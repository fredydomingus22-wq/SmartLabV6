import { SupabaseClient } from "@supabase/supabase-js";
import { ProductionOrder, ProductionBatch, ProductionEvent } from "./types";
import { SamplingOrchestratorService } from "../quality/sampling-orchestrator.service";
import { ProductionOrderDomainService } from "./order.service";

/**
 * ProductionOrchestratorService
 * Central domain service for the Manufacturing Execution System (MES).
 * Handles the lifecycle from Order (OP) to Batch Execution and final Release.
 */
export class ProductionOrchestratorService {
    constructor(
        private supabase: SupabaseClient<any>,
        private context: {
            organization_id: string;
            user_id: string;
            role: string;
            plant_id: string;
            correlation_id?: string;
        }
    ) { }

    /**
     * Convert a Production Order into a Planned Batch
     */
    async planBatchFromOrder(orderId: string, shiftId: string, plannedDate: string, batchCode: string, productionLineId: string) {
        const { data: order, error: orderError } = await this.supabase
            .from("production_orders")
            .select("*")
            .eq("id", orderId)
            .single();

        if (orderError || !order) throw new Error("Production Order not found");
        if (order.status !== 'planned' && order.status !== 'draft') {
            throw new Error(`Cannot plan batch from order in state: ${order.status}`);
        }

        const { data: batch, error: batchError } = await this.supabase
            .from("production_batches")
            .insert({
                organization_id: this.context.organization_id,
                plant_id: this.context.plant_id,
                product_id: order.product_id,
                production_order_id: order.id,
                shift_id: shiftId,
                production_line_id: productionLineId, // <-- Added
                code: batchCode,

                planned_quantity: order.planned_quantity,
                status: 'planned',
                start_date: plannedDate,
                created_by: this.context.user_id
            })
            .select()
            .single();

        if (batchError) throw new Error(batchError.message);

        await this.logEvent(batch.id, 'start', {
            description: "Batch planned from OP",
            order_code: order.code
        });

        return batch;
    }

    /**
     * Start Batch Execution with Hygienic Gatekeeper
     */
    async startBatchExecution(batchId: string) {
        // 1. Fetch Batch
        const { data: batch, error: fetchError } = await this.supabase
            .from("production_batches")
            .select("*, production_line:production_lines(id, code)")
            .eq("id", batchId)
            .single();

        if (fetchError || !batch) throw new Error("Batch not found");

        // 2. Hygienic Gatekeeper Check
        const isHygienic = await this.verifyEquipmentHygiene(batchId);
        if (!isHygienic) {
            await this.logEvent(batchId, 'breakdown', {
                error: "HYGIENE_GATE_FAILED",
                message: "Equipment not cleared for production (CIP required or expired)"
            });
            throw new Error("Equipamento não libertado para produção (Necessário CIP ou Aprovação)");
        }

        // 3. Resolve and Lock Technical Sheet (COMPLIANCE LOCK)
        const { data: techSheet } = await this.supabase
            .from("product_technical_sheets")
            .select("id")
            .eq("product_id", batch.product_id)
            .eq("status", "active")
            .order('effective_date', { ascending: false })
            .limit(1)
            .maybeSingle();

        // 4. Transition to In Progress
        const { data: updatedBatch, error: updateError } = await this.supabase
            .from("production_batches")
            .update({
                status: 'in_progress',
                start_date: new Date().toISOString(),
                spec_version_id: techSheet?.id // SNAPSHOT: Locked for this batch lifecycle
            })
            .eq("id", batchId)
            .select()
            .single();

        if (updateError) throw new Error("Failed to start batch: " + updateError.message);

        // 4. Trigger Automatic Sampling
        const sampling = new SamplingOrchestratorService(this.supabase, this.context);
        await sampling.triggerInitialSampling(batchId);

        // 5. Log Event
        await this.logEvent(batchId, 'start', {
            status: 'EM_EXECUCAO',
            message: "Produção iniciada após validação de higiene"
        });

        // 6. Sync Order Status
        if (updatedBatch.production_order_id) {
            const orderService = new ProductionOrderDomainService(this.supabase, {
                ...this.context,
                correlation_id: this.context.correlation_id || crypto.randomUUID()
            });
            await orderService.syncOrderStatus(updatedBatch.production_order_id);
        }

        return updatedBatch;
    }

    /**
     * Finalize Batch Execution
     */
    async finalizeBatch(batchId: string) {
        const { data: batch, error: fetchError } = await this.supabase
            .from("production_batches")
            .select("*")
            .eq("id", batchId)
            .single();

        if (fetchError || !batch) throw new Error("Batch not found");

        const { data: updatedBatch, error: updateError } = await this.supabase
            .from("production_batches")
            .update({
                status: 'completed',
                end_date: new Date().toISOString()
            })
            .eq("id", batchId)
            .select()
            .single();

        if (updateError) throw new Error("Failed to finalize batch");

        // Sync Parent Order
        if (batch.production_order_id) {
            const orderService = new ProductionOrderDomainService(this.supabase, {
                ...this.context,
                correlation_id: this.context.correlation_id || crypto.randomUUID()
            });
            await orderService.syncOrderStatus(batch.production_order_id);
        }

        await this.logEvent(batchId, 'stop', {
            status: 'CONCLUIDO',
            message: "Lote finalizado"
        });

        return updatedBatch;
    }

    /**
     * Record Quality Release Decision from LIMS (Feedback Loop)
     */
    async logReleaseDecision(batchId: string, decision: 'APPROVED' | 'REJECTED' | 'RETAINED', metadata: any = {}) {
        await this.logEvent(batchId, 'stop', {
            status: 'QUALITY_DECISION',
            decision,
            ...metadata,
            message: `Decisão de qualidade recebida do LIMS: ${decision}`
        });

        // Business Logic: REJECTED results in BLOCKED status
        if (decision === 'REJECTED') {
            await this.supabase
                .from("production_batches")
                .update({ status: 'blocked' })
                .eq("id", batchId);
        }
    }

    /**
     * Log a Production Event
     */
    async logExecutionEvent(batchId: string, type: 'start' | 'stop' | 'resume' | 'waste' | 'scrap' | 'breakdown' | 'maintenance' | 'shift_change', metadata: any = {}) {
        await this.logEvent(batchId, type, metadata);

        if (type === 'shift_change') {
            const sampling = new SamplingOrchestratorService(this.supabase, this.context);
            await sampling.processSamplingHeartbeat(batchId);
        }
    }

    /**
     * Check if production is Running
     */
    async isProductionRunning(batchId: string): Promise<boolean> {
        const { data: lastEvent, error } = await this.supabase
            .from("production_events")
            .select("event_type")
            .eq("production_batch_id", batchId)
            .order('timestamp', { ascending: false })
            .limit(1)
            .maybeSingle();

        if (error || !lastEvent) return true;

        const stopEvents = ['stop', 'breakdown', 'maintenance'];
        return !stopEvents.includes(lastEvent.event_type);
    }


    /**
     * Internal Hygiene Verification Logic
     */
    private async verifyEquipmentHygiene(batchId: string): Promise<boolean> {
        const { data: batch } = await this.supabase
            .from("production_batches")
            .select("production_line_id")
            .eq("id", batchId)
            .single();

        if (!batch?.production_line_id) return true;

        const { data: latestCip, error } = await this.supabase
            .from("cip_executions")
            .select("status, end_time, validation_status")
            .eq("equipment_uid", batch.production_line_id)
            .order('end_time', { ascending: false })
            .limit(1)
            .maybeSingle();

        if (error || !latestCip) return false;

        const isCompleted = latestCip.status === 'completed';
        const lastCipTime = latestCip.end_time ? new Date(latestCip.end_time).getTime() : 0;
        const now = Date.now();
        const hoursSinceCip = (now - lastCipTime) / (1000 * 60 * 60);

        return isCompleted && (hoursSinceCip < 72);
    }

    /**
     * Standardized Event Logging
     */
    private async logEvent(batchId: string, type: any, metadata: any = {}) {
        await this.supabase
            .from("production_events")
            .insert({
                organization_id: this.context.organization_id,
                plant_id: this.context.plant_id,
                production_batch_id: batchId,
                event_type: type,
                performed_by: this.context.user_id,
                metadata: {
                    ...metadata,
                    correlation_id: this.context.correlation_id || Date.now().toString()
                }
            });
    }
}

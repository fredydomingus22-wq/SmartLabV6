import { SupabaseClient } from "@supabase/supabase-js";
import { BaseDomainService } from "../shared/base.service";
import { DomainResponse } from "../shared/industrial.context";

export interface CreateOrderDTO {
    product_id: string;
    code?: string;
    planned_quantity: number;
    plant_id: string;
    start_date?: string;
}

/**
 * ProductionOrderDomainService
 * 
 * Manages the lifecycle of Production Orders (OPs).
 * Extracted from server actions for consistency and auditability.
 */
export class ProductionOrderDomainService extends BaseDomainService {

    /**
     * Create a new Production Order (OP)
     */
    async createOrder(dto: CreateOrderDTO): Promise<DomainResponse> {
        // Security: Enforce RBAC
        this.enforceRole(['production_manager', 'admin', 'system_owner', 'quality']);

        try {
            const code = dto.code || `OP-${Date.now()}`;
            const startDate = dto.start_date || new Date().toISOString().split('T')[0];

            const { data: order, error } = await this.supabase
                .from("production_orders")
                .insert({
                    organization_id: this.context.organization_id,
                    plant_id: dto.plant_id,
                    product_id: dto.product_id,
                    code: code,
                    planned_quantity: dto.planned_quantity,
                    status: 'planned',
                    start_date: startDate,
                    created_by: this.context.user_id
                })
                .select("id, code")
                .single();

            if (error) throw error;

            await this.auditAction('ORDER_CREATED', 'production_orders', order.id, {
                code: order.code,
                product_id: dto.product_id,
                planned_quantity: dto.planned_quantity
            });

            return this.success(order, "Ordem de Produção criada com sucesso.");

        } catch (error: any) {
            console.error("[ProductionOrderService] Create failed:", error);
            return this.failure("Falha ao criar Ordem de Produção.", error);
        }
    }

    /**
     * Sync Parent Order Status based on Child Batches.
     * Moved from ProductionOrchestratorService for better separation.
     */
    async syncOrderStatus(orderId: string): Promise<DomainResponse> {
        try {
            const { data: batches, error: batchError } = await this.supabase
                .from("production_batches")
                .select("id, status")
                .eq("production_order_id", orderId);

            if (batchError) throw batchError;

            if (!batches || batches.length === 0) {
                // No batches yet, keep as planned
                return this.success({ orderId, status: 'planned' });
            }

            // Logic: 
            // - All released -> order is 'completed'
            // - Any in_progress -> order is 'in_progress'
            // - All planned -> order is 'planned'
            const allReleased = batches.every(b => b.status === 'released');
            const anyInProgress = batches.some(b => ['in_progress', 'completed', 'qa_hold'].includes(b.status));

            let newStatus = 'planned';
            if (allReleased) {
                newStatus = 'completed';
            } else if (anyInProgress) {
                newStatus = 'in_progress';
            }

            const { error: updateError } = await this.supabase
                .from("production_orders")
                .update({ status: newStatus })
                .eq("id", orderId)
                .eq("organization_id", this.context.organization_id);

            if (updateError) throw updateError;

            return this.success({ orderId, status: newStatus });

        } catch (error: any) {
            console.error("[ProductionOrderService] Sync status failed:", error);
            return this.failure("Falha ao sincronizar estado da Ordem.", error);
        }
    }

    /**
     * Cancel a Production Order with reason.
     */
    async cancelOrder(orderId: string, reason: string): Promise<DomainResponse> {
        this.enforceRole(['production_manager', 'admin', 'system_owner']);

        if (!reason || reason.trim().length < 10) {
            return this.failure("Uma justificação com pelo menos 10 caracteres é obrigatória.");
        }

        try {
            // Verify no in-progress batches
            const { data: activeBatches, error: batchError } = await this.supabase
                .from("production_batches")
                .select("id")
                .eq("production_order_id", orderId)
                .in("status", ['in_progress', 'completed', 'qa_hold']);

            if (batchError) throw batchError;

            if (activeBatches && activeBatches.length > 0) {
                return this.failure(`BLOQUEIO: Existem ${activeBatches.length} lotes em execução associados a esta ordem.`);
            }

            const { error: updateError } = await this.supabase
                .from("production_orders")
                .update({
                    status: 'cancelled',
                    cancellation_reason: reason,
                    cancelled_at: new Date().toISOString(),
                    cancelled_by: this.context.user_id
                })
                .eq("id", orderId)
                .eq("organization_id", this.context.organization_id);

            if (updateError) throw updateError;

            await this.auditAction('ORDER_CANCELLED', 'production_orders', orderId, { reason });

            return this.success({ id: orderId }, "Ordem de Produção cancelada.");

        } catch (error: any) {
            return this.failure("Falha ao cancelar Ordem de Produção.", error);
        }
    }
}

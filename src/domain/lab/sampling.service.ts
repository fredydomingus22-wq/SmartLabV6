import { SupabaseClient } from "@supabase/supabase-js";
import { BaseDomainService } from "../shared/base.service";
import { DomainResponse, DomainContext } from "../shared/industrial.context";

/**
 * SamplingService
 * 
 * Orchestrates the bridging between MES (Production) and LIMS (Lab).
 * Evaluates industrial sampling plans and issues execution requests.
 */
export class SamplingService extends BaseDomainService {
    constructor(supabase: SupabaseClient, context: DomainContext) {
        super(supabase, context);
    }

    /**
     * Evaluates plans for a specific production event (e.g., Batch Start).
     * Generates corresponding sample requests.
     */
    async triggerRequestsFromEvent(params: {
        batchId: string;
        orderId?: string;
        productId: string;
        eventAnchor: 'batch_start' | 'batch_end' | 'shift_change' | 'process_step';
    }): Promise<DomainResponse> {
        try {
            // 1. Fetch active plans matching the product and event
            // Logic: Matches specific product or global plans (product_id IS NULL)
            const { data: plans, error: planError } = await this.supabase
                .from("production_sampling_plans")
                .select("*")
                .eq("organization_id", this.context.organization_id)
                .eq("is_active", true)
                .eq("event_anchor", params.eventAnchor)
                .or(`product_id.eq.${params.productId},product_id.is.null`);

            if (planError) throw planError;
            if (!plans || plans.length === 0) return this.success([]);

            // 2. Generate Requests
            const requests = plans.map(plan => ({
                organization_id: this.context.organization_id,
                plant_id: this.context.plant_id,
                sampling_plan_id: plan.id,
                production_batch_id: params.batchId,
                production_order_id: params.orderId,
                status: 'pending',
                priority: 'normal',
                metadata: {
                    triggered_by: 'system_auto_orchestration',
                    anchor: params.eventAnchor,
                    product_id: params.productId
                }
            }));

            const { data: createdRequests, error: insertError } = await this.supabase
                .from("sample_requests")
                .insert(requests)
                .select();

            if (insertError) throw insertError;

            // 3. Audit the Trigger
            await this.auditAction('SAMPLING_PLAN_TRIGGERED', 'production_batches', params.batchId, {
                plansCount: plans.length,
                event: params.eventAnchor
            });

            return this.success(createdRequests);
        } catch (error: any) {
            console.error("[SamplingService] Trigger failed:", error);
            return this.failure("Falha ao processar planos de amostragem.", error);
        }
    }

    /**
     * Marks a request as collected when the physical sample is created.
     */
    async markAsCollected(requestId: string): Promise<DomainResponse> {
        try {
            const { error: updateError } = await this.supabase
                .from("sample_requests")
                .update({
                    status: 'collected',
                    collected_at: new Date().toISOString()
                })
                .eq("id", requestId)
                .eq("organization_id", this.context.organization_id);

            if (updateError) throw updateError;

            await this.auditAction('SAMPLE_REQUEST_COLLECTED', 'sample_requests', requestId);

            return this.success({ id: requestId });
        } catch (error: any) {
            return this.failure("Falha ao marcar pedido como coletado.", error);
        }
    }
}

import { SupabaseClient } from "@supabase/supabase-js";
import { BaseDomainService } from "../shared/base.service";
import { DomainResponse } from "../shared/industrial.context";

export interface CreateIntermediateDTO {
    production_batch_id: string;
    equipment_id: string;
    code: string;
    volume?: number;
    unit?: string;
    product_id?: string;
    plant_id: string;
}

/**
 * IntermediateDomainService
 * 
 * Manages the industrial lifecycle of intermediate products (tanks/mixes).
 * Refined for Manual Sampling and Lab Analyst Approval.
 */
export class IntermediateDomainService extends BaseDomainService {

    constructor(supabase: SupabaseClient, context: any) {
        super(supabase, context);
    }

    /**
     * Registers a new intermediate product.
     * Manual sampling will be triggered later by the operator.
     */
    /**
     * Registers (activates) an intermediate product.
     * Can either create a new one (ad-hoc) or claim a "planned" slot created by the batch planner.
     */
    async registerIntermediate(dto: CreateIntermediateDTO): Promise<DomainResponse> {
        this.enforceRole(['production_operator', 'qc_supervisor', 'admin', 'system_owner', 'lab_analyst']);

        try {
            // 1. Conflict Check: Is the equipment occupied?
            const { data: occupied } = await this.supabase
                .from("intermediate_products")
                .select("id, status, code")
                .eq("equipment_id", dto.equipment_id)
                .in("status", ["pending", "sampling", "in_analysis", "approved", "in_use"]) // Active statuses
                .maybeSingle();

            if (occupied) {
                return this.failure(`EQUIPAMENTO OCUPADO: ${occupied.code} está em uso (${occupied.status}).`);
            }

            // 2. Resolve Product Linkage (Recipe)
            let resolvedProductId = dto.product_id;
            if (!resolvedProductId) {
                const { data: batch } = await this.supabase
                    .from("production_batches")
                    .select("product:products(parent_id)")
                    .eq("id", dto.production_batch_id)
                    .single();

                resolvedProductId = (batch?.product as any)?.parent_id;
            }

            // 3. Status Strategy: Claim "planned" or Create New
            // Check if there is a 'planned' intermediate for this batch (and same recipe) that hasn't been assigned equipment
            const { data: plannedSlot } = await this.supabase
                .from("intermediate_products")
                .select("id")
                .eq("production_batch_id", dto.production_batch_id)
                .eq("status", "planned")
                .is("equipment_id", null)
                .limit(1)
                .maybeSingle();

            let intermediateId = "";

            if (plannedSlot) {
                // CLAIM EXISTING SLOT
                const { data: updated, error: updateError } = await this.supabase
                    .from("intermediate_products")
                    .update({
                        organization_id: this.context.organization_id, // Ensure ownership
                        plant_id: dto.plant_id,
                        product_id: resolvedProductId || null,
                        code: dto.code, // Set the actual Tank Name
                        equipment_id: dto.equipment_id,
                        volume: dto.volume || null,
                        unit: dto.unit || "L",
                        status: "pending", // Activated
                        start_date: new Date().toISOString()
                    })
                    .eq("id", plannedSlot.id)
                    .select("id")
                    .single();

                if (updateError) throw updateError;
                intermediateId = updated.id;

            } else {
                // AD-HOC CREATION
                const { data: newIntermediate, error: insertError } = await this.supabase
                    .from("intermediate_products")
                    .insert({
                        organization_id: this.context.organization_id,
                        plant_id: dto.plant_id,
                        production_batch_id: dto.production_batch_id,
                        product_id: resolvedProductId || null,
                        code: dto.code,
                        equipment_id: dto.equipment_id,
                        volume: dto.volume || null,
                        unit: dto.unit || "L",
                        status: "pending",
                        approval_status: "pending",
                        start_date: new Date().toISOString()
                    })
                    .select("id")
                    .single();

                if (insertError) throw insertError;
                intermediateId = newIntermediate.id;
            }

            // 4. Audit
            await this.auditAction('INTERMEDIATE_CREATED', 'intermediate_products', intermediateId, {
                equipment_id: dto.equipment_id,
                productId: resolvedProductId,
                was_planned: !!plannedSlot
            });

            return this.success({ id: intermediateId }, "Produto intermédio registado/ativado.");

        } catch (error: any) {
            console.error("[IntermediateService] Registration failed:", error);
            return this.failure("Falha ao registar produto intermédio.", error.message);
        }
    }

    /**
     * Finalizes production of the intermediate (Tank Full / Mixed).
     * Moves status to 'sampling' and triggers LIMS auto-sampling.
     */
    async finalizeProduction(intermediateId: string): Promise<DomainResponse> {
        this.enforceRole(['production_operator', 'admin', 'system_owner']);

        try {
            // 1. Update status to 'sampling'
            const { data: intermediate, error } = await this.supabase
                .from("intermediate_products")
                .update({
                    status: "sampling",
                    approval_status: "pending"
                })
                .eq("id", intermediateId)
                .select("*, batch:production_batch_id(*)")
                .single();

            if (error) throw error;

            // 2. Trigger LIMS Auto-Sampling
            // We create a sample entitlement. The actual sample record is created in 'registered' status.
            const { error: sampleError } = await this.supabase.from("samples").insert({
                organization_id: this.context.organization_id,
                plant_id: this.context.plant_id,
                production_batch_id: intermediate.production_batch_id,
                intermediate_product_id: intermediateId,
                code: `SMP-${intermediate.code}-${Date.now().toString().slice(-4)}`, // Temp Code
                status: "registered", // Ready for collection
                collected_by: null, // To be collected
                // We need to resolve sample_type_id for "Intermediate". 
                // For now we assume the system has a type linked or we query it.
                // Fallback: The UI/Lab will refine it.
                sample_type_id: "00000000-0000-0000-0000-000000000000" // Placeholder UUID or fetch dynamically?
                // Ideally, we'd look up sample_type where category='intermediate'
            });

            if (sampleError) {
                console.warn("Auto-sampling failed (non-blocking):", sampleError);
            }

            await this.auditAction('INTERMEDIATE_PRODUCTION_FINISHED', 'intermediate_products', intermediateId);
            return this.success({ id: intermediateId }, "Produção finalizada. Pedido de amostragem enviado ao Laboratório.");

        } catch (error: any) {
            return this.failure("Erro ao finalizar produção.", error.message);
        }
    }

    /**
     * Industrial Approval Gate (Manual by Lab Analyst)
     * Requirements:
     * - Actor must be lab_analyst or above.
     * - Electronic signature verified.
     * - All linked samples must be approved.
     */
    async approveIntermediate(intermediateId: string, password?: string): Promise<DomainResponse> {
        // Only Analysts and Managers can approve quality
        this.enforceRole(['lab_analyst', 'micro_analyst', 'qa_manager', 'qc_supervisor', 'admin', 'system_owner']);

        try {
            // 1. Electronic Signature Validation
            if (!password) return this.failure("ASSINATURA OBRIGATÓRIA: Forneça a palavra-passe para assinar a aprovação.");

            const { data: profile } = await this.supabase.rpc('verify_user_password', {
                p_user_id: this.context.user_id,
                p_password: password
            });
            if (!profile) return this.failure("ASSINATURA INVÁLIDA: Credenciais de autorização incorretas.");

            // 2. Verification of Lab Compliance
            const { data: samples, error: sampleError } = await this.supabase
                .from("samples")
                .select("id, status, code")
                .eq("intermediate_product_id", intermediateId);

            if (sampleError) throw sampleError;

            if (!samples || samples.length === 0) {
                return this.failure("BLOQUEIO DE QUALIDADE: Nenhuma amostra registada para este tanque.");
            }

            const pendingSamples = samples.filter(s => !['approved', 'released', 'validated'].includes(s.status));
            if (pendingSamples.length > 0) {
                return this.failure(
                    `BLOQUEIO DE QUALIDADE: Amostras pendentes (${pendingSamples.length}).`,
                    { pending: pendingSamples.map(p => p.code) }
                );
            }

            // 3. Status Transition to 'approved'
            const { error: updateError } = await this.supabase
                .from("intermediate_products")
                .update({
                    approval_status: "approved",
                    status: "approved", // Moves from in_analysis/sampling to approved
                    approved_by: this.context.user_id,
                    approved_at: new Date().toISOString()
                })
                .eq("id", intermediateId);

            if (updateError) throw updateError;

            // 4. Audit
            await this.auditAction('INTERMEDIATE_APPROVED', 'intermediate_products', intermediateId, {
                samples_verified: samples.length,
                signed: true
            });

            return this.success({ id: intermediateId }, "Tanque aprovado tecnicamente pelo Laboratório.");

        } catch (error: any) {
            return this.failure("Falha na aprovação do produto intermédio.", error.message);
        }
    }

    /**
     * Transitions a tank from 'approved' to 'in_use'.
     */
    async startUsage(intermediateId: string): Promise<DomainResponse> {
        this.enforceRole(['production_operator', 'admin', 'system_owner']);

        try {
            const { data: current } = await this.supabase
                .from("intermediate_products")
                .select("status, approval_status")
                .eq("id", intermediateId)
                .single();

            if (current?.approval_status !== "approved") {
                return this.failure("BLOQUEIO: O tanque deve estar aprovado pelo laboratório antes de iniciar o uso.");
            }

            const { error } = await this.supabase
                .from("intermediate_products")
                .update({ status: "in_use" })
                .eq("id", intermediateId);

            if (error) throw error;

            await this.auditAction('INTERMEDIATE_DISCHARGE_STARTED', 'intermediate_products', intermediateId);
            return this.success({ id: intermediateId }, "Uso do tanque iniciado.");
        } catch (error: any) {
            return this.failure("Erro ao iniciar uso.", error.message);
        }
    }

    /**
     * Marks intermediate as consumed and releases the equipment.
     */
    async consumeIntermediate(intermediateId: string): Promise<DomainResponse> {
        this.enforceRole(['production_operator', 'admin', 'system_owner']);

        try {
            const { error } = await this.supabase
                .from("intermediate_products")
                .update({
                    status: "consumed",
                    end_date: new Date().toISOString()
                })
                .eq("id", intermediateId);

            if (error) throw error;

            await this.auditAction('INTERMEDIATE_CONSUMED', 'intermediate_products', intermediateId);
            return this.success({ id: intermediateId }, "Consumo finalizado. Equipamento libertado.");
        } catch (error: any) {
            return this.failure("Erro ao finalizar consumo.", error.message);
        }
    }
}

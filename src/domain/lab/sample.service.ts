import { BaseDomainService } from "../shared/base.service";
import { DomainResponse } from "../shared/industrial.context";
import { SampleFSM, SampleStatus } from "./sample.fsm";

export interface CreateSampleDTO {
    sample_type_id: string;
    plant_id: string;
    code?: string;
    production_batch_id?: string;
    intermediate_product_id?: string;
    sampling_point_id?: string;
    collected_at?: string;
    assignee_id?: string;
}

/**
 * Industrial Sample Domain Service
 * Handles the complete lifecycle of a laboratory sample.
 */
export class SampleDomainService extends BaseDomainService {

    /**
     * Registers a new sample and initializes the analysis queue.
     */
    /**
     * Registers a new sample and initializes the analysis queue.
     */
    async registerSample(dto: CreateSampleDTO): Promise<DomainResponse> {
        // Security: Enforce RBAC
        this.enforceRole(['lab_analyst', 'micro_analyst', 'admin', 'qa_manager', 'system_owner']);

        if (!dto.sample_type_id || !dto.plant_id) {
            return this.failure("Missing required metadata.");
        }

        try {
            // 1. Context Resolution (Recipe & Requirements)
            const { productIds, categoryFilter, sampleTypeCode } = await this.resolveProductContext(dto);

            // 2. Generate Industrial Code
            const finalCode = await this.generateSampleCode(dto, sampleTypeCode, productIds[0] || null);

            // 3. Persistence
            const { data: newSample, error } = await this.supabase
                .from("samples")
                .insert({
                    organization_id: this.context.organization_id,
                    plant_id: dto.plant_id,
                    sample_type_id: dto.sample_type_id,
                    code: finalCode,
                    production_batch_id: dto.production_batch_id || null,
                    intermediate_product_id: dto.intermediate_product_id || null,
                    sampling_point_id: dto.sampling_point_id || null,
                    collected_by: this.context.user_id,
                    collected_at: dto.collected_at || null,
                    status: dto.collected_at ? 'collected' : 'registered', // Industrial FSM compliance
                })
                .select("id")
                .single();

            if (error) throw error;

            // 4. Initialize Analysis Queue (The "Plan")
            if (categoryFilter.length > 0) {
                await this.initializeAnalysisQueue(newSample.id, productIds, categoryFilter, dto.sample_type_id, dto.plant_id);
            }

            // 5. Create Technical Task
            if (dto.assignee_id) {
                await this.createTechnicalTask(newSample.id, finalCode, dto.assignee_id, dto.plant_id, sampleTypeCode);
            }

            // 6. Mandatory Industrial Audit
            await this.auditAction('SAMPLE_REGISTERED', 'samples', newSample.id, {
                code: finalCode,
                productIds,
                type: sampleTypeCode
            });

            return this.success({ id: newSample.id, code: finalCode });

        } catch (error: unknown) {
            console.error("[SampleService] Registration Error:", error);
            return this.failure(error instanceof Error ? error.message : "Industrial registration failed.");
        }
    }

    private async resolveProductContext(dto: CreateSampleDTO) {
        const { data: sampleType } = await this.supabase
            .from("sample_types")
            .select("id, test_category, code")
            .eq("id", dto.sample_type_id)
            .single();

        if (!sampleType) throw new Error("Invalid sample type.");

        const sampleTypeCode = sampleType.code || "NOTYPE";
        const testCategory = sampleType.test_category || "physico_chemical";

        let categoryFilter: string[] = [];
        if (testCategory === 'physico_chemical') categoryFilter = ['physico_chemical', 'sensory'];
        else if (testCategory === 'microbiological') categoryFilter = ['microbiological'];
        else if (testCategory === 'both') categoryFilter = ['physico_chemical', 'microbiological', 'sensory'];

        let productIds: string[] = [];

        // Industrial Enforcements:
        // 1. If it's a Tank/Intermediate Sample, it MUST follow ONLY the tank's recipe.
        if (dto.intermediate_product_id) {
            const { data: ip } = await this.supabase
                .from("intermediate_products")
                .select("product_id")
                .eq("id", dto.intermediate_product_id)
                .single();

            if (ip?.product_id) productIds.push(ip.product_id);
        }

        // 2. If it's a Batch sample (no tank context), use the batch's product.
        else if (dto.production_batch_id) {
            const { data: batch } = await this.supabase
                .from("production_batches")
                .select("product_id")
                .eq("id", dto.production_batch_id)
                .single();
            if (batch?.product_id) productIds.push(batch.product_id);
        }

        // Remove duplicates and nulls
        const uniqueProductIds = Array.from(new Set(productIds.filter(id => id)));

        return { productIds: uniqueProductIds, categoryFilter, sampleTypeCode };
    }

    private async generateSampleCode(dto: CreateSampleDTO, typeCode: string, productId: string | null): Promise<string> {
        // If code is provided and NOT the placeholder, use it.
        // If it IS the placeholder, ignore it and generate a real one.
        if (dto.code && dto.code !== 'AUTO-GENERATED') return dto.code;

        let sampleCodePrefix = "NOSKU";
        if (productId) {
            const { data: product } = await this.supabase.from("products").select("sku").eq("id", productId).single();
            sampleCodePrefix = product?.sku || "NOSKU";
        } else if (dto.sampling_point_id) {
            const { data: sp } = await this.supabase.from("sampling_points").select("code").eq("id", dto.sampling_point_id).single();
            sampleCodePrefix = sp?.code || "NOSP";
        }

        const dateObj = new Date();
        const y = dateObj.getFullYear();
        const m = String(dateObj.getMonth() + 1).padStart(2, '0');
        const d = String(dateObj.getDate()).padStart(2, '0');
        const h = String(dateObj.getHours()).padStart(2, '0');
        const min = String(dateObj.getMinutes()).padStart(2, '0');

        return `${sampleCodePrefix}-${typeCode}-${y}${m}${d}-${h}${min}`;
    }

    private async initializeAnalysisQueue(sampleId: string, productIds: string[], categoryFilter: string[], sampleTypeId: string, plantId: string) {
        // Optimized query: Use original table names for filtering to avoid alias/PostgREST issues.
        let query = this.supabase
            .from("product_specifications")
            .select("qa_parameter_id, qa_parameters!inner(category, status)")
            .eq("organization_id", this.context.organization_id)
            .eq("status", "active")
            .eq("qa_parameters.status", "active")
            .in("qa_parameters.category", categoryFilter);

        // Industrial Logic: If we have product IDs, they represent the "mandatário" (authority).
        // For product-based samples, the sample_type is secondary to the product identification.
        if (productIds.length > 0) {
            query = query.in("product_id", productIds);
        } else {
            query = query.is("product_id", null).eq("sample_type_id", sampleTypeId);
        }

        const { data: specs, error } = await query;

        if (error) {
            console.error(`[SampleService] Failed to fetch specs for sample ${sampleId}:`, error);
            return;
        }

        if (specs && specs.length > 0) {
            const uniqueParamIds = Array.from(new Set(specs.map(s => s.qa_parameter_id)));

            // Deduplicate against existing results (safety gate)
            const { error: insertError } = await this.supabase.from("lab_analysis").insert(
                uniqueParamIds.map(paramId => ({
                    organization_id: this.context.organization_id,
                    plant_id: plantId,
                    sample_id: sampleId,
                    qa_parameter_id: paramId,
                    is_valid: true
                }))
            );

            if (insertError) {
                console.error(`[SampleService] Failed to insert analysis queue for sample ${sampleId}:`, insertError);
            } else {
                // Proactively advance status if queue is initialized
                await this.supabase.from("samples").update({
                    status: 'collected'
                }).eq("id", sampleId);
            }
        } else {
            console.warn(`[SampleService] No specifications found for sample ${sampleId} (Products: ${productIds.join(',')}, SampleType: ${sampleTypeId})`);
        }
    }

    /**
     * Updates sample status with mandatory audit.
     */
    async updateSampleStatus(sampleId: string, status: SampleStatus): Promise<DomainResponse> {
        // Security: Enforce RBAC
        this.enforceRole(['lab_analyst', 'micro_analyst', 'admin', 'qa_manager', 'system_owner']);

        try {
            // Security: Immutability Check
            const { data: current } = await this.supabase
                .from("samples")
                .select("status")
                .eq("id", sampleId)
                .single();

            if (current && ['approved', 'rejected', 'released', 'archived'].includes(current.status)) {
                return this.failure(`IMMUTABILITY VIOLATION: Cannot manually update status for locked sample (${current.status}).`);
            }

            const { error } = await this.supabase
                .from("samples")
                .update({ status })
                .eq("id", sampleId)
                .eq("organization_id", this.context.organization_id);

            if (error) throw error;

            await this.auditAction('SAMPLE_STATUS_UPDATED', 'samples', sampleId, { status });
            return this.success({ id: sampleId, status });
        } catch (error: unknown) {
            return this.failure("Status update failed.", error instanceof Error ? error.message : "Unknown error");
        }
    }

    /**
     * Re-calculates and updates sample status based on analysis completion.
     */
    async refreshStatus(sampleId: string): Promise<DomainResponse> {
        try {
            const { data: sample, error: fetchError } = await this.supabase
                .from("samples")
                .select(`id, status, lab_analysis(id, value_numeric, value_text, status)`)
                .eq("id", sampleId)
                .single();

            if (fetchError || !sample) return this.failure("Sample not found.");

            const analyses = sample.lab_analysis || [];
            const completedCount = analyses.filter(a => a.value_numeric !== null || a.value_text !== null || a.status === 'completed').length;
            const totalCount = analyses.length;

            let nextStatus: SampleStatus = sample.status as SampleStatus;

            if (totalCount > 0) {
                if (completedCount > 0 && completedCount < totalCount) {
                    nextStatus = "in_analysis";
                } else if (completedCount === totalCount && totalCount > 0) {
                    // All completed, move to under_review if currently in_analysis or collected
                    if (['collected', 'in_analysis'].includes(sample.status)) {
                        nextStatus = "under_review";
                    }
                }
            }

            if (nextStatus !== sample.status) {
                const { error: updateError } = await this.supabase
                    .from("samples")
                    .update({ status: nextStatus })
                    .eq("id", sampleId);

                if (updateError) throw updateError;

                await this.auditAction('SAMPLE_STATUS_PROGRESSED', 'samples', sampleId, {
                    old_status: sample.status,
                    new_status: nextStatus
                });
            }

            return this.success({ id: sampleId, status: nextStatus });
        } catch (error: unknown) {
            return this.failure("Failed to refresh sample status.", error instanceof Error ? error.message : "Unknown error");
        }
    }

    /**
     * Level 2: Technical Review
     * Performed by Supervisor to verify analyst work.
     */
    async technicalReview(params: {
        sampleId: string;
        decision: 'approved' | 'rejected';
        reason?: string;
        password?: string;
    }): Promise<DomainResponse> {
        const { sampleId, decision, reason, password } = params;

        // Security: Enforce Authority (Only Supervisors/Admins can review)
        this.enforceRole(['qa_manager', 'qc_supervisor', 'quality', 'admin', 'system_owner']);

        try {
            // 1. Electronic Signature Validation
            if (password) {
                const isValid = await this.verifyElectronicSignature(password);
                if (!isValid) return this.failure("Assinatura eletrónica inválida para revisão técnica.");
            }

            // 2. Fetch Sample for FSM and Compliance Check
            const { data: currentSample } = await this.supabase
                .from("samples")
                .select("status, lab_analysis(is_conforming)")
                .eq("id", sampleId)
                .single();

            if (!currentSample) return this.failure("Amostra não encontrada.");

            // 3. FSM Validation
            if (!SampleFSM.isValidTransition(currentSample.status as SampleStatus, decision)) {
                return this.failure(`Transição inválida de ${currentSample.status} para ${decision}`);
            }

            // 4. Industrial Compliance Logic
            if (decision === 'approved') {
                const analyses = currentSample.lab_analysis || [];
                const isCompliant = SampleFSM.isCompliant(analyses as any);

                if (!isCompliant && !reason) {
                    return this.failure("BLOQUEIO DE QUALIDADE: Foram encontrados parâmetros não conformes. É obrigatória uma justificação para aprovação técnica.");
                }
            }

            // 5. Update Persistence with Traceability
            const { error } = await this.supabase
                .from("samples")
                .update({
                    status: decision,
                    reviewed_by: this.context.user_id,
                    reviewed_at: new Date().toISOString(),
                    // If rejected, it might need re-analysis
                    notes: decision === 'rejected' ? reason : undefined
                })
                .eq("id", sampleId)
                .eq("organization_id", this.context.organization_id);

            if (error) throw error;

            // 6. Mandatory Audit
            await this.auditAction('SAMPLE_TECHNICAL_REVIEW', 'samples', sampleId, {
                status: decision,
                reason,
                signed: !!password
            });

            return this.success({ id: sampleId, status: decision });

        } catch (error: unknown) {
            console.error("[SampleService] Technical review failed:", error);
            return this.failure("Falha ao processar revisão técnica.", error instanceof Error ? error.message : "Erro desconhecido");
        }
    }

    /**
     * Level 3: Quality Release
     * Final step to release batch/sample to market.
     */
    async finalRelease(params: {
        sampleId: string;
        decision: 'released' | 'rejected';
        notes?: string;
        password?: string;
    }): Promise<DomainResponse> {
        const { sampleId, decision, notes, password } = params;
        this.enforceRole(['qa_manager', 'admin', 'system_owner']);

        try {
            if (password) {
                const isValid = await this.verifyElectronicSignature(password);
                if (!isValid) return this.failure("Assinatura eletrónica inválida.");
            }

            const { data: sample } = await this.supabase
                .from("samples")
                .select("status")
                .eq("id", sampleId)
                .single();

            if (!sample) return this.failure("Amostra não encontrada.");

            // Allow release only from 'approved' (technical pass)
            if (sample.status !== 'approved' && decision === 'released') {
                return this.failure("BLOQUEIO DE QUALIDADE: Amostra deve estar aprovada tecnicamente antes da libertação.");
            }

            const { error } = await this.supabase
                .from("samples")
                .update({
                    status: decision === 'released' ? 'released' : 'rejected',
                    released_by: this.context.user_id,
                    released_at: new Date().toISOString(),
                    release_notes: notes
                })
                .eq("id", sampleId);

            if (error) throw error;

            await this.auditAction('SAMPLE_FINAL_RELEASE', 'samples', sampleId, { status: decision, notes });
            return this.success({ id: sampleId, status: decision });
        } catch (error: unknown) {
            return this.failure("Erro na libertação final.", error instanceof Error ? error.message : "Unknown error");
        }
    }

    private async createTechnicalTask(sampleId: string, code: string, assigneeId: string, plantId: string, typeCode: string) {
        await this.supabase.from("app_tasks").insert({
            organization_id: this.context.organization_id,
            plant_id: plantId,
            title: `Análise: ${code}`,
            description: `Executar análises laboratoriais para a amostra ${code}.`,
            status: 'todo',
            priority: 'medium',
            assignee_id: assigneeId,
            module_context: (typeCode === 'MICRO' || typeCode === 'ENV') ? 'micro_sample' : 'lab_sample',
            entity_id: sampleId,
            entity_reference: code,
            created_by: this.context.user_id
        });
    }

    private async verifyElectronicSignature(password: string): Promise<boolean> {
        const { data: profile } = await this.supabase.rpc('verify_user_password', {
            p_user_id: this.context.user_id,
            p_password: password
        });
        return !!profile;
    }
}

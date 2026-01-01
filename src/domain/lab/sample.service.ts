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
    async registerSample(dto: CreateSampleDTO): Promise<DomainResponse> {
        if (!dto.sample_type_id || !dto.plant_id) {
            return this.failure("Missing required metadata.");
        }

        try {
            // 1. Resolve Product & Category
            const { productId, categoryFilter, sampleTypeCode } = await this.resolveProductContext(dto);

            // 2. Generate Industrial Code
            const finalCode = await this.generateSampleCode(dto, sampleTypeCode, productId);

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
                    collected_at: dto.collected_at || new Date().toISOString(),
                    status: 'collected', // Standard LIMS entry point
                })
                .select("id")
                .single();

            if (error) throw error;

            // 4. Initialize Analysis Queue (The "Plan")
            if (categoryFilter.length > 0) {
                await this.initializeAnalysisQueue(newSample.id, productId, categoryFilter, dto.sample_type_id, dto.plant_id);
            }

            // 5. Create Technical Task
            if (dto.assignee_id) {
                await this.createTechnicalTask(newSample.id, finalCode, dto.assignee_id, dto.plant_id, sampleTypeCode);
            }

            // 6. Mandatory Industrial Audit
            await this.auditAction('SAMPLE_REGISTERED', 'samples', newSample.id, {
                code: finalCode,
                productId,
                type: sampleTypeCode
            });

            return this.success({ id: newSample.id, code: finalCode });

        } catch (error: any) {
            console.error("[SampleService] Registration Error:", error);
            return this.failure(error.message || "Industrial registration failed.");
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
        if (testCategory === 'physico_chemical') categoryFilter = ['physico_chemical'];
        else if (testCategory === 'microbiological') categoryFilter = ['microbiological'];
        else if (testCategory === 'both') categoryFilter = ['physico_chemical', 'microbiological'];

        let productId = null;
        if (dto.production_batch_id) {
            const { data: batch } = await this.supabase.from("production_batches").select("product_id").eq("id", dto.production_batch_id).single();
            productId = batch?.product_id;
        } else if (dto.intermediate_product_id) {
            const { data: ip } = await this.supabase.from("intermediate_products").select("production_batches(product_id)").eq("id", dto.intermediate_product_id).single();
            const batchData = Array.isArray(ip?.production_batches) ? ip.production_batches[0] : ip?.production_batches;
            productId = batchData?.product_id;
        }

        return { productId, categoryFilter, sampleTypeCode };
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

    private async initializeAnalysisQueue(sampleId: string, productId: string | null, categoryFilter: string[], sampleTypeId: string, plantId: string) {
        let query = this.supabase
            .from("product_specifications")
            .select("qa_parameter_id, qa_parameters!inner(category, status)")
            .eq("qa_parameters.status", "active")
            .in("qa_parameters.category", categoryFilter)
            .eq("sample_type_id", sampleTypeId);

        if (productId) {
            query = query.eq("product_id", productId);
        } else {
            // For general samples, look for records where product_id is null
            query = query.is("product_id", null);
        }

        const { data: specs } = await query;

        if (specs && specs.length > 0) {
            const uniqueParamIds = Array.from(new Set(specs.map(s => s.qa_parameter_id)));
            await this.supabase.from("lab_analysis").insert(
                uniqueParamIds.map(paramId => ({
                    organization_id: this.context.organization_id,
                    plant_id: plantId,
                    sample_id: sampleId,
                    qa_parameter_id: paramId
                }))
            );
        }
    }

    /**
     * Updates sample status with mandatory audit.
     */
    async updateSampleStatus(sampleId: string, status: SampleStatus): Promise<DomainResponse> {
        try {
            const { error } = await this.supabase
                .from("samples")
                .update({ status })
                .eq("id", sampleId)
                .eq("organization_id", this.context.organization_id);

            if (error) throw error;

            await this.auditAction('SAMPLE_STATUS_UPDATED', 'samples', sampleId, { status });
            return this.success({ id: sampleId, status });
        } catch (error: any) {
            return this.failure("Status update failed.", error);
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
        } catch (error: any) {
            return this.failure("Failed to refresh sample status.", error);
        }
    }

    /**
     * Approves or rejects a sample based on technical results.
     */
    async approveSample(params: {
        sampleId: string;
        status: 'approved' | 'rejected';
        reason?: string;
        password?: string;
    }): Promise<DomainResponse> {
        const { sampleId, status, reason, password } = params;

        try {
            // 1. Electronic Signature Validation
            if (password) {
                const isValid = await this.verifyElectronicSignature(password);
                if (!isValid) return this.failure("Invalid electronic signature for approval.");
            }

            // 2. Fetch Sample for FSM and Compliance Check
            const { data: currentSample } = await this.supabase
                .from("samples")
                .select("status, lab_analysis(is_conforming)")
                .eq("id", sampleId)
                .single();

            if (!currentSample) return this.failure("Sample not found.");

            // 3. FSM Validation
            if (!SampleFSM.isValidTransition(currentSample.status as SampleStatus, status === 'approved' ? 'approved' : 'rejected')) {
                return this.failure(`Invalid transition from ${currentSample.status} to ${status}`);
            }

            // 4. Industrial Compliance Logic
            if (status === 'approved') {
                const analyses = currentSample.lab_analysis || [];
                const isCompliant = SampleFSM.isCompliant(analyses as any);

                if (!isCompliant && !reason) {
                    return this.failure("QUALITY BLOCK: Non-conforming parameters found. CAPA justification is mandatory for deviation approval.");
                }
            }

            // 5. Update Persistence
            const { error } = await this.supabase
                .from("samples")
                .update({ status })
                .eq("id", sampleId)
                .eq("organization_id", this.context.organization_id);

            if (error) throw error;

            // 6. Mandatory Audit
            await this.auditAction('SAMPLE_APPROVAL_PROCESSED', 'samples', sampleId, {
                status,
                reason,
                signed: !!password
            });

            return this.success({ id: sampleId, status });

        } catch (error: any) {
            console.error("[SampleService] Approval failed:", error);
            return this.failure("Failed to process sample approval.", error);
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

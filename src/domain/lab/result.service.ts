import { BaseDomainService } from "../shared/base.service";
import { DomainResponse } from "../shared/industrial.context";
import { generateAnalysisHash } from "@/lib/utils/crypto";

export interface RegisterResultDTO {
    sample_id: string;
    qa_parameter_id: string;
    value_numeric?: number;
    value_text?: string;
    is_conforming?: boolean;
    notes?: string;
    equipment_id?: string;
    password?: string; // For electronic signature
}

/**
 * ResultDomainService
 * Manages the integrity and lifecycle of analytical results.
 */
export class ResultDomainService extends BaseDomainService {

    async registerResult(dto: RegisterResultDTO): Promise<DomainResponse> {
        // 1. Qualification & Segregation Check (Business Rule)
        const { checkAnalystQualification } = await import("@/lib/queries/training");

        // Fetch parameter category for segregation
        const { data: param } = await this.supabase
            .from("qa_parameters")
            .select("category")
            .eq("id", dto.qa_parameter_id)
            .single();

        if (this.context.role === 'lab_analyst' && param?.category === 'microbiological') {
            return this.failure("ACCESS DENIED: Lab Analysts cannot record Microbiological results.");
        }
        if (this.context.role === 'micro_analyst' && param?.category !== 'microbiological') {
            return this.failure("ACCESS DENIED: Micro Analysts cannot record Phisico-Chemical results.");
        }

        const qualCheck = await checkAnalystQualification(this.context.user_id, dto.qa_parameter_id);
        if (!qualCheck.qualified) {
            return this.failure(`Qualification Error: ${qualCheck.reason}`);
        }

        // Industrial OOS Rule
        if (dto.is_conforming === false && !dto.notes) {
            return this.failure("JUSTIFICAÇÃO OBRIGATÓRIA: Resultados fora de especificação exigem um comentário técnico.");
        }

        try {
            // 2. Electronic Signature Validation (If provided)
            let signatureHash = null;
            if (dto.password) {
                const isValid = await this.verifyElectronicSignature(dto.password);
                if (!isValid) return this.failure("Invalid electronic signature.");

                signatureHash = generateAnalysisHash({
                    analysisId: dto.qa_parameter_id,
                    sampleId: dto.sample_id,
                    parameterId: dto.qa_parameter_id,
                    value: dto.value_numeric ?? dto.value_text ?? '',
                    userId: this.context.user_id,
                    timestamp: new Date().toISOString()
                });
            }

            // 3. Persistence
            const { data: newResult, error } = await this.supabase
                .from("lab_analysis")
                .upsert({
                    organization_id: this.context.organization_id,
                    plant_id: this.context.plant_id,
                    sample_id: dto.sample_id,
                    qa_parameter_id: dto.qa_parameter_id,
                    value_numeric: dto.value_numeric ?? null,
                    value_text: dto.value_text ?? null,
                    is_conforming: dto.is_conforming ?? null,
                    notes: dto.notes ?? null,
                    equipment_id: dto.equipment_id ?? null,
                    status: 'completed',
                    analyzed_by: this.context.user_id,
                    analyzed_at: new Date().toISOString(),
                    signed_transaction_hash: signatureHash
                })
                .select("id")
                .single();

            if (error) throw error;

            // 4. AI Trigger (Optional/Async)
            if (dto.value_numeric !== undefined) {
                const { triggerResultValidation } = await import("@/lib/ai/triggers");
                triggerResultValidation(newResult.id, dto.sample_id, dto.qa_parameter_id, dto.value_numeric, "").catch(e => console.error(e));
            }

            // 5. Mandatory Audit
            await this.auditAction('RESULT_REGISTERED', 'analysis', newResult.id, {
                sample_id: dto.sample_id,
                parameter_id: dto.qa_parameter_id,
                is_conforming: dto.is_conforming
            });

            return this.success({ id: newResult.id });

        } catch (error: any) {
            console.error("[ResultService] Registration failed:", error);
            return this.failure("Failed to register result.", error);
        }
    }

    /**
     * Saves a batch of results with optional electronic signature and metadata updates.
     */
    async saveResultsBatch(params: {
        sampleId: string;
        results: { analysisId: string; value: string | number | null; is_conforming?: boolean; notes?: string; equipmentId?: string }[];
        notes?: string;
        password?: string;
        attachmentUrl?: string;
    }): Promise<DomainResponse> {
        const { sampleId, results, notes, password, attachmentUrl } = params;

        try {
            // 1. Electronic Signature Validation (If provided)
            let signatureHashBase = null;
            if (password) {
                const isValid = await this.verifyElectronicSignature(password);
                if (!isValid) return this.failure("ASSINATURA INVÁLIDA: Credenciais incorretas.");
                signatureHashBase = "SIGNED";
            }

            // 2. Role-Based Batch Check
            // Fetch categories for all parameters in this batch
            const paramIds = results.map(r => r.analysisId); // In saveResultsBatch, analysisId is the parameter if not mapped
            // Wait, in saveResultsBatch, are these analysis IDs or parameter IDs? 
            // Looking at the update, they are used as ID of lab_analysis.

            const { data: analyses } = await this.supabase
                .from("lab_analysis")
                .select("id, parameter:qa_parameters(category)")
                .in("id", results.map(r => r.analysisId));

            for (const analysis of (analyses || [])) {
                const category = (analysis.parameter as any)?.category;
                if (this.context.role === 'lab_analyst' && category === 'microbiological') {
                    return this.failure("ERRO DE SEGREGAÇÃO: O lote contém análises microbiológicas não autorizadas.");
                }
                if (this.context.role === 'micro_analyst' && category !== 'microbiological') {
                    return this.failure("ERRO DE SEGREGAÇÃO: O lote contém análises físico-químicas não autorizadas.");
                }
            }

            // 2. Process each result
            for (const res of results) {
                const numericValue = typeof res.value === 'string'
                    ? (res.value.trim() === '' ? null : parseFloat(res.value))
                    : res.value;

                const signatureHash = signatureHashBase ? generateAnalysisHash({
                    analysisId: res.analysisId,
                    sampleId,
                    parameterId: res.analysisId,
                    value: res.value,
                    userId: this.context.user_id,
                    timestamp: new Date().toISOString()
                }) : null;

                // Industrial OOS Rule: Block batch if any OOS result lacks justification
                if (res.is_conforming === false && !res.notes) {
                    return this.failure(`JUSTIFICAÇÃO OBRIGATÓRIA: O parâmetro ID ${res.analysisId} está fora de especificação e requer um comentário técnico.`);
                }

                await this.supabase.from("lab_analysis").update({
                    value_numeric: numericValue,
                    value_text: typeof res.value === 'string' && isNaN(parseFloat(res.value)) ? res.value : null,
                    is_conforming: res.is_conforming ?? null,
                    notes: res.notes || null,
                    equipment_id: res.equipmentId || null,
                    status: 'completed',
                    analyzed_by: this.context.user_id,
                    analyzed_at: new Date().toISOString(),
                    signed_transaction_hash: signatureHash
                }).eq("id", res.analysisId).eq("organization_id", this.context.organization_id);
            }

            // 3. Update Sample Metadata
            if (notes !== undefined || attachmentUrl !== undefined) {
                const updateData: any = {};
                if (notes !== undefined) updateData.notes = notes;
                if (attachmentUrl !== undefined) updateData.attachment_url = attachmentUrl;
                await this.supabase.from("samples").update(updateData).eq("id", sampleId);
            }

            // 4. Industrial Audit
            await this.auditAction('LAB_RESULTS_SIGNED_SAVED', 'samples', sampleId, {
                resultCount: results.length,
                signed: !!password
            });

            return this.success();

        } catch (error: any) {
            console.error("[ResultService] Bulk save failed:", error);
            return this.failure("Failed to save results batch.", error);
        }
    }

    private async verifyElectronicSignature(password: string): Promise<boolean> {
        const { data: profile } = await this.supabase.rpc('verify_user_password', {
            p_user_id: this.context.user_id,
            p_password: password
        });
        return !!profile;
    }
}

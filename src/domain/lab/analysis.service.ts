import { BaseDomainService } from "../shared/base.service";
import { DomainResponse } from "../shared/industrial.context";
import { AnalysisFSM, AnalysisStatus } from "./analysis.fsm";
import { generateAnalysisHash } from "@/lib/utils/crypto";

export interface SaveResultDTO {
    analysisId?: string;
    sampleId: string;
    parameterId?: string;
    value: string | number | null;
    is_conforming?: boolean;
    notes?: string;
    equipmentId?: string;
    password?: string;
}

export class AnalysisDomainService extends BaseDomainService {

    /**
     * Set an analysis to 'started' status when an analyst picks it up.
     */
    async startAnalysis(analysisId: string): Promise<DomainResponse> {
        try {
            const { data: analysis, error: fetchError } = await this.supabase
                .from("lab_analysis")
                .select("status, parameter:qa_parameters(category)")
                .eq("id", analysisId)
                .single();

            if (fetchError || !analysis) return this.failure("Analysis not found.");

            // 1. Role-Based Segregation Check
            const param: any = Array.isArray(analysis.parameter) ? analysis.parameter[0] : analysis.parameter;
            const category = param?.category;

            if (this.context.role === 'lab_analyst' && category === 'microbiological') {
                return this.failure("ACCESS DENIED: Lab Analysts cannot start Microbiological analyses.");
            }
            if (this.context.role === 'micro_analyst' && category !== 'microbiological') {
                return this.failure("ACCESS DENIED: Micro Analysts cannot start Phisico-Chemical/Sensory analyses.");
            }

            if (!AnalysisFSM.isValidTransition(analysis.status as AnalysisStatus, 'started')) {
                return this.failure(`Invalid transition from ${analysis.status} to started.`);
            }

            const { error: updateError } = await this.supabase
                .from("lab_analysis")
                .update({
                    status: 'started',
                    analyzed_by: this.context.user_id,
                    updated_at: new Date().toISOString()
                })
                .eq("id", analysisId);

            if (updateError) throw updateError;

            await this.auditAction('ANALYSIS_STARTED', 'analysis', analysisId);
            return this.success({ id: analysisId, status: 'started' });

        } catch (error: any) {
            return this.failure("Failed to start analysis.", error);
        }
    }

    /**
     * Completes an analysis with results.
     */
    async completeAnalysis(analysisId: string, payload: {
        value_numeric?: number;
        value_text?: string;
        is_conforming?: boolean;
        notes?: string;
        equipment_id?: string;
        password?: string;
    }): Promise<DomainResponse> {
        try {
            const { password, ...data } = payload;

            // 1. Electronic Signature Check
            if (password) {
                const isValid = await this.verifyElectronicSignature(password);
                if (!isValid) return this.failure("ASSINATURA INVÁLIDA: Credenciais incorretas.");
            }

            const { data: analysis, error: fetchError } = await this.supabase
                .from("lab_analysis")
                .select("status, sample_id, qa_parameter_id, parameter:qa_parameters(category)")
                .eq("id", analysisId)
                .single();

            if (fetchError || !analysis) return this.failure("Analysis not found.");

            // Security: Immutability Check
            const { data: sample } = await this.supabase
                .from("samples")
                .select("status")
                .eq("id", analysis.sample_id)
                .single();

            if (!sample || ['approved', 'rejected', 'released', 'archived'].includes(sample.status)) {
                return this.failure(`IMMUTABILITY VIOLATION: Parent sample is ${sample?.status || 'missing'}. Record is locked.`);
            }

            // 2. Role-Based Segregation Check
            const param: any = Array.isArray(analysis.parameter) ? analysis.parameter[0] : analysis.parameter;
            const category = param?.category;

            if (this.context.role === 'lab_analyst' && category === 'microbiological') {
                return this.failure("ACCESS DENIED: Lab Analysts cannot record Microbiological results.");
            }
            if (this.context.role === 'micro_analyst' && category !== 'microbiological') {
                return this.failure("ACCESS DENIED: Micro Analysts cannot record Phisico-Chemical results.");
            }

            // 3. OOS Enforcement (Industrial Rules)
            if (data.is_conforming === false && !data.notes) {
                return this.failure("JUSTIFICAÇÃO OBRIGATÓRIA: Resultados fora de especificação exigem um comentário técnico.");
            }

            if (!AnalysisFSM.isValidTransition(analysis.status as AnalysisStatus, 'completed')) {
                return this.failure(`Invalid transition from ${analysis.status} to completed.`);
            }

            const { error: updateError } = await this.supabase
                .from("lab_analysis")
                .update({
                    ...data,
                    status: 'completed',
                    analyzed_at: new Date().toISOString(),
                    analyzed_by: this.context.user_id,
                    signed_transaction_hash: password ? generateAnalysisHash({
                        analysisId: analysisId,
                        sampleId: analysis.sample_id,
                        parameterId: analysis.qa_parameter_id,
                        value: data.value_numeric ?? data.value_text ?? '',
                        userId: this.context.user_id,
                        timestamp: new Date().toISOString()
                    }) : null,
                    updated_at: new Date().toISOString()
                })
                .eq("id", analysisId);

            if (updateError) throw updateError;

            await this.auditAction('ANALYSIS_COMPLETED', 'analysis', analysisId, payload);
            return this.success({ id: analysisId, status: 'completed' });

        } catch (error: any) {
            return this.failure("Failed to complete analysis.", error);
        }
    }

    /**
     * Invalidates an analysis and handles retest logic.
     */
    async invalidateAnalysis(analysisId: string, reason: string, password?: string): Promise<DomainResponse> {
        // Security: Authority Check
        this.enforceRole(['lab_analyst', 'micro_analyst', 'qa_manager', 'qc_supervisor', 'qc_technician', 'admin']);

        try {
            // 0. Signature Verification (21 CFR Part 11)
            if (password) {
                const isValid = await this.verifyElectronicSignature(password);
                if (!isValid) return this.failure("Assinatura eletrónica inválida.");
            }
            const { data: original, error: fetchError } = await this.supabase
                .from("lab_analysis")
                .select("*")
                .eq("id", analysisId)
                .single();

            if (fetchError || !original) return this.failure("Analysis not found.");

            // Security: Immutability Check
            const { data: sample } = await this.supabase
                .from("samples")
                .select("status")
                .eq("id", original.sample_id)
                .single();

            if (!sample || ['approved', 'rejected', 'released', 'archived'].includes(sample.status)) {
                return this.failure(`IMMUTABILITY VIOLATION: Cannot invalidate analysis for sample in '${sample?.status || 'missing'}' state.`);
            }

            // 1. Mark as Invalidated
            const { error: invalidateError } = await this.supabase
                .from("lab_analysis")
                .update({
                    status: 'invalidated',
                    is_valid: false,
                    notes: `INVALIDATED: ${reason} (Original Notes: ${original.notes || ''})`,
                    updated_at: new Date().toISOString(),
                    updated_by: this.context.user_id
                })
                .eq("id", analysisId);

            if (invalidateError) throw invalidateError;

            // 2. Clear Sample decision if it was approved (forced re-review)
            await this.supabase
                .from("samples")
                .update({
                    status: 'in_analysis',
                    validated_at: null,
                    validated_by: null
                })
                .eq("id", original.sample_id);

            // 3. Create Retest Analysis (Clone)
            const { error: retestError } = await this.supabase
                .from("lab_analysis")
                .insert({
                    organization_id: original.organization_id,
                    plant_id: original.plant_id,
                    sample_id: original.sample_id,
                    qa_parameter_id: original.qa_parameter_id,
                    status: 'pending',
                    is_retest: true,
                    supersedes_id: analysisId,
                    retest_reason: reason
                });

            if (retestError) throw retestError;

            await this.auditAction('ANALYSIS_INVALIDATED', 'analysis', analysisId, {
                reason,
                signed: !!password
            });
            return this.success({ id: analysisId, status: 'invalidated' });

        } catch (error: any) {
            return this.failure("Failed to invalidate analysis.", error);
        }
    }

    async verifyElectronicSignature(password: string): Promise<boolean> {
        try {
            const { data, error } = await this.supabase.rpc('verify_user_password', {
                p_user_id: this.context.user_id,
                p_password: password
            });
            if (error) throw error;
            return !!data;
        } catch (error) {
            console.error("[AnalysisService] Signature verification error:", error);
            return false;
        }
    }

    /**
     * Batch save results with strict security locks.
     * Ported from ResultDomainService for unification.
     */
    async saveResultsBatch(params: {
        sampleId: string;
        results: SaveResultDTO[];
        notes?: string;
        password?: string;
        attachmentUrl?: string;
    }): Promise<DomainResponse> {
        const { sampleId, results, notes, password, attachmentUrl } = params;

        // Security: Enforce RBAC
        this.enforceRole(['lab_analyst', 'micro_analyst', 'admin', 'qa_manager', 'system_owner', 'qc_supervisor', 'quality']);

        try {
            // 1. Immutability Check
            const { data: sampleStatus } = await this.supabase
                .from("samples")
                .select("status")
                .eq("id", sampleId)
                .single();

            if (!sampleStatus || ['approved', 'rejected', 'released', 'archived'].includes(sampleStatus.status)) {
                return this.failure(`IMMUTABILITY VIOLATION: Cannot edit sample in '${sampleStatus?.status || 'missing'}' state.`);
            }

            // 2. Electronic Signature Check (MANDATORY 21 CFR PART 11)
            if (!password) {
                return this.failure("SECURITY BLOCK: Assinatura eletrónica é obrigatória para submeter resultados.");
            }

            const isValid = await this.verifyElectronicSignature(password);
            if (!isValid) return this.failure("ASSINATURA INVÁLIDA: Credenciais incorretas.");

            const signatureHashBase = "SIGNED";

            // 3. Batch Execution Traceability
            for (const res of results) {
                // Determine if we have analysisId or need to find it by parameter
                let targetAnalysisId = res.analysisId;
                if (!targetAnalysisId && res.parameterId) {
                    const { data: found } = await this.supabase
                        .from("lab_analysis")
                        .select("id")
                        .eq("sample_id", sampleId)
                        .eq("qa_parameter_id", res.parameterId)
                        .single();
                    targetAnalysisId = found?.id;
                }

                if (!targetAnalysisId) continue;

                // Segregation + OOS Validation
                const { data: analysis } = await this.supabase
                    .from("lab_analysis")
                    .select("qa_parameter_id, parameter:qa_parameters(category)")
                    .eq("id", targetAnalysisId)
                    .single();

                const category = (analysis?.parameter as any)?.category;
                if (this.context.role === 'lab_analyst' && category === 'microbiological') {
                    return this.failure(`ERRO DE SEGREGAÇÃO: Análise microbiológica (ID ${targetAnalysisId}) não autorizada.`);
                }

                if (res.is_conforming === false && !res.notes) {
                    return this.failure("JUSTIFICAÇÃO OBRIGATÓRIA: Resultados fora de especificação exigem um comentário técnico.");
                }

                // Persistence
                const numericValue = typeof res.value === 'string'
                    ? (res.value.trim() === '' ? null : parseFloat(res.value))
                    : res.value;

                await this.supabase.from("lab_analysis").update({
                    value_numeric: numericValue,
                    value_text: typeof res.value === 'string' && isNaN(parseFloat(res.value)) ? res.value : null,
                    is_conforming: res.is_conforming ?? null,
                    notes: res.notes || null,
                    equipment_id: res.equipmentId || null,
                    status: 'completed',
                    analyzed_by: this.context.user_id,
                    analyzed_at: new Date().toISOString(),
                    signed_transaction_hash: signatureHashBase ? generateAnalysisHash({
                        analysisId: targetAnalysisId,
                        sampleId,
                        parameterId: analysis?.qa_parameter_id || '',
                        value: res.value,
                        userId: this.context.user_id,
                        timestamp: new Date().toISOString()
                    }) : null
                }).eq("id", targetAnalysisId);
            }

            // 4. Update Sample Metadata
            if (notes !== undefined || attachmentUrl !== undefined) {
                const updateData: any = {};
                if (notes !== undefined) updateData.notes = notes;
                if (attachmentUrl !== undefined) updateData.attachment_url = attachmentUrl;
                await this.supabase.from("samples").update(updateData).eq("id", sampleId);
            }

            await this.auditAction('LAB_RESULTS_SAVED_UNIFIED', 'samples', sampleId, { count: results.length });
            return this.success();

        } catch (error: any) {
            return this.failure("Erro ao salvar lote de resultados (Unified).", error);
        }
    }
}

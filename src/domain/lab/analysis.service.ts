import { BaseDomainService } from "../shared/base.service";
import { DomainResponse } from "../shared/industrial.context";
import { AnalysisFSM, AnalysisStatus } from "./analysis.fsm";
import { generateAnalysisHash } from "@/lib/utils/crypto";

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
    async invalidateAnalysis(analysisId: string, reason: string): Promise<DomainResponse> {
        try {
            const { data: original, error: fetchError } = await this.supabase
                .from("lab_analysis")
                .select("*")
                .eq("id", analysisId)
                .single();

            if (fetchError || !original) return this.failure("Analysis not found.");

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

            await this.auditAction('ANALYSIS_INVALIDATED', 'analysis', analysisId, { reason });
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
}

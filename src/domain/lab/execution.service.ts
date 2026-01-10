import { SupabaseClient } from "@supabase/supabase-js";
import { BaseDomainService } from "../shared/base.service";
import { DomainResponse, DomainContext } from "../shared/industrial.context";
import { AnalysisFSM, AnalysisStatus } from "./analysis.fsm";
import { ResultEvaluationService } from "./result-evaluation.service";
import { ElectronicSignatureService } from "./signature.service";

/**
 * AnalysisExecutionService
 * 
 * Coordinates the full industrial laboratory execution lifecycle.
 * Enforces strict FSM, Equipment Qualification, and OOS compliance.
 */
export class AnalysisExecutionService extends BaseDomainService {
    private signatureService: ElectronicSignatureService;

    constructor(supabase: SupabaseClient, context: DomainContext) {
        super(supabase, context);
        this.signatureService = new ElectronicSignatureService(supabase, context);
    }

    /**
     * Zone A: Context Fetcher
     * Validates equipment and pickups context for the technician.
     */
    async getExecutionBadge(analysisId: string): Promise<DomainResponse> {
        try {
            const { data: analysis, error } = await this.supabase
                .from("lab_analysis")
                .select(`
                    *,
                    parameter:qa_parameters(*),
                    sample:samples(*, batch:production_batches(*, product:products(*))),
                    equipment:equipments(*)
                `)
                .eq("id", analysisId)
                .single();

            if (error || !analysis) return this.failure("Análise não encontrada.");

            // Equipment Qualification Check
            if (analysis.equipment_id) {
                const eq = analysis.equipment;
                const now = new Date();
                if (eq.next_calibration_date && new Date(eq.next_calibration_date) < now) {
                    return this.failure(`EQUIPAMENTO BLOQUEADO: ${eq.name} com calibração expirada.`, { equipment: eq });
                }
                if (eq.status !== 'active') {
                    return this.failure(`EQUIPAMENTO INVÁLIDO: ${eq.name} está ${eq.status}.`);
                }
            }

            return this.success(analysis);
        } catch (error: any) {
            return this.failure("Falha ao obter contexto de execução.", error);
        }
    }

    /**
     * Retrieves full sample context, analyses, and specifications for the Industrial Wizard.
     * Matches the robust logic from the Sample Details Page.
     */
    async getBatchExecutionContext(sampleId: string): Promise<DomainResponse> {
        try {
            // 1. Build Query with Role-Based Filtering
            let sampleQuery = this.supabase
                .from("samples")
                .select(`
                    *,
                    type: sample_types(id, name, code),
                    batch: production_batches(
                        id, code,
                        product: products(id, name, sku)
                    ),
                    intermediate_product: intermediate_products(
                        id, code, status,
                        equipment_id,
                        product_id,
                        batch: production_batches(
                            id, code,
                            product: products(id, name, sku) 
                        )
                    ),
                    sampling_point: sampling_points(id, name, code, location),
                    lab_analysis(
                        id,
                        value_numeric,
                        value_text,
                        is_conforming,
                        analyzed_by,
                        analyzed_at,
                        status,
                        qa_parameter_id,
                        deviation_type,
                        notes,
                        equipment_id,
                        parameter: qa_parameters!inner(
                            id, name, code, unit, category
                        ),
                        analyst: user_profiles!lab_analysis_analyzed_by_profile_fkey(full_name),
                        equipment: equipments(id, name, code, next_calibration_date, status)
                    )
                `)
                .eq("id", sampleId);

            // Apply strict category filtering based on role (Segregated Compliance)
            const role = this.context.role;
            if (role === 'lab_analyst') {
                sampleQuery = sampleQuery.not('lab_analysis.parameter.category', 'eq', 'microbiological');
            } else if (role === 'micro_analyst') {
                sampleQuery = sampleQuery.eq('lab_analysis.parameter.category', 'microbiological');
            }

            const { data: sample, error: sampleError } = await sampleQuery.single();

            if (sampleError || !sample) {
                return this.failure("Amostra não encontrada ou acesso negado.");
            }

            // 2. Resolve Product Authority (Strict Scoping)
            const isIntermediate = !!sample.intermediate_product_id;
            const productId = isIntermediate
                ? sample.intermediate_product?.product_id
                : (sample.batch?.product?.id || sample.intermediate_product?.batch?.product?.id);
            const analysesRaw = (sample as any).lab_analysis || [];

            let specQuery = this.supabase
                .from("product_specifications")
                .select(`
                    qa_parameter_id, 
                    min_value, 
                    max_value, 
                    target_value, 
                    sample_type_id,
                    product_id,
                    parameter:qa_parameters!inner(category)
                `)
                .eq("status", "active");

            // Role-based segregation
            if (this.context.role === 'lab_analyst') {
                specQuery = specQuery.neq('parameter.category', 'microbiological');
            } else if (this.context.role === 'micro_analyst') {
                specQuery = specQuery.eq('parameter.category', 'microbiological');
            }

            // Path A: Product-based scoping (Strict)
            if (productId) {
                // IMPORTANT: For product samples, we strictly follow the product spec.
                // We do NOT mix with general sample type specs to avoid OOS false positives.
                specQuery = specQuery.eq("product_id", productId);
            }
            // Path B: General sampling (Environment/Utilities)
            else {
                specQuery = specQuery.eq("sample_type_id", sample.sample_type_id);
            }

            const { data: productSpecs } = await specQuery;
            const specs: Record<string, any> = {};

            productSpecs?.forEach((spec: any) => {
                const existing = specs[spec.qa_parameter_id];
                // Preference: Specific Product Spec > Global Spec
                if (!existing || (spec.product_id === productId)) {
                    specs[spec.qa_parameter_id] = spec;
                }
            });

            // 3. Filter & Normalize Analyses
            const analyses = analysesRaw
                .map((a: any) => ({
                    ...a,
                    parameter: Array.isArray(a.parameter) ? a.parameter[0] : a.parameter,
                    analyst: Array.isArray(a.analyst) ? a.analyst[0] : a.analyst,
                    equipment: Array.isArray(a.equipment) ? a.equipment[0] : a.equipment
                }))
                .filter((analysis: any) => {
                    // Industrial Logic: Show if it has a spec OR if it already has a recorded value (diagnostic/retest)
                    const hasSpec = !!specs[analysis.qa_parameter_id];
                    const hasValue = analysis.value_numeric !== null || analysis.value_text !== null;

                    // Critical: if it exists in the lab_analysis table, it's intended to be executed
                    // for this specific sample (Technical Plan enforcement).
                    return hasSpec || hasValue;
                });

            return this.success({ sample, analyses, specs });

        } catch (error: any) {
            console.error("Context fetch failed:", error);
            return this.failure("Erro ao carregar contexto do lote.", error);
        }
    }

    /**
     * Zone B & C: Process Results and Sign
     */
    async submitResults(analysisId: string, payload: {
        value: number | string;
        equipmentId?: string;
        notes?: string;
        deviationType?: string;
        password?: string;
    }): Promise<DomainResponse> {
        try {
            // 1. Fetch Analysis and Product Context
            const { data: analysis, error: fetchError } = await this.supabase
                .from("lab_analysis")
                .select(`
                    *,
                    parameter:qa_parameters(*),
                    sample:samples(
                        id,
                        batch:production_batches(product_id)
                    )
                `)
                .eq("id", analysisId)
                .single();

            if (fetchError || !analysis) return this.failure("Análise não encontrada.");

            // Security: Enforce RBAC
            this.enforceRole(['lab_analyst', 'micro_analyst', 'admin', 'qa_manager', 'system_owner']);

            // Security: Immutability Check
            const { data: sampleStatus } = await this.supabase
                .from("samples")
                .select("status")
                .eq("id", analysis.sample_id)
                .single();

            if (!sampleStatus || ['approved', 'rejected', 'released', 'archived'].includes(sampleStatus.status)) {
                return this.failure(`IMMUTABILITY VIOLATION: Parent sample is ${sampleStatus?.status || 'missing'}. Execution locked.`);
            }

            // Security: Prevent Signature Overwrite (NC-04)
            if (analysis.status === 'completed' && analysis.signed_transaction_hash) {
                return this.failure("VIOLAÇÃO DE INTEGRIDADE: Este resultado já possui uma assinatura digital válida e não pode ser sobrescrito.");
            }

            // 2. Fetch Specification Limits (Industrial Tier)
            const { data: specData } = await this.supabase
                .from("product_specifications")
                .select("*")
                .eq("product_id", (analysis.sample as any)?.batch?.product_id)
                .eq("qa_parameter_id", analysis.qa_parameter_id)
                .maybeSingle();

            const spec = {
                min_value: specData?.min_value,
                max_value: specData?.max_value,
                target_value: specData?.target_value
            };

            const evaluation = ResultEvaluationService.evaluate(payload.value, spec);

            // 3. OOS Enforcement (Industrial Non-Negotiable)
            if (!evaluation.is_conforming && !payload.notes) {
                return this.failure("JUSTIFICAÇÃO OBRIGATÓRIA: Resultados fora de especificação exigem um comentário técnico.");
            }

            // 4. Update State (FSM)
            // We allow moving to 'completed' without signature during a flow session.
            const nextStatus: AnalysisStatus = 'completed';

            // 5. Persist
            const { error: updateError } = await this.supabase
                .from("lab_analysis")
                .update({
                    value_numeric: typeof payload.value === 'number' ? payload.value : null,
                    value_text: typeof payload.value === 'string' ? payload.value : null,
                    is_conforming: evaluation.is_conforming,
                    notes: payload.notes,
                    deviation_type: payload.deviationType,
                    equipment_id: payload.equipmentId ?? analysis.equipment_id,
                    status: nextStatus,
                    analyzed_at: new Date().toISOString(),
                    analyzed_by: this.context.user_id,
                    updated_by: this.context.user_id,
                    updated_at: new Date().toISOString()
                })
                .eq("id", analysisId);

            if (updateError) throw updateError;

            await this.auditAction('ANALYSIS_RESULT_SAVED', 'analysis', analysisId, {
                evaluation,
                batchFlow: true
            });

            return this.success({ id: analysisId, evaluation });

        } catch (error: any) {
            console.error("[AnalysisExecutionService] Submission failed:", error);
            return this.failure("Falha ao submeter resultados.", error);
        }
    }

    async finalizeBatchResults(
        sampleId: string,
        password: string, // Mandatory 21 CFR Signature
        results: Array<{
            analysisId: string;
            value: string | number;
            notes?: string;
            deviationType?: string;
            equipmentId?: string;
        }>
    ): Promise<DomainResponse> {
        try {
            // Security: Enforce RBAC
            this.enforceRole(['lab_analyst', 'micro_analyst', 'admin', 'qa_manager', 'system_owner']);

            // Security: Immutability Check
            const { data: sampleStatus } = await this.supabase
                .from("samples")
                .select("status")
                .eq("id", sampleId)
                .single();

            if (!sampleStatus || ['approved', 'rejected', 'released', 'archived'].includes(sampleStatus.status)) {
                return this.failure(`IMMUTABILITY VIOLATION: Cannot finalize execution for locked sample (${sampleStatus?.status || 'missing'}).`);
            }

            // 1. Verify Electronic Signature
            const isSigValid = await this.signatureService.verify(password);
            if (!isSigValid) return this.failure("ASSINATURA INVÁLIDA: Credenciais incorretas.");

            // 2. Fetch all necessary data for validation with comprehensive joins
            const { data: analyses, error: fetchError } = await this.supabase
                .from("lab_analysis")
                .select(`
                    id, 
                    qa_parameter_id,
                    sample:samples(
                        id,
                        sample_type_id,
                        batch:production_batches(product_id),
                        intermediate_product:intermediate_products(
                            batch:production_batches(product_id)
                        )
                    )
                `)
                .eq("sample_id", sampleId);

            if (fetchError || !analyses) return this.failure("Erro ao recuperar contexto das análises.");

            // 3. Prepare Batch Data & Validate
            const timestamp = new Date().toISOString();
            const sessionHash = this.signatureService.generateHash({
                analysisId: 'BATCH-' + sampleId,
                sampleId,
                parameterId: 'MULTIPLE',
                value: 'SESS-REF-' + timestamp,
                timestamp
            });

            // 4. Prepare Batch Payload
            const updatePayload: any[] = [];

            // Process each result
            for (const resultEntry of results) {
                const analysis = analyses.find(a => a.id === resultEntry.analysisId);
                if (!analysis) continue;

                const sample = analysis.sample as any;
                const isIntermediate = !!sample.intermediate_product_id;
                const productId = isIntermediate
                    ? sample.intermediate_product?.product_id
                    : (sample.batch?.product?.id || sample.intermediate_product?.batch?.product?.id);

                // Fetch Spec with strict scoping (Matching getBatchExecutionContext logic)
                let specQuery = this.supabase
                    .from("product_specifications")
                    .select("*")
                    .eq("status", "active")
                    .eq("qa_parameter_id", analysis.qa_parameter_id);

                if (productId) {
                    specQuery = specQuery.eq("product_id", productId);
                } else {
                    specQuery = specQuery.eq("sample_type_id", sample.sample_type_id);
                }

                const { data: specDataList } = await specQuery;
                const specData = specDataList?.[0]; // Single truth since we scoped by product

                const spec = {
                    min_value: specData?.min_value,
                    max_value: specData?.max_value,
                    target_value: specData?.target_value
                };

                const evaluation = ResultEvaluationService.evaluate(resultEntry.value, spec);

                // OOS enforcement
                if (!evaluation.is_conforming && !resultEntry.notes) {
                    return this.failure(`JUSTIFICAÇÃO OBRIGATÓRIA: O parâmetro ${analysis.id} está OOS e exige nota técnica.`);
                }

                // Validate Equipment Existence (via lab_assets)
                let validLabAssetId = resultEntry.equipmentId;
                if (validLabAssetId) {
                    const { count } = await this.supabase
                        .from("lab_assets")
                        .select("id", { count: "exact", head: true })
                        .eq("id", validLabAssetId);

                    if (count === 0) {
                        console.warn(`[AnalysisExecutionService] Invalid lab_asset ID ${validLabAssetId} detected and removed.`);
                        validLabAssetId = undefined; // Strip invalid ID
                    }
                }

                // Add to atomic payload
                updatePayload.push({
                    id: analysis.id,
                    value_numeric: typeof resultEntry.value === 'number' ? resultEntry.value : null,
                    value_text: typeof resultEntry.value === 'string' ? resultEntry.value : null,
                    is_conforming: evaluation.is_conforming,
                    notes: resultEntry.notes,
                    deviation_type: resultEntry.deviationType,
                    lab_asset_id: validLabAssetId, // New Standard
                    status: 'completed',
                    signed_transaction_hash: sessionHash,
                    analyzed_at: timestamp,
                    analyzed_by: this.context.user_id,
                    updated_by: this.context.user_id,
                    updated_at: timestamp
                });
            }

            // 5. Atomic Persistence via RPC (Bypasses RLS for Analyst)
            if (updatePayload.length > 0) {
                const { error: batchError } = await this.supabase
                    .rpc("update_batch_results_atomic", { payload: updatePayload });

                if (batchError) {
                    console.error("Batch RPC Error:", batchError);
                    throw batchError;
                }
            }

            // 5. Progress Sample Status
            const { error: sampleError } = await this.supabase
                .from("samples")
                .update({ status: 'under_review' })
                .eq("id", sampleId);

            if (sampleError) throw sampleError;

            await this.auditAction('BATCH_SIGNATURE_COMPLETED', 'samples', sampleId, {
                resultsCount: results.length,
                transactionHash: sessionHash
            });

            return this.success({ sampleId, hash: sessionHash });

        } catch (error: any) {
            console.error("[AnalysisExecutionService] Batch finalization failed:", error);
            return this.failure("Falha ao finalizar lote de análises.", error);
        }
    }
}

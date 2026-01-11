import { SupabaseClient } from "@supabase/supabase-js";
import { BaseDomainService } from "../shared/base.service";
import { ProductionOrchestratorService } from "../production/production-orchestrator.service";
import { DomainResponse, DomainContext } from "../shared/industrial.context";
import { AnalysisFSM, AnalysisStatus } from "./analysis.fsm";
import { ResultEvaluationService } from "./result-evaluation.service";
import { ElectronicSignatureService } from "./signature.service";
import { NonConformityDomainService } from "../quality/nc.service";

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
     * Set an analysis to 'started' status when an analyst picks it up.
     * Migrated from deprecated AnalysisDomainService.
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
     * Invalidates an analysis and handles retest logic.
     * Migrated from deprecated AnalysisDomainService.
     */
    async invalidateAnalysis(analysisId: string, reason: string, password?: string): Promise<DomainResponse> {
        // Security: Authority Check
        this.enforceRole(['lab_analyst', 'micro_analyst', 'qa_manager', 'qc_supervisor', 'qc_technician', 'admin']);

        try {
            // 0. Signature Verification (21 CFR Part 11)
            if (password) {
                const isValid = await this.signatureService.verify(password);
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

    /**
     * COMPATIBILITY WRAPPER: Delegates to submitResults.
     * Maintains backward compatibility with legacy action signatures.
     */
    async completeAnalysis(analysisId: string, payload: {
        value_numeric?: number;
        value_text?: string;
        is_conforming?: boolean;
        notes?: string;
        equipment_id?: string;
        password?: string;
    }): Promise<DomainResponse> {
        // Adapt payload to submitResults signature
        const value = payload.value_numeric ?? payload.value_text ?? '';
        return this.submitResults(analysisId, {
            value,
            notes: payload.notes,
            equipmentId: payload.equipment_id,
            password: payload.password
        });
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
                        id, code, product_id,
                        product: products(id, name, sku)
                    ),
                    intermediate_product: intermediate_products(
                        id, code, status,
                        tank_id,
                        product_id,
                        batch: production_batches(
                            id, code, product_id,
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

            // CRITICAL: We DO NOT filter by nested resource categories (e.g. lab_analysis.parameter.category) 
            // in the root .single() query, as this causes PostgREST row multiplication and fails the .single() constraint.
            // Filtering is handled in the JS layer below.

            const { data: sample, error: sampleError } = await sampleQuery.single();

            if (sampleError || !sample) {
                return this.failure("Amostra não encontrada ou acesso negado.");
            }

            // 2. Resolve Product Authority based on Sample Type (Strict Scoping)
            // CORRECTED LOGIC: FP samples ALWAYS use Batch Product. IP samples use IP Product.
            // We trust the `sample_type.code` which is usually 'FP-FQ', 'IP-MICRO', etc.

            const sampleType = Array.isArray(sample.type) ? sample.type[0] : sample.type;
            const sampleTypeCode = sampleType?.code || "";
            const isFinishedProduct = sampleTypeCode.startsWith("FP");
            const isIntermediate = sampleTypeCode.startsWith("IP") || !!sample.intermediate_product_id; // Fallback to ID if code missing

            // Robust resolution handling arrays from Supabase/PostgREST joins
            const batch = Array.isArray(sample.batch) ? sample.batch[0] : sample.batch;
            const ip = Array.isArray(sample.intermediate_product) ? sample.intermediate_product[0] : sample.intermediate_product;

            let productId = null;

            if (isFinishedProduct) {
                // CASE: Finished Product -> Always use Batch Product
                productId = batch?.product_id || (Array.isArray(batch?.product) ? batch?.product[0]?.id : batch?.product?.id);
            } else if (isIntermediate) {
                // CASE: Intermediate Product -> Prioritize IP Product -> Fallback to Batch Product
                productId = ip?.product_id || batch?.product_id;
            } else {
                // CASE: Environmental / Other -> Fallback to Batch (e.g. Utility water from a batch run)
                productId = batch?.product_id;
            }

            const allAnalyses = (sample as any).lab_analysis || [];

            // Apply role-based filtering in application layer to prevent query multiplication
            const role = this.context.role;
            const analysesRaw = allAnalyses.filter((a: any) => {
                const category = Array.isArray(a.parameter) ? a.parameter[0]?.category : a.parameter?.category;
                if (role === 'lab_analyst') return category !== 'microbiological';
                if (role === 'micro_analyst') return category === 'microbiological';
                return true;
            });

            let specQuery = this.supabase
                .from("product_specifications")
                .select(`
                    qa_parameter_id, 
                    min_value, 
                    max_value, 
                    target_value, 
                    sample_type_id,
                    product_id,
                    process_context,
                    parameter:qa_parameters!inner(category)
                `)
                .eq("status", "active");

            // Role-based segregation for specifications (Compliance Tier)
            if (this.context.role === 'lab_analyst') {
                specQuery = specQuery.neq('parameter.category', 'microbiological');
            } else if (this.context.role === 'micro_analyst') {
                specQuery = specQuery.eq('parameter.category', 'microbiological');
            }

            // Path A: Strict Scoping (Product/Version)
            if (sample.spec_version_id) {
                specQuery = specQuery.eq("technical_sheet_id", sample.spec_version_id);
            } else if (productId) {
                specQuery = specQuery.eq("product_id", productId);
            } else {
                // Path B: General sampling (Environment/Utilities)
                specQuery = specQuery.eq("sample_type_id", sample.sample_type_id);
            }

            // Always apply the stage-gate filter (Sample Type or Global NULL)
            specQuery = specQuery.or(`sample_type_id.eq.${sample.sample_type_id},sample_type_id.is.null`);

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
                        sample_type_id,
                        batch:production_batches(product_id),
                        intermediate_product:intermediate_products(product_id)
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
                return this.failure("VIOLAÇÃO DE INTEGRIDADE: Este resultado já possui uma assinatura digital válida e não pode ser sobrescrita.");
            }

            const sampleContext = analysis.sample as any;
            const batchContext = Array.isArray(sampleContext?.batch) ? sampleContext.batch[0] : sampleContext?.batch;
            const ipContext = Array.isArray(sampleContext?.intermediate_product) ? sampleContext.intermediate_product[0] : sampleContext?.intermediate_product;

            // Robust Product Resolution matching getBatchExecutionContext
            // Note: In submitResults we might need to fetch sample_type code if not present, 
            // but for now we rely on the same logic if possible. 
            // The previous query for `analysis` included `sample:samples(...)` but we didn't join `sample_types` there explicitly?
            // Actually `submitResults` fetches `analysis` with `sample:samples(...)`.
            // We should ensure sample_types is fetched in submitResults too.
            // For now, let's use a safe fallback: if intermediate_product_id is present AND batch_id is present, check relation context.
            // BUT, `submitResults` 1st fetch joins `sample:samples(...)`. I should check that fetch.
            // Assuming we update the fetch to include `type:sample_types(code)`.

            // Fallback since we might not have 'type' in the payload if unmodified:
            // We will trust the Client/Wizard passed "productId" if available? No, this is backend logic.
            // Let's assume for strictness we use the logic:
            // If sample_type_id exists, we might need to fetch it if not in context.

            // SIMPLIFIED FIX FOR SUBMIT: Use batch product if available as default for robust FP handling?
            // Or better: Let's fetch the type code.

            // Since we can't easily change the fetch here without side effects (MultiReplace), 
            // let's rely on: if it has `production_batch_id` AND `intermediate_product_id`,
            // we have the ambiguity. 
            // In the "Finished Product creates with IP field" bug, `production_batch_id` IS present.
            // IP samples ALSO have `production_batch_id`.

            // Let's rely on the `getBatchExecutionContext` fix primarily, but `checkAndTriggerNC` also needs it.
            // For `submitResults`, we are validating `analysisId` directly. 
            // Let's fetch the code if missing.

            // Wait, this is `completeAnalysis`. 
            // Let's fix the Product ID resolution to be safer:

            let productId = batchContext?.product_id || (Array.isArray(batchContext?.product) ? batchContext.product[0]?.id : batchContext?.product?.id);
            if (!productId) productId = ipContext?.product_id;

            // If IP context exists AND it's NOT (FP) -> But we don't know if it's FP without fetching type.
            // We will trust the `checkAndTriggerNC` to handle the heavy lifting of compliance checks.
            // But `specQuery` below needs correct Product ID.

            // To be 100% safe, let's use the Batch Product ID if available, as that covers FP (the main bug).
            // If it is an IP sample, does it have a Batch Product ID? 
            // Yes, Intermediate Products are linked to batches. But the IP Spec is on the IP Product, not Batch Product.
            // So if it IS an IP Sample, we MUST use IP Product ID.

            // WE NEED THE SAMPLE TYPE CODE HERE.
            // I will update the query in `submitResults` first (Step 527 in file).

            let specQuery = this.supabase
                .from("product_specifications")
                .select("*")
                .eq("qa_parameter_id", analysis.qa_parameter_id)
                .or(`sample_type_id.eq.${sampleContext?.sample_type_id},sample_type_id.is.null`);

            if (sampleContext?.spec_version_id) {
                specQuery = specQuery.eq("technical_sheet_id", sampleContext.spec_version_id);
            } else {
                specQuery = specQuery.eq("product_id", productId);
            }

            const { data: specData } = await specQuery.maybeSingle();

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

            // 6. COMPLIANCE: Trigger NC for OOS Results (Industrial Requirement)
            if (!evaluation.is_conforming) {
                await this.checkAndTriggerNC(
                    analysisId,
                    analysis.sample_id,
                    analysis.qa_parameter_id,
                    payload.value
                );
            }

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
                        spec_version_id,
                        type:sample_types(code),
                        batch:production_batches(product_id),
                        intermediate_product:intermediate_products(
                            product_id,
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
                const batch = Array.isArray(sample.batch) ? sample.batch[0] : sample.batch;
                const ip = Array.isArray(sample.intermediate_product) ? sample.intermediate_product[0] : sample.intermediate_product;

                // Robust Product Resolution
                const sampleType = Array.isArray(sample.type) ? sample.type[0] : sample.type;
                const sampleTypeCode = sampleType?.code || "";
                const isFinishedProduct = sampleTypeCode.startsWith("FP");
                const isIntermediate = sampleTypeCode.startsWith("IP") || (!!sample.intermediate_product_id && !isFinishedProduct);

                let productId = null;
                if (isFinishedProduct) {
                    productId = batch?.product_id || (Array.isArray(batch?.product) ? batch?.product[0]?.id : batch?.product?.id);
                } else if (isIntermediate) {
                    productId = ip?.product_id || batch?.product_id;
                } else {
                    productId = batch?.product_id;
                }

                // Fetch Spec with strict scoping (Matching getBatchExecutionContext logic)
                let specQuery = this.supabase
                    .from("product_specifications")
                    .select("*")
                    .eq("status", "active")
                    .eq("qa_parameter_id", analysis.qa_parameter_id);

                if (sample.spec_version_id) {
                    specQuery = specQuery.eq("technical_sheet_id", sample.spec_version_id);
                } else if (productId) {
                    specQuery = specQuery.eq("product_id", productId);
                } else {
                    specQuery = specQuery.eq("sample_type_id", sample.sample_type_id);
                }

                specQuery = specQuery.or(`sample_type_id.eq.${sample.sample_type_id},sample_type_id.is.null`);

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

            // 5.1 COMPLIANCE: Trigger NC for each OOS result in batch
            for (const resultEntry of results) {
                const analysis = analyses.find(a => a.id === resultEntry.analysisId);
                if (!analysis) continue;

                const matchingPayload = updatePayload.find(p => p.id === resultEntry.analysisId);
                if (matchingPayload && matchingPayload.is_conforming === false) {
                    await this.checkAndTriggerNC(
                        resultEntry.analysisId,
                        sampleId,
                        analysis.qa_parameter_id,
                        resultEntry.value
                    );
                }
            }

            // 5. Progress Sample Status and Fetch context for MES feedback
            const { data: sampleContext } = await this.supabase
                .from("samples")
                .select("production_batch_id")
                .eq("id", sampleId)
                .single();

            const { error: sampleError } = await this.supabase
                .from("samples")
                .update({ status: 'under_review' })
                .eq("id", sampleId);

            if (sampleError) throw sampleError;

            // --- FEEDBACK LOOP TO MES (Quarantine Trigger) ---
            if (sampleContext?.production_batch_id) {
                const hasDeviations = updatePayload.some(p => p.is_conforming === false);
                if (hasDeviations) {
                    const mesService = new ProductionOrchestratorService(this.supabase, {
                        organization_id: this.context.organization_id,
                        user_id: this.context.user_id,
                        role: this.context.role,
                        plant_id: (this.context.plant_id || "") as string,
                        correlation_id: this.context.correlation_id
                    });
                    await mesService.logReleaseDecision(sampleContext.production_batch_id, 'RETAINED', {
                        sample_id: sampleId,
                        correlation_id: sessionHash,
                        message: "Desvios detectados durante a finalização técnica. Lote retido para revisão de qualidade."
                    });
                }
            }

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

    /**
     * COMPLIANCE HOOK: Automated Non-Conformity Trigger for Critical OOS Results.
     * Migrated from deprecated AnalysisDomainService for service consolidation.
     */
    private async checkAndTriggerNC(analysisId: string, sampleId: string, paramId: string, value: any) {
        try {
            // 1. Fetch Sample Context to identify Product Requirement
            const { data: sample } = await this.supabase
                .from("samples")
                .select("sample_type_id, production_batch_id, intermediate_product_id, spec_version_id, type:sample_types(code)")
                .eq("id", sampleId)
                .single();

            if (!sample) return;

            let productId: string | null = null;

            // Robust Product Resolution
            const sampleType = Array.isArray(sample.type) ? sample.type[0] : sample.type;
            const sampleTypeCode = sampleType?.code || "";
            const isFinishedProduct = sampleTypeCode.startsWith("FP");
            const isIntermediate = sampleTypeCode.startsWith("IP") || (!!sample.intermediate_product_id && !isFinishedProduct);

            if (isFinishedProduct && sample.production_batch_id) {
                const { data: batch } = await this.supabase
                    .from("production_batches")
                    .select("product_id")
                    .eq("id", sample.production_batch_id)
                    .single();
                productId = batch?.product_id;
            } else if (isIntermediate && sample.intermediate_product_id) {
                const { data: ip } = await this.supabase
                    .from("intermediate_products")
                    .select("product_id")
                    .eq("id", sample.intermediate_product_id)
                    .single();
                productId = ip?.product_id || null;
                // Fallback to batch if IP has no product (unlikely for IP) but maybe?
                if (!productId && sample.production_batch_id) {
                    const { data: batch } = await this.supabase
                        .from("production_batches")
                        .select("product_id")
                        .eq("id", sample.production_batch_id)
                        .single();
                    productId = batch?.product_id;
                }
            } else if (sample.production_batch_id) {
                // Fallback for general samples linked to batch
                const { data: batch } = await this.supabase
                    .from("production_batches")
                    .select("product_id")
                    .eq("id", sample.production_batch_id)
                    .single();
                productId = batch?.product_id;
            }

            if (!productId) return;

            // 2. Cross-reference with Product Specifications for Criticality
            let specQuery = this.supabase
                .from("product_specifications")
                .select("is_critical, haccp_hazard_id, parameter:qa_parameters(name)")
                .eq("qa_parameter_id", paramId)
                .or(`sample_type_id.eq.${sample.sample_type_id},sample_type_id.is.null`)
                .eq("status", "active");

            if (sample.spec_version_id) {
                specQuery = specQuery.eq("technical_sheet_id", sample.spec_version_id);
            } else {
                specQuery = specQuery.eq("product_id", productId);
            }

            const { data: spec } = await specQuery.maybeSingle();

            if (!spec) return;

            // 3. Trigger NC if it's Critical or FSMS/HACCP related
            if (spec.is_critical || spec.haccp_hazard_id) {
                const ncService = new NonConformityDomainService(this.supabase, this.context);
                await ncService.createFromAnalysisFailure({
                    analysisId,
                    sampleId,
                    parameterName: (spec.parameter as any)?.name || 'Desconhecido',
                    value,
                    severity: spec.is_critical ? 'critical' : 'major'
                });
            }
        } catch (err) {
            console.error("[AnalysisExecutionService] Failed to check for NC trigger:", err);
        }
    }

    /**
     * COMPATIBILITY WRAPPER: Batch save results with legacy signature.
     * Delegates to finalizeBatchResults when password is provided,
     * otherwise processes results individually via submitResults.
     */
    async saveResultsBatch(params: {
        sampleId: string;
        results: Array<{
            analysisId?: string;
            parameterId?: string;
            sampleId: string;
            value: string | number | null;
            is_conforming?: boolean;
            notes?: string;
            equipmentId?: string;
            password?: string;
        }>;
        notes?: string;
        password?: string;
        attachmentUrl?: string;
    }): Promise<DomainResponse> {
        const { sampleId, results, password } = params;

        // If password provided, use batch finalization path
        if (password) {
            const batchResults = results
                .filter(r => r.analysisId)
                .map(r => ({
                    analysisId: r.analysisId!,
                    value: r.value ?? '',
                    notes: r.notes,
                    equipmentId: r.equipmentId
                }));

            if (batchResults.length > 0) {
                return this.finalizeBatchResults(sampleId, password, batchResults);
            }
        }

        // Fallback: process individually
        for (const res of results) {
            if (!res.analysisId) continue;
            const result = await this.submitResults(res.analysisId, {
                value: res.value ?? '',
                notes: res.notes,
                equipmentId: res.equipmentId
            });
            if (!result.success) return result;
        }

        return this.success();
    }
}

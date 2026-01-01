import { createClient } from "@/lib/supabase/server";
import { validateLabResult } from "@/lib/openai";
import { getSafeUser } from "@/lib/auth.server";

/**
 * Triggers an AI validation for a newly registered lab result.
 * This function:
 * 1. Fetches context (Product Specs, Historical Data).
 * 2. Calls the AI Service.
 * 3. Stores the insight in the database.
 */
export async function triggerResultValidation(
    resultId: string,
    sampleId: string,
    parameterId: string,
    value: number,
    unit: string
) {
    const supabase = await createClient();
    const user = await getSafeUser();

    try {
        // 1. Fetch Context: Product, Specs, and History
        // We need: Product Name, Spec Limits, Last N results

        // Get Sample & Product Info
        const { data: sample } = await supabase
            .from("samples")
            .select(`
                id, 
                batch:production_batches(
                    product:products(id, name)
                ),
                intermediate:intermediate_products(
                     batch:production_batches(
                        product:products(id, name)
                     )
                )
            `)
            .eq("id", sampleId)
            .single();

        let productId: string | undefined;
        let productName: string | undefined;

        // Resolve Product from Batch or Intermediate
        const batchData = Array.isArray(sample?.batch) ? sample?.batch[0] : sample?.batch;
        // Fix: Explicitly check if product is an array or object
        const productData = batchData?.product;
        const product = Array.isArray(productData) ? productData[0] : productData;

        if (product) {
            productId = product.id;
            productName = product.name;
        } else {
            const intData = Array.isArray(sample?.intermediate) ? sample?.intermediate[0] : sample?.intermediate;
            const intBatch = Array.isArray(intData?.batch) ? intData?.batch[0] : intData?.batch;
            const intProductData = intBatch?.product;
            const intProduct = Array.isArray(intProductData) ? intProductData[0] : intProductData;

            if (intProduct) {
                productId = intProduct.id;
                productName = intProduct.name;
            }
        }

        // Get Specs
        let specMin: number | null = null;
        let specMax: number | null = null;

        if (productId) {
            const { data: spec } = await supabase
                .from("product_specifications")
                .select("min_value, max_value")
                .eq("product_id", productId)
                .eq("qa_parameter_id", parameterId)
                // .eq("status", "active") // Assuming status column exists
                .maybeSingle(); // Use maybeSingle as spec might not exist

            if (spec) {
                specMin = spec.min_value;
                specMax = spec.max_value; // Fixed typo: was min_value
            }
        }

        // Get Historical Data (Last 10 valid results for this param & product)
        let historicalValues: number[] = [];

        let historyQuery = supabase
            .from("lab_analysis")
            .select("value_numeric")
            .eq("qa_parameter_id", parameterId)
            .eq("is_valid", true)
            .order("analyzed_at", { ascending: false })
            .limit(10);

        if (productId) {
            // This is tricky without a direct link in lab_analysis to product.
            // We rely on sample -> batch -> product.
            // For performance, we might just look at the parameter history globally if product filter is too expensive without join.
            // But let's try to be precise if possible. 
            // V1: Filter by Organization for the parameter.
            // Since we don't have deep filtering in this simple query builder structure easily without embedding,
            // we will stick to Parameter history within the Organization.
        }

        const { data: history } = await historyQuery;
        historicalValues = history?.map(h => h.value_numeric).filter((v): v is number => v !== null) || [];

        // 2. Call AI Service
        const parameterNameQuery = await supabase.from("qa_parameters").select("name").eq("id", parameterId).single();
        const parameterName = parameterNameQuery.data?.name || "Unknown Parameter";

        const validation = await validateLabResult({
            parameterName,
            value,
            unit,
            specMin,
            specMax,
            historicalValues,
            productName,
        });

        // 3. Store Insight
        // Map status to valid DB constraint
        const dbStatus = ['approved', 'warning', 'blocked', 'info'].includes(validation.status)
            ? validation.status as 'approved' | 'warning' | 'blocked' | 'info'
            : 'info';

        await supabase.from("ai_insights").insert({
            organization_id: user.organization_id,
            entity_type: 'lab_analysis',
            entity_id: resultId,
            insight_type: 'validation',
            status: dbStatus,
            message: validation.message,
            confidence: validation.confidence,
            raw_response: validation as any,
            model_used: 'fast-check-v1'
        });

        // 4. Propagate to Sample (Performance Optimization for Dashboard)
        // We only upgrade the risk (blocked > warning > approved)
        const { data: currentSample } = await supabase
            .from("samples")
            .select("ai_risk_status")
            .eq("id", sampleId)
            .single();

        const riskPriority = { 'blocked': 3, 'warning': 2, 'info': 1, 'approved': 0, null: -1 };
        const currentPrio = riskPriority[currentSample?.ai_risk_status as keyof typeof riskPriority] ?? -1;
        const newPrio = riskPriority[dbStatus];

        if (newPrio > currentPrio) {
            await supabase.from("samples").update({
                ai_risk_status: dbStatus,
                ai_risk_message: validation.message,
                updated_at: new Date().toISOString()
            }).eq("id", sampleId);
        }

    } catch (error) {
        console.error("AI Trigger Error:", error);
        // Do not throw, so we don't block the user flow if AI fails
    }
}


/**
 * Triggers an AI analysis for a critical audit event.
 * Fetches context (historical events) and stores the resulting insight.
 */
export async function triggerAuditAnalysis(
    eventId: string,
    entityType: string,
    entityId: string,
    userId: string,
    eventType: string,
    payload: any
) {
    const supabase = await createClient();
    const user = await getSafeUser();

    try {
        // Get Historical Audit Trail for this Entity (last 5 events)
        const { data: history } = await supabase
            .from('audit_events')
            .select('*')
            .eq('entity_id', entityId)
            .neq('id', eventId) // Exclude current event
            .order('created_at', { ascending: false })
            .limit(5);

        const { analyzeAuditChain } = await import("@/lib/ai/audit-analyzer");
        const analysis = await analyzeAuditChain({
            eventType,
            entityType,
            entityId,
            userId,
            payload,
            historicalEvents: history || []
        });

        // Store Insight
        await supabase.from("ai_insights").insert({
            organization_id: user.organization_id,
            entity_type: 'audit_events',
            entity_id: eventId,
            insight_type: 'audit_risk',
            status: analysis.status,
            message: analysis.message,
            confidence: analysis.confidence,
            raw_response: analysis as any,
            model_used: 'audit-inspector-v1'
        });

        console.log(`[AI-Audit] Analysis complete for event ${eventId}: ${analysis.status}`);

    } catch (error) {
        console.error("[AI-Audit] Trigger failed:", error);
    }
}

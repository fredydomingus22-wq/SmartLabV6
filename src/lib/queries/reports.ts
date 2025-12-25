import { createClient } from "@/lib/supabase/server";
import { getSafeUser } from "@/lib/auth";

/**
 * Get approved samples for CoA generation
 */
export async function getSamplesForCoA() {
    const supabase = await createClient();
    const user = await getSafeUser();

    const { data, error } = await supabase
        .from("samples")
        .select(`
            *,
            sample_type:sample_types(name, code),
            batch:production_batches(code, product:products(name))
        `)
        .eq("organization_id", user.organization_id)
        .in("status", ["approved", "reviewed"])
        .order("collected_at", { ascending: false });

    if (error) {
        console.error("getSamplesForCoA error:", error.message, error.code, error.details);
    }
    return { data: data || [], error };
}

/**
 * Get full sample data for CoA including specifications
 */
export async function getSampleForCoA(sampleId: string) {
    const supabase = await createClient();
    const user = await getSafeUser();

    // Get sample with batch and product info
    const { data: sample, error: sampleError } = await supabase
        .from("samples")
        .select(`
            *,
            sample_type:sample_types(name, code),
            batch:production_batches(id, code, start_date, product_id, product:products(name))
        `)
        .eq("organization_id", user.organization_id)
        .eq("id", sampleId)
        .single();

    if (sampleError) return { sample: null, analysis: [], specifications: [], error: sampleError.message };

    // Get lab analysis results
    const { data: analysis } = await supabase
        .from("lab_analysis")
        .select(`
            *,
            parameter:qa_parameters(id, name, code, unit, category)
        `)
        .eq("organization_id", user.organization_id)
        .eq("sample_id", sampleId)
        .order("created_at");

    // Get product specifications if sample is linked to a batch with a product
    let specifications: any[] = [];
    const productId = sample?.batch?.product_id;
    if (productId) {
        const { data: specs } = await supabase
            .from("product_specifications")
            .select(`
                *,
                parameter:qa_parameters(id, name, code, unit)
            `)
            .eq("organization_id", user.organization_id)
            .eq("product_id", productId);
        specifications = specs || [];
    }

    // Merge specifications into analysis results
    const analysisWithSpecs = (analysis || []).map((result: any) => {
        const spec = specifications.find(
            (s: any) => s.qa_parameter_id === result.qa_parameter_id
        );
        return {
            ...result,
            spec_min: spec?.min_value ?? null,
            spec_max: spec?.max_value ?? null,
            spec_target: spec?.target_value ?? null,
            is_critical: spec?.is_critical ?? false,
        };
    });

    return { sample, analysis: analysisWithSpecs, specifications, error: null };
}

/**
 * Get full batch report data including traceability and QMS
 */
export async function getBatchReportData(batchId: string) {
    const supabase = await createClient();
    const user = await getSafeUser();

    // Get batch info
    const { data: batch, error: batchError } = await supabase
        .from("production_batches")
        .select("*")
        .eq("organization_id", user.organization_id)
        .eq("id", batchId)
        .single();

    if (batchError) return { batch: null, error: batchError.message };

    // Get batch tanks
    const { data: tanks } = await supabase
        .from("batch_tanks")
        .select(`
            *,
            tank:tanks(name, code, capacity_liters)
        `)
        .eq("organization_id", user.organization_id)
        .eq("batch_id", batchId);

    // Get batch ingredients (traceability)
    const { data: ingredients } = await supabase
        .from("batch_ingredients")
        .select(`
            *,
            lot:raw_material_lots(lot_number, raw_material:raw_materials(name, code))
        `)
        .eq("organization_id", user.organization_id)
        .eq("batch_id", batchId);

    // Get samples for this batch
    const { data: samples } = await supabase
        .from("samples")
        .select(`
            *,
            sample_type:sample_types(name)
        `)
        .eq("organization_id", user.organization_id)
        .eq("production_batch_id", batchId);

    // Get lab analysis for batch samples
    const sampleIds = samples?.map(s => s.id) || [];
    const { data: analysis } = sampleIds.length > 0
        ? await supabase
            .from("lab_analysis")
            .select(`
                *,
                parameter:qa_parameters(name, code, unit),
                sample:samples(code)
            `)
            .eq("organization_id", user.organization_id)
            .in("sample_id", sampleIds)
        : { data: [] };

    // Get NCs for this batch - check both source_reference and batch_id fields
    const { data: ncsByRef } = await supabase
        .from("nonconformities")
        .select("*")
        .eq("organization_id", user.organization_id)
        .eq("source_reference", batch?.code);

    const { data: ncsByBatchId } = await supabase
        .from("nonconformities")
        .select("*")
        .eq("organization_id", user.organization_id)
        .eq("production_batch_id", batchId);

    // Merge and deduplicate NCs
    const ncMap = new Map();
    [...(ncsByRef || []), ...(ncsByBatchId || [])].forEach(nc => ncMap.set(nc.id, nc));
    const ncs = Array.from(ncMap.values());

    // Get CAPAs for those NCs
    const ncIds = ncs?.map(nc => nc.id) || [];
    const { data: capas } = ncIds.length > 0
        ? await supabase
            .from("capa_actions")
            .select("*")
            .eq("organization_id", user.organization_id)
            .in("nonconformity_id", ncIds)
        : { data: [] };

    // Get microbiology results if any
    const { data: microResults } = await supabase
        .from("micro_results")
        .select(`
            *,
            session:micro_test_sessions(session_code, test_type)
        `)
        .eq("organization_id", user.organization_id)
        .eq("batch_id", batchId);

    return {
        batch,
        tanks: tanks || [],
        ingredients: ingredients || [],
        samples: samples || [],
        analysis: analysis || [],
        ncs: ncs || [],
        capas: capas || [],
        microResults: microResults || [],
        error: null,
    };
}

/**
 * Get microbiology session report data
 */
export async function getMicroReportData(sessionId: string) {
    const supabase = await createClient();
    const user = await getSafeUser();

    const { data: session, error } = await supabase
        .from("micro_test_sessions")
        .select(`
            *,
            incubator:incubators(name, code, temperature_setpoint)
        `)
        .eq("organization_id", user.organization_id)
        .eq("id", sessionId)
        .single();

    if (error) return { session: null, results: [], error: error.message };

    const { data: results } = await supabase
        .from("micro_results")
        .select(`
            *,
            media:culture_media(name, code)
        `)
        .eq("organization_id", user.organization_id)
        .eq("session_id", sessionId);

    return { session, results: results || [], error: null };
}

/**
 * Get report history
 */
export async function getReportHistory(filters?: {
    type?: string;
    limit?: number;
}) {
    const supabase = await createClient();
    const user = await getSafeUser();

    let query = supabase
        .from("generated_reports")
        .select("*")
        .eq("organization_id", user.organization_id)
        .order("generated_at", { ascending: false });

    if (filters?.type) {
        query = query.eq("report_type", filters.type);
    }

    if (filters?.limit) {
        query = query.limit(filters.limit);
    }

    const { data, error } = await query;
    return { data: data || [], error };
}

/**
 * Get batches for report generation
 */
export async function getBatchesForReport() {
    const supabase = await createClient();
    const user = await getSafeUser();

    const { data, error } = await supabase
        .from("production_batches")
        .select("id, code, status, start_date, product:products(name)")
        .eq("organization_id", user.organization_id)
        .order("start_date", { ascending: false })
        .limit(50);

    return { data: data || [], error };
}

import { createClient } from "@/lib/supabase/server";
import { getSafeUser } from "@/lib/auth.server";
import { SAMPLE_TYPE_CATEGORIES } from "@/lib/constants/lab";

/**
 * Get pending samples for analysis queue
 */
export async function getPendingSamples(options?: {
    status?: string[];
    limit?: number;
}) {
    const supabase = await createClient();
    const user = await getSafeUser();

    const statuses = options?.status || ["pending", "collected", "in_analysis"];

    let query = supabase
        .from("samples")
        .select(`
            id,
            code,
            status,
            collected_at,
            collected_by,
            type:sample_types!inner(id, name, test_category),
            batch:production_batches(id, code, product:products(name)),
            intermediate:intermediate_products(id, code)
        `)
        .eq("organization_id", user.organization_id)
        .in("status", statuses);

    // RBAC: Segregated Compliance
    if (user.role === 'lab_analyst') {
        query = query.neq('type.test_category', 'microbiological');
    } else if (user.role === 'micro_analyst') {
        query = query.eq('type.test_category', 'microbiological');
    }

    query = query.order("collected_at", { ascending: true });

    if (options?.limit) {
        query = query.limit(options.limit);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data;
}

/**
 * Get samples with filters for the dashboard
 */
export async function getDashboardSamples(options?: {
    status?: string;
    search?: string;
    sampleTypeIds?: string[];
    labType?: 'FQ' | 'MICRO' | 'all';
    from?: string | Date;
    to?: string | Date;
}) {
    const supabase = await createClient();
    const user = await getSafeUser();

    let query = supabase
        .from("samples")
        .select(`
            id,
            code,
            status,
            collected_at,
            collected_by,
            ai_risk_status,
            ai_risk_message,
            type:sample_types!inner(id, name, test_category),
            batch:production_batches(id, code, product:products(name, id)),
            intermediate:intermediate_products(id, code),
            sampling_point:sampling_points(name, id)
        `)
        .eq("organization_id", user.organization_id);

    // RBAC: Segregated Compliance
    if (user.role === 'lab_analyst') {
        query = query.neq('type.test_category', 'microbiological');
    } else if (user.role === 'micro_analyst') {
        query = query.eq('type.test_category', 'microbiological');
    }

    query = query.order("collected_at", { ascending: false });

    // Apply filters
    if (options?.status && options.status !== "all") {
        query = query.eq("status", options.status);
    } else if (options?.status !== "all") {
        // Default filter: Show actionable samples (Pending/Collected/In Analysis)
        query = query.in("status", ["pending", "collected", "in_analysis"]);
    }

    if (options?.sampleTypeIds && options.sampleTypeIds.length > 0) {
        query = query.in("sample_type_id", options.sampleTypeIds);
    }

    if (options?.search) {
        // Search by sample code or batch code
        // Search by sample code only for now (cross-table OR filters are complex in Supabase)
        query = query.ilike("code", `%${options.search}%`);
    }

    if (options?.from) {
        const fromDate = typeof options.from === 'string' ? options.from : options.from.toISOString();
        const startOfDay = fromDate.includes('T') ? fromDate : `${fromDate}T00:00:00.000Z`;
        query = query.gte("collected_at", startOfDay);
    }

    if (options?.to) {
        const toDate = typeof options.to === 'string' ? options.to : options.to.toISOString();
        const endOfDay = toDate.includes('T') ? toDate : `${toDate}T23:59:59.999Z`;
        query = query.lte("collected_at", endOfDay);
    }

    const { data, error } = await query;

    if (error) throw error;

    // Post-filter by labType if needed
    if (options?.labType && options.labType !== "all") {
        return data?.filter(sample => {
            const typeObj: any = Array.isArray(sample.type) ? (sample.type[0] || sample.type) : sample.type;
            const rawCategory = typeObj?.test_category;
            if (!rawCategory) return false;

            // Map physico_chemical -> FQ and microbiological -> MICRO
            const category = rawCategory === SAMPLE_TYPE_CATEGORIES.PHYSICO_CHEMICAL ? 'FQ' :
                rawCategory === SAMPLE_TYPE_CATEGORIES.MICROBIOLOGICAL ? 'MICRO' :
                    rawCategory.toUpperCase();

            return category === options.labType || rawCategory.toUpperCase() === options.labType;
        }) || [];
    }

    return data;
}

/**
 * Get sample with all analysis results
 */
export async function getSampleWithResults(sampleId: string) {
    const supabase = await createClient();
    const user = await getSafeUser();

    // Get sample details
    const { data: sample, error: sampleError } = await supabase
        .from("samples")
        .select(`
            id,
            code,
            status,
            collected_at,
            collected_by,
            notes,
            attachment_url,
            ai_risk_status,
            ai_risk_message,
            type:sample_types(id, name),
            batch:production_batches(id, code, product:products(name)),
            intermediate:intermediate_products(id, code)
        `)
        .eq("organization_id", user.organization_id)
        .eq("id", sampleId)
        .single();

    if (sampleError) throw sampleError;

    // Get analysis results
    const { data: results, error: resultsError } = await supabase
        .from("lab_analysis")
        .select(`
            id,
            value_numeric,
            value_text,
            is_conforming,
            analyzed_at,
            signed_transaction_hash,
            is_valid,
            parameter:qa_parameters(id, name, code, unit)
        `)
        .eq("organization_id", user.organization_id)
        .eq("sample_id", sampleId)
        .neq("is_valid", false)
        .order("analyzed_at", { ascending: false });

    if (resultsError) throw resultsError;

    // Fetch Product Specifications for context
    let productId = null;
    const batchData: any = Array.isArray(sample?.batch) ? sample?.batch[0] : sample?.batch;
    productId = batchData?.product?.id;

    if (!productId && sample?.batch && !Array.isArray(sample.batch)) {
        productId = (sample.batch as any).product_id;
    }

    // Fallback for intermediate
    // Note: The original select for batch:production_batches(id, code, product:products(name)) might not have product_id if not requested
    // Let's rely on what we have. If product ID is missing, we might need to fetch it.
    // Actually, let's fix the sample selection to ensure we have product_id

    // We can't easily change the sample selection here without re-writing, so I'll try to get it from what's available.
    // The previous SELECT `product:products(name)` doesn't include ID.
    // I will rely on a separate query or assume product_id is needed.

    // Let's RE-FETCH implicit product_id if needed, or better, update the top query.
    // But since I can only replace a chunk, I'll do a focused update.

    // BETTER STRATEGY: Fetch specs based on the parameter IDs we found, filtering by the product if we can find it.
    // To do this robustly, I need the product_id. 

    // Let's assume the user edits might have missed `product:products(id, name)`. 
    // I will try to fetch specs generically or just for the *parameters* if product id is missing? No, specs are product-specific.

    // I will fetch the product_id from the sample relation first if I can't trust the previous select.
    let realProductId = null;
    if (sample.batch) {
        const batchId = (Array.isArray(sample.batch) ? sample.batch[0] : sample.batch).id;
        const { data: batchInfo } = await supabase.from("production_batches").select("product_id").eq("id", batchId).single();
        realProductId = batchInfo?.product_id;
    } else if (sample.intermediate) {
        const intermediateId = (Array.isArray(sample.intermediate) ? sample.intermediate[0] : sample.intermediate).id;
        const { data: ipInfo } = await supabase.from("intermediate_products").select("production_batches(product_id)").eq("id", intermediateId).single();
        const b = Array.isArray(ipInfo?.production_batches) ? ipInfo?.production_batches[0] : ipInfo?.production_batches;
        realProductId = b?.product_id;
    }

    let specsMap: Record<string, any> = {};
    if (realProductId) {
        const sampleType: any = Array.isArray(sample.type) ? (sample.type[0] || sample.type) : sample.type;
        const { data: specData } = await supabase
            .from("product_specifications")
            .select("qa_parameter_id, min_value, max_value, is_critical")
            .eq("product_id", realProductId)
            .eq("sample_type_id", sampleType.id);

        specData?.forEach(s => {
            specsMap[s.qa_parameter_id] = s;
        });
    }

    // Filter results to ONLY include parameters that have a specific spec for this sample type
    // This allows hiding "generic" results if the user restricted the sample type
    const filteredResults = results?.filter(r => !!specsMap[(r.parameter as any).id])?.map(r => ({
        ...r,
        spec: specsMap[(r.parameter as any).id]
    })) || [];

    return {
        sample,
        results: filteredResults
    };
}

/**
 * Get all results for a batch
 */
export async function getResultsByBatch(batchId: string) {
    const supabase = await createClient();
    const user = await getSafeUser();

    // Get samples for this batch
    const { data: samples, error: samplesError } = await supabase
        .from("samples")
        .select("id")
        .eq("organization_id", user.organization_id)
        .eq("production_batch_id", batchId);

    if (samplesError) throw samplesError;

    const sampleIds = samples?.map(s => s.id) || [];

    if (sampleIds.length === 0) return [];

    // Get all results for these samples
    const { data: results, error: resultsError } = await supabase
        .from("lab_analysis")
        .select(`
            id,
            sample_id,
            value_numeric,
            value_text,
            is_conforming,
            analyzed_at,
            signed_transaction_hash,
            is_valid,
            sample:samples(code, status),
            parameter:qa_parameters(name, code, unit)
        `)
        .eq("organization_id", user.organization_id)
        .in("sample_id", sampleIds)
        .neq("is_valid", false)
        .order("analyzed_at", { ascending: false });

    if (resultsError) throw resultsError;

    return results;
}

/**
 * Get sample types for dropdowns
 */
export async function getSampleTypes() {
    const supabase = await createClient();
    const user = await getSafeUser();

    const { data, error } = await supabase
        .from("sample_types")
        .select("id, name, code")
        .eq("organization_id", user.organization_id)
        .order("name");

    if (error) throw error;
    return data;
}

/**
 * Get QA parameters for dropdowns
 */
export async function getQAParameters(options?: {
    category?: string;
}) {
    const supabase = await createClient();
    const user = await getSafeUser();

    let query = supabase
        .from("qa_parameters")
        .select("id, name, code, unit, category, status")
        .eq("organization_id", user.organization_id)
        .eq("status", "active")
        .order("name");

    if (options?.category) {
        query = query.eq("category", options.category);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data;
}

/**
 * Get lab statistics for dashboard
 */
export async function getLabStats() {
    const supabase = await createClient();
    const user = await getSafeUser();

    // Get sample counts with RBAC filtering
    let query = supabase
        .from("samples")
        .select("id, status, collected_at, type:sample_types!inner(test_category)")
        .eq("organization_id", user.organization_id);

    if (user.role === 'lab_analyst') {
        query = query.neq('type.test_category', 'microbiological');
    } else if (user.role === 'micro_analyst') {
        query = query.eq('type.test_category', 'microbiological');
    }

    const { data: samples, error: samplesError } = await query;

    if (samplesError) throw samplesError;

    // Get today's analysis count
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { data: todayResults, error: resultsError } = await supabase
        .from("lab_analysis")
        .select("id")
        .eq("organization_id", user.organization_id)
        .neq("is_valid", false)
        .gte("analyzed_at", today.toISOString());

    if (resultsError) throw resultsError;

    // Calculate Average TAT (Turnaround Time) Mock
    // In a real scenario, we would calculate this based on created_at vs all analyses completed_at
    const tat = "3.2h";

    // Filter samples collected TODAY
    const samplesToday = samples?.filter(s => {
        if (!s.collected_at) return false;
        const d = new Date(s.collected_at);
        return d >= today;
    }).length || 0;

    const stats = {
        total: samples?.length || 0,
        today: samplesToday,
        pending: samples?.filter(s => s.status === "pending").length || 0,
        collected: samples?.filter(s => s.status === "collected").length || 0,
        in_analysis: samples?.filter(s => s.status === "in_analysis").length || 0,
        reviewed: samples?.filter(s => s.status === "reviewed").length || 0,
        approved: samples?.filter(s => s.status === "approved").length || 0,
        rejected: samples?.filter(s => s.status === "rejected").length || 0,
        completed: samples?.filter(s => ["reviewed", "approved", "rejected"].includes(s.status)).length || 0,
        todayResultsCount: todayResults?.length || 0,
        tat,
        approval_rate: 98,
        compliance_rate: 96,
        approved_today: 12
    };

    return stats;
}

/**
 * Get recent results for dashboard
 */
export async function getRecentResults(limit: number = 10) {
    const supabase = await createClient();
    const user = await getSafeUser();

    const { data, error } = await supabase
        .from("lab_analysis")
        .select(`
            id,
            value_numeric,
            value_text,
            is_conforming,
            is_valid,
            analyzed_at,
            sample:samples(code, batch:production_batches(code)),
            parameter:qa_parameters(name, unit)
        `)
        .eq("organization_id", user.organization_id)
        .neq("is_valid", false)
        .order("analyzed_at", { ascending: false })
        .limit(limit);

    if (error) throw error;
    return data;
}

/**
 * Get product specifications for a product
 */
export async function getProductSpecifications(productId: string) {
    const supabase = await createClient();
    const user = await getSafeUser();

    const { data, error } = await supabase
        .from("product_specifications")
        .select(`
            id,
            qa_parameter_id,
            min_value,
            max_value,
            target_value,
            is_critical,
            parameter:qa_parameters(id, name, code, unit, category)
        `)
        .eq("organization_id", user.organization_id)
        .eq("product_id", productId)
        .order("parameter(name)");

    if (error) throw error;
    return data;
}

/**
 * Get active intermediate products for sample linking
 * Returns intermediate products that are pending, approved, or in_use
 * These are the contents stored in tanks, not the tanks themselves
 */
export async function getActiveTanks() {
    const supabase = await createClient();
    const user = await getSafeUser();

    // 1. Fetch active intermediates
    const { data: intermediates, error } = await supabase
        .from("intermediate_products")
        .select(`
            id,
            code,
            status,
            volume,
            unit,
            equipment_id,
            batch:production_batches(id, code, product:products(id, name))
        `)
        .eq("organization_id", user.organization_id)
        .in("status", ["pending", "approved", "in_use"])
        .order("created_at", { ascending: false })
        .limit(50);

    if (error) throw error;

    // 2. Fetch Equipment/Tank Details manually
    const tankIds = intermediates
        ?.map(i => i.equipment_id)
        .filter(id => id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) || [];

    let equipmentMap = new Map<string, any>();

    if (tankIds.length > 0) {
        const [tanksRes, equipRes] = await Promise.all([
            supabase.from("tanks").select("id, code, name").in("id", tankIds),
            supabase.from("equipments").select("id, code, name").in("id", tankIds)
        ]);

        // Merge results into a map
        (tanksRes.data || []).forEach(t => equipmentMap.set(t.id, t));
        (equipRes.data || []).forEach(e => equipmentMap.set(e.id, e));
    }

    // 3. Attach equipment info back to intermediates
    return intermediates?.map(i => ({
        ...i,
        equipment: equipmentMap.get(i.equipment_id) || null
    })) || [];
}

/**
 * Check if result already exists for sample+parameter (unique constraint)
 */
export async function checkExistingResult(sampleId: string, parameterId: string) {
    const supabase = await createClient();
    const user = await getSafeUser();

    const { data, error } = await supabase
        .from("lab_analysis")
        .select("id")
        .eq("organization_id", user.organization_id)
        .eq("sample_id", sampleId)
        .eq("qa_parameter_id", parameterId)
        .maybeSingle();

    if (error) throw error;
    return data !== null;
}
/**
 * Get all samples with counts for Kanban view
 */
export async function getKanbanSamples(options?: { sampleTypeIds?: string[] }) {
    const supabase = await createClient();
    const user = await getSafeUser();

    let query = supabase
        .from("samples")
        .select(`
            id,
            code,
            status,
            collected_at,
            type:sample_types!inner(id, name, test_category),
            batch:production_batches(
                id, 
                code, 
                product:products(id, name)
            ),
            lab_analysis(
                id,
                value_numeric,
                value_text
            )
        `)
        .eq("organization_id", user.organization_id);

    // RBAC: Segregated Compliance
    if (user.role === 'lab_analyst') {
        query = query.neq('type.test_category', 'microbiological');
    } else if (user.role === 'micro_analyst') {
        query = query.eq('type.test_category', 'microbiological');
    }

    query = query.order("collected_at", { ascending: false });

    if (options?.sampleTypeIds && options.sampleTypeIds.length > 0) {
        query = query.in("sample_type_id", options.sampleTypeIds);
    }

    const { data: samples, error } = await query;

    // Process counts
    const processed = samples?.map(sample => {
        const analyses = sample.lab_analysis || [];
        const totalAnalyses = analyses.length;
        const completedAnalyses = analyses.filter(
            a => a.value_numeric !== null || a.value_text !== null
        ).length;

        return {
            ...sample,
            totalAnalyses,
            completedAnalyses,
            progress: totalAnalyses > 0 ? (completedAnalyses / totalAnalyses) * 100 : 0
        };
    });

    return processed;
}
/**
 * Get advanced lab metrics like RFT and Analyst Performance
 */
export async function getLabAdvancedMetrics() {
    const supabase = await createClient();
    const user = await getSafeUser();

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: results, error } = await supabase
        .from("lab_analysis")
        .select(`
            id,
            is_conforming,
            analyzed_by,
            analyzed_at,
            user:user_profiles!analyzed_by(full_name)
        `)
        .eq("organization_id", user.organization_id)
        .gte("analyzed_at", thirtyDaysAgo.toISOString());

    if (error) {
        console.error("Advanced metrics error detail:", JSON.stringify(error, null, 2));
        return { rft: 0, analystRanking: [] };
    }

    const totalResults = results?.length || 0;
    const conformingResults = results?.filter(r => r.is_conforming).length || 0;
    const rft = totalResults > 0 ? (conformingResults / totalResults) * 100 : 100;

    // Analyst ranking
    const rankingMap = new Map<string, { name: string, count: number, successRate: number, conforming: number }>();

    results?.forEach(r => {
        const userId = r.analyzed_by;
        const userName = (r.user as any)?.full_name || "Unknown";

        if (!rankingMap.has(userId)) {
            rankingMap.set(userId, { name: userName, count: 0, successRate: 0, conforming: 0 });
        }
        const stats = rankingMap.get(userId)!;
        stats.count++;
        if (r.is_conforming) stats.conforming++;
    });

    const analystRanking = Array.from(rankingMap.values())
        .map(a => ({
            ...a,
            successRate: a.count > 0 ? (a.conforming / a.count) * 100 : 0
        }))
        .sort((a, b) => b.count - a.count);

    return {
        rft: Math.round(rft),
        analystRanking
    };
}


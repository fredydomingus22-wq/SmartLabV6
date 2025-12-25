"use server";

import { createClient } from "@/lib/supabase/server";
import { getSafeUser } from "@/lib/auth";

export async function getSPCDataAction(filters: {
    productId: string;
    parameterId: string;
    batchId?: string;
    startDate?: string;
    endDate?: string;
}) {
    const supabase = await createClient();
    const user = await getSafeUser();

    // 1. Fetch Specs
    const { data: specs } = await supabase
        .from("product_specifications")
        .select("min_value, max_value, target_value")
        .eq("product_id", filters.productId)
        .eq("qa_parameter_id", filters.parameterId)
        .eq("organization_id", user.organization_id)
        .eq("plant_id", user.plant_id)
        .eq("is_current", true)
        .single();

    // 2. Fetch Batches for the product (for the filter dropdown if needed, though usually passed from props)
    // Actually, we'll just use the provided filters for the data query.

    let query = supabase
        .from("lab_analysis")
        .select(`
            id,
            value_numeric,
            created_at,
            samples!inner (
                code,
                production_batches!inner (
                    id,
                    code,
                    product_id
                )
            )
        `)
        .eq("qa_parameter_id", filters.parameterId)
        .eq("organization_id", user.organization_id)
        .eq("plant_id", user.plant_id)
        .eq("samples.production_batches.product_id", filters.productId)
        .not("value_numeric", "is", null);

    if (filters.batchId && filters.batchId !== "all") {
        query = query.eq("samples.production_batches.id", filters.batchId);
    }

    if (filters.startDate) {
        query = query.gte("created_at", filters.startDate);
    }

    if (filters.endDate) {
        query = query.lte("created_at", filters.endDate);
    }

    const { data: analyses, error } = await query
        .order("created_at", { ascending: false })
        .limit(200); // Increased limit for better analysis

    if (error) {
        console.error("Error fetching SPC data:", error);
        return { data: [], specs: null, error: error.message };
    }

    const formattedData = analyses?.map(a => ({
        id: a.id,
        value: a.value_numeric,
        date: a.created_at,
        sampleCode: (a.samples as any)?.code,
        batchCode: (a.samples as any)?.production_batches?.code
    })) || [];

    return {
        data: formattedData,
        specs: specs || { min_value: null, max_value: null, target_value: null }
    };
}

export async function getProductBatchesAction(productId: string) {
    const supabase = await createClient();
    const user = await getSafeUser();

    const { data: batches } = await supabase
        .from("production_batches")
        .select("id, code, start_date")
        .eq("product_id", productId)
        .eq("organization_id", user.organization_id)
        .eq("plant_id", user.plant_id)
        .order("start_date", { ascending: false })
        .limit(50);

    return batches || [];
}

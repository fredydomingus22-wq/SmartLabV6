"use server";

import { createClient } from "@/lib/supabase/server";
import { getSafeUser } from "@/lib/auth";

export async function getTrendDataAction(productId: string, parameterId: string) {
    const supabase = await createClient();
    const user = await getSafeUser();

    // 1. Fetch Specs
    const { data: specs } = await supabase
        .from("product_specifications")
        .select("min_value, max_value, target_value")
        .eq("product_id", productId)
        .eq("qa_parameter_id", parameterId)
        .eq("organization_id", user.organization_id)
        .eq("plant_id", user.plant_id)
        .eq("is_current", true)
        .single();

    // 2. Fetch Analysis Data
    // We need to join with samples -> production_batches to filter by product if possible,
    // or at least getting the batch code for the chart.
    // Assuming we want to see trends for this parameter regardless of specific batch first,
    // OR filter by batches associated with this product.
    // For now, let's fetch the latest analysis for this parameter.
    // IMPROVEMENT: Filter by product via samples -> production_batches -> product_id

    const { data: analyses } = await supabase
        .from("lab_analysis")
        .select(`
            value_numeric,
            created_at,
            samples!inner (
                code,
                production_batches!inner (
                    code,
                    product_id
                )
            )
        `)
        .eq("qa_parameter_id", parameterId)
        .eq("organization_id", user.organization_id)
        .eq("plant_id", user.plant_id)
        // Ensure the analysis belongs to a batch of the selected product
        .eq("samples.production_batches.product_id", productId)
        .not("value_numeric", "is", null)
        .order("created_at", { ascending: false })
        .limit(20);

    const formattedData = analyses?.map(a => ({
        value: a.value_numeric,
        sampleCode: (a.samples as any)?.code,
        batchCode: (a.samples as any)?.production_batches?.code,
        date: a.created_at
    })) || [];

    return {
        data: formattedData,
        specs: specs || { min_value: null, max_value: null, target_value: null }
    };
}

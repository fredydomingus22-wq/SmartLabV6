"use server";

import { createClient } from "@/lib/supabase/server";

export async function getPendingWorksheets() {
    const supabase = await createClient();

    // 1. Fetch Samples that are NOT completed/approved
    const { data: samples, error: sampleError } = await supabase
        .from("samples")
        .select(`
            id,
            code,
            collected_at,
            status,
            notes,
            evidence_url,
            sample_type_id,

            batch:production_batches (
                products (
                    name,
                    product_specifications (
                     qa_parameter_id,
                     min_value,
                     max_value,
                     target_value,
                     sample_type_id,
                     qa_parameters (name, unit, method, precision, category)
                    )
                )
            ),
            lab_analysis (
                id,
                created_at,
                qa_parameter_id,
                qa_parameters (name, unit, method, precision, category),
                value_numeric,
                value_text,
                is_conforming,
                notes,
                is_valid
            )
        `)
        .neq("lab_analysis.is_valid", false)
        .in("status", ["collected", "received", "pending", "in_analysis", "pending_analysis", "reviewed"])
        .order("collected_at", { ascending: false });

    if (sampleError) {
        console.error("Error fetching samples for worksheets:", sampleError);
        return { success: false, message: sampleError.message };
    }

    // 2. Transform data
    const worksheets = samples
        .filter((sample: any) => sample.lab_analysis && sample.lab_analysis.length > 0)
        .map((sample: any) => {
            const batch = Array.isArray(sample.batch) ? sample.batch[0] : sample.batch;
            const productName = batch?.products?.name || "N/A";
            const productSpecs = batch?.products?.product_specifications || [];

            const analyses = sample.lab_analysis.map((a: any) => {
                // Find best matching spec: Specific > Generic
                const specificSpec = productSpecs.find((s: any) => s.qa_parameter_id === a.qa_parameter_id && s.sample_type_id === sample.sample_type_id);
                const genericSpec = productSpecs.find((s: any) => s.qa_parameter_id === a.qa_parameter_id && s.sample_type_id === null);
                const spec = specificSpec || genericSpec;

                return {
                    id: a.id,
                    parameter: a.qa_parameters,
                    created_at: a.created_at,
                    value_numeric: a.value_numeric,
                    value_text: a.value_text,
                    is_conforming: a.is_conforming,
                    notes: a.notes,
                    spec: spec ? {
                        min: spec.min_value,
                        max: spec.max_value,
                        target: spec.target_value
                    } : null,
                    status: (a.value_numeric !== null || a.value_text !== null) ? "filled" : "ready"
                };
            });

            const isFullyAnalyzed = analyses.length > 0 && analyses.every((a: any) => a.status === "filled");

            return {
                sample: {
                    ...sample,
                    productName,
                    isFullyAnalyzed
                },
                analyses
            };
        });

    // Final filter: ensure we didn't include validated ones by status
    const validWorksheets = worksheets.filter((w: any) => w.sample.status !== "validated");

    return { success: true, data: validWorksheets };
}

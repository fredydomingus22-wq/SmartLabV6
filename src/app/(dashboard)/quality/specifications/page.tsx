import React from "react";
import { createClient } from "@/lib/supabase/server";
import { SpecificationsClient } from "./specifications-client";

export const dynamic = "force-dynamic";

export default async function SpecificationsPage({ searchParams }: { searchParams: Promise<{ product?: string }> }) {
    const params = await searchParams;
    const supabase = await createClient();

    // Fetch original data logic (preserved)
    const { data: sampleTypes } = await supabase.from("sample_types").select("*").order("name");
    const { data: products } = await supabase.from("products").select("*").order("name");
    const selectedProductId = params.product;
    const isGlobalMode = selectedProductId === "global";

    let specifications: any[] = [];
    if (selectedProductId) {
        let query = supabase.from("product_specifications").select(`
            id, qa_parameter_id, min_value, max_value, target_value, text_value_expected, 
            is_critical, sampling_frequency, test_method_override, sample_type_id, created_at, 
            haccp_hazard:haccp_hazards(id, is_pcc, hazard_description, hazard_category),
            parameter:qa_parameters(id, name, code, unit, category),
            sample_type:sample_types(id, name, code)
        `).order("created_at");

        if (isGlobalMode) query = query.is("product_id", null);
        else query = query.eq("product_id", selectedProductId);

        const { data } = await query;
        specifications = data || [];
    }

    let availableParameters: any[] = [];
    if (selectedProductId) {
        const { data: qap } = await supabase.from("qa_parameters").select("*").eq("status", "active").order("name");
        availableParameters = qap || [];
    }

    const { data: samplingPoints } = await supabase.from("sampling_points").select("*").eq("status", "active").order("name");

    return (
        <SpecificationsClient
            specifications={specifications}
            selectedProductId={selectedProductId}
            isGlobalMode={isGlobalMode}
            products={products}
            sampleTypes={sampleTypes}
            samplingPoints={samplingPoints}
            availableParameters={availableParameters}
        />
    );
}

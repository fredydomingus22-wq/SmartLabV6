
import { createClient } from "@/lib/supabase/server";

export async function getProductBOM(productId: string) {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from("product_bom")
        .select(`
            *,
            component_product:products!component_product_id(id, name, sku, unit),
            component_raw_material:raw_materials!component_raw_material_id(id, name, code, unit)
        `)
        .eq("parent_product_id", productId);

    if (error) {
        console.error("Error fetching BOM:", error);
        return [];
    }

    return data;
}

export async function getProcessSpecifications(productId: string) {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from("product_specifications")
        .select(`
            id,
            qa_parameter_id,
            min_value,
            max_value,
            target_value,
            text_value_expected,
            is_critical,
            sampling_frequency,
            parameter:qa_parameters!inner(id, name, code, unit, category)
        `)
        .eq("product_id", productId)
        .eq("parameter.category", "process");

    if (error) {
        console.error("Error fetching process specs:", error);
        return [];
    }

    return data;
}

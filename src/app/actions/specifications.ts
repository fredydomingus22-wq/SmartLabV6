"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";

// Validation schemas
const SpecificationSchema = z.object({
    product_id: z.string().uuid("Invalid product ID").nullable().optional(),
    qa_parameter_id: z.string().uuid("Invalid parameter ID"),
    min_value: z.coerce.number().optional(),
    max_value: z.coerce.number().optional(),
    target_value: z.coerce.number().optional(),
    text_value_expected: z.string().optional(),
    is_critical: z.coerce.boolean().default(false),
    sampling_frequency: z.string().default("per_batch"),
    test_method_override: z.string().optional(),
    sample_type_id: z.string().uuid("Invalid physical stage ID").nullable().optional(),
    sampling_point_id: z.string().uuid("Invalid sampling point ID").nullable().optional(),
}).refine(data => data.product_id || data.sample_type_id || data.sampling_point_id, {
    message: "Specification must belong to at least one of: Product, Phase, or Sampling Point",
    path: ["product_id"]
});

/**
 * Create a new Specification (Polymorphic)
 */
export async function createSpecificationAction(formData: FormData) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, message: "Unauthorized" };

    const { data: profile } = await supabase
        .from("user_profiles")
        .select("organization_id, plant_id")
        .eq("id", user.id)
        .single();

    if (!profile) return { success: false, message: "Profile not found" };

    const rawSampleTypeId = formData.get("sample_type_id");
    const sampleTypeId = rawSampleTypeId === "null" || !rawSampleTypeId ? null : rawSampleTypeId;

    const rawProductId = formData.get("product_id");
    const productId = rawProductId === "null" || !rawProductId ? null : rawProductId;

    const rawSamplingPointId = formData.get("sampling_point_id");
    const samplingPointId = rawSamplingPointId === "null" || !rawSamplingPointId ? null : rawSamplingPointId;

    const rawData = {
        product_id: productId,
        qa_parameter_id: formData.get("qa_parameter_id"),
        min_value: formData.get("min_value") || undefined,
        max_value: formData.get("max_value") || undefined,
        target_value: formData.get("target_value") || undefined,
        text_value_expected: formData.get("text_value_expected") || undefined,
        is_critical: formData.get("is_critical") === "true",
        sampling_frequency: formData.get("sampling_frequency") || "per_batch",
        test_method_override: formData.get("test_method_override") || undefined,
        sample_type_id: sampleTypeId,
        sampling_point_id: samplingPointId,
    };

    const validation = SpecificationSchema.safeParse(rawData);
    if (!validation.success) {
        return { success: false, message: validation.error.issues[0].message };
    }

    // Check for duplicate based on polymorphic key
    let query = supabase
        .from("product_specifications")
        .select("id")
        .eq("qa_parameter_id", validation.data.qa_parameter_id);

    if (validation.data.product_id) query = query.eq("product_id", validation.data.product_id);
    else query = query.is("product_id", null);

    if (validation.data.sample_type_id) query = query.eq("sample_type_id", validation.data.sample_type_id);
    else query = query.is("sample_type_id", null);

    if (validation.data.sampling_point_id) query = query.eq("sampling_point_id", validation.data.sampling_point_id);
    else query = query.is("sampling_point_id", null);

    const { data: existing } = await query.maybeSingle();

    if (existing) {
        return { success: false, message: "Specification already exists for this configuration" };
    }

    // Fetch category from parameter
    const { data: parameter } = await supabase
        .from("qa_parameters")
        .select("category")
        .eq("id", validation.data.qa_parameter_id)
        .single();

    const specCategory = parameter?.category || "physico_chemical";

    const { error } = await supabase.from("product_specifications").insert({
        organization_id: profile.organization_id,
        plant_id: profile.plant_id,
        ...validation.data,
        category: specCategory,
        status: "active",
        version: 1,
    });

    if (error) return { success: false, message: error.message };

    revalidatePath("/quality/specifications");
    return { success: true, message: "Specification created successfully" };
}

/**
 * Update an existing Specification with automatic versioning
 */
export async function updateSpecificationAction(formData: FormData) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, message: "Unauthorized" };

    const id = formData.get("id") as string;
    const changeReason = formData.get("change_reason") as string || "Updated via UI";
    if (!id) return { success: false, message: "Specification ID required" };

    // Get current spec data for history
    const { data: currentSpec, error: fetchError } = await supabase
        .from("product_specifications")
        .select("*")
        .eq("id", id)
        .single();

    if (fetchError || !currentSpec) {
        return { success: false, message: "Specification not found" };
    }

    const rawSampleTypeId = formData.get("sample_type_id");
    const sampleTypeId = rawSampleTypeId === "null" || !rawSampleTypeId ? null : rawSampleTypeId;

    const rawProductId = formData.get("product_id");
    const productId = rawProductId === "null" || !rawProductId ? null : rawProductId;

    const rawSamplingPointId = formData.get("sampling_point_id");
    const samplingPointId = rawSamplingPointId === "null" || !rawSamplingPointId ? null : rawSamplingPointId;

    const rawData = {
        product_id: productId,
        qa_parameter_id: formData.get("qa_parameter_id"),
        min_value: formData.get("min_value") || undefined,
        max_value: formData.get("max_value") || undefined,
        target_value: formData.get("target_value") || undefined,
        text_value_expected: formData.get("text_value_expected") || undefined,
        is_critical: formData.get("is_critical") === "true",
        sampling_frequency: formData.get("sampling_frequency") || "per_batch",
        test_method_override: formData.get("test_method_override") || undefined,
        sample_type_id: sampleTypeId,
        sampling_point_id: samplingPointId,
    };

    const validation = SpecificationSchema.safeParse(rawData);
    if (!validation.success) {
        return { success: false, message: validation.error.issues[0].message };
    }

    // Create history record
    const { error: historyError } = await supabase
        .from("specification_history")
        .insert({
            organization_id: currentSpec.organization_id,
            plant_id: currentSpec.plant_id,
            specification_id: id,
            product_id: currentSpec.product_id,
            sample_type_id: currentSpec.sample_type_id,
            sampling_point_id: currentSpec.sampling_point_id,
            qa_parameter_id: currentSpec.qa_parameter_id,
            version: currentSpec.version || 1,
            min_value: currentSpec.min_value,
            max_value: currentSpec.max_value,
            target_value: currentSpec.target_value,
            text_value_expected: currentSpec.text_value_expected,
            is_critical: currentSpec.is_critical,
            sampling_frequency: currentSpec.sampling_frequency,
            status: currentSpec.status || 'active',
            effective_date: currentSpec.effective_date || new Date().toISOString().split('T')[0],
            superseded_at: new Date().toISOString(),
            changed_by: user.id,
            change_reason: changeReason,
        });

    if (historyError) {
        console.error("Failed to create history:", historyError);
    }

    // Update with incremented version
    const newVersion = (currentSpec.version || 1) + 1;

    const { error } = await supabase
        .from("product_specifications")
        .update({
            ...validation.data,
            version: newVersion,
            effective_date: new Date().toISOString().split('T')[0],
            updated_at: new Date().toISOString(),
        })
        .eq("id", id);

    if (error) return { success: false, message: error.message };

    revalidatePath("/quality/specifications");
    return { success: true, message: `Specification updated to version ${newVersion}` };
}

/**
 * Delete a Product Specification
 */
export async function deleteSpecificationAction(formData: FormData) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, message: "Unauthorized" };

    const id = formData.get("id") as string;
    if (!id) return { success: false, message: "Specification ID required" };

    const { error } = await supabase
        .from("product_specifications")
        .delete()
        .eq("id", id);

    if (error) return { success: false, message: error.message };

    revalidatePath("/quality/specifications");
    return { success: true, message: "Specification deleted" };
}

/**
 * Copy all specs from one product to another
 */
export async function copySpecsFromProductAction(formData: FormData) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, message: "Unauthorized" };

    const sourceProductId = formData.get("source_product_id") as string;
    const targetProductId = formData.get("target_product_id") as string;

    if (!sourceProductId || !targetProductId) {
        return { success: false, message: "Source and target product IDs required" };
    }

    if (sourceProductId === targetProductId) {
        return { success: false, message: "Source and target cannot be the same" };
    }

    const { data: profile } = await supabase
        .from("user_profiles")
        .select("organization_id, plant_id")
        .eq("id", user.id)
        .single();

    if (!profile) return { success: false, message: "Profile not found" };

    // Get source specs
    const { data: sourceSpecs, error: fetchError } = await supabase
        .from("product_specifications")
        .select("qa_parameter_id, min_value, max_value, target_value, text_value_expected, is_critical, sampling_frequency, test_method_override")
        .eq("product_id", sourceProductId);

    if (fetchError) return { success: false, message: fetchError.message };
    if (!sourceSpecs || sourceSpecs.length === 0) {
        return { success: false, message: "Source product has no specifications" };
    }

    // Check for existing specs on target
    const { data: existingSpecs } = await supabase
        .from("product_specifications")
        .select("qa_parameter_id")
        .eq("product_id", targetProductId);

    const existingParamIds = new Set((existingSpecs || []).map(s => s.qa_parameter_id));

    // Filter out specs that already exist
    const newSpecs = sourceSpecs.filter(s => !existingParamIds.has(s.qa_parameter_id));

    if (newSpecs.length === 0) {
        return { success: false, message: "All specifications already exist on target product" };
    }

    // Insert new specs
    const specsToInsert = newSpecs.map(spec => ({
        organization_id: profile.organization_id,
        plant_id: profile.plant_id,
        product_id: targetProductId,
        ...spec,
    }));

    const { error: insertError } = await supabase
        .from("product_specifications")
        .insert(specsToInsert);

    if (insertError) return { success: false, message: insertError.message };

    revalidatePath("/quality/specifications");
    return {
        success: true,
        message: `Copied ${newSpecs.length} specifications to target product`
    };
}

/**
 * Bulk import specifications for a product
 */
export async function bulkImportSpecsAction(
    productId: string,
    specs: Array<{
        parameter_code: string;
        min_value?: number;
        max_value?: number;
        target_value?: number;
        is_critical?: boolean;
    }>
) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, message: "Unauthorized", imported: 0, errors: [] };

    const { data: profile } = await supabase
        .from("user_profiles")
        .select("organization_id, plant_id")
        .eq("id", user.id)
        .single();

    if (!profile) return { success: false, message: "Profile not found", imported: 0, errors: [] };

    // Get all parameters by code
    const { data: parameters } = await supabase
        .from("qa_parameters")
        .select("id, code")
        .eq("organization_id", profile.organization_id);

    const paramMap = new Map((parameters || []).map(p => [p.code, p.id]));

    const errors: string[] = [];
    let imported = 0;

    for (const spec of specs) {
        const paramId = paramMap.get(spec.parameter_code.toUpperCase());
        if (!paramId) {
            errors.push(`${spec.parameter_code}: Parameter not found`);
            continue;
        }

        // Check for duplicate
        const { data: existing } = await supabase
            .from("product_specifications")
            .select("id")
            .eq("product_id", productId)
            .eq("qa_parameter_id", paramId)
            .maybeSingle();

        if (existing) {
            errors.push(`${spec.parameter_code}: Already exists`);
            continue;
        }

        const { error } = await supabase.from("product_specifications").insert({
            organization_id: profile.organization_id,
            plant_id: profile.plant_id,
            product_id: productId,
            qa_parameter_id: paramId,
            min_value: spec.min_value,
            max_value: spec.max_value,
            target_value: spec.target_value,
            is_critical: spec.is_critical ?? false,
        });

        if (error) {
            errors.push(`${spec.parameter_code}: ${error.message}`);
        } else {
            imported++;
        }
    }

    revalidatePath("/quality/specifications");
    return {
        success: errors.length === 0,
        message: `Imported ${imported} specifications${errors.length > 0 ? `, ${errors.length} errors` : ''}`,
        imported,
        errors,
    };
}

/**
 * Restore a specification from a historical version
 */
export async function restoreSpecificationFromHistoryAction(historyId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, message: "Unauthorized" };

    // Fetch the historical version
    const { data: historyRecord, error: fetchError } = await supabase
        .from("specification_history")
        .select("*")
        .eq("id", historyId)
        .single();

    if (fetchError || !historyRecord) {
        return { success: false, message: "Historical version not found" };
    }

    // Get current specification
    const { data: currentSpec, error: currentError } = await supabase
        .from("product_specifications")
        .select("*")
        .eq("id", historyRecord.specification_id)
        .single();

    if (currentError || !currentSpec) {
        return { success: false, message: "Current specification not found" };
    }

    // Save current to history before restoring
    await supabase.from("specification_history").insert({
        organization_id: currentSpec.organization_id,
        plant_id: currentSpec.plant_id,
        specification_id: currentSpec.id,
        product_id: currentSpec.product_id,
        qa_parameter_id: currentSpec.qa_parameter_id,
        version: currentSpec.version || 1,
        min_value: currentSpec.min_value,
        max_value: currentSpec.max_value,
        target_value: currentSpec.target_value,
        text_value_expected: currentSpec.text_value_expected,
        is_critical: currentSpec.is_critical,
        sampling_frequency: currentSpec.sampling_frequency,
        status: currentSpec.status,
        effective_date: currentSpec.effective_date,
        superseded_at: new Date().toISOString(),
        changed_by: user.id,
        change_reason: `Rolled back to version ${historyRecord.version}`,
    });

    // Restore values from history
    const newVersion = (currentSpec.version || 1) + 1;
    const { error } = await supabase
        .from("product_specifications")
        .update({
            min_value: historyRecord.min_value,
            max_value: historyRecord.max_value,
            target_value: historyRecord.target_value,
            text_value_expected: historyRecord.text_value_expected,
            is_critical: historyRecord.is_critical,
            sampling_frequency: historyRecord.sampling_frequency,
            version: newVersion,
            effective_date: new Date().toISOString().split('T')[0],
            updated_at: new Date().toISOString(),
        })
        .eq("id", historyRecord.specification_id);

    if (error) return { success: false, message: error.message };

    revalidatePath("/quality/specifications");
    revalidatePath(`/quality/specifications/${historyRecord.specification_id}`);
    return {
        success: true,
        message: `Restored to v${historyRecord.version} (now v${newVersion})`
    };
}

"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";

// Helper to convert empty strings to undefined
const emptyToUndefined = (val: FormDataEntryValue | null) => {
    if (val === null || val === "") return undefined;
    return val;
};

// Validation schemas
const ParameterSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    code: z.string().min(1, "Code is required").toUpperCase(),
    unit: z.string().optional(),
    category: z.enum(["physico_chemical", "microbiological", "sensory", "process", "other"]).optional(),
    method: z.string().optional(),
    precision: z.coerce.number().int().min(0).max(6).default(2),
    analysis_time_minutes: z.coerce.number().int().positive().optional(),
    incubation_temp_c: z.coerce.number().int().min(0).max(60).optional(),
    equipment_required: z.string().optional(),
    description: z.string().optional(),
    status: z.enum(["active", "inactive"]).default("active"),
});

const BulkParameterSchema = z.array(ParameterSchema);

/**
 * Create a new QA Parameter
 */
export async function createParameterAction(formData: FormData) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, message: "Unauthorized" };

    // Get user's org and plant
    const { data: profile } = await supabase
        .from("user_profiles")
        .select("organization_id, plant_id")
        .eq("id", user.id)
        .single();

    if (!profile) return { success: false, message: "Profile not found" };

    const rawData = {
        name: formData.get("name"),
        code: formData.get("code"),
        unit: emptyToUndefined(formData.get("unit")),
        category: emptyToUndefined(formData.get("category")),
        method: emptyToUndefined(formData.get("method")),
        precision: emptyToUndefined(formData.get("precision")) || 2,
        analysis_time_minutes: emptyToUndefined(formData.get("analysis_time_minutes")),
        incubation_temp_c: emptyToUndefined(formData.get("incubation_temp_c")),
        equipment_required: emptyToUndefined(formData.get("equipment_required")),
        description: emptyToUndefined(formData.get("description")),
        status: emptyToUndefined(formData.get("status")) || "active",
    };

    const validation = ParameterSchema.safeParse(rawData);
    if (!validation.success) {
        return { success: false, message: validation.error.issues[0].message };
    }

    // Check for duplicate code
    const { data: existing } = await supabase
        .from("qa_parameters")
        .select("id")
        .eq("code", validation.data.code)
        .eq("organization_id", profile.organization_id)
        .maybeSingle();

    if (existing) {
        return { success: false, message: `Parameter with code ${validation.data.code} already exists` };
    }

    const { error } = await supabase.from("qa_parameters").insert({
        organization_id: profile.organization_id,
        plant_id: profile.plant_id,
        ...validation.data,
    });

    if (error) return { success: false, message: error.message };

    revalidatePath("/quality/parameters");
    return { success: true, message: "Parameter created successfully" };
}

/**
 * Update an existing QA Parameter with automatic versioning
 * Creates a history record before updating, increments version
 */
export async function updateParameterAction(formData: FormData) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, message: "Unauthorized" };

    const id = formData.get("id") as string;
    const changeReason = formData.get("change_reason") as string || "Updated via UI";
    if (!id) return { success: false, message: "Parameter ID required" };

    // Get current parameter data for history
    const { data: currentParam, error: fetchError } = await supabase
        .from("qa_parameters")
        .select("*")
        .eq("id", id)
        .single();

    if (fetchError || !currentParam) {
        return { success: false, message: "Parameter not found" };
    }

    const rawData = {
        name: formData.get("name"),
        code: formData.get("code"),
        unit: emptyToUndefined(formData.get("unit")),
        category: emptyToUndefined(formData.get("category")),
        method: emptyToUndefined(formData.get("method")),
        precision: emptyToUndefined(formData.get("precision")) || 2,
        analysis_time_minutes: emptyToUndefined(formData.get("analysis_time_minutes")),
        incubation_temp_c: emptyToUndefined(formData.get("incubation_temp_c")),
        equipment_required: emptyToUndefined(formData.get("equipment_required")),
        description: emptyToUndefined(formData.get("description")),
        status: emptyToUndefined(formData.get("status")) || "active",
    };

    const validation = ParameterSchema.safeParse(rawData);
    if (!validation.success) {
        return { success: false, message: validation.error.issues[0].message };
    }

    // Create history record of current version before updating
    const { error: historyError } = await supabase
        .from("qa_parameter_history")
        .insert({
            organization_id: currentParam.organization_id,
            plant_id: currentParam.plant_id,
            parameter_id: id,
            version: currentParam.version || 1,
            name: currentParam.name,
            code: currentParam.code,
            unit: currentParam.unit,
            category: currentParam.category,
            method: currentParam.method,
            precision: currentParam.precision,
            analysis_time_minutes: currentParam.analysis_time_minutes,
            equipment_required: currentParam.equipment_required,
            description: currentParam.description,
            status: currentParam.status,
            effective_date: currentParam.effective_date || new Date().toISOString().split('T')[0],
            superseded_at: new Date().toISOString(),
            changed_by: user.id,
            change_reason: changeReason,
        });

    if (historyError) {
        console.error("Failed to create history:", historyError);
        // Continue with update even if history fails
    }

    // Update with incremented version
    const newVersion = (currentParam.version || 1) + 1;

    const { error } = await supabase
        .from("qa_parameters")
        .update({
            ...validation.data,
            version: newVersion,
            effective_date: new Date().toISOString().split('T')[0],
            updated_at: new Date().toISOString(),
        })
        .eq("id", id);

    if (error) return { success: false, message: error.message };

    revalidatePath("/quality/parameters");
    return { success: true, message: `Parameter updated to version ${newVersion}` };
}

/**
 * Delete (deactivate) a QA Parameter
 */
export async function deleteParameterAction(formData: FormData) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, message: "Unauthorized" };

    const id = formData.get("id") as string;
    if (!id) return { success: false, message: "Parameter ID required" };

    // Soft delete - set status to inactive
    const { error } = await supabase
        .from("qa_parameters")
        .update({ status: "inactive", updated_at: new Date().toISOString() })
        .eq("id", id);

    if (error) return { success: false, message: error.message };

    revalidatePath("/quality/parameters");
    return { success: true, message: "Parameter deactivated" };
}

/**
 * Bulk import parameters from CSV data
 */
export async function bulkImportParametersAction(parameters: Array<{
    name: string;
    code: string;
    unit?: string;
    category?: string;
    method?: string;
    precision?: number;
}>) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, message: "Unauthorized", imported: 0, errors: [] };

    const { data: profile } = await supabase
        .from("user_profiles")
        .select("organization_id, plant_id")
        .eq("id", user.id)
        .single();

    if (!profile) return { success: false, message: "Profile not found", imported: 0, errors: [] };

    const errors: string[] = [];
    let imported = 0;

    for (const param of parameters) {
        const validation = ParameterSchema.safeParse(param);
        if (!validation.success) {
            errors.push(`${param.code}: ${validation.error.issues[0].message}`);
            continue;
        }

        // Check for duplicate
        const { data: existing } = await supabase
            .from("qa_parameters")
            .select("id")
            .eq("code", validation.data.code)
            .eq("organization_id", profile.organization_id)
            .maybeSingle();

        if (existing) {
            errors.push(`${param.code}: Already exists`);
            continue;
        }

        const { error } = await supabase.from("qa_parameters").insert({
            organization_id: profile.organization_id,
            plant_id: profile.plant_id,
            ...validation.data,
        });

        if (error) {
            errors.push(`${param.code}: ${error.message}`);
        } else {
            imported++;
        }
    }

    revalidatePath("/quality/parameters");
    return {
        success: errors.length === 0,
        message: `Imported ${imported} parameters${errors.length > 0 ? `, ${errors.length} errors` : ''}`,
        imported,
        errors,
    };
}

/**
 * Get all parameters for the current tenant
 */
export async function getParametersAction() {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from("qa_parameters")
        .select("*")
        .order("name");

    if (error) return { success: false, message: error.message, data: [] };
    return { success: true, data };
}

/**
 * Get version history for a specific parameter
 */
export async function getParameterHistoryAction(parameterId: string) {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from("qa_parameter_history")
        .select(`
            *,
            changed_by_user:changed_by(email)
        `)
        .eq("parameter_id", parameterId)
        .order("version", { ascending: false });

    if (error) return { success: false, message: error.message, history: [] };
    return { success: true, history: data };
}


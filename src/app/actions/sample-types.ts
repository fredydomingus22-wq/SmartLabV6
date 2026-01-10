"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";

// Validation schema
const SampleTypeSchema = z.object({
    name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
    code: z.string().min(1, "Código é obrigatório").toUpperCase(),
    description: z.string().optional(),
    test_category: z.enum(["physico_chemical", "microbiological", "both"]).default("physico_chemical"),
    retention_time_days: z.coerce.number().min(0, "Deve ser positivo").default(30),
    default_sla_minutes: z.coerce.number().min(0, "Deve ser positivo").default(2880),
});

/**
 * Get all sample types (Global System Types)
 */
export async function getSampleTypesAction() {
    const supabase = await createClient();

    // No organization filter needed as sample_types are now global
    const { data, error } = await supabase
        .from("sample_types")
        .select("id, name, code, description, test_category, retention_time_days, default_sla_minutes")
        .order("name");

    if (error) return { success: false, message: error.message, data: [] };
    return { success: true, data };
}

/**
 * Create a new Sample Type (Global - Restricted)
 */
export async function createSampleTypeAction(formData: FormData) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, message: "Unauthorized" };

    const { data: profile } = await supabase
        .from("user_profiles")
        .select("role")
        .eq("id", user.id)
        .single();

    // Only System Owners or Admins should create global types (Strictly speaking, maybe only System Owner?)
    // User requested "Global for everyone", so creation modifies system master data.
    // Let's allow admins for now but they affect everyone.
    if (profile?.role !== 'system_owner' && profile?.role !== 'admin') {
        return { success: false, message: "Permission denied. Only Admins can manage Global Sample Types." };
    }

    const rawData = {
        name: formData.get("name"),
        code: formData.get("code"),
        description: formData.get("description") || undefined,
        test_category: formData.get("test_category") || "physico_chemical",
        retention_time_days: formData.get("retention_time_days"),
        default_sla_minutes: formData.get("default_sla_minutes"),
    };

    const validation = SampleTypeSchema.safeParse(rawData);
    if (!validation.success) {
        return { success: false, message: validation.error.issues[0].message };
    }

    // Check for duplicate code (Global check)
    const { data: existing } = await supabase
        .from("sample_types")
        .select("id")
        .eq("code", validation.data.code)
        .maybeSingle();

    if (existing) {
        return { success: false, message: `Tipo de amostra com código ${validation.data.code} já existe` };
    }

    // Insert Global Type (No Org ID)
    const { error } = await supabase.from("sample_types").insert({
        name: validation.data.name,
        code: validation.data.code,
        test_category: validation.data.test_category,
        retention_time_days: validation.data.retention_time_days,
        default_sla_minutes: validation.data.default_sla_minutes,
    });

    if (error) return { success: false, message: error.message };

    revalidatePath("/lab/sample-types");
    return { success: true, message: "Tipo de amostra global criado com sucesso" };
}

/**
 * Update an existing Sample Type
 */
export async function updateSampleTypeAction(formData: FormData) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, message: "Unauthorized" };

    const id = formData.get("id") as string;
    if (!id) return { success: false, message: "ID required" };

    const rawData = {
        name: formData.get("name"),
        code: formData.get("code"),
        description: formData.get("description") || undefined,
        test_category: formData.get("test_category") || "physico_chemical",
        retention_time_days: formData.get("retention_time_days"),
        default_sla_minutes: formData.get("default_sla_minutes"),
    };

    const validation = SampleTypeSchema.safeParse(rawData);
    if (!validation.success) {
        return { success: false, message: validation.error.issues[0].message };
    }

    const { error } = await supabase
        .from("sample_types")
        .update({
            name: validation.data.name,
            code: validation.data.code,
            test_category: validation.data.test_category,
            retention_time_days: validation.data.retention_time_days,
            default_sla_minutes: validation.data.default_sla_minutes,
        })
        .eq("id", id);

    if (error) return { success: false, message: error.message };

    revalidatePath("/lab/sample-types");
    return { success: true, message: "Tipo de amostra atualizado" };
}

/**
 * Delete a Sample Type
 */
export async function deleteSampleTypeAction(formData: FormData) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, message: "Unauthorized" };

    const id = formData.get("id") as string;
    if (!id) return { success: false, message: "ID required" };

    // Check if used by any samples
    const { data: usedBySamples } = await supabase
        .from("samples")
        .select("id")
        .eq("sample_type_id", id)
        .limit(1);

    if (usedBySamples && usedBySamples.length > 0) {
        return { success: false, message: "Tipo de amostra em uso, não pode ser eliminado" };
    }

    const { error } = await supabase
        .from("sample_types")
        .delete()
        .eq("id", id);

    if (error) return { success: false, message: error.message };

    revalidatePath("/lab/sample-types");
    return { success: true, message: "Tipo de amostra eliminado" };
}

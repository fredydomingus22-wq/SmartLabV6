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
});

/**
 * Get all sample types for the current tenant
 */
export async function getSampleTypesAction() {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from("sample_types")
        .select("*")
        .order("name");

    if (error) return { success: false, message: error.message, data: [] };
    return { success: true, data };
}

/**
 * Create a new Sample Type
 */
export async function createSampleTypeAction(formData: FormData) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, message: "Unauthorized" };

    const { data: profile } = await supabase
        .from("user_profiles")
        .select("organization_id, plant_id")
        .eq("id", user.id)
        .single();

    if (!profile) return { success: false, message: "Profile not found" };

    const rawData = {
        name: formData.get("name"),
        code: formData.get("code"),
        description: formData.get("description") || undefined,
        test_category: formData.get("test_category") || "physico_chemical",
    };

    const validation = SampleTypeSchema.safeParse(rawData);
    if (!validation.success) {
        return { success: false, message: validation.error.issues[0].message };
    }

    // Check for duplicate code
    const { data: existing } = await supabase
        .from("sample_types")
        .select("id")
        .eq("code", validation.data.code)
        .eq("organization_id", profile.organization_id)
        .maybeSingle();

    if (existing) {
        return { success: false, message: `Tipo de amostra com código ${validation.data.code} já existe` };
    }

    const { error } = await supabase.from("sample_types").insert({
        organization_id: profile.organization_id,
        plant_id: profile.plant_id,
        name: validation.data.name,
        code: validation.data.code,
        test_category: validation.data.test_category,
    });

    if (error) return { success: false, message: error.message };

    revalidatePath("/lab/sample-types");
    return { success: true, message: "Tipo de amostra criado com sucesso" };
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

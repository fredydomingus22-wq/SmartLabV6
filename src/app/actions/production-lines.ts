"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";

// Validation schema
const ProductionLineSchema = z.object({
    name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
    code: z.string().min(1, "Código é obrigatório").toUpperCase(),
    status: z.enum(["active", "maintenance", "inactive"]).default("active"),
});

/**
 * Get all production lines for the current tenant
 */
export async function getProductionLinesAction() {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from("production_lines")
        .select("*")
        .order("name");

    if (error) return { success: false, message: error.message, data: [] };
    return { success: true, data };
}

/**
 * Create a new Production Line
 */
export async function createProductionLineAction(formData: FormData) {
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
        status: formData.get("status") || "active",
    };

    const validation = ProductionLineSchema.safeParse(rawData);
    if (!validation.success) {
        return { success: false, message: validation.error.issues[0].message };
    }

    const { error } = await supabase.from("production_lines").insert({
        organization_id: profile.organization_id,
        plant_id: profile.plant_id,
        ...validation.data,
    });

    if (error) return { success: false, message: error.message };

    revalidatePath("/production/lines");
    return { success: true, message: "Linha de produção criada" };
}

/**
 * Update an existing Production Line
 */
export async function updateProductionLineAction(formData: FormData) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, message: "Unauthorized" };

    const id = formData.get("id") as string;
    if (!id) return { success: false, message: "ID required" };

    const rawData = {
        name: formData.get("name"),
        code: formData.get("code"),
        status: formData.get("status") || "active",
    };

    const validation = ProductionLineSchema.safeParse(rawData);
    if (!validation.success) {
        return { success: false, message: validation.error.issues[0].message };
    }

    const { error } = await supabase
        .from("production_lines")
        .update(validation.data)
        .eq("id", id);

    if (error) return { success: false, message: error.message };

    revalidatePath("/production/lines");
    return { success: true, message: "Linha de produção atualizada" };
}

/**
 * Delete a Production Line
 */
export async function deleteProductionLineAction(formData: FormData) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, message: "Unauthorized" };

    const id = formData.get("id") as string;
    if (!id) return { success: false, message: "ID required" };

    // Check if used by any batches
    const { data: usedByBatches } = await supabase
        .from("production_batches")
        .select("id")
        .eq("production_line_id", id)
        .limit(1);

    if (usedByBatches && usedByBatches.length > 0) {
        return { success: false, message: "Linha em uso, não pode ser eliminada" };
    }

    const { error } = await supabase
        .from("production_lines")
        .delete()
        .eq("id", id);

    if (error) return { success: false, message: error.message };

    revalidatePath("/production/lines");
    return { success: true, message: "Linha de produção eliminada" };
}

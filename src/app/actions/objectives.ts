"use server";

import { createClient } from "@/lib/supabase/server";
import { getSafeUser } from "@/lib/auth.server";
import { revalidatePath } from "next/cache";
import { z } from "zod";

/**
 * Zod Schemas
 */
const ObjectiveSchema = z.object({
    title: z.string().min(3, "Título é obrigatório"),
    description: z.string().optional().nullable(),
    category: z.enum(["process", "customer", "product", "compliance", "financial", "people"]),
    target_value: z.coerce.number().min(0),
    current_value: z.coerce.number().min(0).optional(),
    unit: z.string().min(1),
    target_date: z.string().optional().nullable(),
    owner_id: z.string().uuid().optional().nullable(),
    plant_id: z.string().uuid().optional().nullable(),
    resources_required: z.string().optional().nullable(),
    evaluation_method: z.string().optional().nullable(),
});

const ProgressUpdateSchema = z.object({
    objective_id: z.string().uuid(),
    current_value: z.coerce.number().min(0),
    status: z.enum(["on_track", "at_risk", "achieved", "missed"]).optional(),
});

/**
 * Create a new quality objective
 */
export async function createObjectiveAction(formData: FormData) {
    try {
        const user = await getSafeUser();
        const supabase = await createClient();

        const validatedFields = ObjectiveSchema.safeParse({
            title: formData.get("title"),
            description: formData.get("description") || null,
            category: formData.get("category"),
            target_value: formData.get("target_value"),
            current_value: formData.get("current_value") || 0,
            unit: formData.get("unit"),
            target_date: formData.get("target_date") || null,
            owner_id: formData.get("owner_id") || null,
            plant_id: formData.get("plant_id") || user.plant_id,
            resources_required: formData.get("resources_required") || null,
            evaluation_method: formData.get("evaluation_method") || null,
        });

        if (!validatedFields.success) {
            return { success: false, error: "Campos inválidos", details: validatedFields.error.flatten().fieldErrors };
        }

        const { error } = await supabase
            .from("quality_objectives")
            .insert({
                ...validatedFields.data,
                organization_id: user.organization_id,
            });


        if (error) throw error;

        revalidatePath("/(dashboard)/quality/objectives", "layout");
        return { success: true, message: "Objetivo de qualidade criado com sucesso" };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

/**
 * Update progress on an objective
 */
export async function updateObjectiveProgressAction(formData: FormData) {
    try {
        const user = await getSafeUser();
        const supabase = await createClient();

        const validatedFields = ProgressUpdateSchema.safeParse({
            objective_id: formData.get("objective_id"),
            current_value: formData.get("current_value"),
            status: formData.get("status") || undefined,
        });

        if (!validatedFields.success) {
            return { success: false, error: "Campos inválidos" };
        }

        const { objective_id, current_value, status } = validatedFields.data;

        // Build update object
        const updateData: Record<string, any> = { current_value };
        if (status) updateData.status = status;

        const { error } = await supabase
            .from("quality_objectives")
            .update(updateData)
            .eq("id", objective_id)
            .eq("organization_id", user.organization_id);

        if (error) throw error;

        revalidatePath("/(dashboard)/quality/objectives", "layout");
        return { success: true, message: "Progresso atualizado" };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

/**
 * Delete an objective
 */
export async function deleteObjectiveAction(id: string) {
    try {
        const user = await getSafeUser();
        const supabase = await createClient();

        const { error } = await supabase
            .from("quality_objectives")
            .delete()
            .eq("id", id)
            .eq("organization_id", user.organization_id);

        if (error) throw error;

        revalidatePath("/(dashboard)/quality/objectives", "layout");
        return { success: true, message: "Objetivo eliminado" };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}


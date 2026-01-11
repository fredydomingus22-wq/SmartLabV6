"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requirePermission } from "@/lib/permissions.server";

const ShiftSchema = z.object({
    name: z.string().min(1, "O nome do turno é obrigatório"),
    start_time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Formato de hora inválido (HH:MM)"),
    end_time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Formato de hora inválido (HH:MM)"),
    description: z.string().optional(),
});

export async function getShiftsAction() {
    await requirePermission('production', 'read');
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    const { data: profile } = await supabase
        .from("user_profiles")
        .select("plant_id")
        .eq("id", user.id)
        .single();

    if (!profile) throw new Error("Profile not found");

    const { data, error } = await supabase
        .from("shifts")
        .select("*")
        .eq("plant_id", profile.plant_id)
        .order("start_time", { ascending: true });

    if (error) throw error;
    return data;
}

export async function createShiftAction(formData: FormData) {
    await requirePermission('production', 'write');
    const supabase = await createClient();

    const rawData = {
        name: formData.get("name"),
        start_time: formData.get("start_time"),
        end_time: formData.get("end_time"),
        description: formData.get("description") || undefined,
    };

    const validation = ShiftSchema.safeParse(rawData);
    if (!validation.success) {
        return { success: false, message: validation.error.issues[0].message };
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    const { data: profile } = await supabase
        .from("user_profiles")
        .select("organization_id, plant_id")
        .eq("id", user.id)
        .single();

    if (!profile) throw new Error("Profile not found");

    const { error } = await supabase
        .from("shifts")
        .insert({
            ...validation.data,
            organization_id: profile.organization_id,
            plant_id: profile.plant_id,
        });

    if (error) return { success: false, message: error.message };

    revalidatePath("/production/config/shifts");
    return { success: true, message: "Turno criado com sucesso!" };
}

export async function updateShiftAction(id: string, formData: FormData) {
    await requirePermission('production', 'write');
    const supabase = await createClient();

    const rawData = {
        name: formData.get("name"),
        start_time: formData.get("start_time"),
        end_time: formData.get("end_time"),
        description: formData.get("description") || undefined,
    };

    const validation = ShiftSchema.safeParse(rawData);
    if (!validation.success) {
        return { success: false, message: validation.error.issues[0].message };
    }

    const { error } = await supabase
        .from("shifts")
        .update(validation.data)
        .eq("id", id);

    if (error) return { success: false, message: error.message };

    revalidatePath("/production/config/shifts");
    return { success: true, message: "Turno atualizado com sucesso!" };
}

export async function deleteShiftAction(id: string) {
    await requirePermission('production', 'write');
    const supabase = await createClient();

    const { error } = await supabase
        .from("shifts")
        .delete()
        .eq("id", id);

    if (error) return { success: false, message: error.message };

    revalidatePath("/production/config/shifts");
    return { success: true, message: "Turno eliminado com sucesso!" };
}

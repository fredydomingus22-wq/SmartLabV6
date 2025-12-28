"use server";

import { createClient } from "@/lib/supabase/server";
import { getSafeUser } from "@/lib/auth.server";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const TankSchema = z.object({
    name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
    code: z.string().min(1, "Código é obrigatório").toUpperCase(),
    capacity: z.coerce.number().optional().nullable(),
    capacity_unit: z.string().default("L"),
    status: z.enum(["active", "maintenance", "decommissioned", "cleaning"]).default("active"),
    description: z.string().optional().nullable(),
});

/**
 * Get all tanks for the current tenant
 */
export async function getTanksAction() {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from("tanks")
        .select("*")
        .order("code");

    if (error) return { success: false, message: error.message, data: [] };
    return { success: true, data };
}

/**
 * Get a single tank with its current content (intermediate product)
 */
export async function getTankWithContentAction(id: string) {
    const supabase = await createClient();

    const { data: tank, error } = await supabase
        .from("tanks")
        .select("*")
        .eq("id", id)
        .single();

    if (error) return { success: false, message: error.message, data: null };

    // Get current content
    const { data: content } = await supabase
        .from("intermediate_products")
        .select(`
            id, code, status, volume, unit,
            batch:production_batches(id, code, product:products(id, name))
        `)
        .eq("equipment_id", id)
        .in("status", ["pending", "approved", "in_use"])
        .single();

    return { success: true, data: { ...tank, currentContent: content } };
}

/**
 * Create a new tank
 */
export async function createTankAction(formData: FormData) {
    try {
        const user = await getSafeUser();
        const supabase = await createClient();

        const rawData = {
            name: formData.get("name"),
            code: formData.get("code"),
            capacity: formData.get("capacity") || null,
            capacity_unit: formData.get("capacity_unit") || "L",
            status: formData.get("status") || "active",
            description: formData.get("description") || null,
        };

        const validation = TankSchema.safeParse(rawData);
        if (!validation.success) {
            return { success: false, message: validation.error.issues[0].message };
        }

        const { error } = await supabase.from("tanks").insert({
            organization_id: user.organization_id,
            plant_id: user.plant_id,
            ...validation.data
        });

        if (error) throw error;

        revalidatePath("/production/tanks");
        return { success: true, message: "Tanque criado com sucesso" };
    } catch (error: any) {
        return { success: false, message: error.message || "Erro ao criar tanque" };
    }
}

/**
 * Update a tank
 */
export async function updateTankAction(formData: FormData) {
    try {
        const supabase = await createClient();
        const id = formData.get("id") as string;
        if (!id) return { success: false, message: "ID obrigatório" };

        const rawData = {
            name: formData.get("name"),
            code: formData.get("code"),
            capacity: formData.get("capacity") || null,
            capacity_unit: formData.get("capacity_unit") || "L",
            status: formData.get("status") || "active",
            description: formData.get("description") || null,
        };

        const validation = TankSchema.safeParse(rawData);
        if (!validation.success) {
            return { success: false, message: validation.error.issues[0].message };
        }

        const { error } = await supabase
            .from("tanks")
            .update({ ...validation.data, updated_at: new Date().toISOString() })
            .eq("id", id);

        if (error) throw error;

        revalidatePath("/production/tanks");
        return { success: true, message: "Tanque atualizado" };
    } catch (error: any) {
        return { success: false, message: error.message || "Erro ao atualizar" };
    }
}

/**
 * Update tank status
 */
export async function updateTankStatusAction(id: string, status: string) {
    const supabase = await createClient();

    const validStatuses = ["active", "maintenance", "decommissioned", "cleaning"];
    if (!validStatuses.includes(status)) {
        return { success: false, message: "Status inválido" };
    }

    const { error } = await supabase.from("tanks").update({ status }).eq("id", id);

    if (error) return { success: false, message: error.message };

    revalidatePath("/production/tanks");
    return { success: true, message: `Status atualizado para ${status}` };
}

"use server";

import { createClient } from "@/lib/supabase/server";
import { getSafeUser } from "@/lib/auth.server";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const ProcessEquipmentSchema = z.object({
    name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
    code: z.string().min(1, "Código é obrigatório").toUpperCase(),
    equipment_category: z.enum(["filler", "pasteurizer", "homogenizer", "separator", "mixer", "sterilizer", "cooler", "heater", "pump", "valve", "other"]),
    manufacturer: z.string().optional().nullable(),
    model: z.string().optional().nullable(),
    serial_number: z.string().optional().nullable(),
    installation_date: z.string().optional().nullable(),
    capacity: z.coerce.number().optional().nullable(),
    capacity_unit: z.string().optional().nullable(),
    status: z.enum(["active", "maintenance", "decommissioned"]).default("active"),
    next_maintenance_date: z.string().optional().nullable(),
    description: z.string().optional().nullable(),
});

/**
 * Get all process equipment for the current tenant
 */
export async function getProcessEquipmentAction(category?: string) {
    const supabase = await createClient();

    let query = supabase.from("process_equipment").select("*").order("code");

    if (category) {
        query = query.eq("equipment_category", category);
    }

    const { data, error } = await query;

    if (error) return { success: false, message: error.message, data: [] };
    return { success: true, data };
}

/**
 * Get process equipment for CIP selection (active only)
 */
export async function getCIPTargetsAction() {
    const supabase = await createClient();

    // Get tanks
    const { data: tanks } = await supabase
        .from("tanks")
        .select("id, name, code")
        .eq("status", "active")
        .order("code");

    // Get process equipment
    const { data: equipment } = await supabase
        .from("process_equipment")
        .select("id, name, code, equipment_category")
        .eq("status", "active")
        .order("code");

    // Get production lines
    const { data: lines } = await supabase
        .from("production_lines")
        .select("id, name, code")
        .eq("status", "active")
        .order("code");

    return {
        success: true,
        data: {
            tanks: tanks || [],
            process_equipment: equipment || [],
            production_lines: lines || []
        }
    };
}

/**
 * Get a single process equipment with maintenance history
 */
export async function getProcessEquipmentWithHistoryAction(id: string) {
    const supabase = await createClient();

    const { data: equipment, error } = await supabase
        .from("process_equipment")
        .select("*")
        .eq("id", id)
        .single();

    if (error) return { success: false, message: error.message, data: null };

    // Get maintenance logs
    const { data: logs } = await supabase
        .from("maintenance_logs")
        .select("*, performed_by_profile:user_profiles!performed_by(full_name)")
        .eq("asset_type", "process_equipment")
        .eq("asset_id", id)
        .order("performed_at", { ascending: false });

    // Get CIP executions
    const { data: cipExecutions } = await supabase
        .from("cip_executions")
        .select("*, program:cip_programs(name)")
        .eq("target_type", "process_equipment")
        .eq("target_id", id)
        .order("start_time", { ascending: false })
        .limit(10);

    return {
        success: true,
        data: {
            ...equipment,
            maintenance_logs: logs || [],
            cip_executions: cipExecutions || []
        }
    };
}

/**
 * Create new process equipment
 */
export async function createProcessEquipmentAction(formData: FormData) {
    try {
        const user = await getSafeUser();
        const supabase = await createClient();

        const rawData = {
            name: formData.get("name"),
            code: formData.get("code"),
            equipment_category: formData.get("equipment_category"),
            manufacturer: formData.get("manufacturer") || null,
            model: formData.get("model") || null,
            serial_number: formData.get("serial_number") || null,
            installation_date: formData.get("installation_date") || null,
            capacity: formData.get("capacity") || null,
            capacity_unit: formData.get("capacity_unit") || null,
            status: formData.get("status") || "active",
            next_maintenance_date: formData.get("next_maintenance_date") || null,
            description: formData.get("description") || null,
        };

        const validation = ProcessEquipmentSchema.safeParse(rawData);
        if (!validation.success) {
            return { success: false, message: validation.error.issues[0].message };
        }

        const { error } = await supabase.from("process_equipment").insert({
            organization_id: user.organization_id,
            plant_id: user.plant_id,
            ...validation.data
        });

        if (error) throw error;

        revalidatePath("/production/equipment");
        return { success: true, message: "Equipamento criado com sucesso" };
    } catch (error: any) {
        return { success: false, message: error.message || "Erro ao criar equipamento" };
    }
}

/**
 * Update process equipment
 */
export async function updateProcessEquipmentAction(formData: FormData) {
    try {
        const supabase = await createClient();
        const id = formData.get("id") as string;
        if (!id) return { success: false, message: "ID obrigatório" };

        const rawData = {
            name: formData.get("name"),
            code: formData.get("code"),
            equipment_category: formData.get("equipment_category"),
            manufacturer: formData.get("manufacturer") || null,
            model: formData.get("model") || null,
            serial_number: formData.get("serial_number") || null,
            installation_date: formData.get("installation_date") || null,
            capacity: formData.get("capacity") || null,
            capacity_unit: formData.get("capacity_unit") || null,
            status: formData.get("status") || "active",
            next_maintenance_date: formData.get("next_maintenance_date") || null,
            description: formData.get("description") || null,
        };

        const validation = ProcessEquipmentSchema.safeParse(rawData);
        if (!validation.success) {
            return { success: false, message: validation.error.issues[0].message };
        }

        const { error } = await supabase
            .from("process_equipment")
            .update({ ...validation.data, updated_at: new Date().toISOString() })
            .eq("id", id);

        if (error) throw error;

        revalidatePath("/production/equipment");
        return { success: true, message: "Equipamento atualizado" };
    } catch (error: any) {
        return { success: false, message: error.message || "Erro ao atualizar" };
    }
}

/**
 * Update process equipment status
 */
export async function updateProcessEquipmentStatusAction(id: string, status: string) {
    const supabase = await createClient();

    const validStatuses = ["active", "maintenance", "decommissioned"];
    if (!validStatuses.includes(status)) {
        return { success: false, message: "Status inválido" };
    }

    const { error } = await supabase.from("process_equipment").update({ status }).eq("id", id);

    if (error) return { success: false, message: error.message };

    revalidatePath("/production/equipment");
    return { success: true, message: `Status atualizado para ${status}` };
}

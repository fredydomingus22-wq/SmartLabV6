"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";

// Validation schema
const EquipmentSchema = z.object({
    name: z.string().min(2, "Name must have at least 2 characters"),
    code: z.string().min(1, "Code is required").toUpperCase(),
    equipment_type: z.enum(["tank", "mixer", "pasteurizer", "filler", "incubator", "production_line", "other"]),
    status: z.enum(["active", "maintenance", "decommissioned", "out_of_calibration", "retired"]).default("active"),
    capacity: z.coerce.number().optional().nullable(),
    capacity_unit: z.string().optional().nullable(),
    serial_number: z.string().optional().nullable(),
    manufacturer: z.string().optional().nullable(),
    model: z.string().optional().nullable(),
    installation_date: z.string().optional().nullable(),
    last_calibration_date: z.string().optional().nullable(),
    next_calibration_date: z.string().optional().nullable(),
    calibration_frequency_months: z.coerce.number().optional().nullable(),
    criticality: z.enum(["low", "medium", "high"]).default("medium"),
});

/**
 * Get all equipment for the current tenant
 */
export async function getEquipmentAction(type?: string) {
    const supabase = await createClient();

    let query = supabase
        .from("equipments")
        .select("*")
        .order("name");

    if (type) {
        query = query.eq("equipment_type", type);
    }

    const { data, error } = await query;

    if (error) return { success: false, message: error.message, data: [] };
    return { success: true, data };
}

/**
 * Get tanks (equipment type=tank) with their current intermediate products
 */
export async function getTanksWithContentsAction() {
    const supabase = await createClient();

    // Get all tank-type equipment
    const { data: tanks, error: tankError } = await supabase
        .from("equipments")
        .select("*")
        .eq("equipment_type", "tank")
        .order("code");

    if (tankError) return { success: false, message: tankError.message, data: [] };

    // Get intermediate products currently assigned to tanks
    const { data: contents, error: contentsError } = await supabase
        .from("intermediate_products")
        .select(`
            id,
            code,
            status,
            volume,
            unit,
            equipment_id,
            batch:production_batches(id, code, product:products(id, name))
        `)
        .in("status", ["pending", "approved", "in_use"]);

    if (contentsError) return { success: false, message: contentsError.message, data: [] };

    // Merge tanks with their current contents
    const tanksWithContents = tanks?.map(tank => ({
        ...tank,
        currentContent: contents?.find(c => c.equipment_id === tank.id) || null,
    }));

    return { success: true, data: tanksWithContents };
}

/**
 * Create new equipment
 */
export async function createEquipmentAction(formData: FormData) {
    try {
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
            equipment_type: formData.get("equipment_type"),
            status: formData.get("status") || "active",
            capacity: formData.get("capacity") || null,
            capacity_unit: formData.get("capacity_unit") || "L",
            serial_number: formData.get("serial_number") || null,
            manufacturer: formData.get("manufacturer") || null,
            model: formData.get("model") || null,
            installation_date: formData.get("installation_date") || null,
            last_calibration_date: formData.get("last_calibration_date") || null,
            next_calibration_date: formData.get("next_calibration_date") || null,
            calibration_frequency_months: formData.get("calibration_frequency_months") || null,
            criticality: formData.get("criticality") || "medium",
        };

        const validation = EquipmentSchema.safeParse(rawData);
        if (!validation.success) {
            return { success: false, message: validation.error.issues[0].message };
        }

        const { error } = await supabase.from("equipments").insert({
            organization_id: profile.organization_id,
            plant_id: profile.plant_id,
            ...validation.data
        });

        if (error) throw error;

        revalidatePath("/production/equipment");
        return { success: true, message: "Equipment created" };
    } catch (error: any) {
        return { success: false, message: error.message || "Error creating equipment" };
    }
}

/**
 * Update equipment
 */
export async function updateEquipmentAction(formData: FormData) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { success: false, message: "Unauthorized" };

        const id = formData.get("id") as string;
        if (!id) return { success: false, message: "ID required" };

        const rawData = {
            name: formData.get("name"),
            code: formData.get("code"),
            equipment_type: formData.get("equipment_type"),
            status: formData.get("status") || "active",
            capacity: formData.get("capacity") || null,
            capacity_unit: formData.get("capacity_unit") || "L",
            serial_number: formData.get("serial_number") || null,
            manufacturer: formData.get("manufacturer") || null,
            model: formData.get("model") || null,
            installation_date: formData.get("installation_date") || null,
            last_calibration_date: formData.get("last_calibration_date") || null,
            next_calibration_date: formData.get("next_calibration_date") || null,
            calibration_frequency_months: formData.get("calibration_frequency_months") || null,
            criticality: formData.get("criticality") || "medium",
        };

        const validation = EquipmentSchema.safeParse(rawData);
        if (!validation.success) {
            return { success: false, message: validation.error.issues[0].message };
        }

        const { error } = await supabase
            .from("equipments")
            .update({
                ...validation.data,
                updated_at: new Date().toISOString()
            })
            .eq("id", id);

        if (error) throw error;

        revalidatePath("/production/equipment");
        return { success: true, message: "Equipment updated" };
    } catch (error: any) {
        return { success: false, message: error.message || "Error updating equipment" };
    }
}

/**
 * Update equipment status
 */
export async function updateEquipmentStatusAction(id: string, status: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, message: "Unauthorized" };

    const validStatuses = ["active", "maintenance", "decommissioned", "out_of_calibration", "retired"];
    if (!validStatuses.includes(status)) {
        return { success: false, message: "Invalid status" };
    }

    const { error } = await supabase
        .from("equipments")
        .update({ status })
        .eq("id", id);

    if (error) return { success: false, message: error.message };

    revalidatePath("/production/equipment");
    return { success: true, message: `Status updated to ${status}` };
}

/**
 * Delete equipment
 */
export async function deleteEquipmentAction(formData: FormData) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, message: "Unauthorized" };

    const id = formData.get("id") as string;
    if (!id) return { success: false, message: "ID required" };

    // Check if used by intermediate products
    const { data: usedByProducts } = await supabase
        .from("intermediate_products")
        .select("id")
        .eq("equipment_id", id)
        .limit(1);

    if (usedByProducts && usedByProducts.length > 0) {
        return { success: false, message: "Equipment in use by intermediate products, cannot delete" };
    }

    const { error } = await supabase
        .from("equipments")
        .delete()
        .eq("id", id);

    if (error) return { success: false, message: error.message };

    revalidatePath("/production/equipment");
    return { success: true, message: "Equipment deleted" };
}

"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";

// Validation schema
const TankSchema = z.object({
    code: z.string().min(1, "Code is required").toUpperCase(),
    status: z.enum(["empty", "filling", "in_process", "ready", "cleaning"]).default("empty"),
    volume: z.coerce.number().optional(),
    unit: z.string().default("L"),
});

/**
 * Get all tanks (intermediate products) for the current tenant
 */
export async function getTanksAction() {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from("intermediate_products")
        .select(`
            *,
            batch:production_batches(id, code, product:products(name))
        `)
        .order("code");

    if (error) return { success: false, message: error.message, data: [] };
    return { success: true, data };
}

/**
 * Create a new Tank
 */
export async function createTankAction(formData: FormData) {
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
        code: formData.get("code"),
        status: formData.get("status") || "empty",
        volume: formData.get("volume") || undefined,
        unit: formData.get("unit") || "L",
    };

    const validation = TankSchema.safeParse(rawData);
    if (!validation.success) {
        return { success: false, message: validation.error.issues[0].message };
    }

    const { error } = await supabase.from("intermediate_products").insert({
        organization_id: profile.organization_id,
        plant_id: profile.plant_id,
        code: validation.data.code,
        status: validation.data.status,
        volume: validation.data.volume || null,
        unit: validation.data.unit,
    });

    if (error) return { success: false, message: error.message };

    revalidatePath("/production/tanks");
    return { success: true, message: "Tank created" };
}

/**
 * Update an existing Tank
 */
export async function updateTankAction(formData: FormData) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, message: "Unauthorized" };

    const id = formData.get("id") as string;
    if (!id) return { success: false, message: "ID required" };

    const rawData = {
        code: formData.get("code"),
        status: formData.get("status") || "empty",
        volume: formData.get("volume") || undefined,
        unit: formData.get("unit") || "L",
    };

    const validation = TankSchema.safeParse(rawData);
    if (!validation.success) {
        return { success: false, message: validation.error.issues[0].message };
    }

    const { error } = await supabase
        .from("intermediate_products")
        .update({
            code: validation.data.code,
            status: validation.data.status,
            volume: validation.data.volume || null,
            unit: validation.data.unit,
        })
        .eq("id", id);

    if (error) return { success: false, message: error.message };

    revalidatePath("/production/tanks");
    return { success: true, message: "Tank updated" };
}

/**
 * Delete a Tank
 */
export async function deleteTankAction(formData: FormData) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, message: "Unauthorized" };

    const id = formData.get("id") as string;
    if (!id) return { success: false, message: "ID required" };

    // Check if used by any samples
    const { data: usedBySamples } = await supabase
        .from("samples")
        .select("id")
        .eq("intermediate_product_id", id)
        .limit(1);

    if (usedBySamples && usedBySamples.length > 0) {
        return { success: false, message: "Tank in use by samples, cannot be deleted" };
    }

    const { error } = await supabase
        .from("intermediate_products")
        .delete()
        .eq("id", id);

    if (error) return { success: false, message: error.message };

    revalidatePath("/production/tanks");
    return { success: true, message: "Tank deleted" };
}

/**
 * Quick status update for a Tank
 */
export async function updateTankStatusAction(id: string, status: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, message: "Unauthorized" };

    const validStatuses = ["empty", "filling", "in_process", "ready", "cleaning"];
    if (!validStatuses.includes(status)) {
        return { success: false, message: "Invalid status" };
    }

    const { error } = await supabase
        .from("intermediate_products")
        .update({ status })
        .eq("id", id);

    if (error) return { success: false, message: error.message };

    revalidatePath("/production/tanks");
    revalidatePath("/lab");
    return { success: true, message: `Status updated to ${status}` };
}

"use server";

import { createSafeActionClient } from "next-safe-action";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

const action = createSafeActionClient();

// --- Schemas ---

const createPackagingMaterialSchema = z.object({
    name: z.string().min(1, "Nome obrigatório"),
    code: z.string().optional(),
    description: z.string().optional(),
    min_stock_level: z.preprocess((v) => Number(v), z.number().min(0).default(0)),
});

const createPackagingLotSchema = z.object({
    packaging_material_id: z.string().uuid(),
    lot_code: z.string().min(1, "Código de lote obrigatório"),
    quantity: z.preprocess((v) => Number(v), z.number().min(0)),
    received_at: z.string().optional(), // ISO date string
    expiry_date: z.string().optional(), // ISO date string
});

const createPackagingUsageSchema = z.object({
    production_batch_id: z.string().uuid(),
    packaging_lot_id: z.string().uuid(),
    quantity_used: z.preprocess((v) => Number(v), z.number().min(0)),
    unit: z.string().optional(),
});

// --- Actions ---

export async function createPackagingMaterial(formData: FormData) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, message: "Unauthorized" };

    const rawData = {
        name: formData.get("name"),
        code: formData.get("code") || undefined,
        description: formData.get("description") || undefined,
        min_stock_level: formData.get("min_stock_level"),
    };

    const validation = createPackagingMaterialSchema.safeParse(rawData);
    if (!validation.success) {
        return { success: false, message: validation.error.issues[0].message };
    }

    const { data: profile } = await supabase
        .from("user_profiles")
        .select("organization_id, plant_id")
        .eq("id", user.id)
        .single();

    if (!profile) return { success: false, message: "Profile not found" };

    const { error } = await supabase.from("packaging_materials").insert({
        organization_id: profile.organization_id,
        plant_id: profile.plant_id,
        ...validation.data,
    });

    if (error) return { success: false, message: error.message };

    revalidatePath("/materials/packaging");
    return { success: true, message: "Material registado com sucesso" };
}

export async function createPackagingLot(formData: FormData) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, message: "Unauthorized" };

    const rawData = {
        packaging_material_id: formData.get("packaging_material_id"),
        lot_code: formData.get("lot_code"),
        quantity: formData.get("quantity"),
        received_at: formData.get("received_at") || undefined,
        expiry_date: formData.get("expiry_date") || undefined,
    };

    const validation = createPackagingLotSchema.safeParse(rawData);
    if (!validation.success) {
        return { success: false, message: validation.error.issues[0].message };
    }

    const { data: profile } = await supabase
        .from("user_profiles")
        .select("organization_id, plant_id")
        .eq("id", user.id)
        .single();

    if (!profile) return { success: false, message: "Profile not found" };
    if (!profile.plant_id) return { success: false, message: "Must be in a plant to create lots" };

    const { error } = await supabase.from("packaging_lots").insert({
        organization_id: profile.organization_id,
        plant_id: profile.plant_id,
        packaging_material_id: validation.data.packaging_material_id,
        lot_code: validation.data.lot_code,
        quantity: validation.data.quantity,
        remaining_quantity: validation.data.quantity,
        received_at: validation.data.received_at || new Date().toISOString(),
        expiry_date: validation.data.expiry_date,
        status: 'active'
    });

    if (error) return { success: false, message: error.message };

    revalidatePath("/materials/packaging");
    revalidatePath(`/materials/packaging/${validation.data.packaging_material_id}`);
    return { success: true, message: "Lote registado com sucesso" };
}

export async function recordPackagingUsage(formData: FormData) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, message: "Unauthorized" };

    const rawData = {
        production_batch_id: formData.get("production_batch_id"),
        packaging_lot_id: formData.get("packaging_lot_id"),
        quantity_used: formData.get("quantity_used"),
        unit: formData.get("unit") || undefined,
    };

    const validation = createPackagingUsageSchema.safeParse(rawData);
    if (!validation.success) {
        return { success: false, message: validation.error.issues[0].message };
    }

    const { data: profile } = await supabase
        .from("user_profiles")
        .select("organization_id, plant_id")
        .eq("id", user.id)
        .single();

    if (!profile) return { success: false, message: "Profile not found" };

    const { error } = await supabase.from("batch_packaging_usage").insert({
        organization_id: profile.organization_id,
        plant_id: profile.plant_id,
        production_batch_id: validation.data.production_batch_id,
        packaging_lot_id: validation.data.packaging_lot_id,
        quantity_used: validation.data.quantity_used,
        unit: validation.data.unit,
        added_by: user.id
    });

    if (error) return { success: false, message: error.message };

    await supabase.rpc('decrement_packaging_stock', {
        p_lot_id: validation.data.packaging_lot_id,
        p_quantity: validation.data.quantity_used
    });

    revalidatePath("/production");
    return { success: true, message: "Uso registado com sucesso" };
}

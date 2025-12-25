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

export const createPackagingMaterial = action(
    createPackagingMaterialSchema,
    async (input) => {
        const supabase = await createClient();

        // Org ID handled by Default? No, usually RLS checks it, but manual Insert might need it?
        // Supabase RLS policies usually enforcing "auth.uid() -> user_profile -> org_id" on SELECT
        // But on INSERT/UPDATE, we might need to supply it if not defaulting.
        // My migration scripts use `get_my_org_id()` in policies but table definitions require `organization_id`.
        // We should fetch org_id from user profile or let database handle it if there's a default?
        // Looking at my migration: `organization_id UUID NOT NULL`. No default.
        // So I must fetch it.

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Unauthorized");

        // Fetch org and plant from profile
        const { data: profile } = await supabase
            .from("user_profiles")
            .select("organization_id, plant_id")
            .eq("id", user.id)
            .single();

        if (!profile) throw new Error("Profile not found");

        const { error } = await supabase.from("packaging_materials").insert({
            organization_id: profile.organization_id,
            plant_id: profile.plant_id, // Nullable
            ...input,
        });

        if (error) throw new Error(error.message);

        revalidatePath("/materials/packaging");
        return { success: true };
    }
);

export const createPackagingLot = action(
    createPackagingLotSchema,
    async (input) => {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Unauthorized");

        const { data: profile } = await supabase
            .from("user_profiles")
            .select("organization_id, plant_id")
            .eq("id", user.id)
            .single();

        if (!profile) throw new Error("Profile not found");
        if (!profile.plant_id) throw new Error("Must be in a plant to create lots");

        const { error } = await supabase.from("packaging_lots").insert({
            organization_id: profile.organization_id,
            plant_id: profile.plant_id,
            packaging_material_id: input.packaging_material_id,
            lot_code: input.lot_code,
            quantity: input.quantity,
            remaining_quantity: input.quantity, // Initial remaining = total
            received_at: input.received_at || new Date().toISOString(),
            expiry_date: input.expiry_date,
            status: 'active'
        });

        if (error) throw new Error(error.message);

        revalidatePath("/materials/packaging");
        revalidatePath(`/materials/packaging/${input.packaging_material_id}`);
        return { success: true };
    }
);

export const recordPackagingUsage = action(
    createPackagingUsageSchema,
    async (input) => {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Unauthorized");

        const { data: profile } = await supabase
            .from("user_profiles")
            .select("organization_id, plant_id")
            .eq("id", user.id)
            .single();

        if (!profile) throw new Error("Profile not found");

        const { error } = await supabase.from("batch_packaging_usage").insert({
            organization_id: profile.organization_id,
            plant_id: profile.plant_id,
            production_batch_id: input.production_batch_id,
            packaging_lot_id: input.packaging_lot_id,
            quantity_used: input.quantity_used,
            unit: input.unit,
            added_by: user.id
        });

        if (error) throw new Error(error.message);

        // Note: Traceability trigger will handle the rest

        // Also update remaining quantity?
        // Logic for inventory deduction should ideally be here or trigger.
        // I'll add a simple deduction here for now.

        await supabase.rpc('decrement_packaging_stock', {
            p_lot_id: input.packaging_lot_id,
            p_quantity: input.quantity_used
        });

        revalidatePath("/production"); // Revalidate production views
        return { success: true };
    }
);

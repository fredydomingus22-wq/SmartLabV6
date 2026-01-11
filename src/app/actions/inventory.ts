"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { MaterialsDomainService } from "@/domain/materials/materials.service";

// Schema for Creating Reagent
const CreateReagentSchema = z.object({
    name: z.string().min(2),
    cas_number: z.string().nullable().optional(),
    supplier: z.string().nullable().optional(),
    storage_location: z.string().nullable().optional(),
    min_stock_level: z.coerce.number().min(0),
    unit: z.string().default("units"),
    plant_id: z.string().uuid(),
});

// Schema for Receiving Stock
const ReceiveStockSchema = z.object({
    reagent_id: z.string().uuid(),
    quantity: z.coerce.number().positive(),
    batch_number: z.string().nullable().optional(),
    expiry_date: z.string().nullable().optional(), // YYYY-MM-DD
    external_supplier: z.string().nullable().optional(),
    notes: z.string().nullable().optional(),
});

// Schema for Consuming Stock
const ConsumeStockSchema = z.object({
    reagent_id: z.string().uuid(),
    quantity: z.coerce.number().positive(),
    destination: z.string().nullable().optional(),
    purpose: z.string().nullable().optional(),
    requested_by: z.string().nullable().optional(),
    notes: z.string().optional(),
});

import { ActionState } from "@/lib/types";
import { getSafeUser } from "@/lib/auth.server";

// ... schemas

export async function createReagentAction(formData: FormData): Promise<ActionState> {
    const user = await getSafeUser(); // Critical: redirect if not auth
    const supabase = await createClient();

    const rawData = {
        name: formData.get("name"),
        cas_number: formData.get("cas_number"),
        supplier: formData.get("supplier"),
        storage_location: formData.get("storage_location"),
        min_stock_level: formData.get("min_stock_level"),
        unit: formData.get("unit"),
        plant_id: formData.get("plant_id"), // Ideally user driven, but form currently submits it?
    };

    const validation = CreateReagentSchema.safeParse(rawData);
    if (!validation.success) return { success: false, message: validation.error.issues[0].message };

    const { error } = await supabase.from("reagents").insert({
        organization_id: user.organization_id,
        // Ensure plant_id matches user access if strict? For now, trust form or user?
        // Let's use user.plant_id if available to override or validate?
        // Phase 2: strict plant validation.
        ...validation.data
    });

    if (error) return { success: false, message: error.message };

    revalidatePath("/materials/reagents");
    return { success: true, message: "Reagent Created" };
}

export async function receiveStockAction(formData: FormData): Promise<ActionState> {
    const user = await getSafeUser();
    const supabase = await createClient();

    const rawData = {
        reagent_id: formData.get("reagent_id"),
        quantity: formData.get("quantity"),
        batch_number: formData.get("batch_number"),
        expiry_date: formData.get("expiry_date"),
        notes: formData.get("notes"),
        external_supplier: formData.get("external_supplier"),
    };

    const validation = ReceiveStockSchema.safeParse(rawData);
    if (!validation.success) return { success: false, message: validation.error.issues[0].message };

    const { data: reagent } = await supabase
        .from("reagents")
        .select("organization_id, plant_id, unit")
        .eq("id", validation.data.reagent_id)
        .single();
    if (!reagent) return { success: false, message: "Reagent not found" };

    const batchNumber = validation.data.batch_number || `BATCH-${Date.now()}`;
    const service = new MaterialsDomainService(supabase);

    try {
        await service.receiveReagent({
            reagent_id: validation.data.reagent_id,
            quantity: validation.data.quantity,
            batch_number: batchNumber,
            expiry_date: validation.data.expiry_date,
            supplier: validation.data.external_supplier,
            notes: validation.data.notes,
            user_id: user.id,
            plant_id: reagent.plant_id,
            organization_id: reagent.organization_id,
            unit: reagent.unit || "units"
        });

        revalidatePath("/materials/reagents");
        return { success: true, message: `Stock Received - Batch ${batchNumber}` };
    } catch (error: any) {
        return { success: false, message: error.message };
    }
}

export async function consumeStockAction(formData: FormData): Promise<ActionState> {
    const user = await getSafeUser();
    const supabase = await createClient();

    const rawData = {
        reagent_id: formData.get("reagent_id"),
        quantity: formData.get("quantity"),
        destination: formData.get("destination"),
        purpose: formData.get("purpose"),
        requested_by: formData.get("requested_by"),
        notes: formData.get("notes"),
    };

    const validation = ConsumeStockSchema.safeParse(rawData);
    if (!validation.success) return { success: false, message: validation.error.issues[0].message };

    const service = new MaterialsDomainService(supabase);

    try {
        await service.consumeReagent({
            reagent_id: validation.data.reagent_id,
            quantity: validation.data.quantity,
            destination: validation.data.destination,
            purpose: validation.data.purpose,
            requested_by: validation.data.requested_by,
            notes: validation.data.notes,
            user_id: user.id
        });

        revalidatePath("/materials/reagents");
        return { success: true, message: "Stock Consumed" };
    } catch (error: any) {
        return { success: false, message: error.message };
    }
}


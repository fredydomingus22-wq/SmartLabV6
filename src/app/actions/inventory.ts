"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";

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

    // Generate batch number if not provided
    const batchNumber = validation.data.batch_number || `BATCH-${Date.now()}`;

    // Create the batch record
    const { data: batch, error: batchError } = await supabase
        .from("reagent_batches")
        .insert({
            organization_id: reagent.organization_id,
            plant_id: reagent.plant_id,
            reagent_id: validation.data.reagent_id,
            batch_number: batchNumber,
            initial_quantity: validation.data.quantity,
            current_quantity: validation.data.quantity,
            unit: reagent.unit || "units",
            expiry_date: validation.data.expiry_date || null,
            supplier: validation.data.external_supplier || null,
            status: "active",
        })
        .select("id")
        .single();

    if (batchError) return { success: false, message: batchError.message };

    // Log the movement for audit trail
    const { error: movementError } = await supabase.from("reagent_movements").insert({
        organization_id: reagent.organization_id,
        plant_id: reagent.plant_id,
        reagent_id: validation.data.reagent_id,
        reagent_batch_id: batch?.id,
        movement_type: "in",
        quantity: validation.data.quantity,
        batch_number: batchNumber,
        expiry_date: validation.data.expiry_date || null,
        external_supplier: validation.data.external_supplier || null,
        user_id: user.id,
        destination: null,
        purpose: "Purchase/Resupply",
        notes: validation.data.notes || "Manual Receipt"
    });

    if (movementError) return { success: false, message: movementError.message };

    revalidatePath("/materials/reagents");
    return { success: true, message: `Stock Received - Batch ${batchNumber}` };
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

    const { data: reagent } = await supabase
        .from("reagents")
        .select("organization_id, plant_id")
        .eq("id", validation.data.reagent_id)
        .single();
    if (!reagent) return { success: false, message: "Reagent not found" };

    // Get active batches ordered by FEFO (First Expiry, First Out)
    const { data: batches, error: batchError } = await supabase
        .from("reagent_batches")
        .select("id, batch_number, current_quantity, expiry_date")
        .eq("reagent_id", validation.data.reagent_id)
        .eq("status", "active")
        .gt("current_quantity", 0)
        .order("expiry_date", { ascending: true, nullsFirst: false })
        .order("received_date", { ascending: true });

    if (batchError) return { success: false, message: batchError.message };

    // Calculate total available stock
    const totalAvailable = (batches || []).reduce((sum, b) => sum + Number(b.current_quantity), 0);
    const requestedQty = validation.data.quantity;

    if (totalAvailable < requestedQty) {
        return {
            success: false,
            message: `Insufficient stock. Available: ${totalAvailable.toFixed(2)}, Requested: ${requestedQty}`
        };
    }

    // Consume from batches using FEFO
    let remainingToConsume = requestedQty;
    const consumedBatches: { batchId: string; batchNumber: string; quantity: number }[] = [];

    for (const batch of batches || []) {
        if (remainingToConsume <= 0) break;

        const available = Number(batch.current_quantity);
        const toConsume = Math.min(available, remainingToConsume);

        // Update batch quantity
        const newQuantity = available - toConsume;
        const newStatus = newQuantity <= 0 ? "depleted" : "active";

        await supabase
            .from("reagent_batches")
            .update({
                current_quantity: newQuantity,
                status: newStatus,
            })
            .eq("id", batch.id);

        consumedBatches.push({
            batchId: batch.id,
            batchNumber: batch.batch_number,
            quantity: toConsume,
        });

        remainingToConsume -= toConsume;
    }

    // Log the movement for audit trail
    const batchSummary = consumedBatches.map(b => `${b.batchNumber}(${b.quantity})`).join(", ");

    const { error: movementError } = await supabase.from("reagent_movements").insert({
        organization_id: reagent.organization_id,
        plant_id: reagent.plant_id,
        reagent_id: validation.data.reagent_id,
        reagent_batch_id: consumedBatches[0]?.batchId || null, // Primary batch
        movement_type: "out",
        quantity: validation.data.quantity,
        destination: validation.data.destination || null,
        purpose: validation.data.purpose || null,
        requested_by: validation.data.requested_by || null,
        user_id: user.id,
        notes: `${validation.data.notes || "Manual Consumption"} | Batches: ${batchSummary}`
    });

    if (movementError) return { success: false, message: movementError.message };

    revalidatePath("/materials/reagents");
    return { success: true, message: `Stock Consumed from ${consumedBatches.length} batch(es)` };
}


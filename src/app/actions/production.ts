"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getBatchTraceabilityAction } from "./traceability";
import { mapToEnterpriseReport } from "@/lib/reports/report-dtos";
import { requirePermission } from "@/lib/permissions.server";

// --- Schemas ---

const CreateBatchSchema = z.object({
    product_id: z.string().uuid(),
    production_line_id: z.string().uuid(),
    code: z.string().min(3),
    planned_quantity: z.coerce.number().optional(),
    plant_id: z.string().uuid(),
    start_date: z.string().optional(),
});

const UpdateBatchStatusSchema = z.object({
    batch_id: z.string().uuid(),
    status: z.enum(["planned", "open", "in_progress", "completed", "closed", "blocked", "released", "rejected"]),
});

const CreateIntermediateSchema = z.object({
    production_batch_id: z.string().uuid(),
    code: z.string().min(1), // Tank Name/Code for display
    equipment_id: z.string().uuid(), // FK to equipments
    volume: z.coerce.number().optional(),
    unit: z.string().default("L"),
});

const LinkIngredientSchema = z.object({
    intermediate_product_id: z.string().uuid(),
    raw_material_lot_id: z.string().uuid().optional(),
    raw_material_lot_code: z.string().min(1),
    quantity: z.coerce.number().positive(),
    unit: z.string().min(1),
});

/**
 * Create Golden Batch from Form (used by CreateBatchDialog)
 */
export async function createGoldenBatchFromFormAction(formData: FormData): Promise<void> {
    const user = await requirePermission('production', 'write');
    const supabase = await createClient();

    const rawData = {
        product_id: formData.get("product_id"),
        production_line_id: formData.get("production_line_id"),
        code: formData.get("code") ?? `GB-${Date.now()}`,
        planned_quantity: formData.get("planned_quantity") || undefined,
        plant_id: formData.get("plant_id"),
        start_date: formData.get("start_date") || new Date().toISOString(),
    };

    console.log("SERVER ACTION: createGoldenBatchFromFormAction", rawData);

    const validation = CreateBatchSchema.safeParse(rawData);
    if (!validation.success) {
        console.error("VALIDATION ERROR:", validation.error.issues);
        throw new Error(validation.error.issues[0]?.message ?? "Invalid data");
    }

    // Security Check: Get Plant's Organization
    const { data: plant } = await supabase
        .from("plants")
        .select("organization_id")
        .eq("id", validation.data.plant_id)
        .single();

    if (!plant) {
        throw new Error("Invalid Plant ID");
    }

    // Verify User belongs to this Org (Optional but Good Practice)
    // For now, we trust the RLS policies which limit INSERTs to user's org.
    // However, explicitly setting organization_id guarantees we don't accidentally insert into null org if RLS was loose.

    const { error } = await supabase.from("production_batches").insert({
        organization_id: plant.organization_id, // CRITICAL: Must match Plant's Org
        plant_id: validation.data.plant_id,
        product_id: validation.data.product_id,
        production_line_id: validation.data.production_line_id,
        code: validation.data.code,
        planned_quantity: validation.data.planned_quantity,
        status: "planned", // EPIC 1.1: Default status is PLANNED
        start_date: validation.data.start_date,
    });

    if (error) {
        console.error("DB INSERT ERROR:", error);
        throw new Error(error.message);
    }

    revalidatePath("/production");
}

/**
 * Create Intermediate Product (Tank/Silo Mapping)
 */
export async function createIntermediateProductAction(formData: FormData) {
    const user = await requirePermission('production', 'write');
    const supabase = await createClient();

    const rawData = {
        production_batch_id: formData.get("production_batch_id"),
        code: formData.get("code"),
        equipment_id: formData.get("equipment_id"),
        volume: formData.get("volume"),
        unit: formData.get("unit") || "L",
    };

    const validation = CreateIntermediateSchema.safeParse(rawData);
    if (!validation.success) {
        return { success: false, message: validation.error.issues[0].message };
    }

    // Check if equipment is currently occupied
    const { data: occupied } = await supabase
        .from("intermediate_products")
        .select("id, status, code")
        .eq("equipment_id", validation.data.equipment_id)
        .neq("status", "consumed")
        .maybeSingle();

    if (occupied) {
        return {
            success: false,
            message: `Equipment ${occupied.code} is currently occupied (Status: ${occupied.status}). Must be finalized/consumed before reuse.`
        };
    }

    // Get batch to inherit org/plant
    const { data: batch } = await supabase
        .from("production_batches")
        .select("organization_id, plant_id")
        .eq("id", validation.data.production_batch_id)
        .single();

    if (!batch) return { success: false, message: "Batch not found" };

    const { error } = await supabase.from("intermediate_products").insert({
        organization_id: batch.organization_id,
        plant_id: batch.plant_id,
        production_batch_id: validation.data.production_batch_id,
        code: validation.data.code, // Keep for display/backup
        equipment_id: validation.data.equipment_id,
        volume: validation.data.volume || null,
        unit: validation.data.unit,
        status: "pending",
        start_date: new Date().toISOString(),
        approval_status: "pending"
    });

    if (error) return { success: false, message: error.message };

    revalidatePath("/production");
    return { success: true, message: "Tank/Intermediate Created" };
}

/**
 * Link Raw Material (Ingredient) to Intermediate Product
 * Also debits quantity from the source lot
 */
export async function linkIngredientAction(formData: FormData) {
    const user = await requirePermission('production', 'write');
    const supabase = await createClient();

    const rawData = {
        intermediate_product_id: formData.get("intermediate_product_id"),
        raw_material_lot_id: formData.get("raw_material_lot_id") || undefined,
        raw_material_lot_code: formData.get("raw_material_lot_code"),
        quantity: formData.get("quantity"),
        unit: formData.get("unit"),
    };

    const validation = LinkIngredientSchema.safeParse(rawData);
    if (!validation.success) {
        return { success: false, message: validation.error.issues[0].message };
    }

    // Get intermediate to inherit org/plant
    const { data: intermediate } = await supabase
        .from("intermediate_products")
        .select("organization_id, plant_id")
        .eq("id", validation.data.intermediate_product_id)
        .single();

    if (!intermediate) return { success: false, message: "Intermediate product not found" };

    // If lot ID provided, verify sufficient quantity
    if (validation.data.raw_material_lot_id) {
        const { data: lot } = await supabase
            .from("raw_material_lots")
            .select("quantity_remaining, unit")
            .eq("id", validation.data.raw_material_lot_id)
            .single();

        if (!lot) return { success: false, message: "Lot not found" };

        if (lot.quantity_remaining < validation.data.quantity) {
            return {
                success: false,
                message: `Insufficient quantity. Available: ${lot.quantity_remaining} ${lot.unit}`
            };
        }
    }

    // Insert the ingredient link
    const { error } = await supabase.from("intermediate_ingredients").insert({
        organization_id: intermediate.organization_id,
        plant_id: intermediate.plant_id,
        intermediate_product_id: validation.data.intermediate_product_id,
        raw_material_lot_id: validation.data.raw_material_lot_id || null,
        raw_material_lot_code: validation.data.raw_material_lot_code,
        quantity: validation.data.quantity,
        unit: validation.data.unit,
    });

    if (error) return { success: false, message: error.message };

    // Debit quantity from the source lot
    if (validation.data.raw_material_lot_id) {
        // Fetch current quantity and update with new value
        const { data: currentLot } = await supabase
            .from("raw_material_lots")
            .select("quantity_remaining")
            .eq("id", validation.data.raw_material_lot_id)
            .single();

        if (currentLot) {
            const newQuantity = currentLot.quantity_remaining - validation.data.quantity;
            await supabase
                .from("raw_material_lots")
                .update({ quantity_remaining: newQuantity })
                .eq("id", validation.data.raw_material_lot_id);
        }
    }

    revalidatePath("/production");
    revalidatePath("/raw-materials");
    return { success: true, message: "Ingredient Linked & Lot Updated" };
}

/**
 * Update Intermediate Product Status (Approve/Reject)
 */
export async function updateIntermediateStatusAction(formData: FormData) {
    const user = await requirePermission('production', 'write');
    const supabase = await createClient();

    const { data: profile } = await supabase
        .from("user_profiles")
        .select("organization_id, plant_id")
        .eq("id", user.id)
        .single();

    if (!profile) return { success: false, message: "Profile not found" };

    const intermediate_id = formData.get("intermediate_id") as string;
    const status = formData.get("status") as string;

    if (!intermediate_id || !["pending", "approved", "rejected", "in_use", "consumed"].includes(status)) {
        return { success: false, message: "Invalid data" };
    }

    const updateData: any = { status };
    if (status === "consumed") {
        updateData.end_date = new Date().toISOString();
    }

    const { error } = await supabase
        .from("intermediate_products")
        .update(updateData)
        .eq("id", intermediate_id)
        .eq("organization_id", profile.organization_id)
        .eq("plant_id", profile.plant_id);

    if (error) return { success: false, message: error.message };

    revalidatePath("/production");
    return { success: true, message: `Intermediate ${status}` };
}

/**
 * Approve Intermediate Product (QA Manager)
 */
export async function approveIntermediateAction(formData: FormData) {
    const user = await requirePermission('production', 'write');
    const supabase = await createClient();

    const intermediate_id = formData.get("intermediate_id") as string;

    const { data: profile } = await supabase.from('user_profiles').select('role, organization_id, plant_id').eq('id', user.id).single();
    if (profile?.role !== 'admin' && profile?.role !== 'manager') {
        return { success: false, message: "Only QA Managers can approve intermediates." };
    }

    const { error } = await supabase
        .from("intermediate_products")
        .update({
            approval_status: "approved",
            status: "in_use"
        })
        .eq("id", intermediate_id)
        .eq("organization_id", profile.organization_id)
        .eq("plant_id", profile.plant_id);

    if (error) return { success: false, message: error.message };

    revalidatePath("/production");
    return { success: true, message: "Intermediate Product Approved" };
}

/**
 * Finalize Production Batch (Move from In Progress to Completed)
 * Used by technicians when physical production is done.
 */
export async function finalizeBatchAction(batch_id: string) {
    const user = await requirePermission('production', 'write');
    const supabase = await createClient();

    const { data: profile } = await supabase
        .from("user_profiles")
        .select("organization_id, plant_id")
        .eq("id", user.id)
        .single();

    if (!profile) return { success: false, message: "Profile not found" };

    const { error } = await supabase
        .from("production_batches")
        .update({ status: "completed" })
        .eq("id", batch_id)
        .eq("organization_id", profile.organization_id)
        .eq("plant_id", profile.plant_id);

    if (error) return { success: false, message: error.message };

    revalidatePath("/production");
    revalidatePath(`/production/${batch_id}`);
    return { success: true, message: "Produção finalizada. Aguardando revisão do Manager." };
}

/**
 * Release Production Batch (QA Review)
 */
export async function releaseBatchAction(formData: FormData) {
    const user = await requirePermission('production', 'write');
    const supabase = await createClient();

    const batch_id = formData.get("batch_id") as string;
    const action = formData.get("action") as "release" | "reject";

    const { data: profile } = await supabase
        .from("user_profiles")
        .select("organization_id, plant_id, role")
        .eq("id", user.id)
        .single();

    if (!profile) return { success: false, message: "Profile not found" };

    // Security: Only managers/admins can release/reject
    if (!["admin", "system_owner", "manager", "qa_manager"].includes(profile.role)) {
        return { success: false, message: "Apenas Managers ou Admins podem liberar ou rejeitar lotes." };
    }

    // 1. Fetch all intermediate products
    const { data: intermediates } = await supabase
        .from('intermediate_products')
        .select('id, code, approval_status')
        .eq('production_batch_id', batch_id);

    // 2. Validate Intermediates (only for release)
    if (action === "release") {
        const unapproved = intermediates?.filter(i => i.approval_status !== 'approved');
        if (unapproved && unapproved.length > 0) {
            return {
                success: false,
                message: `Não é possível liberar: Produtos intermédios [${unapproved.map(u => u.code).join(', ')}] não estão aprovados.`
            };
        }
    }

    // 3. Update the batch
    const status = action === "release" ? "released" : "rejected";
    const { error } = await supabase
        .from("production_batches")
        .update({
            status: status,
            end_date: new Date().toISOString(),
            qa_approved_by: user.id,
            qa_approved_at: new Date().toISOString()
        })
        .eq("id", batch_id)
        .eq("organization_id", profile.organization_id)
        .eq("plant_id", profile.plant_id);

    if (error) return { success: false, message: error.message };

    // 4. Create Compliance Snapshot (ISO/FSSC Rule)
    if (action === "release") {
        try {
            const traceabilityData = await getBatchTraceabilityAction(batch_id);
            if (traceabilityData.success && traceabilityData.data) {
                const enterpriseDTO = mapToEnterpriseReport(traceabilityData.data);

                await supabase.from("generated_reports").insert({
                    organization_id: profile.organization_id,
                    plant_id: profile.plant_id,
                    report_type: "FINAL",
                    entity_type: "batch",
                    entity_id: batch_id,
                    report_number: `BQR-${enterpriseDTO.header.batchCode}`,
                    title: "Production Batch Quality Report",
                    report_data: enterpriseDTO as any, // The JSONB Snapshot
                    generated_by: user.id,
                    status: "signed",
                    signed_by: user.id,
                    signed_at: new Date().toISOString()
                });
            }
        } catch (snapError) {
            console.error("SNAPSHOT ERROR (Non-blocking):", snapError);
        }
    }

    revalidatePath("/production");
    revalidatePath(`/production/${batch_id}`);
    return { success: true, message: `Lote ${action === "release" ? "Liberado" : "Rejeitado"} com sucesso.` };
}

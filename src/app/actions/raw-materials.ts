"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";

// --- Schemas ---

const CreateSupplierSchema = z.object({
    name: z.string().min(2),
    code: z.string().min(2),
    contact_name: z.string().optional(),
    contact_email: z.string().email().optional().or(z.literal("")),
    contact_phone: z.string().optional(),
    address: z.string().optional(),
    plant_id: z.string().uuid(),
});

const CreateRawMaterialSchema = z.object({
    name: z.string().min(2),
    code: z.string().min(2),
    description: z.string().optional(),
    category: z.string().optional(),
    unit: z.string().default("kg"),
    allergens: z.string().optional(), // comma-separated
    storage_conditions: z.string().optional(),
    plant_id: z.string().uuid(),
});

const ReceiveLotSchema = z.object({
    raw_material_id: z.string().uuid(),
    supplier_id: z.string().uuid().optional(),
    lot_code: z.string().min(1),
    quantity_received: z.coerce.number().positive(),
    unit: z.string().min(1),
    expiry_date: z.string().optional(),
    production_date: z.string().optional(),
    certificate_number: z.string().optional(),
    coa_file_url: z.string().url().optional().or(z.literal("")), // URL to uploaded COA file
    storage_location: z.string().optional(),
    notes: z.string().optional(),
    plant_id: z.string().uuid(),
});

const ApproveLotSchema = z.object({
    lot_id: z.string().uuid(),
    status: z.enum(["approved", "rejected"]),
    notes: z.string().optional(),
});

const ConsumeLotSchema = z.object({
    lot_id: z.string().uuid(),
    quantity: z.coerce.number().positive(),
});

// --- Actions ---

/**
 * Create a new Supplier
 */
export async function createSupplierAction(formData: FormData) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, message: "Unauthorized" };

    const { data: userData } = await supabase
        .from('user_profiles')
        .select('organization_id')
        .eq('id', user.id)
        .single();
    if (!userData) return { success: false, message: "Profile not found" };

    const rawData = {
        name: formData.get("name"),
        code: formData.get("code"),
        contact_name: formData.get("contact_name") || undefined,
        contact_email: formData.get("contact_email") || undefined,
        contact_phone: formData.get("contact_phone") || undefined,
        address: formData.get("address") || undefined,
        plant_id: formData.get("plant_id"),
    };

    const validation = CreateSupplierSchema.safeParse(rawData);
    if (!validation.success) {
        return { success: false, message: validation.error.issues[0].message };
    }

    const { error } = await supabase.from("suppliers").insert({
        organization_id: userData.organization_id,
        plant_id: validation.data.plant_id,
        name: validation.data.name,
        code: validation.data.code,
        contact_name: validation.data.contact_name || null,
        contact_email: validation.data.contact_email || null,
        contact_phone: validation.data.contact_phone || null,
        address: validation.data.address || null,
        status: "active",
    });

    if (error) return { success: false, message: error.message };

    revalidatePath("/materials/raw");
    revalidatePath("/materials/suppliers");
    return { success: true, message: "Fornecedor criado" };
}

/**
 * Create a Raw Material (catalog item)
 */
export async function createRawMaterialAction(formData: FormData) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, message: "Unauthorized" };

    const { data: userData } = await supabase
        .from('user_profiles')
        .select('organization_id')
        .eq('id', user.id)
        .single();
    if (!userData) return { success: false, message: "Profile not found" };

    const rawData = {
        name: formData.get("name"),
        code: formData.get("code"),
        description: formData.get("description") || undefined,
        category: formData.get("category") || undefined,
        unit: formData.get("unit") || "kg",
        allergens: formData.get("allergens") || undefined,
        storage_conditions: formData.get("storage_conditions") || undefined,
        plant_id: formData.get("plant_id"),
    };

    const validation = CreateRawMaterialSchema.safeParse(rawData);
    if (!validation.success) {
        return { success: false, message: validation.error.issues[0].message };
    }

    // Parse allergens from comma-separated string
    const allergens = validation.data.allergens
        ? validation.data.allergens.split(",").map(a => a.trim()).filter(Boolean)
        : null;

    const { error } = await supabase.from("raw_materials").insert({
        organization_id: userData.organization_id,
        plant_id: validation.data.plant_id,
        name: validation.data.name,
        code: validation.data.code,
        description: validation.data.description || null,
        category: validation.data.category || null,
        unit: validation.data.unit,
        allergens: allergens,
        storage_conditions: validation.data.storage_conditions || null,
        status: "active",
    });

    if (error) return { success: false, message: error.message };

    revalidatePath("/materials/raw");
    return { success: true, message: "Matéria-prima criada" };
}

/**
 * Receive a new Raw Material Lot
 */
export async function receiveLotAction(formData: FormData) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, message: "Unauthorized" };

    const { data: userData } = await supabase
        .from('user_profiles')
        .select('organization_id')
        .eq('id', user.id)
        .single();
    if (!userData) return { success: false, message: "Profile not found" };

    const rawData = {
        raw_material_id: formData.get("raw_material_id"),
        supplier_id: formData.get("supplier_id") || undefined,
        lot_code: formData.get("lot_code"),
        quantity_received: formData.get("quantity_received"),
        unit: formData.get("unit"),
        expiry_date: formData.get("expiry_date") || undefined,
        production_date: formData.get("production_date") || undefined,
        certificate_number: formData.get("certificate_number") || undefined,
        coa_file_url: formData.get("coa_file_url") || undefined,
        storage_location: formData.get("storage_location") || undefined,
        notes: formData.get("notes") || undefined,
        plant_id: formData.get("plant_id"),
    };

    const validation = ReceiveLotSchema.safeParse(rawData);
    if (!validation.success) {
        return { success: false, message: validation.error.issues[0].message };
    }

    const { error } = await supabase.from("raw_material_lots").insert({
        organization_id: userData.organization_id,
        plant_id: validation.data.plant_id,
        raw_material_id: validation.data.raw_material_id,
        supplier_id: validation.data.supplier_id || null,
        lot_code: validation.data.lot_code,
        quantity_received: validation.data.quantity_received,
        quantity_remaining: validation.data.quantity_received, // Start with full qty
        unit: validation.data.unit,
        expiry_date: validation.data.expiry_date || null,
        production_date: validation.data.production_date || null,
        certificate_number: validation.data.certificate_number || null,
        coa_file_url: validation.data.coa_file_url || null,
        storage_location: validation.data.storage_location || null,
        notes: validation.data.notes || null,
        status: "quarantine", // Starts in quarantine for QC
    });

    if (error) return { success: false, message: error.message };

    revalidatePath("/materials/raw");
    return { success: true, message: "Lote recebido - Em quarentena" };
}

/**
 * Approve or Reject a Lot after QC
 */
export async function approveLotAction(formData: FormData) {
    const supabase = await createClient();

    const rawData = {
        lot_id: formData.get("lot_id"),
        status: formData.get("status"),
        notes: formData.get("notes") || undefined,
    };

    const validation = ApproveLotSchema.safeParse(rawData);
    if (!validation.success) {
        return { success: false, message: validation.error.issues[0].message };
    }

    const { error } = await supabase
        .from("raw_material_lots")
        .update({
            status: validation.data.status,
            notes: validation.data.notes
        })
        .eq("id", validation.data.lot_id);

    if (error) return { success: false, message: error.message };

    revalidatePath("/materials/raw");
    return {
        success: true,
        message: validation.data.status === "approved"
            ? "Lote aprovado"
            : "Lote rejeitado"
    };
}

/**
 * Consume from a Lot (reduces quantity_remaining)
 */
export async function consumeLotAction(formData: FormData) {
    const supabase = await createClient();

    const rawData = {
        lot_id: formData.get("lot_id"),
        quantity: formData.get("quantity"),
    };

    const validation = ConsumeLotSchema.safeParse(rawData);
    if (!validation.success) {
        return { success: false, message: validation.error.issues[0].message };
    }

    // Get current lot
    const { data: lot, error: lotError } = await supabase
        .from("raw_material_lots")
        .select("quantity_remaining, status")
        .eq("id", validation.data.lot_id)
        .single();

    if (lotError) return { success: false, message: lotError.message };
    if (lot.status !== "approved") return { success: false, message: "Lot must be approved before use" };
    if (lot.quantity_remaining < validation.data.quantity) {
        return { success: false, message: "Insufficient quantity" };
    }

    const newRemaining = lot.quantity_remaining - validation.data.quantity;
    const newStatus = newRemaining <= 0 ? "exhausted" : "approved";

    const { error } = await supabase
        .from("raw_material_lots")
        .update({
            quantity_remaining: newRemaining,
            status: newStatus
        })
        .eq("id", validation.data.lot_id);

    if (error) return { success: false, message: error.message };

    revalidatePath("/materials/raw");
    return { success: true, message: "Consumo registado" };
}

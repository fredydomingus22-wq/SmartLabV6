import { createClient } from "@/lib/supabase/server";
import { getSafeUser } from "@/lib/auth";

/**
 * Get all suppliers
 */
export async function getSuppliers(options?: { status?: string }) {
    const supabase = await createClient();
    const user = await getSafeUser();

    let query = supabase
        .from("suppliers")
        .select("id, name, code, contact_name, contact_email, contact_phone, status")
        .eq("organization_id", user.organization_id)
        .order("name");

    if (options?.status) {
        query = query.eq("status", options.status);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data;
}

/**
 * Get all raw materials (catalog)
 */
export async function getRawMaterials(options?: { status?: string; category?: string }) {
    const supabase = await createClient();
    const user = await getSafeUser();

    let query = supabase
        .from("raw_materials")
        .select("id, name, code, description, category, unit, allergens, storage_conditions, status")
        .eq("organization_id", user.organization_id)
        .order("name");

    if (options?.status) {
        query = query.eq("status", options.status);
    }

    if (options?.category) {
        query = query.eq("category", options.category);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data;
}

/**
 * Get raw material lots with details
 */
export async function getLots(options?: {
    status?: string;
    materialId?: string;
    limit?: number;
}) {
    const supabase = await createClient();
    const user = await getSafeUser();

    let query = supabase
        .from("raw_material_lots")
        .select(`
            id,
            lot_code,
            quantity_received,
            quantity_remaining,
            unit,
            received_date,
            expiry_date,
            status,
            storage_location,
            certificate_number,
            notes,
            raw_material:raw_materials(id, name, code),
            supplier:suppliers(id, name, code)
        `)
        .eq("organization_id", user.organization_id)
        .order("received_date", { ascending: false });

    if (options?.status) {
        query = query.eq("status", options.status);
    }

    if (options?.materialId) {
        query = query.eq("raw_material_id", options.materialId);
    }

    if (options?.limit) {
        query = query.limit(options.limit);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data;
}

/**
 * Get a single lot with full details
 */
export async function getLotDetails(lotId: string) {
    const supabase = await createClient();
    const user = await getSafeUser();

    const { data: lot, error: lotError } = await supabase
        .from("raw_material_lots")
        .select(`
            *,
            raw_material:raw_materials(id, name, code, category, allergens),
            supplier:suppliers(id, name, code, contact_name)
        `)
        .eq("organization_id", user.organization_id)
        .eq("id", lotId)
        .single();

    if (lotError) throw lotError;

    // Get quality checks for this lot
    const { data: checks, error: checksError } = await supabase
        .from("raw_material_checks")
        .select(`
            id,
            check_name,
            expected_value,
            actual_value,
            is_pass,
            checked_at,
            notes,
            parameter:qa_parameters(name, unit)
        `)
        .eq("organization_id", user.organization_id)
        .eq("raw_material_lot_id", lotId)
        .order("checked_at");

    if (checksError) throw checksError;

    return { lot, checks };
}

/**
 * Get lots expiring soon
 */
export async function getExpiringLots(days: number = 30) {
    const supabase = await createClient();
    const user = await getSafeUser();

    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);

    const { data, error } = await supabase
        .from("raw_material_lots")
        .select(`
            id,
            lot_code,
            quantity_remaining,
            unit,
            expiry_date,
            raw_material:raw_materials(name, code)
        `)
        .eq("organization_id", user.organization_id)
        .lte("expiry_date", futureDate.toISOString())
        .gt("quantity_remaining", 0)
        .in("status", ["approved"])
        .order("expiry_date");

    if (error) throw error;
    return data;
}

/**
 * Get low stock materials
 */
export async function getLowStockMaterials(minQuantity: number = 100) {
    const supabase = await createClient();
    const user = await getSafeUser();

    // Get total remaining by material
    const { data: lots, error } = await supabase
        .from("raw_material_lots")
        .select(`
            raw_material_id,
            quantity_remaining,
            raw_material:raw_materials(name, code, unit)
        `)
        .eq("organization_id", user.organization_id)
        .eq("status", "approved");

    if (error) throw error;

    // Aggregate by material
    const materialStock = new Map<string, { name: string; code: string; unit: string; total: number }>();

    lots?.forEach(lot => {
        const materialId = lot.raw_material_id;
        const material = Array.isArray(lot.raw_material) ? lot.raw_material[0] : lot.raw_material;

        if (!materialStock.has(materialId)) {
            materialStock.set(materialId, {
                name: material?.name || "Unknown",
                code: material?.code || "",
                unit: material?.unit || "",
                total: 0
            });
        }

        const current = materialStock.get(materialId)!;
        current.total += Number(lot.quantity_remaining) || 0;
    });

    // Filter low stock
    return Array.from(materialStock.entries())
        .filter(([_, data]) => data.total < minQuantity)
        .map(([id, data]) => ({ id, ...data }));
}

/**
 * Get raw materials statistics
 */
export async function getRawMaterialStats() {
    const supabase = await createClient();
    const user = await getSafeUser();

    const { data: lots, error } = await supabase
        .from("raw_material_lots")
        .select("id, status, expiry_date")
        .eq("organization_id", user.organization_id);

    if (error) throw error;

    const today = new Date();
    const thirtyDays = new Date();
    thirtyDays.setDate(thirtyDays.getDate() + 30);

    const stats = {
        totalLots: lots?.length || 0,
        inQuarantine: lots?.filter(l => l.status === "quarantine").length || 0,
        approved: lots?.filter(l => l.status === "approved").length || 0,
        rejected: lots?.filter(l => l.status === "rejected").length || 0,
        expiringSoon: lots?.filter(l =>
            l.status === "approved" &&
            l.expiry_date &&
            new Date(l.expiry_date) <= thirtyDays
        ).length || 0,
    };

    return stats;
}

/**
 * Search lots by code (for traceability)
 */
export async function searchLotsByCode(searchTerm: string) {
    const supabase = await createClient();
    const user = await getSafeUser();

    const { data, error } = await supabase
        .from("raw_material_lots")
        .select(`
            id,
            lot_code,
            status,
            received_date,
            raw_material:raw_materials(name, code),
            supplier:suppliers(name)
        `)
        .eq("organization_id", user.organization_id)
        .ilike("lot_code", `%${searchTerm}%`)
        .limit(20);

    if (error) throw error;
    return data;
}

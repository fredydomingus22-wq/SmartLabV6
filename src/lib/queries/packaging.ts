import { createClient } from "@/lib/supabase/server";
import { getSafeUser } from "@/lib/auth";

/**
 * Get all packaging materials
 */
export async function getPackagingMaterials() {
    const supabase = await createClient();
    const user = await getSafeUser();

    // Fetch materials for Org (and optionally Plant if defined)
    // The policy usually handles (org_id = my_org) AND (plant_id IS NULL OR plant_id = my_plant)
    const { data, error } = await supabase
        .from("packaging_materials")
        .select("id, name, code, description, min_stock_level")
        .eq("organization_id", user.organization_id)
        .order("name");

    if (error) throw error;
    return data;
}

/**
 * Get packaging lots with details
 */
export async function getPackagingLots(options?: {
    status?: string;
    materialId?: string;
    limit?: number;
}) {
    const supabase = await createClient();
    const user = await getSafeUser();

    let query = supabase
        .from("packaging_lots")
        .select(`
            id,
            lot_code,
            quantity,
            remaining_quantity,
            received_at,
            expiry_date,
            status,
            packaging_material:packaging_materials(id, name, code)
        `)
        .eq("organization_id", user.organization_id)
        .order("received_at", { ascending: false });

    if (options?.status) {
        query = query.eq("status", options.status);
    }

    if (options?.materialId) {
        query = query.eq("packaging_material_id", options.materialId);
    }

    if (options?.limit) {
        query = query.limit(options.limit);
    }

    const { data: rawData, error } = await query;

    if (error) throw error;

    return rawData?.map(item => ({
        ...item,
        packaging_material: Array.isArray(item.packaging_material)
            ? item.packaging_material[0]
            : item.packaging_material
    }));
}

/**
 * Get a single packaging lot with full details
 */
export async function getPackagingLotDetails(lotId: string) {
    const supabase = await createClient();
    const user = await getSafeUser();

    const { data: lot, error } = await supabase
        .from("packaging_lots")
        .select(`
            *,
            packaging_material:packaging_materials(id, name, code, description)
        `)
        .eq("organization_id", user.organization_id)
        .eq("id", lotId)
        .single();

    if (error) throw error;
    return lot;
}

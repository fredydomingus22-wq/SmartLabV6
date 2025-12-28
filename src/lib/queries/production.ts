import { createClient } from "@/lib/supabase/server";
import { getSafeUser } from "@/lib/auth.server";

/**
 * Get all production batches with metadata
 */
export async function getBatches(options?: {
    status?: string;
    limit?: number;
}) {
    const supabase = await createClient();
    const user = await getSafeUser();

    let query = supabase
        .from("production_batches")
        .select(`
            id,
            code,
            status,
            planned_quantity,
            actual_quantity,
            start_date,
            end_date,
            created_at,
            product:products(id, name, sku),
            line:production_lines(id, name, code)
        `)
        .eq("organization_id", user.organization_id)
        .order("created_at", { ascending: false });

    if (options?.status) {
        query = query.eq("status", options.status);
    }

    if (options?.limit) {
        query = query.limit(options.limit);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data;
}

/**
 * Get a single batch with full genealogy
 */
export async function getBatchGenealogy(batchId: string) {
    const supabase = await createClient();
    const user = await getSafeUser();

    // Fetch batch with intermediates and ingredients
    const { data: batch, error: batchError } = await supabase
        .from("production_batches")
        .select(`
            id,
            code,
            status,
            planned_quantity,
            actual_quantity,
            start_date,
            end_date,
            product:products(id, name, sku),
            line:production_lines(id, name)
        `)
        .eq("organization_id", user.organization_id)
        .eq("id", batchId)
        .single();

    if (batchError) throw batchError;

    // Fetch intermediate products
    const { data: intermediates, error: intError } = await supabase
        .from("intermediate_products")
        .select(`
            id,
            code,
            status,
            volume,
            unit,
            created_at
        `)
        .eq("organization_id", user.organization_id)
        .eq("production_batch_id", batchId)
        .order("created_at");

    if (intError) throw intError;

    // Fetch ingredients for all intermediates
    const intermediateIds = intermediates?.map(i => i.id) || [];

    let ingredients: any[] = [];
    if (intermediateIds.length > 0) {
        const { data: ingData, error: ingError } = await supabase
            .from("intermediate_ingredients")
            .select(`
                id,
                intermediate_product_id,
                raw_material_lot_code,
                quantity,
                unit,
                added_at
            `)
            .in("intermediate_product_id", intermediateIds);

        if (ingError) throw ingError;
        ingredients = ingData || [];
    }

    // Fetch samples linked to this batch
    const { data: samples, error: samplesError } = await supabase
        .from("samples")
        .select(`
            id,
            code,
            status,
            collected_at,
            sample_type:sample_types(name)
        `)
        .eq("organization_id", user.organization_id)
        .eq("production_batch_id", batchId);

    if (samplesError) throw samplesError;

    return {
        batch,
        intermediates: intermediates?.map(int => ({
            ...int,
            ingredients: ingredients.filter(ing => ing.intermediate_product_id === int.id)
        })),
        samples
    };
}

/**
 * Get intermediate products for a batch
 */
export async function getIntermediateProducts(batchId: string) {
    const supabase = await createClient();
    const user = await getSafeUser();

    const { data, error } = await supabase
        .from("intermediate_products")
        .select(`
            id,
            code,
            status,
            volume,
            unit,
            created_at,
            ingredients:intermediate_ingredients(
                id,
                raw_material_lot_code,
                quantity,
                unit
            )
        `)
        .eq("organization_id", user.organization_id)
        .eq("production_batch_id", batchId)
        .order("created_at");

    if (error) throw error;
    return data;
}

/**
 * Get batch statistics for dashboard
 */
export async function getBatchStats() {
    const supabase = await createClient();
    const user = await getSafeUser();

    const { data: allBatches, error } = await supabase
        .from("production_batches")
        .select("id, status")
        .eq("organization_id", user.organization_id);

    if (error) throw error;

    const stats = {
        total: allBatches?.length || 0,
        open: allBatches?.filter(b => b.status === "open").length || 0,
        closed: allBatches?.filter(b => b.status === "closed").length || 0,
        blocked: allBatches?.filter(b => b.status === "blocked").length || 0,
    };

    return stats;
}

/**
 * Get production lines for dropdowns
 */
export async function getProductionLines() {
    const supabase = await createClient();
    const user = await getSafeUser();

    const { data, error } = await supabase
        .from("production_lines")
        .select("id, name, code, status")
        .eq("organization_id", user.organization_id)
        .eq("status", "active")
        .order("name");

    if (error) throw error;
    return data;
}

/**
 * Get products for dropdowns
 */
export async function getProducts() {
    const supabase = await createClient();
    const user = await getSafeUser();

    const { data, error } = await supabase
        .from("products")
        .select("id, name, sku, status")
        .eq("organization_id", user.organization_id)
        .eq("status", "active")
        .order("name");

    if (error) throw error;
    return data;
}
/**
 * Get the latest CIP status for a piece of equipment
 * Returns { isClean: boolean, lastCipDate?: string, validationStatus?: string }
 */
export async function getEquipmentCIPStatus(equipmentId: string | UUID) {
    const supabase = await createClient();
    const user = await getSafeUser();

    const { data: latestCip, error } = await supabase
        .from("cip_executions")
        .select("id, status, validation_status, end_time")
        .eq("organization_id", user.organization_id)
        .eq("equipment_id", equipmentId.toString())
        .order("end_time", { ascending: false })
        .limit(1)
        .maybeSingle();

    if (error) {
        console.error("Error fetching CIP status:", error);
        return { isClean: false, error: error.message };
    }

    if (!latestCip) {
        return { isClean: false, message: "No CIP record found for this equipment" };
    }

    // Equipment is clean ONLY if completed and valid
    const isClean = latestCip.status === "completed" && latestCip.validation_status === "valid";

    return {
        isClean,
        lastCipDate: latestCip.end_time,
        validationStatus: latestCip.validation_status,
        status: latestCip.status
    };
}

import { UUID } from "crypto";


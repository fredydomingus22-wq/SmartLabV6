import { createClient } from "@/lib/supabase/server";
import { getSafeUser } from "@/lib/auth";

/**
 * Forward Trace: Get all production batches that used a specific raw material lot
 */
export async function getForwardTrace(lotId: string) {
    const supabase = await createClient();
    const user = await getSafeUser();

    // Find all intermediate products that used this lot as ingredient
    const { data: ingredients, error: ingError } = await supabase
        .from("intermediate_ingredients")
        .select(`
            id,
            quantity,
            unit,
            added_at,
            intermediate_product:intermediate_products(
                id,
                code,
                volume,
                unit,
                status,
                production_batch:production_batches(
                    id,
                    code,
                    status,
                    start_date,
                    product:products(id, name, sku)
                )
            )
        `)
        .eq("organization_id", user.organization_id)
        .eq("raw_material_lot_id", lotId);

    if (ingError) {
        console.error("Forward trace error:", ingError);
        return { batches: [], error: ingError.message };
    }

    // Flatten and deduplicate batches
    const batchMap = new Map<string, any>();

    for (const ing of ingredients || []) {
        const intermediate: any = Array.isArray(ing.intermediate_product)
            ? ing.intermediate_product[0]
            : ing.intermediate_product;

        if (!intermediate) continue;

        const batch: any = Array.isArray(intermediate.production_batch)
            ? intermediate.production_batch[0]
            : intermediate.production_batch;

        if (!batch) continue;

        if (!batchMap.has(batch.id)) {
            batchMap.set(batch.id, {
                ...batch,
                intermediates: [],
                totalQuantityUsed: 0,
            });
        }

        const batchEntry = batchMap.get(batch.id);
        batchEntry.intermediates.push({
            code: intermediate.code,
            quantityUsed: ing.quantity,
            unit: ing.unit,
        });
        batchEntry.totalQuantityUsed += ing.quantity;
    }

    return { batches: Array.from(batchMap.values()), error: null };
}

/**
 * Backward Trace: Get all raw materials and suppliers used in a production batch
 */
export async function getBackwardTrace(batchId: string) {
    const supabase = await createClient();
    const user = await getSafeUser();

    // Get batch details with intermediates and their ingredients
    const { data: batch, error: batchError } = await supabase
        .from("production_batches")
        .select(`
            id,
            code,
            status,
            start_date,
            end_date,
            product:products(id, name, sku),
            production_line:production_lines(id, name)
        `)
        .eq("organization_id", user.organization_id)
        .eq("id", batchId)
        .single();

    if (batchError || !batch) {
        return { batch: null, materials: [], error: batchError?.message || "Batch not found" };
    }

    // Get all intermediates for this batch
    const { data: intermediates } = await supabase
        .from("intermediate_products")
        .select(`
            id,
            code,
            volume,
            unit,
            status
        `)
        .eq("organization_id", user.organization_id)
        .eq("production_batch_id", batchId);

    // Get all ingredients for these intermediates
    const intermediateIds = (intermediates || []).map(i => i.id);

    const { data: ingredients } = await supabase
        .from("intermediate_ingredients")
        .select(`
            id,
            quantity,
            unit,
            added_at,
            intermediate_product_id,
            lot:raw_material_lots(
                id,
                lot_code,
                quantity_received,
                quantity_remaining,
                status,
                raw_material:raw_materials(id, name, code),
                supplier:suppliers(id, name, code)
            )
        `)
        .eq("organization_id", user.organization_id)
        .in("intermediate_product_id", intermediateIds);

    // Build materials tree
    const materialsMap = new Map<string, any>();

    for (const ing of ingredients || []) {
        const lot: any = Array.isArray(ing.lot) ? ing.lot[0] : ing.lot;
        if (!lot) continue;

        const material: any = Array.isArray(lot.raw_material) ? lot.raw_material[0] : lot.raw_material;
        const supplier: any = Array.isArray(lot.supplier) ? lot.supplier[0] : lot.supplier;

        if (!material) continue;

        const key = `${material.id}-${lot.id}`;
        if (!materialsMap.has(key)) {
            materialsMap.set(key, {
                material: material,
                lot: {
                    id: lot.id,
                    code: lot.lot_code,
                    status: lot.status,
                },
                supplier: supplier,
                usages: [],
                totalUsed: 0,
            });
        }

        const entry = materialsMap.get(key);
        const intermediate = (intermediates || []).find(i => i.id === ing.intermediate_product_id);
        entry.usages.push({
            intermediateCode: intermediate?.code || "Unknown",
            quantity: ing.quantity,
            unit: ing.unit,
            addedAt: ing.added_at,
        });
        entry.totalUsed += ing.quantity;
    }

    return {
        batch,
        intermediates: intermediates || [],
        materials: Array.from(materialsMap.values()),
        error: null
    };
}

/**
 * Search entities for traceability lookup
 */
export async function searchTraceableEntities(query: string, entityType: "lot" | "batch") {
    const supabase = await createClient();
    const user = await getSafeUser();

    if (entityType === "lot") {
        const { data } = await supabase
            .from("raw_material_lots")
            .select(`
                id,
                lot_code,
                status,
                raw_material:raw_materials(name)
            `)
            .eq("organization_id", user.organization_id)
            .ilike("lot_code", `%${query}%`)
            .limit(10);

        return (data || []).map(d => ({
            id: d.id,
            code: d.lot_code,
            name: Array.isArray(d.raw_material) ? (d.raw_material[0] as any)?.name : (d.raw_material as any)?.name,
            type: "lot" as const,
        }));
    } else {
        const { data } = await supabase
            .from("production_batches")
            .select(`
                id,
                code,
                status,
                product:products(name)
            `)
            .eq("organization_id", user.organization_id)
            .ilike("code", `%${query}%`)
            .limit(10);

        return (data || []).map(d => ({
            id: d.id,
            code: d.code,
            name: Array.isArray(d.product) ? (d.product[0] as any)?.name : (d.product as any)?.name,
            type: "batch" as const,
        }));
    }
}

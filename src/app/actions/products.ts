"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";

// Helper to convert empty strings to undefined
const emptyToUndefined = (val: FormDataEntryValue | null) => {
    if (val === null || val === "") return undefined;
    return val;
};

// Validation schema
const ProductSchema = z.object({
    name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
    sku: z.string().min(1, "SKU é obrigatório").toUpperCase(),
    description: z.string().optional(),
    category: z.enum(["final", "intermediate", "raw_material"]).default("final"),
    unit: z.string().default("unit"),
    status: z.enum(["active", "inactive"]).default("active"),
    shelf_life_days: z.coerce.number().int().positive().optional(),
    storage_conditions: z.string().optional(),
    parent_id: z.string().uuid().optional().nullable(),
    bev_category: z.string().optional().nullable(),
});

/**
 * Create a new Product
 */
export async function createProductAction(formData: FormData) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, message: "Unauthorized" };

    // Get user's org and plant from profile
    const { data: profile } = await supabase
        .from("user_profiles")
        .select("organization_id, plant_id")
        .eq("id", user.id)
        .single();

    if (!profile) return { success: false, message: "Profile not found" };

    const rawData = {
        name: formData.get("name"),
        sku: formData.get("sku"),
        description: emptyToUndefined(formData.get("description")),
        category: emptyToUndefined(formData.get("category")) || "final",
        unit: emptyToUndefined(formData.get("unit")) || "unit",
        status: emptyToUndefined(formData.get("status")) || "active",
        shelf_life_days: emptyToUndefined(formData.get("shelf_life_days")),
        storage_conditions: emptyToUndefined(formData.get("storage_conditions")),
        parent_id: emptyToUndefined(formData.get("parent_id")),
        bev_category: emptyToUndefined(formData.get("bev_category")),
    };

    const validation = ProductSchema.safeParse(rawData);
    if (!validation.success) {
        return { success: false, message: validation.error.issues[0].message };
    }

    // Check for duplicate SKU
    const { data: existing } = await supabase
        .from("products")
        .select("id")
        .eq("sku", validation.data.sku)
        .eq("organization_id", profile.organization_id)
        .maybeSingle();

    if (existing) {
        return { success: false, message: `Produto com SKU ${validation.data.sku} já existe` };
    }

    const { error } = await supabase.from("products").insert({
        organization_id: profile.organization_id,
        plant_id: profile.plant_id,
        ...validation.data,
    });

    if (error) return { success: false, message: error.message };

    revalidatePath("/quality/products");
    return { success: true, message: "Produto criado com sucesso" };
}

/**
 * Update an existing Product with versioning
 */
export async function updateProductAction(formData: FormData) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, message: "Unauthorized" };

    const id = formData.get("id") as string;
    if (!id) return { success: false, message: "Product ID required" };

    // Get current product data for history
    const { data: currentProduct, error: fetchError } = await supabase
        .from("products")
        .select("*")
        .eq("id", id)
        .single();

    if (fetchError || !currentProduct) {
        return { success: false, message: "Product not found" };
    }

    const rawData = {
        name: formData.get("name"),
        sku: formData.get("sku"),
        description: emptyToUndefined(formData.get("description")),
        category: emptyToUndefined(formData.get("category")) || "final",
        unit: emptyToUndefined(formData.get("unit")) || "unit",
        status: emptyToUndefined(formData.get("status")) || "active",
        shelf_life_days: emptyToUndefined(formData.get("shelf_life_days")),
        storage_conditions: emptyToUndefined(formData.get("storage_conditions")),
        parent_id: emptyToUndefined(formData.get("parent_id")),
        bev_category: emptyToUndefined(formData.get("bev_category")),
    };

    const validation = ProductSchema.safeParse(rawData);
    if (!validation.success) {
        return { success: false, message: validation.error.issues[0].message };
    }

    // Save current version to history before updating
    const { error: historyError } = await supabase
        .from("product_history")
        .insert({
            organization_id: currentProduct.organization_id,
            plant_id: currentProduct.plant_id,
            product_id: id,
            version: currentProduct.version || 1,
            name: currentProduct.name,
            sku: currentProduct.sku,
            description: currentProduct.description,
            category: currentProduct.category,
            unit: currentProduct.unit,
            shelf_life_days: currentProduct.shelf_life_days,
            storage_conditions: currentProduct.storage_conditions,
            parent_id: currentProduct.parent_id,
            status: currentProduct.status,
            effective_date: currentProduct.created_at?.split('T')[0],
            superseded_at: new Date().toISOString(),
            changed_by: user.id,
            bev_category: currentProduct.bev_category,
        });

    if (historyError) {
        console.error("Failed to save product history:", historyError);
    }

    // Update product with new version
    const newVersion = (currentProduct.version || 1) + 1;
    const { error } = await supabase
        .from("products")
        .update({
            ...validation.data,
            version: newVersion,
            updated_at: new Date().toISOString(),
        })
        .eq("id", id);

    if (error) return { success: false, message: error.message };

    revalidatePath("/quality/products");
    revalidatePath(`/quality/products/${id}`);
    return { success: true, message: `Produto atualizado (v${newVersion})` };
}

/**
 * Delete (deactivate) a Product
 */
export async function deleteProductAction(formData: FormData) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, message: "Unauthorized" };

    const id = formData.get("id") as string;
    if (!id) return { success: false, message: "Product ID required" };

    // Soft delete - set status to inactive
    const { error } = await supabase
        .from("products")
        .update({ status: "inactive", updated_at: new Date().toISOString() })
        .eq("id", id);

    if (error) return { success: false, message: error.message };

    revalidatePath("/quality/products");
    return { success: true, message: "Produto desativado" };
}

/**
 * Bulk import products from CSV data
 */
export async function bulkImportProductsAction(products: Array<{
    name: string;
    sku: string;
    description?: string;
    category?: string;
    unit?: string;
}>) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, message: "Unauthorized", imported: 0, errors: [] };

    const { data: profile } = await supabase
        .from("user_profiles")
        .select("organization_id, plant_id")
        .eq("id", user.id)
        .single();

    if (!profile) return { success: false, message: "Profile not found", imported: 0, errors: [] };

    const errors: string[] = [];
    let imported = 0;

    for (const product of products) {
        const validation = ProductSchema.safeParse(product);
        if (!validation.success) {
            errors.push(`${product.sku}: ${validation.error.issues[0].message}`);
            continue;
        }

        // Check for duplicate
        const { data: existing } = await supabase
            .from("products")
            .select("id")
            .eq("sku", validation.data.sku)
            .eq("organization_id", profile.organization_id)
            .maybeSingle();

        if (existing) {
            errors.push(`${product.sku}: Já existe`);
            continue;
        }

        const { error } = await supabase.from("products").insert({
            organization_id: profile.organization_id,
            plant_id: profile.plant_id,
            ...validation.data,
        });

        if (error) {
            errors.push(`${product.sku}: ${error.message}`);
        } else {
            imported++;
        }
    }

    revalidatePath("/quality/products");
    return {
        success: errors.length === 0,
        message: `Importados ${imported} produtos${errors.length > 0 ? `, ${errors.length} erros` : ''}`,
        imported,
        errors,
    };
}

/**
 * Get all products for the current tenant
 */
export async function getProductsAction() {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from("products")
        .select(`
            *,
            parent:products!parent_id(name, sku)
        `)
        .order("name");

    if (error) return { success: false, message: error.message, data: [] };
    return { success: true, data };
}

/**
 * Get product version history
 */
export async function getProductHistoryAction(productId: string) {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from("product_history")
        .select(`
            *,
            changed_by_user:changed_by(email)
        `)
        .eq("product_id", productId)
        .order("version", { ascending: false });

    if (error) return { success: false, message: error.message, data: [] };
    return { success: true, data };
}


"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function addBOMItemAction(formData: FormData) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, message: "Unauthorized" };

    const parent_product_id = formData.get("parent_product_id") as string;
    const component_product_id = formData.get("component_product_id") as string || null;
    const component_raw_material_id = formData.get("component_raw_material_id") as string || null;
    const quantity = parseFloat(formData.get("quantity") as string);
    const unit = formData.get("unit") as string;

    if (!parent_product_id || (!component_product_id && !component_raw_material_id)) {
        return { success: false, message: "Campos obrigatórios em falta" };
    }

    const { data: profile } = await supabase
        .from("user_profiles")
        .select("organization_id, plant_id")
        .eq("id", user.id)
        .single();

    if (!profile) return { success: false, message: "Profile not found" };

    const { error } = await supabase.from("product_bom").insert({
        organization_id: profile.organization_id,
        plant_id: profile.plant_id,
        parent_product_id,
        component_product_id,
        component_raw_material_id,
        quantity,
        unit,
        updated_at: new Date().toISOString()
    });

    if (error) {
        if (error.code === '23505') return { success: false, message: "Componente já existe na ficha técnica" };
        return { success: false, message: error.message };
    }

    revalidatePath(`/quality/products/${parent_product_id}`);
    return { success: true, message: "Componente adicionado à ficha técnica" };
}

export async function removeBOMItemAction(formData: FormData) {
    const supabase = await createClient();
    const id = formData.get("id") as string;
    const productId = formData.get("product_id") as string;

    if (!id) return { success: false, message: "ID do item necessário" };

    const { error } = await supabase
        .from("product_bom")
        .delete()
        .eq("id", id);

    if (error) return { success: false, message: error.message };

    revalidatePath(`/quality/products/${productId}`);
    return { success: true, message: "Componente removido da ficha técnica" };
}

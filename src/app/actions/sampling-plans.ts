"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { getSafeUser } from "@/lib/auth.server";
import { z } from "zod";

const SamplingPlanSchema = z.object({
    name: z.string().min(1, "Nome é obrigatório"),
    description: z.string().optional(),
    product_id: z.string().uuid("Produto inválido"),
    sample_type_id: z.string().uuid("Tipo de amostra inválido"),
    trigger_type: z.enum(["time_based", "event_based", "manual"]),
    event_anchor: z.enum(["batch_start", "batch_end", "shift_change", "process_step"]).optional(),
    frequency_minutes: z.coerce.number().optional(),
    trigger_on_start: z.boolean().default(false),
    is_active: z.boolean().default(true),
    process_context: z.string().optional(),
    parameter_ids: z.array(z.string().uuid()).optional(),
});

export async function getProductParametersAction(productId: string) {
    const supabase = await createClient();

    const { data: specs, error } = await supabase
        .from("product_specifications")
        .select(`
            qa_parameter:qa_parameters(id, name, code)
        `)
        .eq("product_id", productId);

    if (error) return { success: false, message: error.message, data: [] };

    // Extract unique parameters
    const params = specs.map(s => s.qa_parameter).filter(Boolean);
    return { success: true, data: params };
}

export async function getSamplingPlansAction() {
    const user = await getSafeUser();
    const supabase = await createClient();

    const { data, error } = await supabase
        .from("production_sampling_plans")
        .select(`
            *,
            product:products(id, name, sku),
            sample_type:sample_types(id, name, code)
        `)
        .eq("organization_id", user.organization_id)
        .order("created_at", { ascending: false });

    if (error) return { success: false, message: error.message, data: [] };
    return { success: true, data: data || [] };
}

export async function createSamplingPlanAction(formData: FormData) {
    const user = await getSafeUser();
    const supabase = await createClient();

    const rawData = {
        name: formData.get("name") as string,
        description: formData.get("description") as string || undefined,
        product_id: formData.get("product_id") as string,
        sample_type_id: formData.get("sample_type_id") as string,
        trigger_type: formData.get("trigger_type") as string,
        event_anchor: formData.get("event_anchor") as string || undefined,
        frequency_minutes: formData.get("frequency_minutes") ? Number(formData.get("frequency_minutes")) : undefined,
        trigger_on_start: formData.get("trigger_on_start") === "true",
        is_active: formData.get("is_active") !== "false",
        process_context: formData.get("process_context") as string || undefined,
        parameter_ids: formData.get("parameter_ids") ? JSON.parse(formData.get("parameter_ids") as string) : undefined,
    };

    const validation = SamplingPlanSchema.safeParse(rawData);
    if (!validation.success) {
        return { success: false, message: validation.error.issues[0].message };
    }

    const { data, error } = await supabase
        .from("production_sampling_plans")
        .insert({
            ...validation.data,
            organization_id: user.organization_id,
            plant_id: user.plant_id,
        })
        .select()
        .single();

    if (error) return { success: false, message: error.message };

    revalidatePath("/production/sampling-plans");
    return { success: true, message: "Plano de amostragem criado", data };
}

export async function updateSamplingPlanAction(id: string, formData: FormData) {
    const user = await getSafeUser();
    const supabase = await createClient();

    const rawData = {
        name: formData.get("name") as string,
        description: formData.get("description") as string || undefined,
        product_id: formData.get("product_id") as string,
        sample_type_id: formData.get("sample_type_id") as string,
        trigger_type: formData.get("trigger_type") as string,
        event_anchor: formData.get("event_anchor") as string || undefined,
        frequency_minutes: formData.get("frequency_minutes") ? Number(formData.get("frequency_minutes")) : undefined,
        trigger_on_start: formData.get("trigger_on_start") === "true",
        is_active: formData.get("is_active") !== "false",
        process_context: formData.get("process_context") as string || undefined,
        parameter_ids: formData.get("parameter_ids") ? JSON.parse(formData.get("parameter_ids") as string) : undefined,
    };

    const validation = SamplingPlanSchema.safeParse(rawData);
    if (!validation.success) {
        return { success: false, message: validation.error.issues[0].message };
    }

    const { error } = await supabase
        .from("production_sampling_plans")
        .update(validation.data)
        .eq("id", id)
        .eq("organization_id", user.organization_id);

    if (error) return { success: false, message: error.message };

    revalidatePath("/production/sampling-plans");
    return { success: true, message: "Plano de amostragem atualizado" };
}

export async function deleteSamplingPlanAction(id: string) {
    const user = await getSafeUser();
    const supabase = await createClient();

    const { error } = await supabase
        .from("production_sampling_plans")
        .delete()
        .eq("id", id)
        .eq("organization_id", user.organization_id);

    if (error) return { success: false, message: error.message };

    revalidatePath("/production/sampling-plans");
    return { success: true, message: "Plano de amostragem eliminado" };
}

export async function toggleSamplingPlanActiveAction(id: string, isActive: boolean) {
    const user = await getSafeUser();
    const supabase = await createClient();

    const { error } = await supabase
        .from("production_sampling_plans")
        .update({ is_active: isActive })
        .eq("id", id)
        .eq("organization_id", user.organization_id);

    if (error) return { success: false, message: error.message };

    revalidatePath("/production/sampling-plans");
    return { success: true, message: isActive ? "Plano ativado" : "Plano desativado" };
}

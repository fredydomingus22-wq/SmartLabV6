"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const taccpAssessmentSchema = z.object({
    area_name: z.string().min(1, "Área é obrigatória"),
    threat_description: z.string().optional(),
    threat_type: z.enum(['cyber', 'physical_outside', 'physical_inside', 'supply_chain']),
    likelihood: z.number().min(1).max(5),
    consequence: z.number().min(1).max(5),
    mitigation_measures: z.string().optional(),
    status: z.enum(['active', 'review_pending', 'retired']).default('active'),
    plant_id: z.string().uuid().nullable().optional(),
});

const vaccpVulnerabilitySchema = z.object({
    material_id: z.string().uuid("Material é obrigatório"),
    fraud_history_score: z.number().min(1).max(5),
    economic_gain_potential: z.number().min(1).max(5),
    detection_ease_score: z.number().min(1).max(5),
    mitigation_strategy: z.string().optional(),
    plant_id: z.string().uuid().nullable().optional(),
});

const samplingPointSchema = z.object({
    name: z.string().min(1, "Nome é obrigatório"),
    code: z.string().min(1, "Código é obrigatório"),
    location: z.string().optional(),
    equipment_id: z.string().uuid().nullable().optional(),
    description: z.string().optional(),
    plant_id: z.string().uuid().nullable().optional(),
});

const allergenDefinitionSchema = z.object({
    name: z.string().min(1, "Nome é obrigatório"),
    code: z.string().optional(),
    risk_category: z.enum(['high', 'medium', 'low']).default('medium').optional(),
    plant_id: z.string().uuid().nullable().optional(),
});

const materialAllergenSchema = z.object({
    material_id: z.string().uuid("Material é obrigatório"),
    allergen_id: z.string().uuid("Alergénio é obrigatório"),
    presence_type: z.enum(['contains', 'may_contain', 'free_from']),
    notes: z.string().optional(),
    plant_id: z.string().uuid().nullable().optional(),
});

export async function createSamplingPointAction(data: z.infer<typeof samplingPointSchema>) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Não autorizado");

    const { data: profile } = await supabase.from("user_profiles").select("organization_id").eq("id", user.id).single();
    if (!profile) throw new Error("Perfil não encontrado");

    const { error } = await supabase.from("sampling_points").insert({
        ...data,
        organization_id: profile.organization_id,
    });
    if (error) return { error: error.message };
    revalidatePath("/quality/environmental-monitoring");
    return { success: true };
}

export async function createTACCPAction(data: z.infer<typeof taccpAssessmentSchema>) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        throw new Error("Não autorizado");
    }

    // Get organization_id and plant_id from profile if not provided
    const { data: profile } = await supabase
        .from("user_profiles")
        .select("organization_id, plant_id")
        .eq("id", user.id)
        .single();

    if (!profile) {
        throw new Error("Perfil não encontrado");
    }

    const { error } = await supabase.from("taccp_assessments").insert({
        ...data,
        organization_id: profile.organization_id,
        plant_id: data.plant_id || profile.plant_id,
    });

    if (error) {
        console.error("Erro ao criar TACCP:", error);
        return { error: error.message };
    }

    revalidatePath("/haccp/taccp");
    return { success: true };
}

export async function updateTACCPAction(id: string, data: Partial<z.infer<typeof taccpAssessmentSchema>>) {
    const supabase = await createClient();

    const { error } = await supabase
        .from("taccp_assessments")
        .update(data)
        .eq("id", id);

    if (error) {
        console.error("Erro ao atualizar TACCP:", error);
        return { error: error.message };
    }

    revalidatePath("/haccp/taccp");
    return { success: true };
}

export async function deleteTACCPAction(id: string) {
    const supabase = await createClient();

    const { error } = await supabase
        .from("taccp_assessments")
        .delete()
        .eq("id", id);

    if (error) {
        console.error("Erro ao excluir TACCP:", error);
        return { error: error.message };
    }

    revalidatePath("/haccp/taccp");
    return { success: true };
}

export async function createAllergenDefinitionAction(data: z.infer<typeof allergenDefinitionSchema>) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Não autorizado");

    const { data: profile } = await supabase.from("user_profiles").select("organization_id").eq("id", user.id).single();
    if (!profile) throw new Error("Perfil não encontrado");

    const { error } = await supabase.from("allergen_definitions").insert({
        ...data,
        organization_id: profile.organization_id,
    });
    if (error) return { error: error.message };
    revalidatePath("/haccp/allergens");
    return { success: true };
}

export async function linkMaterialAllergenAction(data: z.infer<typeof materialAllergenSchema>) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Não autorizado");

    const { data: profile } = await supabase.from("user_profiles").select("organization_id").eq("id", user.id).single();
    if (!profile) throw new Error("Perfil não encontrado");

    const { error } = await supabase.from("material_allergens").insert({
        ...data,
        organization_id: profile.organization_id,
    });
    if (error) return { error: error.message };
    revalidatePath("/haccp/allergens");
    return { success: true };
}

export async function createVACCPAction(data: z.infer<typeof vaccpVulnerabilitySchema>) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        throw new Error("Não autorizado");
    }

    const { data: profile } = await supabase
        .from("user_profiles")
        .select("organization_id, plant_id")
        .eq("id", user.id)
        .single();

    if (!profile) {
        throw new Error("Perfil não encontrado");
    }

    const { error } = await supabase.from("vaccp_vulnerabilities").insert({
        ...data,
        organization_id: profile.organization_id,
    });

    if (error) {
        console.error("Erro ao criar VACCP:", error);
        return { error: error.message };
    }

    revalidatePath("/haccp/vaccp");
    return { success: true };
}

export async function updateVACCPAction(id: string, data: Partial<z.infer<typeof vaccpVulnerabilitySchema>>) {
    const supabase = await createClient();

    const { error } = await supabase
        .from("vaccp_vulnerabilities")
        .update(data)
        .eq("id", id);

    if (error) {
        console.error("Erro ao atualizar VACCP:", error);
        return { error: error.message };
    }

    revalidatePath("/haccp/vaccp");
    return { success: true };
}

export async function deleteVACCPAction(id: string) {
    const supabase = await createClient();

    const { error } = await supabase
        .from("vaccp_vulnerabilities")
        .delete()
        .eq("id", id);

    if (error) {
        console.error("Erro ao excluir VACCP:", error);
        return { error: error.message };
    }

    revalidatePath("/haccp/vaccp");
    return { success: true };
}

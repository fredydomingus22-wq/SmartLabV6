"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getSafeUser } from "@/lib/auth.server";

// --- Schemas ---

const CreateHazardSchema = z.object({
    process_step: z.string().min(2),
    hazard_description: z.string().min(5),
    hazard_category: z.enum(["biological", "chemical", "physical", "allergen", "radiological"]),
    risk_probability: z.coerce.number().min(1).max(5),
    risk_severity: z.coerce.number().min(1).max(5),
    control_measure: z.string().optional(),
    is_pcc: z.coerce.boolean().default(false),
    plant_id: z.string().uuid(),
});

const LogPCCSchema = z.object({
    hazard_id: z.string().uuid(),
    equipment_id: z.string().uuid().optional().nullable(),
    production_batch_id: z.string().uuid().optional().nullable(),
    critical_limit_min: z.coerce.number().optional().nullable(),
    critical_limit_max: z.coerce.number().optional().nullable(),
    actual_value: z.coerce.number(),
    is_compliant: z.coerce.boolean(),
    action_taken: z.string().optional().nullable(),
    notes: z.string().optional().nullable(),
    password: z.string().min(1),
});

const CreatePlanVersionSchema = z.object({
    version_number: z.string().min(1),
    changes_summary: z.string().optional(),
});

const ApprovePlanVersionSchema = z.object({
    version_id: z.string().uuid(),
    password: z.string().min(1),
});

// --- Actions ---

export async function createHazardAction(formData: FormData) {
    const user = await getSafeUser();
    const supabase = await createClient();

    const rawData = {
        process_step: formData.get("process_step"),
        hazard_description: formData.get("hazard_description"),
        hazard_category: formData.get("hazard_category"),
        risk_probability: formData.get("risk_probability"),
        risk_severity: formData.get("risk_severity"),
        control_measure: formData.get("control_measure"),
        is_pcc: formData.get("is_pcc") === "on" || formData.get("is_pcc") === "true",
        plant_id: formData.get("plant_id"),
    };

    const validation = CreateHazardSchema.safeParse(rawData);
    if (!validation.success) return { success: false, message: validation.error.issues[0].message };

    const riskScore = validation.data.risk_probability * validation.data.risk_severity;
    const isSignificant = riskScore >= 9;

    const { error } = await supabase.from("haccp_hazards").insert({
        organization_id: user.organization_id,
        ...validation.data,
        is_significant: isSignificant,
    });

    if (error) return { success: false, message: error.message };

    revalidatePath("/haccp/hazards");
    return { success: true, message: "Hazard Created" };
}

/**
 * Triggers AI analysis for a PCC deviation
 */
async function triggerPCCAIAnalysis(hazardId: string, actualValue: number) {
    const supabase = await createClient();

    const { data: hazard } = await supabase
        .from("haccp_hazards")
        .select("process_step, hazard_description")
        .eq("id", hazardId)
        .single();

    if (!hazard) return;

    const message = `ALERTA DE DESVIO: O ponto de controlo "${hazard.process_step}" registou o valor ${actualValue}. ` +
        `Risco aumentado de ${hazard.hazard_description}. Recomenda-se verificação imediata da integridade do lote.`;

    await supabase.from("ai_insights").insert({
        entity_type: "pcc",
        entity_id: hazardId,
        insight_type: "anomaly",
        message: message,
        confidence: 0.95,
        status: "warning",
        model_used: "gpt-4o-food-safety"
    });
}

export async function logPCCCheckAction(formData: FormData) {
    const user = await getSafeUser();
    const supabase = await createClient();

    const rawData = {
        hazard_id: formData.get("hazard_id"),
        equipment_id: formData.get("equipment_id") || null,
        production_batch_id: formData.get("production_batch_id") || null,
        critical_limit_min: formData.get("critical_limit_min") || null,
        critical_limit_max: formData.get("critical_limit_max") || null,
        actual_value: formData.get("actual_value"),
        is_compliant: formData.get("is_compliant") === "true",
        action_taken: formData.get("action_taken") || null,
        notes: formData.get("notes") || null,
        password: formData.get("password"),
    };

    const validation = LogPCCSchema.safeParse(rawData);
    if (!validation.success) return { success: false, message: validation.error.issues[0].message };

    const validated = validation.data;

    // 1. Verify Electronic Signature
    const { data: profile, error: profileError } = await supabase
        .rpc('verify_user_password', {
            p_user_id: user.id,
            p_password: validated.password
        });

    if (profileError || !profile) {
        return { success: false, message: "Assinatura eletrónica inválida. Verifique a sua senha." };
    }

    // 2. Data Integrity Hash
    const contentToHash = `${validated.hazard_id}-${validated.actual_value}-${validated.is_compliant}-${new Date().toISOString()}`;
    const signatureHash = Buffer.from(contentToHash).toString('base64');

    // 3. Insert Log
    const { error: logError } = await supabase.from("pcc_logs").insert({
        organization_id: user.organization_id,
        plant_id: user.plant_id,
        hazard_id: validated.hazard_id,
        equipment_id: validated.equipment_id,
        production_batch_id: validated.production_batch_id,
        critical_limit_min: validated.critical_limit_min,
        critical_limit_max: validated.critical_limit_max,
        actual_value: validated.actual_value,
        is_compliant: validated.is_compliant,
        action_taken: validated.action_taken,
        notes: validated.notes,
        checked_by: user.id,
        signature_hash: signatureHash,
    });

    if (logError) return { success: false, message: logError.message };

    // 4. AI Analysis for deviations
    if (!validated.is_compliant) {
        triggerPCCAIAnalysis(validated.hazard_id, validated.actual_value);
    }

    revalidatePath("/haccp/pcc");
    revalidatePath("/haccp/performance");
    return { success: true, message: validated.is_compliant ? "Registo efetuado com sucesso." : "DESVIO REGISTADO - Alerta AI gerado." };
}

export async function submitPRPChecklistAction(templateId: string, answers: { itemId: string; value: string; observation?: string }[]) {
    const user = await getSafeUser();
    const supabase = await createClient();

    const { data: execution, error: execError } = await supabase
        .from("haccp_prp_executions")
        .insert({
            template_id: templateId,
            organization_id: user.organization_id,
            plant_id: user.plant_id,
            executed_by: user.id,
            completed_at: new Date().toISOString(),
        })
        .select()
        .single();

    if (execError) return { success: false, message: execError.message };

    const answersToInsert = answers.map(a => ({
        execution_id: execution.id,
        item_id: a.itemId,
        value: a.value,
        observation: a.observation || null,
    }));

    const { error: answersError } = await supabase.from("haccp_prp_answers").insert(answersToInsert);
    if (answersError) return { success: false, message: answersError.message };

    revalidatePath("/haccp/prp");
    return { success: true, message: "Checklist submetida." };
}

export async function createHaccpPlanVersionAction(formData: FormData) {
    const user = await getSafeUser();
    const supabase = await createClient();

    const rawData = {
        version_number: formData.get("version_number"),
        changes_summary: formData.get("changes_summary"),
    };

    const validation = CreatePlanVersionSchema.safeParse(rawData);
    if (!validation.success) return { success: false, message: validation.error.issues[0].message };

    const { data: hazards } = await supabase
        .from("haccp_hazards")
        .select("*")
        .eq("organization_id", user.organization_id)
        .eq("status", "active");

    const snapshot = {
        hazards: hazards || [],
        generated_at: new Date().toISOString(),
        generated_by: user.id
    };

    const { error } = await supabase.from("haccp_plan_versions").insert({
        organization_id: user.organization_id,
        plant_id: user.plant_id,
        version_number: validation.data.version_number,
        changes_summary: validation.data.changes_summary,
        status: "draft",
        created_by: user.id,
        plan_snapshot: snapshot,
    });

    if (error) return { success: false, message: error.message };

    revalidatePath("/haccp/hazards");
    return { success: true, message: "Versão rascunho criada." };
}

export async function approveHaccpPlanVersionAction(formData: FormData) {
    const user = await getSafeUser();
    const supabase = await createClient();

    const rawData = {
        version_id: formData.get("version_id"),
        password: formData.get("password"),
    };

    const validation = ApprovePlanVersionSchema.safeParse(rawData);
    if (!validation.success) return { success: false, message: validation.error.issues[0].message };

    // Verifying password via sign-in as fallback/additional check
    const { error: authError } = await supabase.auth.signInWithPassword({
        email: user.email!,
        password: validation.data.password,
    });
    if (authError) return { success: false, message: "Senha inválida." };

    const { error } = await supabase
        .from("haccp_plan_versions")
        .update({
            status: "approved",
            approved_by: user.id,
            approved_at: new Date().toISOString(),
            effective_date: new Date().toISOString(),
        })
        .eq("id", validation.data.version_id)
        .eq("organization_id", user.organization_id);

    if (error) return { success: false, message: error.message };

    revalidatePath("/haccp/hazards");
    return { success: true, message: "Plano HACCP Aprovado." };
}

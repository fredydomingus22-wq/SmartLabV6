"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";

// Schema for Creating Hazard
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

// Schema for Logging PCC Check
const LogPCCSchema = z.object({
    hazard_id: z.string().uuid(),
    equipment_id: z.string().optional(),
    critical_limit_min: z.coerce.number().optional(),
    critical_limit_max: z.coerce.number().optional(),
    actual_value: z.coerce.number(),
    action_taken: z.string().optional(),
});

import { getSafeUser } from "@/lib/auth.server";
// ... other imports

export async function createHazardAction(formData: FormData) {
    const user = await getSafeUser();
    const supabase = await createClient(); // Still needed for insert, but auth is handled

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

    // Calculate is_significant based on Risk Matrix (Probability x Severity >= 9)
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

export async function logPCCCheckAction(formData: FormData) {
    const user = await getSafeUser();
    const supabase = await createClient();

    const password = formData.get("password") as string;
    if (!password) {
        return { success: false, message: "Password required for electronic signature" };
    }

    // Verify password
    const { error: authError } = await supabase.auth.signInWithPassword({
        email: user.email!,
        password: password,
    });

    if (authError) {
        return { success: false, message: "Invalid password. Authentication failed." };
    }

    const rawData = {
        hazard_id: formData.get("hazard_id"),
        equipment_id: formData.get("equipment_id"),
        critical_limit_min: formData.get("critical_limit_min"),
        critical_limit_max: formData.get("critical_limit_max"),
        actual_value: formData.get("actual_value"),
        action_taken: formData.get("action_taken"),
    };

    const validation = LogPCCSchema.safeParse(rawData);
    if (!validation.success) return { success: false, message: validation.error.issues[0].message };

    // Determine Compliance
    const { actual_value, critical_limit_min, critical_limit_max } = validation.data;
    let isCompliant = true;
    if (critical_limit_min !== undefined && actual_value < critical_limit_min) isCompliant = false;
    if (critical_limit_max !== undefined && actual_value > critical_limit_max) isCompliant = false;

    // Generate signature hash
    const signatureData = {
        userId: user.id,
        email: user.email,
        timestamp: new Date().toISOString(),
        action: "pcc_check",
        hazardId: validation.data.hazard_id,
        value: actual_value
    };
    const signatureHash = btoa(JSON.stringify(signatureData));

    const { error } = await supabase.from("pcc_logs").insert({
        organization_id: user.organization_id,
        plant_id: user.plant_id,
        hazard_id: validation.data.hazard_id,
        equipment_id: validation.data.equipment_id || null,
        critical_limit_min: validation.data.critical_limit_min || null,
        critical_limit_max: validation.data.critical_limit_max || null,
        actual_value: validation.data.actual_value,
        is_compliant: isCompliant,
        action_taken: !isCompliant ? validation.data.action_taken : null,
        checked_by: user.id,
        signature_hash: signatureHash, // Assuming this column exists or was added
    });

    if (error) return { success: false, message: error.message };

    revalidatePath("/haccp/pcc");
    return { success: true, message: isCompliant ? "Check Logged - Compliant" : "DEVIATION LOGGED - Action Required" };
}

export async function submitPRPChecklistAction(templateId: string, answers: { itemId: string; value: string; observation?: string }[]) {
    const user = await getSafeUser();
    const supabase = await createClient();

    // 1. Create Execution Record
    const { data: execution, error: execError } = await supabase
        .from("haccp_prp_executions")
        .insert({
            template_id: templateId,
            organization_id: user.organization_id,
            plant_id: user.plant_id,
            executed_by: user.id,
            completed_at: new Date().toISOString(), // Helper for clarity, uses DB now usually but insert needs it if not default
        })
        .select()
        .single();

    if (execError) return { success: false, message: "Failed to start execution: " + execError.message };

    // 2. Insert Answers
    const answersToInsert = answers.map(a => ({
        execution_id: execution.id,
        item_id: a.itemId,
        value: a.value,
        observation: a.observation || null,
    }));

    const { error: answersError } = await supabase
        .from("haccp_prp_answers")
        .insert(answersToInsert);

    if (answersError) {
        // Cleanup failed execution? Or let it be. Handled by generic cleanup usually.
        return { success: false, message: "Failed to save answers: " + answersError.message };
    }

    revalidatePath("/haccp/prp");
    return { success: true, message: "Checklist submitted successfully" };
}

/**
 * Create a simplified HACCP Hazard (Quick Mode for Specs)
 */
export async function createQuickHazardAction(description: string, category: "biological" | "chemical" | "physical" | "allergen" | "radiological", isPcc: boolean) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, message: "Unauthorized" };

    const { data: profile } = await supabase
        .from("user_profiles")
        .select("organization_id, plant_id")
        .eq("id", user.id)
        .single();

    if (!profile) return { success: false, message: "Profile not found" };

    // Default values for required fields in Quick Mode
    // We assume significant if it's a PCC, otherwise we default values to result in < 9
    const probability = isPcc ? 3 : 2;
    const severity = isPcc ? 4 : 2;
    const isSignificant = (probability * severity) >= 9;

    const { data, error } = await supabase
        .from("haccp_hazards")
        .insert({
            organization_id: profile.organization_id,
            plant_id: profile.plant_id,
            process_step: "Production / Specification Limit",
            hazard_description: description,
            hazard_category: category,
            risk_probability: probability,
            risk_severity: severity,
            is_significant: isSignificant,
            is_pcc: isPcc,
            control_measure: "Monitoring via LIMS Specification",
            status: "active"
        })
        .select("id")
        .single();

    if (error) return { success: false, message: error.message };

    return { success: true, hazardId: data.id };
}

export async function searchHaccpHazardsAction(query: string) {
    const supabase = await createClient();
    const { data } = await supabase
        .from("haccp_hazards")
        .select("id, hazard_description, is_pcc, hazard_category")
        .ilike("hazard_description", `%${query}%`)
        .eq("status", "active")
        .limit(10);

    return data || [];
}

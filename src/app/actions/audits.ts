"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getSafeUser } from "@/lib/auth";

const CreateAuditSchema = z.object({
    title: z.string().min(1, "O título é obrigatório"),
    checklist_id: z.string().uuid("Selecione um checklist"),
    auditor_id: z.string().uuid().optional(),
    auditee_id: z.string().uuid().optional(),
    planned_date: z.string().optional(),
    scope: z.string().optional(),
    plant_id: z.string().uuid().optional(),
});

const AuditResponseSchema = z.object({
    audit_id: z.string().uuid(),
    question_id: z.string().uuid(),
    result: z.enum(["compliant", "minor_nc", "major_nc", "observation", "ofi", "na"]),
    evidence: z.string().optional(),
    notes: z.string().optional(),
});

/**
 * Schedule a new audit
 */
export async function createAuditAction(formData: FormData) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, message: "Não autorizado" };

    const { data: userData } = await supabase
        .from("user_profiles")
        .select("organization_id, plant_id")
        .eq("id", user.id)
        .single();

    if (!userData) return { success: false, message: "Perfil não encontrado" };

    const rawData = {
        title: formData.get("title"),
        checklist_id: formData.get("checklist_id"),
        auditor_id: formData.get("auditor_id") || undefined,
        auditee_id: formData.get("auditee_id") || undefined,
        planned_date: formData.get("planned_date") || undefined,
        scope: formData.get("scope") || undefined,
        plant_id: formData.get("plant_id") || undefined,
    };

    const validation = CreateAuditSchema.safeParse(rawData);
    if (!validation.success) {
        return { success: false, message: validation.error.issues[0].message };
    }

    let plantId = validation.data.plant_id || userData.plant_id;
    if (!plantId) {
        const { data: firstPlant } = await supabase
            .from("plants")
            .select("id")
            .eq("organization_id", userData.organization_id)
            .limit(1)
            .single();
        plantId = firstPlant?.id;
    }

    if (!plantId) {
        return { success: false, message: "Unidade industrial não definida" };
    }

    // Generate Audit number
    const year = new Date().getFullYear();
    const { count } = await supabase
        .from("audits")
        .select("*", { count: "exact", head: true })
        .eq("organization_id", userData.organization_id);

    const auditNumber = `AUD-${year}-${String((count || 0) + 1).padStart(4, "0")}`;

    const { error } = await supabase.from("audits").insert({
        organization_id: userData.organization_id,
        plant_id: plantId,
        audit_number: auditNumber,
        checklist_id: validation.data.checklist_id,
        title: validation.data.title,
        scope: validation.data.scope,
        auditor_id: validation.data.auditor_id,
        auditee_id: validation.data.auditee_id,
        planned_date: validation.data.planned_date,
        status: "planned",
        created_by: user.id,
    });

    if (error) return { success: false, message: error.message };

    revalidatePath("/quality/audits");
    return { success: true, message: `Auditoria ${auditNumber} agendada` };
}

/**
 * Submit response for an audit question
 */
export async function submitAuditResponseAction(data: z.infer<typeof AuditResponseSchema>) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Não autorizado");

    const { data: profile } = await supabase
        .from("user_profiles")
        .select("organization_id")
        .eq("id", user.id)
        .single();

    if (!profile) throw new Error("Perfil não encontrado");

    const validation = AuditResponseSchema.safeParse(data);
    if (!validation.success) {
        return { success: false, message: validation.error.issues[0].message };
    }

    const { error } = await supabase
        .from("audit_responses")
        .upsert({
            audit_id: validation.data.audit_id,
            question_id: validation.data.question_id,
            result: validation.data.result,
            evidence: validation.data.evidence,
            notes: validation.data.notes,
            organization_id: profile.organization_id, // Added organization_id
            updated_at: new Date().toISOString(),
        }, {
            onConflict: "audit_id, question_id"
        });

    if (error) return { success: false, message: error.message };

    // If result is NC, we might want to flag it for finding creation later

    revalidatePath(`/quality/audits/${validation.data.audit_id}`);
    return { success: true, message: "Resposta guardada" };
}

/**
 * Update Audit Status
 */
export async function updateAuditStatusAction(id: string, status: string) {
    const supabase = await createClient();

    const updateData: any = { status, updated_at: new Date().toISOString() };

    if (status === 'in_progress') {
        updateData.actual_start_date = new Date().toISOString().split('T')[0];
    } else if (status === 'completed') {
        updateData.actual_end_date = new Date().toISOString().split('T')[0];
    }

    const { error } = await supabase
        .from("audits")
        .update(updateData)
        .eq("id", id);

    if (error) return { success: false, message: error.message };

    revalidatePath("/quality/audits");
    revalidatePath(`/quality/audits/${id}`);
    return { success: true, message: `Estado da auditoria atualizado para ${status}` };
}

/**
 * Generate Finding from Response
 */
export async function generateFindingFromResponse(auditId: string, responseId: string, description: string, classification: string) {
    const supabase = await createClient();

    const { error } = await supabase.from("audit_findings").insert({
        audit_id: auditId,
        response_id: responseId,
        description,
        classification,
        status: "draft"
    });

    if (error) return { success: false, message: error.message };

    revalidatePath(`/quality/audits/${auditId}`);
    return { success: true, message: "Constatação de auditoria registada" };
}

/**
 * Promote an audit finding to a formal Nonconformity (NC)
 */
export async function promoteFindingToNCAction(findingId: string) {
    const supabase = await createClient();
    const user = await getSafeUser();

    // 1. Fetch finding details
    const { data: finding, error: fetchError } = await supabase
        .from("audit_findings")
        .select(`
            *,
            audit:audits(audit_number, title, plant_id)
        `)
        .eq("id", findingId)
        .single();

    if (fetchError || !finding) return { success: false, message: "Constatação não encontrada" };
    if (finding.nonconformity_id) return { success: false, message: "Já existe uma NC associada a esta constatação" };

    // 2. Generate NC number
    const year = new Date().getFullYear();
    const { count } = await supabase
        .from("nonconformities")
        .select("*", { count: "exact", head: true })
        .eq("organization_id", user.organization_id);

    const ncNumber = `NC-${year}-${String((count || 0) + 1).padStart(4, "0")}`;

    // 3. Create NC record
    const { data: nc, error: ncError } = await supabase
        .from("nonconformities")
        .insert({
            organization_id: user.organization_id,
            plant_id: finding.audit?.plant_id,
            nc_number: ncNumber,
            title: `NC Auditoria: ${finding.audit?.audit_number} - ${finding.classification}`,
            description: finding.description,
            nc_type: "audit",
            severity: finding.classification === 'major_nc' ? 'major' : 'minor',
            source_type: "audit",
            source_reference: finding.audit?.audit_number,
            status: "open",
            detected_date: new Date().toISOString().split('T')[0],
            created_by: user.id
        })
        .select()
        .single();

    if (ncError) return { success: false, message: ncError.message };

    // 4. Update finding with NC reference
    await supabase
        .from("audit_findings")
        .update({
            nonconformity_id: nc.id,
            status: "promoted"
        })
        .eq("id", findingId);

    revalidatePath(`/quality/audits/${finding.audit_id}`);
    revalidatePath("/quality/qms");

    return { success: true, message: `Não conformidade ${ncNumber} criada com sucesso`, nc_id: nc.id };
}


"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { createNotificationAction } from "./notifications";
import { z } from "zod";

// Schemas
const CreateNCSchema = z.object({
    title: z.string().min(1, "O título é obrigatório"),
    description: z.string().min(1, "A descrição é obrigatória"),
    nc_type: z.enum(["internal", "supplier", "customer", "audit"]),
    severity: z.enum(["minor", "major", "critical"]),
    category: z.string().optional(),
    source_type: z.string().optional(),
    source_reference: z.string().optional(),
    detected_date: z.string().optional(),
    due_date: z.string().optional(),
    responsible_id: z.string().uuid().optional(),
    notes: z.string().optional(),
    plant_id: z.string().uuid().optional(),
});


const UpdateNCStatusSchema = z.object({
    id: z.string().uuid(),
    status: z.enum(["open", "under_investigation", "containment", "corrective_action", "verification", "closed"]),
    notes: z.string().optional(),
});

const CreateCAPASchema = z.object({
    nonconformity_id: z.string().uuid().optional(),
    action_type: z.enum(["corrective", "preventive", "containment"]),
    description: z.string().min(1, "A descrição é obrigatória"),
    root_cause: z.string().optional(),
    priority: z.enum(["low", "medium", "high", "critical"]),
    planned_date: z.string().optional(),
    responsible_id: z.string().uuid().optional(),
    plant_id: z.string().uuid(),
});


/**
 * Create a new Nonconformity
 */
export async function createNCAction(formData: FormData) {
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
        description: formData.get("description"),
        nc_type: formData.get("nc_type") || "internal",
        severity: formData.get("severity") || "minor",
        category: formData.get("category") || undefined,
        source_type: formData.get("source_type") || undefined,
        source_reference: formData.get("source_reference") || undefined,
        detected_date: formData.get("detected_date") || undefined,
        due_date: formData.get("due_date") || undefined,
        responsible_id: formData.get("responsible_id") || undefined,
        notes: formData.get("notes") || undefined,
        plant_id: formData.get("plant_id") || undefined,
    };

    const validation = CreateNCSchema.safeParse(rawData);
    if (!validation.success) {
        return { success: false, message: validation.error.issues[0].message };
    }

    // Get plant_id - from form, user profile, or first plant in org
    let plantId = validation.data.plant_id || userData.plant_id;
    if (!plantId) {
        // Get first plant from organization
        const { data: firstPlant } = await supabase
            .from("plants")
            .select("id")
            .eq("organization_id", userData.organization_id)
            .limit(1)
            .single();
        plantId = firstPlant?.id;
    }

    if (!plantId) {
        return { success: false, message: "Nenhuma unidade encontrada. Por favor, crie uma unidade primeiro." };
    }


    // Generate NC number
    const year = new Date().getFullYear();
    const { count } = await supabase
        .from("nonconformities")
        .select("*", { count: "exact", head: true })
        .eq("organization_id", userData.organization_id);

    const ncNumber = `NC-${year}-${String((count || 0) + 1).padStart(4, "0")}`;

    const { data: ncData, error: ncError } = await supabase.from("nonconformities").insert({
        organization_id: userData.organization_id,
        plant_id: plantId,
        nc_number: ncNumber,
        title: validation.data.title,
        description: validation.data.description,
        nc_type: validation.data.nc_type,
        severity: validation.data.severity,
        category: validation.data.category,
        source_type: validation.data.source_type,
        source_reference: validation.data.source_reference,
        detected_date: validation.data.detected_date || new Date().toISOString().split("T")[0],
        due_date: validation.data.due_date,
        responsible_id: validation.data.responsible_id,
        notes: validation.data.notes,
        detected_by: user.id,
        created_by: user.id,
    }).select("id, severity, title").single();

    if (ncError) return { success: false, message: ncError.message };

    // --- AUTOMATION TRIGGERS ---

    // 1. Auto-Containment CAPA for Major/Critical
    if (validation.data.severity === "major" || validation.data.severity === "critical") {
        const year = new Date().getFullYear();
        const { count: capaCount } = await supabase
            .from("capa_actions")
            .select("*", { count: "exact", head: true })
            .eq("organization_id", userData.organization_id);

        const actionNumber = `CN-${year}-${String((capaCount || 0) + 1).padStart(4, "0")}`;

        await supabase.from("capa_actions").insert({
            organization_id: userData.organization_id,
            plant_id: plantId,
            nonconformity_id: ncData.id,
            action_number: actionNumber,
            action_type: "containment",
            description: `Ação de contenção imediata para: ${validation.data.title}`,
            priority: validation.data.severity === "critical" ? "critical" : "high",
            planned_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split("T")[0], // 24h deadline
            created_by: user.id,
        });
    }

    // 2. Auto-8D Draft for Critical
    if (validation.data.severity === "critical") {
        const year = new Date().getFullYear();
        const { count: d8Count } = await supabase
            .from("eight_d_reports")
            .select("*", { count: "exact", head: true })
            .eq("organization_id", userData.organization_id);

        const reportNumber = `8D-${year}-${String((d8Count || 0) + 1).padStart(4, "0")}`;

        await supabase.from("eight_d_reports").insert({
            organization_id: userData.organization_id,
            plant_id: plantId,
            nonconformity_id: ncData.id,
            report_number: reportNumber,
            champion: user.id,
            problem_description: validation.data.description,
            current_step: 1,
            status: "open",
            created_by: user.id,
        });
    }

    // 3. Auto-Task assignment
    if (validation.data.responsible_id) {
        await supabase.from("app_tasks").insert({
            organization_id: userData.organization_id,
            plant_id: plantId,
            title: `Investigar NC: ${ncNumber}`,
            description: `Investigação e resolução da Não Conformidade: ${validation.data.title}\n\nDescrição: ${validation.data.description}`,
            status: 'todo',
            priority: validation.data.severity === 'critical' ? 'critical' :
                validation.data.severity === 'major' ? 'high' : 'medium',
            due_date: validation.data.due_date,
            assignee_id: validation.data.responsible_id,
            module_context: 'qms_nc',
            entity_id: ncData.id,
            entity_reference: ncNumber,
            created_by: user.id
        });
    }

    // 4. Send Notification to QA Managers (Admins)
    await createNotificationAction({
        title: `Nova Não Conformidade: ${ncNumber}`,
        content: `A não conformidade "${validation.data.title}" foi registada com gravidade ${validation.data.severity}.`,
        type: 'deviation',
        severity: validation.data.severity === 'critical' ? 'critical' :
            validation.data.severity === 'major' ? 'high' : 'medium',
        targetRole: 'admin',
        link: `/quality/qms/${ncData.id}`,
        plantId: plantId
    });

    revalidatePath("/quality/qms");
    return {
        success: true,
        message: `Não Conformidade ${ncNumber} criada. Fluxos de trabalho automatizados iniciados.`
    };
}


/**
 * Close NC with Electronic Signature (21 CFR Part 11)
 * Requires QA Manager or Admin role
 */
export async function closeNCWithSignatureAction(formData: FormData) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, message: "Não autorizado" };

    // Check user role - must be QA Manager or Admin
    const { data: userProfile } = await supabase
        .from("user_profiles")
        .select("role")
        .eq("id", user.id)
        .single();

    const allowedRoles = ["qa_manager", "admin", "supervisor"];
    if (!userProfile || !allowedRoles.includes(userProfile.role)) {
        return {
            success: false,
            message: "Apenas Gestores de Qualidade ou Administradores podem fechar não conformidades"
        };
    }

    const password = formData.get("password") as string;
    if (!password) {
        return { success: false, message: "A palavra-passe é necessária para a assinatura eletrónica" };
    }


    // Verify password
    const { error: authError } = await supabase.auth.signInWithPassword({
        email: user.email!,
        password: password,
    });

    if (authError) {
        return { success: false, message: "Palavra-passe inválida. A autenticação falhou." };
    }


    const id = formData.get("id") as string;
    const closureNotes = formData.get("closure_notes") as string || "";

    // Generate signature hash
    const signatureData = {
        userId: user.id,
        email: user.email,
        timestamp: new Date().toISOString(),
        action: "close_nc",
        ncId: id,
    };
    const signatureHash = btoa(JSON.stringify(signatureData));

    // Update NC status to closed
    const { error } = await supabase
        .from("nonconformities")
        .update({
            status: "closed",
            closure_notes: closureNotes,
            closed_date: new Date().toISOString().split("T")[0],
            closed_by: user.id,
            signature_hash: signatureHash,
        })
        .eq("id", id);

    if (error) return { success: false, message: error.message };

    revalidatePath("/quality/qms");
    revalidatePath(`/quality/qms/${id}`);
    return { success: true, message: "NC fechada com assinatura eletrónica" };
}


/**
 * Update NC Status
 */
export async function updateNCStatusAction(formData: FormData) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, message: "Não autorizado" };


    const rawData = {
        id: formData.get("id"),
        status: formData.get("status"),
        notes: formData.get("notes") || undefined,
    };

    const validation = UpdateNCStatusSchema.safeParse(rawData);
    if (!validation.success) {
        return { success: false, message: validation.error.issues[0].message };
    }

    const updateData: any = {
        status: validation.data.status,
        updated_at: new Date().toISOString(),
    };

    if (validation.data.status === "closed") {
        updateData.closed_date = new Date().toISOString().split("T")[0];
    }

    const { error } = await supabase
        .from("nonconformities")
        .update(updateData)
        .eq("id", validation.data.id);

    if (error) return { success: false, message: error.message };

    revalidatePath("/quality/qms");
    return { success: true, message: "Estado atualizado" };
}


/**
 * Create a CAPA Action
 */
export async function createCAPAAction(formData: FormData) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, message: "Unauthorized" };

    const { data: userData } = await supabase
        .from("user_profiles")
        .select("organization_id, plant_id")
        .eq("id", user.id)
        .single();

    if (!userData) return { success: false, message: "Profile not found" };

    // Get plant_id from user profile or first plant in org
    let plantId = userData.plant_id;
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
        return { success: false, message: "No plant found. Please create a plant first." };
    }

    const rawData = {
        nonconformity_id: formData.get("nonconformity_id") || undefined,
        action_type: formData.get("action_type") || "corrective",
        description: formData.get("description"),
        root_cause: formData.get("root_cause") || undefined,
        priority: formData.get("priority") || "medium",
        planned_date: formData.get("planned_date") || undefined,
        responsible_id: formData.get("responsible_id") || undefined,
    };

    const validation = CreateCAPASchema.safeParse(rawData);
    if (!validation.success) {
        return { success: false, message: validation.error.issues[0].message };
    }

    // Generate action number
    const year = new Date().getFullYear();
    const prefix = validation.data.action_type === "preventive" ? "PA" : "CA";
    const { count } = await supabase
        .from("capa_actions")
        .select("*", { count: "exact", head: true })
        .eq("organization_id", userData.organization_id);

    const actionNumber = `${prefix}-${year}-${String((count || 0) + 1).padStart(4, "0")}`;

    const { error } = await supabase.from("capa_actions").insert({
        organization_id: userData.organization_id,
        plant_id: plantId,
        nonconformity_id: validation.data.nonconformity_id,
        action_number: actionNumber,
        action_type: validation.data.action_type,
        description: validation.data.description,
        root_cause: validation.data.root_cause,
        priority: validation.data.priority,
        planned_date: validation.data.planned_date,
        responsible_id: validation.data.responsible_id,
        created_by: user.id,
    });

    if (error) return { success: false, message: error.message };

    revalidatePath("/quality/qms");
    return { success: true, message: `Ação ${actionNumber} criada` };
}


/**
 * Update CAPA Status
 */
export async function updateCAPAStatusAction(formData: FormData) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, message: "Unauthorized" };

    const id = formData.get("id") as string;
    const status = formData.get("status") as string;

    const updateData: any = {
        status,
        updated_at: new Date().toISOString(),
    };

    // 21 CFR Part 11: Electronic Signature for "verified" status
    if (status === "verified") {
        const password = formData.get("password") as string;
        if (!password) {
            return { success: false, message: "Password required for verification signature" };
        }

        const { error: authError } = await supabase.auth.signInWithPassword({
            email: user.email!,
            password: password,
        });

        if (authError) {
            return { success: false, message: "Invalid password. Authentication failed." };
        }

        // Generate signature hash
        const signatureData = {
            userId: user.id,
            email: user.email,
            timestamp: new Date().toISOString(),
            action: "verify_capa",
            capaId: id,
        };
        updateData.signature_hash = btoa(JSON.stringify(signatureData));
        updateData.verified_date = new Date().toISOString().split("T")[0];
        updateData.verified_by = user.id;
    }

    if (status === "completed") {
        updateData.completed_date = new Date().toISOString().split("T")[0];
    }

    const { error } = await supabase
        .from("capa_actions")
        .update(updateData)
        .eq("id", id);

    if (error) return { success: false, message: error.message };

    revalidatePath("/quality/qms");
    revalidatePath("/quality/qms/capa");
    return { success: true, message: "Estado da CAPA atualizado" };
}


/**
 * Full Update NC (all fields)
 */
export async function updateNCAction(formData: FormData) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, message: "Unauthorized" };

    const id = formData.get("id") as string;
    if (!id) return { success: false, message: "NC ID required" };

    const updateData: any = {
        updated_at: new Date().toISOString(),
    };

    // Only update fields that are provided
    const fields = ["title", "description", "nc_type", "severity", "category",
        "source_reference", "due_date", "responsible_id", "notes"];

    for (const field of fields) {
        const value = formData.get(field);
        if (value !== null && value !== "") {
            updateData[field] = value;
        }
    }

    const { error } = await supabase
        .from("nonconformities")
        .update(updateData)
        .eq("id", id);

    if (error) return { success: false, message: error.message };

    revalidatePath("/quality/qms");
    revalidatePath(`/quality/qms/${id}`);
    return { success: true, message: "Não Conformidade atualizada" };
}


/**
 * Full Update CAPA (all fields)
 */
export async function updateCAPAAction(formData: FormData) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, message: "Unauthorized" };

    const id = formData.get("id") as string;
    if (!id) return { success: false, message: "CAPA ID required" };

    const updateData: any = {
        updated_at: new Date().toISOString(),
    };

    const fields = ["description", "root_cause", "priority", "planned_date",
        "responsible_id", "effectiveness_notes"];

    for (const field of fields) {
        const value = formData.get(field);
        if (value !== null && value !== "") {
            updateData[field] = value;
        }
    }

    const { error } = await supabase
        .from("capa_actions")
        .update(updateData)
        .eq("id", id);

    if (error) return { success: false, message: error.message };

    revalidatePath("/quality/qms");
    revalidatePath("/quality/qms/capa");
    return { success: true, message: "CAPA updated" };
}

/**
 * Create 8D Report
 */
export async function create8DAction(formData: FormData) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, message: "Unauthorized" };

    const { data: userData } = await supabase
        .from("user_profiles")
        .select("organization_id, plant_id")
        .eq("id", user.id)
        .single();

    if (!userData) return { success: false, message: "Profile not found" };

    // Get plant_id from user profile or first plant in org
    let plantId = userData.plant_id;
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
        return { success: false, message: "No plant found. Please create a plant first." };
    }

    const ncId = formData.get("nonconformity_id") as string;
    const champion = formData.get("champion") as string;
    const problemDescription = formData.get("problem_description") as string;

    // Generate report number
    const year = new Date().getFullYear();
    const { count } = await supabase
        .from("eight_d_reports")
        .select("*", { count: "exact", head: true })
        .eq("organization_id", userData.organization_id);

    const reportNumber = `8D-${year}-${String((count || 0) + 1).padStart(4, "0")}`;

    const { data, error } = await supabase.from("eight_d_reports").insert({
        organization_id: userData.organization_id,
        plant_id: plantId,
        nonconformity_id: ncId || null,
        report_number: reportNumber,
        champion: champion,
        problem_description: problemDescription,
        status: "open",
        created_by: user.id,
    }).select("id, report_number").single();
    if (error) return { success: false, message: error.message };

    // --- AUTOMATION: Create Task for Champion ---
    if (champion) {
        await supabase.from("app_tasks").insert({
            organization_id: userData.organization_id,
            plant_id: plantId,
            title: `Liderar Relatório 8D: ${reportNumber}`,
            description: `Foi designado como Líder (Champion) do Relatório 8D: ${reportNumber}\n\nProblema: ${problemDescription}`,
            status: 'todo',
            priority: 'high',
            assignee_id: champion,
            module_context: 'qms_8d',
            entity_id: data.id,
            entity_reference: reportNumber,
            created_by: user.id
        });

        // Notify champion
        await createNotificationAction({
            title: `Líder 8D Designado: ${reportNumber}`,
            content: `Foi designado como Champion para o relatório 8D ${reportNumber}.`,
            type: 'task',
            severity: 'high',
            targetUserId: champion,
            link: `/quality/qms/8d/${data.id}`,
            plantId: plantId
        });
    }

    revalidatePath("/quality/qms/8d");
    return { success: true, message: `Relatório 8D ${reportNumber} criado` };
}


/**
 * Update 8D Report Step
 */
export async function update8DStepAction(formData: FormData) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, message: "Unauthorized" };

    const id = formData.get("id") as string;
    const step = parseInt(formData.get("step") as string);

    const stepFields: Record<number, string[]> = {
        1: ["team_members", "champion"],
        2: ["problem_description"],
        3: ["containment_actions", "containment_verified"],
        4: ["root_cause_analysis", "root_cause_method"],
        5: ["corrective_actions"],
        6: ["implementation_plan", "implementation_date"],
        7: ["preventive_actions", "systemic_changes"],
        8: ["lessons_learned", "recognition_notes"],
    };

    const updateData: any = {
        current_step: step,
        updated_at: new Date().toISOString(),
    };

    // 21 CFR Part 11: Electronic Signature for Step 8 (Finalization)
    if (step === 8) {
        const password = formData.get("password") as string;
        if (!password) {
            return { success: false, message: "Password required for 8D finalization signature" };
        }

        const { error: authError } = await supabase.auth.signInWithPassword({
            email: user.email!,
            password: password,
        });

        if (authError) {
            return { success: false, message: "Invalid password. Authentication failed." };
        }

        // Generate signature hash
        const signatureData = {
            userId: user.id,
            email: user.email,
            timestamp: new Date().toISOString(),
            action: "finalize_8d",
            reportId: id,
        };
        updateData.signature_hash = btoa(JSON.stringify(signatureData));
        updateData.status = "completed";
        updateData.closed_date = new Date().toISOString().split("T")[0];
    }

    // Update fields for this step
    const fields = stepFields[step] || [];
    for (const field of fields) {
        const value = formData.get(field);
        if (value !== null) {
            if (field === "team_members") {
                // Parse as array
                updateData[field] = (value as string).split(",").map(s => s.trim()).filter(Boolean);
            } else if (field === "containment_verified") {
                updateData[field] = value === "true";
            } else {
                updateData[field] = value;
            }
        }
    }

    const { error } = await supabase
        .from("eight_d_reports")
        .update(updateData)
        .eq("id", id)
        .select("nonconformity_id")
        .single();

    if (error) return { success: false, message: error.message };

    // --- AUTOMATION: Sync NC Status ---
    if (step === 8 && (error as any) === null) {
        // Fetch the report again to get the NC ID if selection failed in update (fallback)
        const { data: report } = await supabase
            .from("eight_d_reports")
            .select("nonconformity_id")
            .eq("id", id)
            .single();

        if (report?.nonconformity_id) {
            await supabase
                .from("nonconformities")
                .update({
                    status: "closed",
                    closed_date: new Date().toISOString().split("T")[0],
                    closed_by: user.id,
                    notes: "NC fechada automaticamente após conclusão do relatório 8D."
                })
                .eq("id", report.nonconformity_id);
        }
    }

    // --- AUTOMATION: Create/Update Task for next step ---
    if ((error as any) === null && step < 8) {
        const { data: updatedReport } = await supabase
            .from("eight_d_reports")
            .select("report_number, champion, problem_description")
            .eq("id", id)
            .single();

        if (updatedReport?.champion) {
            const nextStepTitle = {
                2: "Descrição do Problema (5W2H)",
                3: "Implementar Ações de Contenção",
                4: "Realizar Análise de Causa Raiz",
                5: "Definir Ações Corretivas Permanentes",
                6: "Implementar e Verificar Ações",
                7: "Implementar Medidas Preventivas",
                8: "Concluir Relatório e Reconhecimento"
            }[step + 1] || `Avançar para Passo D${step + 1}`;

            await supabase.from("app_tasks").insert({
                organization_id: (await supabase.from("eight_d_reports").select("organization_id").eq("id", id).single()).data?.organization_id,
                plant_id: (updateData as any).plant_id || user.id, // Fallback logic needs care, but org is priority
                title: `8D ${updatedReport.report_number}: ${nextStepTitle}`,
                description: `O relatório 8D avançou para o passo D${step + 1}.\nLíder: ${updatedReport.champion}`,
                status: 'todo',
                priority: 'medium',
                assignee_id: updatedReport.champion,
                module_context: 'qms_8d',
                entity_id: id,
                entity_reference: updatedReport.report_number,
                created_by: user.id
            });
        }
    }

    revalidatePath("/quality/qms/8d");
    revalidatePath(`/quality/qms/8d/${id}`);
    if (step === 8) revalidatePath("/quality/qms");

    return { success: true, message: `Passo D${step} atualizado` };
}


// --- Auto-NC from Failed Result ---

interface AutoNCParams {
    sampleId: string;
    parameterId: string;
    parameterName: string;
    value: number | string;
    specMin?: number | null;
    specMax?: number | null;
    isCritical: boolean;
    organizationId: string;
    plantId: string;
    userId: string;
}

/**
 * Auto-create an NC draft when a critical parameter fails
 * Called internally from registerResultAction
 */
export async function createNCFromFailedResult(params: AutoNCParams) {
    const supabase = await createClient();

    // Only auto-create for critical parameters
    if (!params.isCritical) {
        return { success: true, ncCreated: false };
    }

    // Generate NC number
    const year = new Date().getFullYear();
    const { count } = await supabase
        .from("nonconformities")
        .select("*", { count: "exact", head: true })
        .eq("organization_id", params.organizationId);

    const ncNumber = `NC-${year}-${String((count || 0) + 1).padStart(4, "0")}`;

    // Build description
    const specRange = params.specMin !== null && params.specMax !== null
        ? `Especificação: ${params.specMin} - ${params.specMax}`
        : params.specMin !== null
            ? `Mínimo: ${params.specMin}`
            : params.specMax !== null
                ? `Máximo: ${params.specMax}`
                : "Nenhuma especificação definida";

    const description = `NC gerada automaticamente devido a falha em análise laboratorial.

Parâmetro: ${params.parameterName}
Resultado: ${params.value}
${specRange}

Esta NC foi criada automaticamente porque um parâmetro CRÍTICO falhou os limites de especificação.`;

    const { error, data: nc } = await supabase.from("nonconformities").insert({
        organization_id: params.organizationId,
        plant_id: params.plantId,
        nc_number: ncNumber,
        title: `Falha em Parâmetro Crítico: ${params.parameterName}`,
        description,
        nc_type: "internal",
        severity: "critical",
        category: "lab_failure",
        source_type: "Análise de Amostra",
        source_reference: params.sampleId,
        detected_date: new Date().toISOString().split("T")[0],
        detected_by: params.userId,
        created_by: params.userId,
        status: "open",
    }).select("id").single();

    if (error) {
        console.error("Falha ao criar NC automática:", error);
        return { success: false, message: error.message, ncCreated: false };
    }


    return {
        success: true,
        ncCreated: true,
        ncNumber,
        ncId: nc?.id
    };
}

// --- AI Analysis ---

/**
 * Get AI-powered analysis for a Nonconformity
 */
export async function getNCAnalysisAIAction(ncId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, message: "Unauthorized" };

    // 1. Check if we already have a functional analysis in the DB
    const { data: existingInsight } = await supabase
        .from("ai_insights")
        .select("*")
        .eq("entity_type", "nonconformity")
        .eq("entity_id", ncId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

    if (existingInsight) {
        return {
            success: true,
            analysis: existingInsight.raw_response,
            cached: true,
            insightId: existingInsight.id
        };
    }

    // 2. If not, fetch NC details and analyze
    const { data: nc, error: fetchError } = await supabase
        .from("nonconformities")
        .select("title, description, nc_type, severity, organization_id, plant_id")
        .eq("id", ncId)
        .single();

    if (fetchError || !nc) return { success: false, message: "NC not found" };

    try {
        const { analyzeRootCause } = await import("@/lib/openai");
        const analysis = await analyzeRootCause({
            title: nc.title,
            description: nc.description,
            ncType: nc.nc_type,
            severity: nc.severity,
        });

        // 3. Persist the analysis
        const { data: savedInsight } = await supabase
            .from("ai_insights")
            .insert({
                organization_id: nc.organization_id,
                plant_id: nc.plant_id,
                entity_type: "nonconformity",
                entity_id: ncId,
                insight_type: "suggestion",
                status: "info",
                message: `Análise de Causa Raiz para: ${nc.title}`,
                confidence: 0.85,
                raw_response: analysis,
                model_used: "gpt-4o-mini"
            })
            .select()
            .single();

        return { success: true, analysis, insightId: savedInsight?.id };
    } catch (error: any) {
        console.error("AI Analysis error:", error);
        return { success: false, message: error.message || "Erro ao processar análise com IA" };
    }
}

/**
 * Get a global quality insight based on recent NC trends
 */
export async function getGlobalQualityInsightAction() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, message: "Unauthorized" };

    const { data: profile } = await supabase
        .from("user_profiles")
        .select("organization_id, plant_id")
        .eq("id", user.id)
        .single();
    if (!profile) return { success: false, message: "Profile not found" };

    // 1. Check for recent cached global insight (last 4 hours)
    const fourHoursAgo = new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString();
    const { data: existingInsight } = await supabase
        .from("ai_insights")
        .select("*")
        .eq("entity_type", "organization")
        .eq("entity_id", profile.organization_id)
        .eq("insight_type", "suggestion")
        .gt("created_at", fourHoursAgo)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

    if (existingInsight) {
        return { success: true, insight: existingInsight.message, cached: true };
    }

    // 2. Fetch recent NCs to analyze trends
    const { data: ncs } = await supabase
        .from("nonconformities")
        .select("title, nc_type, severity")
        .eq("organization_id", profile.organization_id)
        .order("detected_date", { ascending: false })
        .limit(15);

    if (!ncs || ncs.length < 3) {
        return {
            success: true,
            insight: "Continue a monitorizar as Não Conformidades. Dados insuficientes para análise de tendências profundas."
        };
    }

    // 3. Group by type for the prompt
    const categories = Array.from(new Set(ncs.map(n => n.nc_type)));
    const trends = categories.map(cat => ({
        category: cat,
        count: ncs.filter(n => n.nc_type === cat).length,
        titles: ncs.filter(n => n.nc_type === cat).slice(0, 3).map(n => n.title)
    }));

    try {
        const { generateGlobalQualityAdvice } = await import("@/lib/openai");
        const advice = await generateGlobalQualityAdvice(trends);

        // 4. Persist
        await supabase.from("ai_insights").insert({
            organization_id: profile.organization_id,
            plant_id: profile.plant_id,
            entity_type: "organization",
            entity_id: profile.organization_id,
            insight_type: "suggestion",
            status: "info",
            message: advice,
            confidence: 0.9,
            model_used: "gpt-4o-mini"
        });

        return { success: true, insight: advice };
    } catch (error) {
        console.error("Global Insight error:", error);
        return { success: false, message: "Erro ao gerar insight global" };
    }
}


"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
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

    const { error } = await supabase.from("nonconformities").insert({
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
    });

    if (error) return { success: false, message: error.message };

    revalidatePath("/quality/qms");
    return { success: true, message: `Não Conformidade ${ncNumber} criada` };
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

    const { error } = await supabase.from("eight_d_reports").insert({
        organization_id: userData.organization_id,
        plant_id: plantId,
        nonconformity_id: ncId || null,
        report_number: reportNumber,
        champion: champion,
        problem_description: problemDescription,
        current_step: 1,
        status: "open",
        created_by: user.id,
    });

    if (error) return { success: false, message: error.message };

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
        .eq("id", id);

    if (error) return { success: false, message: error.message };

    revalidatePath("/quality/qms/8d");
    revalidatePath(`/quality/qms/8d/${id}`);
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


"use server";

import { createClient } from "@/lib/supabase/server";
import { getSafeUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { z } from "zod";

/**
 * Zod Schemas
 */
const ShiftSchema = z.object({
    name: z.string().min(2, "O nome deve ter pelo menos 2 caracteres"),
    start_time: z.string(),
    end_time: z.string(),
    description: z.string().optional(),
    plant_id: z.string().uuid("Planta inválida"),
});

const TeamSchema = z.object({
    name: z.string().min(2, "O nome deve ter pelo menos 2 caracteres"),
    description: z.string().optional(),
    supervisor_id: z.string().uuid("Supervisor inválido").optional().nullable(),
    plant_id: z.string().uuid("Planta inválida"),
});

const EmployeeSchema = z.object({
    employee_id: z.string().min(2, "ID do funcionário é obrigatório"),
    full_name: z.string().min(3, "Nome completo é obrigatório"),
    position: z.string().optional().nullable(),
    department: z.string().optional().nullable(),
    team_id: z.string().uuid("Equipa inválida").optional().nullable(),
    hiring_date: z.string().optional().nullable(),
    user_id: z.string().uuid("Utilizador inválido").optional().nullable(),
    plant_id: z.string().uuid("Planta inválida"),
});

const QualificationSchema = z.object({
    employee_id: z.string().uuid(),
    qa_parameter_id: z.string().uuid(),
    status: z.enum(["trainee", "qualified", "expert"]),
    qualified_at: z.string().optional().nullable(),
    valid_until: z.string().optional().nullable(),
});

/**
 * Shift Actions
 */
export async function createShiftAction(formData: FormData) {
    try {
        const user = await getSafeUser();
        const supabase = await createClient();

        const validatedFields = ShiftSchema.safeParse({
            name: formData.get("name"),
            start_time: formData.get("start_time"),
            end_time: formData.get("end_time"),
            description: formData.get("description"),
            plant_id: formData.get("plant_id"),
        });

        if (!validatedFields.success) {
            return { success: false, error: "Campos inválidos", details: validatedFields.error.flatten().fieldErrors };
        }

        const { error } = await supabase
            .from("shifts")
            .insert({
                ...validatedFields.data,
                organization_id: user.organization_id,
            });

        if (error) throw error;

        revalidatePath("/(dashboard)/settings/plant", "layout");
        return { success: true, message: "Turno criado com sucesso" };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

/**
 * Team Actions
 */
export async function createTeamAction(formData: FormData) {
    try {
        const user = await getSafeUser();
        const supabase = await createClient();

        const validatedFields = TeamSchema.safeParse({
            name: formData.get("name"),
            description: formData.get("description"),
            supervisor_id: formData.get("supervisor_id") || null,
            plant_id: formData.get("plant_id"),
        });

        if (!validatedFields.success) {
            return { success: false, error: "Campos inválidos", details: validatedFields.error.flatten().fieldErrors };
        }

        const { error } = await supabase
            .from("teams")
            .insert({
                ...validatedFields.data,
                organization_id: user.organization_id,
            });

        if (error) throw error;

        revalidatePath("/(dashboard)/settings/plant", "layout");
        return { success: true, message: "Equipa criada com sucesso" };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

/**
 * Employee Actions
 */
export async function createEmployeeAction(formData: FormData) {
    try {
        const user = await getSafeUser();
        const supabase = await createClient();

        const validatedFields = EmployeeSchema.safeParse({
            employee_id: formData.get("employee_id"),
            full_name: formData.get("full_name"),
            position: formData.get("position"),
            department: formData.get("department"),
            team_id: formData.get("team_id") || null,
            hiring_date: formData.get("hiring_date") || null,
            user_id: formData.get("user_id") || null,
            plant_id: formData.get("plant_id"),
        });

        if (!validatedFields.success) {
            return { success: false, error: "Campos inválidos", details: validatedFields.error.flatten().fieldErrors };
        }

        const { error } = await supabase
            .from("employees")
            .insert({
                ...validatedFields.data,
                organization_id: user.organization_id,
            });

        if (error) throw error;

        revalidatePath("/(dashboard)/settings/users", "layout");
        return { success: true, message: "Funcionário registado com sucesso" };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

/**
 * Attendance Actions
 */
export async function logAttendanceAction(formData: FormData) {
    try {
        const user = await getSafeUser();
        const supabase = await createClient();

        const employee_id = formData.get("employee_id") as string;
        const check_in = new Date().toISOString();

        const { error } = await supabase
            .from("attendance_logs")
            .insert({
                employee_id,
                check_in,
                organization_id: user.organization_id,
                status: 'present'
            });

        if (error) throw error;

        revalidatePath("/(dashboard)/dashboard", "page");
        return { success: true, message: "Entrada registada" };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

/**
 * Qualification Actions
 */
export async function addQualificationAction(formData: FormData) {
    try {
        const user = await getSafeUser();
        const supabase = await createClient();

        const validatedFields = QualificationSchema.safeParse({
            employee_id: formData.get("employee_id"),
            qa_parameter_id: formData.get("qa_parameter_id"),
            status: formData.get("status"),
            qualified_at: formData.get("qualified_at"),
            valid_until: formData.get("valid_until"),
        });

        if (!validatedFields.success) {
            return { success: false, error: "Campos inválidos" };
        }

        const { error } = await supabase
            .from("analyst_qualifications")
            .upsert({
                ...validatedFields.data,
                organization_id: user.organization_id,
                certified_by: user.id
            });

        if (error) throw error;

        revalidatePath("/(dashboard)/settings/users", "layout");
        return { success: true, message: "Qualificação registada" };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

/**
 * Training Record Schema
 */
const TrainingRecordSchema = z.object({
    employee_id: z.string().uuid(),
    title: z.string().min(3, "Título da formação é obrigatório"),
    category: z.enum(["onboarding", "compliance", "technical", "safety", "soft_skills", "other"]),
    completion_date: z.string(),
    expiry_date: z.string().optional().nullable(),
    score: z.coerce.number().min(0).max(100).optional().nullable(),
    certificate_url: z.string().optional().nullable(),
    effectiveness_evaluated_at: z.string().optional().nullable(),
    effectiveness_result: z.string().optional().nullable(),
    evaluator_id: z.string().uuid().optional().nullable(),
});

/**
 * Create Training Record Action
 */
export async function createTrainingRecordAction(formData: FormData) {
    try {
        const user = await getSafeUser();
        const supabase = await createClient();

        const validatedFields = TrainingRecordSchema.safeParse({
            employee_id: formData.get("employee_id"),
            title: formData.get("title"),
            category: formData.get("category"),
            completion_date: formData.get("completion_date"),
            expiry_date: formData.get("expiry_date") || null,
            score: formData.get("score") || null,
            certificate_url: formData.get("certificate_url") || null,
            effectiveness_evaluated_at: formData.get("effectiveness_evaluated_at") || null,
            effectiveness_result: formData.get("effectiveness_result") || null,
            evaluator_id: formData.get("evaluator_id") || null,
        });

        if (!validatedFields.success) {
            return { success: false, error: "Campos inválidos", details: validatedFields.error.flatten().fieldErrors };
        }

        const { error } = await supabase
            .from("training_records")
            .insert({
                ...validatedFields.data,
                organization_id: user.organization_id,
            });

        if (error) throw error;

        revalidatePath("/(dashboard)/quality/training", "layout");
        return { success: true, message: "Registo de formação adicionado com sucesso" };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

/**
 * Evaluate Training Effectiveness Action
 */
export async function evaluateTrainingAction(formData: FormData) {
    try {
        const user = await getSafeUser();
        const supabase = await createClient();

        const record_id = formData.get("record_id") as string;
        const effectiveness_result = formData.get("effectiveness_result") as string;
        const effectiveness_evaluated_at = new Date().toISOString().split('T')[0];

        const { error } = await supabase
            .from("training_records")
            .update({
                effectiveness_result,
                effectiveness_evaluated_at,
                evaluator_id: user.id
            })
            .eq("id", record_id);

        if (error) throw error;

        revalidatePath("/(dashboard)/quality/training", "layout");
        return { success: true, message: "Avaliação de eficácia registada" };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}



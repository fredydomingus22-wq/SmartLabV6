"use server";

import { createClient } from "@/lib/supabase/server";
import { getSafeUser } from "@/lib/auth.server";
import { revalidatePath } from "next/cache";
import { z } from "zod";

// --- Schemas ---
const ModuleSchema = z.object({
    title: z.string().min(3),
    description: z.string().optional(),
    type: z.enum(['document', 'video', 'quiz', 'external']),
    document_id: z.string().optional().nullable(),
    content_url: z.string().optional().nullable(),
    duration_minutes: z.coerce.number().min(1)
});

const PlanSchema = z.object({
    title: z.string().min(3),
    description: z.string().optional(),
    job_titles: z.array(z.string()).min(1),
    recurrence_interval: z.string().optional() // e.g. "1 year"
});

// --- Actions ---

export async function createTrainingModule(data: z.infer<typeof ModuleSchema>) {
    const supabase = await createClient();
    const user = await getSafeUser();

    // Parse & Validate
    const parsed = ModuleSchema.safeParse(data);
    if (!parsed.success) return { error: "Validation failed" };

    const { error } = await supabase
        .from("training_modules")
        .insert({
            ...parsed.data,
            organization_id: user.organization_id,
            created_by: user.id
        });

    if (error) return { error: error.message };
    revalidatePath("/quality/training/manager/modules");
    return { success: true };
}

export async function createTrainingPlan(data: z.infer<typeof PlanSchema>) {
    const supabase = await createClient();
    const user = await getSafeUser();

    const parsed = PlanSchema.safeParse(data);
    if (!parsed.success) return { error: "Validation failed" };

    const { error } = await supabase
        .from("training_plans")
        .insert({
            ...parsed.data,
            organization_id: user.organization_id
        });

    if (error) return { error: error.message };
    revalidatePath("/quality/training/manager/plans");
    return { success: true };
}

export async function assignModuleToPlan(planId: string, moduleId: string) {
    const supabase = await createClient();

    const { error } = await supabase
        .from("training_plan_modules")
        .insert({
            plan_id: planId,
            module_id: moduleId
        });

    if (error) return { error: error.message };
    revalidatePath("/quality/training/manager/plans");
    return { success: true };
}


// --- Quiz Authoring ---

const QuestionSchema = z.object({
    quiz_id: z.string().uuid(),
    question_text: z.string().min(3),
    question_type: z.enum(['single_choice', 'multiple_choice', 'true_false']),
    points: z.coerce.number().min(1),
    options: z.array(z.object({
        id: z.string(),
        text: z.string(),
        is_correct: z.boolean()
    })).min(2)
});

export async function createQuizForModule(moduleId: string, passingScore: number = 80) {
    const supabase = await createClient();

    // Check if exists
    const { data: existing } = await supabase.from("training_quizzes").select("id").eq("module_id", moduleId).single();
    if (existing) return { success: true, quizId: existing.id };

    const { data, error } = await supabase
        .from("training_quizzes")
        .insert({
            module_id: moduleId,
            passing_score: passingScore,
            settings: { shuffle: true }
        })
        .select()
        .single();

    if (error) return { error: error.message };
    return { success: true, quizId: data.id };
}

export async function addQuestionToQuiz(data: z.infer<typeof QuestionSchema>) {
    const supabase = await createClient();

    // Validate
    const parsed = QuestionSchema.safeParse(data);
    if (!parsed.success) return { error: "Validation failed" };

    const { error } = await supabase
        .from("quiz_questions")
        .insert({
            quiz_id: parsed.data.quiz_id,
            question_text: parsed.data.question_text,
            question_type: parsed.data.question_type,
            points: parsed.data.points,
            order_index: 99, // default to end
            options: parsed.data.options
        });

    if (error) return { error: error.message };
    revalidatePath("/quality/training/manager/modules");
    return { success: true };
}
export async function verifySignature(password: string) {
    const supabase = await createClient();
    const user = await getSafeUser();

    // Supabase generic signInWithPassword doesn't directly verify current user password easily without re-assigning session.
    // However, we can try to "sign in" with the current email provided in user object.

    const { error } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: password
    });

    if (error) return { error: "Invalid password for signature" };

    // If successful, we return a success signal. We do NOT want to overwrite the session if possible, 
    // but signInWithPassword updates the session. Ideally we use an RPC or a dedicated auth endpoint.
    // For this implementing, successfully signing in is proof. 
    // Note: This refreshes the session.

    // 21 CFR Part 11: Audit Trail
    await supabase.from("system_audit_logs").insert({
        actor_id: user.id,
        action: 'ELECTRONIC_SIGNATURE_VERIFIED',
        entity_type: 'USER_SIGNATURE',
        entity_id: user.id,
        metadata: {
            timestamp: new Date().toISOString(),
            verification_method: 'PASSWORD_RE_ENTRY',
            compliant: true
        }
    });

    return { success: true };
}

export async function reorderQuizQuestions(quizId: string, questionIds: string[]) {
    const supabase = await createClient();

    // Batch update order_index
    const updates = questionIds.map((id, index) => ({
        id: id,
        quiz_id: quizId,
        order_index: index,
        updated_at: new Date().toISOString()
    }));

    const { error } = await supabase
        .from("quiz_questions")
        .upsert(updates);

    if (error) return { error: error.message };

    revalidatePath(`/quality/training/manager/modules`);
    return { success: true };
}

export async function deleteQuizQuestion(quizId: string, questionId: string) {
    const supabase = await createClient();

    const { error } = await supabase
        .from("quiz_questions")
        .delete()
        .eq("id", questionId)
        .eq("quiz_id", quizId);

    if (error) return { error: error.message };

    revalidatePath(`/quality/training/manager/modules`);
    return { success: true };
}

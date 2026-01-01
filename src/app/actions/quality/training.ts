"use server";

import { createClient } from "@/lib/supabase/server";
import { getSafeUser } from "@/lib/auth.server";
import { revalidatePath } from "next/cache";
import { z } from "zod";

// --- Types ---

export interface TrainingAssignment {
    id: string;
    module_id: string;
    module_title: string;
    module_type: 'document' | 'video' | 'quiz' | 'external';
    status: 'assigned' | 'in_progress' | 'completed' | 'failed' | 'overdue' | 'void';
    due_date: string | null;
    completed_at: string | null;
    score: number | null;
    document_id?: string;
    content_url?: string;
    duration_minutes: number;
}

export interface QuizQuestion {
    id: string;
    question_text: string;
    question_type: 'single_choice' | 'multiple_choice' | 'true_false';
    options: { id: string; text: string; is_correct?: boolean }[];
    points: number;
}

// --- Actions ---

export async function getMyTrainingAssignments(): Promise<{ data: TrainingAssignment[] | null; error: string | null }> {
    try {
        const supabase = await createClient();
        const user = await getSafeUser();

        const { data, error } = await supabase
            .from("training_assignments")
            .select(`
                id,
                status,
                due_date,
                completed_at,
                score,
                module:training_modules (
                    id,
                    title,
                    type,
                    document_id,
                    content_url,
                    duration_minutes
                )
            `)
            .eq("user_id", user.id)
            .order("due_date", { ascending: true });

        if (error) throw new Error(error.message);

        // Transform to flat structure
        const assignments: TrainingAssignment[] = data.map((item: any) => ({
            id: item.id,
            module_id: item.module.id,
            module_title: item.module.title,
            module_type: item.module.type,
            status: item.status,
            due_date: item.due_date,
            completed_at: item.completed_at,
            score: item.score,
            document_id: item.module.document_id,
            content_url: item.module.content_url,
            duration_minutes: item.module.duration_minutes
        }));

        return { data: assignments, error: null };
    } catch (error: any) {
        console.error("Error fetching training assignments:", error);
        return { data: null, error: error.message };
    }
}

export async function getAssignmentDetails(assignmentId: string) {
    const supabase = await createClient();
    const user = await getSafeUser();

    // Verify ownership
    const { data: assignment, error } = await supabase
        .from("training_assignments")
        .select(`
            id,
            status,
            user_id,
            module:training_modules (
                id,
                title,
                description,
                type,
                content_url,
                document_id,
                document_version
            )
        `)
        .eq("id", assignmentId)
        .single();

    if (error || !assignment) return { error: "Assignment not found" };
    if (assignment.user_id !== user.id) return { error: "Unauthorized" };

    // Defensive unwrap for Supabase array inference
    const module = Array.isArray(assignment.module) ? assignment.module[0] : assignment.module;

    // FIX: Generate Signed URL if content_url is a storage path
    // Assuming bucket convention "training-content" or "documents"
    // Heuristic: If it doesn't start with http, assume it's a path
    if (module?.content_url && !module.content_url.startsWith('http')) {
        const { data: signed } = await supabase
            .storage
            .from('documents') // Defaulting to documents bucket for now
            .createSignedUrl(module.content_url, 3600); // 1 hour

        if (signed?.signedUrl) {
            module.content_url = signed.signedUrl;
        }
    }

    return { data: { ...assignment, module } };
}

export async function startTraining(assignmentId: string) {
    const supabase = await createClient();
    const user = await getSafeUser();

    const { error } = await supabase
        .from("training_assignments")
        .update({ status: 'in_progress' })
        .eq("id", assignmentId)
        .eq("user_id", user.id)
        .eq("status", "assigned"); // Only transition from assigned

    if (error) return { error: error.message };

    revalidatePath("/quality/training");
    return { success: true };
}

export async function completeTrainingDocument(assignmentId: string, timeSpentSeconds: number) {
    const supabase = await createClient();
    const user = await getSafeUser();

    // Determine completion logic - if video/doc, we might auto-complete. 
    // If quiz exists, we don't complete yet.
    // For now, assuming simple document read = complete logic if no quiz.

    // Check if module has a quiz
    const { data: assignment } = await supabase
        .from("training_assignments")
        .select("module_id")
        .eq("id", assignmentId)
        .single();

    if (!assignment) return { error: "Not found" };

    const { count } = await supabase
        .from("training_quizzes")
        .select("*", { count: 'exact', head: true })
        .eq("module_id", assignment.module_id);

    const hasQuiz = (count || 0) > 0;

    if (hasQuiz) {
        // Just update time, don't complete
        await supabase
            .from("training_assignments")
            .update({ time_spent_seconds: timeSpentSeconds })
            .eq("id", assignmentId);
        return { success: true, nextStep: 'quiz' };
    } else {
        // Complete it
        const { error } = await supabase
            .from("training_assignments")
            .update({
                status: 'completed',
                completed_at: new Date().toISOString(),
                time_spent_seconds: timeSpentSeconds
            })
            .eq("id", assignmentId)
            .eq("user_id", user.id);

        if (error) return { error: error.message };
        revalidatePath("/quality/training");
        return { success: true, nextStep: 'done' };
    }
}

export async function submitQuizAttempt(assignmentId: string, answers: any[], signatureId?: string) {
    const supabase = await createClient();
    const user = await getSafeUser();

    // 1. Calculate Score
    // Fetch questions and correct answers
    const { data: assignment } = await supabase
        .from("training_assignments")
        .select("module_id")
        .eq("id", assignmentId)
        .single();

    if (!assignment) return { error: "Assignment not found" };

    const { data: quiz } = await supabase
        .from("training_quizzes")
        .select("id, passing_score")
        .eq("module_id", assignment.module_id)
        .single();

    if (!quiz) return { error: "Quiz not found" };

    const { data: questions } = await supabase
        .from("quiz_questions")
        .select("id, points, options")
        .eq("quiz_id", quiz.id);

    let totalPoints = 0;
    let earnedPoints = 0;

    if (questions) {
        questions.forEach(q => {
            totalPoints += q.points;
            // Find user answer
            const userAns = answers.find((a: any) => a.questionId === q.id);
            if (userAns) {
                // Check correctness (assuming single choice for simplicity)
                // Start with assumption that options is array of objects
                const correctOption = (q.options as any[]).find((opt: any) => opt.is_correct);
                if (correctOption && userAns.selectedOptionId === correctOption.id) {
                    earnedPoints += q.points;
                }
            }
        });
    }

    const scorePercent = totalPoints > 0 ? (earnedPoints / totalPoints) * 100 : 100;
    const passed = scorePercent >= (quiz.passing_score || 80);

    // 2. Record Attempt
    const { error: attemptError } = await supabase
        .from("quiz_attempts")
        .insert({
            assignment_id: assignmentId,
            score: Math.round(scorePercent),
            passed,
            answers: answers,
            finished_at: new Date().toISOString()
        });

    if (attemptError) return { error: attemptError.message };

    // 3. Update Assignment Status
    if (passed) {
        await supabase
            .from("training_assignments")
            .update({
                status: 'completed',
                completed_at: new Date().toISOString(),
                score: Math.round(scorePercent),
                signature_id: signatureId // Link e-signature if provided
            })
            .eq("id", assignmentId);

        revalidatePath("/quality/training");
        return { success: true, passed: true, score: scorePercent };
    } else {
        await supabase
            .from("training_assignments")
            .update({
                status: 'failed',
                score: Math.round(scorePercent)
            })
            .eq("id", assignmentId);

        return { success: true, passed: false, score: scorePercent };
    }
}

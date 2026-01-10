import { getAssignmentDetails } from "@/app/actions/quality/training";
import CoursePlayer from "./course-player";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

interface PageProps {
    params: Promise<{ id: string }>;
}

export default async function TrainingPlayerPage({ params }: PageProps) {
    const { id } = await params;
    const { data: assignment, error } = await getAssignmentDetails(id);

    if (error || !assignment) {
        notFound();
    }

    // Fetch quiz questions if they exist
    const supabase = await createClient();
    let quizQuestions: any[] | undefined = undefined;

    // Check if module has quiz. Supabase + TS sometimes infers joins as arrays.
    const moduleData = Array.isArray(assignment.module) ? assignment.module[0] : assignment.module;
    if (moduleData?.id) {
        const { data: quiz } = await supabase
            .from("training_quizzes")
            .select("id")
            .eq("module_id", moduleData.id)
            .single();

        if (quiz) {
            const { data: questions } = await supabase
                .from("quiz_questions")
                .select("*")
                .eq("quiz_id", quiz.id)
                .order("order_index", { ascending: true });

            quizQuestions = questions ?? undefined;
        }
    }

    return (
        <CoursePlayer assignment={assignment} quizQuestions={quizQuestions} />
    );
}

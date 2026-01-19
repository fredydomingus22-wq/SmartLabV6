import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { ModuleDetailClient } from "./module-detail-client";

export const dynamic = 'force-dynamic';

export default async function ModuleDetailPage(props: { params: Promise<{ id: string }> }) {
    const { id } = await props.params;
    const supabase = await createClient();

    // Fetch Module
    const { data: moduleData, error } = await supabase
        .from("training_modules")
        .select("*")
        .eq("id", id)
        .single();

    if (error || !moduleData) notFound();

    // Fetch Quiz Config if exists
    let quizData = null;
    let questions: any[] = [];

    if (moduleData.type === 'quiz') {
        const { data: quiz } = await supabase
            .from("training_quizzes")
            .select("*")
            .eq("module_id", id)
            .single();

        if (quiz) {
            quizData = quiz;
            const { data: qList } = await supabase
                .from("quiz_questions")
                .select("*")
                .eq("quiz_id", quiz.id)
                .order("order_index", { ascending: true });

            questions = qList || [];
        }
    }

    // Sort options to match interface expectation if they are JSONB
    const typedQuestions = questions.map((q: any) => ({
        ...q,
        options: Array.isArray(q.options) ? q.options : []
    }));

    return (
        <ModuleDetailClient
            moduleData={moduleData}
            quizData={quizData}
            questions={typedQuestions}
        />
    );
}

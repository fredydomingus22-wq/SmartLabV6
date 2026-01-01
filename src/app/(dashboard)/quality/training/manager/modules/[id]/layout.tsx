import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import ModuleDetailPage from "./page";

export const dynamic = 'force-dynamic';

export default async function Layout(props: any) {
    const { params, children } = props;
    const { id } = await params;
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

    return (
        <ModuleDetailPage
            moduleData={moduleData}
            quizData={quizData}
            questions={questions}
        />
    );
}

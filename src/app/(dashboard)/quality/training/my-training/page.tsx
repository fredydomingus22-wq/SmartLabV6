import { Suspense } from "react";
import { getMyTrainingAssignments } from "@/app/actions/quality/training";
import { MyTrainingClient } from "./my-training-client";
import { FileText, GraduationCap } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";

export const dynamic = "force-dynamic";

export const metadata = {
    title: "My Training | SmartLab",
    description: "Access your assigned training modules and quizzes."
};

export default async function MyTrainingPage() {
    const { data: assignments, error } = await getMyTrainingAssignments();

    return (
        <div className="space-y-6 px-6 pb-20">
            <PageHeader
                variant="blue"
                icon={<GraduationCap className="h-4 w-4" />}
                overline="Conformidade e Qualificações"
                title="LIMS Academy"
                description="Faça a gestão das suas competências e requisitos críticos de conformidade."
                backHref="/quality"
                sticky={false}
            />

            <Suspense fallback={<div className="text-muted-foreground p-8 text-center animate-pulse">Carregando formação...</div>}>
                {error ? (
                    <div className="p-6 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400">
                        Error loading assignments: {error}
                    </div>
                ) : (
                    <MyTrainingClient assignments={assignments || []} />
                )}
            </Suspense>
        </div>
    );
}

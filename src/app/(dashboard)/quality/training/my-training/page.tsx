import { Suspense } from "react";
import { getMyTrainingAssignments } from "@/app/actions/quality/training";
import { MyTrainingClient } from "./my-training-client";
import { FileText } from "lucide-react";

export const metadata = {
    title: "My Training | SmartLab",
    description: "Access your assigned training modules and quizzes."
};

export default async function MyTrainingPage() {
    const { data: assignments, error } = await getMyTrainingAssignments();

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-8">
            <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2 text-blue-400 font-semibold mb-1">
                    <div className="p-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20">
                        <FileText className="w-4 h-4" />
                    </div>
                    <span className="text-[10px] uppercase tracking-[0.2em]">Compliance & Qualifications</span>
                </div>
                <h1 className="text-4xl font-black tracking-tight bg-gradient-to-br from-white to-white/60 bg-clip-text text-transparent">
                    LIMS Academy
                </h1>
                <p className="text-slate-400 text-sm font-medium tracking-wide">
                    Manage your professional growth and compliance requirements.
                </p>
            </div>

            <Suspense fallback={<div className="text-muted-foreground">Loading training...</div>}>
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

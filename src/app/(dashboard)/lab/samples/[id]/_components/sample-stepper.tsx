"use client";

import { cn } from "@/lib/utils";
import { Check, ClipboardCheck, FlaskConical, ShieldCheck, Truck } from "lucide-react";

type StageStatus = "pending" | "current" | "completed" | "rejected";

interface Stage {
    id: string;
    label: string;
    description: string;
    icon: any;
}

interface SampleStepperProps {
    currentStatus: string;
    className?: string;
}

const STAGES: Stage[] = [
    { id: "analysis", label: "Análise", description: "Execução laboratorial", icon: FlaskConical },
    { id: "review", label: "Revisão Técnica", description: "Verificação de supervisor", icon: ClipboardCheck },
    { id: "release", label: "Libertação", description: "Gestão de qualidade", icon: ShieldCheck },
];

export function SampleStepper({ currentStatus, className }: SampleStepperProps) {
    const getStageStatus = (stageId: string): StageStatus => {
        if (currentStatus === "rejected") return "rejected";

        switch (stageId) {
            case "analysis":
                if (["registered", "collected", "in_analysis"].includes(currentStatus)) return "current";
                return "completed";
            case "review":
                if (currentStatus === "under_review") return "current";
                if (["approved", "released"].includes(currentStatus)) return "completed";
                return "pending";
            case "release":
                if (currentStatus === "approved") return "current";
                if (currentStatus === "released") return "completed";
                return "pending";
            default:
                return "pending";
        }
    };

    return (
        <div className={cn("w-full py-6", className)}>
            <div className="relative flex justify-between">
                {/* Connecting Lines */}
                <div className="absolute top-5 left-0 w-full h-0.5 bg-slate-800 -z-10" aria-hidden="true">
                    <div
                        className="h-full bg-blue-500 transition-all duration-500 ease-in-out"
                        style={{
                            width: currentStatus === "released" ? "100%" :
                                currentStatus === "approved" ? "66%" :
                                    currentStatus === "under_review" ? "33%" : "0%"
                        }}
                    />
                </div>

                {STAGES.map((stage, idx) => {
                    const status = getStageStatus(stage.id);
                    const Icon = stage.icon;

                    return (
                        <div key={stage.id} className="flex flex-col items-center group">
                            <div
                                className={cn(
                                    "w-10 h-10 rounded-xl border-2 flex items-center justify-center transition-all duration-300 shadow-lg",
                                    status === "completed" && "bg-emerald-500 border-emerald-400 text-white shadow-emerald-500/20",
                                    status === "current" && "bg-blue-600 border-blue-400 text-white shadow-blue-500/20 scale-110",
                                    status === "pending" && "bg-slate-900 border-slate-700 text-slate-500",
                                    status === "rejected" && "bg-rose-600 border-rose-400 text-white shadow-rose-500/20"
                                )}
                            >
                                {status === "completed" ? (
                                    <Check className="h-5 w-5" />
                                ) : (
                                    <Icon className="h-5 w-5" />
                                )}
                            </div>
                            <div className="mt-3 text-center">
                                <p className={cn(
                                    "text-[10px] font-black uppercase tracking-widest transition-colors",
                                    status === "completed" ? "text-emerald-400" :
                                        status === "current" ? "text-blue-400" : "text-slate-500"
                                )}>
                                    {stage.label}
                                </p>
                                <p className="text-[9px] text-slate-500 font-medium hidden sm:block">
                                    {stage.description}
                                </p>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

"use client";

import { cn } from "@/lib/utils";
import { Check, Circle, Clock, ShieldCheck, Lock } from "lucide-react";

interface CAPARoutingProps {
    currentStatus: string;
}

const steps = [
    { key: "planned", label: "Planeada", icon: Clock },
    { key: "in_progress", label: "Em Execução", icon: Circle },
    { key: "completed", label: "Concluída", icon: Check },
    { key: "verified", label: "Verificada", icon: ShieldCheck },
    { key: "closed", label: "Fechada", icon: Lock },
];

export function CAPARouting({ currentStatus }: CAPARoutingProps) {
    const currentIndex = steps.findIndex(s => s.key === currentStatus);

    return (
        <div className="w-full py-4">
            <div className="flex items-center justify-between relative max-w-4xl mx-auto">
                {/* Connection Line */}
                <div className="absolute top-1/2 left-0 w-full h-0.5 bg-slate-800 -translate-y-1/2 -z-0" />
                <div
                    className="absolute top-1/2 left-0 h-0.5 bg-indigo-500 -translate-y-1/2 -z-0 transition-all duration-700"
                    style={{ width: `${(currentIndex / (steps.length - 1)) * 100}%` }}
                />

                {steps.map((step, index) => {
                    const isCompleted = index < currentIndex;
                    const isCurrent = index === currentIndex;
                    const Icon = step.icon;

                    return (
                        <div key={step.key} className="relative z-10 flex flex-col items-center gap-2">
                            <div className={cn(
                                "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-500 shadow-xl",
                                isCompleted ? "bg-indigo-500 border-indigo-400 text-white" :
                                    isCurrent ? "bg-slate-900 border-indigo-500 text-indigo-400 scale-110 shadow-indigo-500/20" :
                                        "bg-slate-900 border-slate-800 text-slate-500"
                            )}>
                                <Icon className={cn("h-5 w-5", isCurrent && "animate-pulse")} />
                            </div>
                            <span className={cn(
                                "text-[10px] font-bold uppercase tracking-tight whitespace-nowrap",
                                isCurrent ? "text-indigo-400" : isCompleted ? "text-slate-300" : "text-slate-600"
                            )}>
                                {step.label}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

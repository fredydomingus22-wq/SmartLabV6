"use client";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Activity, Beaker, CheckCircle2, Clock, FlaskConical, Scale } from "lucide-react";

// Update Props to match usage in page.tsx
interface KPIProps {
    stats: {
        total: number;
        pending: number;
        in_analysis: number;
        completed: number;
        tat: string;
    }
}

export function KPICards({ stats }: KPIProps) {
    const kpis = [
        { label: "Pendentes", value: stats.pending, color: "text-amber-500" },
        { label: "Em Análise", value: stats.in_analysis, color: "text-violet-500" },
        { label: "Concluídas", value: stats.completed, color: "text-emerald-500" },
        { label: "TAT Médio", value: stats.tat, color: "text-foreground/70" },
        { label: "Total", value: stats.total, color: "text-blue-500" },
    ];

    return (
        <div className="flex flex-wrap items-center gap-x-8 gap-y-4 px-4 py-3 bg-muted/20 rounded-xl border border-border/30">
            {kpis.map((kpi, idx) => (
                <div key={idx} className="flex items-baseline gap-2">
                    <span className={cn("text-xl font-bold tracking-tight", kpi.color)}>
                        {kpi.value}
                    </span>
                    <span className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground/60 whitespace-nowrap">
                        {kpi.label}
                    </span>
                    {idx < kpis.length - 1 && (
                        <div className="hidden sm:block ml-6 h-4 w-px bg-border/40 self-center" />
                    )}
                </div>
            ))}
        </div>
    );
}


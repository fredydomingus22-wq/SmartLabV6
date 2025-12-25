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
        {
            label: "Total Amostras",
            value: stats.total,
            icon: FlaskConical,
            color: "text-blue-600 dark:text-blue-400",
            bg: "bg-blue-50 dark:bg-blue-950/20",
        },
        {
            label: "Pendentes",
            value: stats.pending,
            icon: Clock,
            color: "text-amber-600 dark:text-amber-400",
            bg: "bg-amber-50 dark:bg-amber-950/30",
        },
        {
            label: "Em Análise",
            value: stats.in_analysis,
            icon: Beaker,
            color: "text-violet-600 dark:text-violet-400",
            bg: "bg-violet-50 dark:bg-violet-950/30",
        },
        {
            label: "Concluídas",
            value: stats.completed,
            icon: CheckCircle2,
            color: "text-emerald-600 dark:text-emerald-400",
            bg: "bg-emerald-50 dark:bg-emerald-950/30",
        },
        {
            label: "Tempo Médio (TAT)",
            value: stats.tat,
            icon: Activity,
            color: "text-slate-600 dark:text-slate-400",
            bg: "bg-muted",
        },
    ];

    return (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 mb-4 md:mb-8">
            {kpis.map((kpi, idx) => (
                <Card key={idx} className="border-border/50 shadow-sm hover:shadow-md transition-shadow duration-200 bg-card">
                    <CardContent className="p-3 sm:p-4 flex flex-col justify-between h-full">
                        <div className="flex justify-between items-start mb-2">
                            <div className={cn("p-2 rounded-lg", kpi.bg)}>
                                <kpi.icon className={cn("h-4 w-4", kpi.color)} />
                            </div>
                        </div>
                        <div>
                            <h3 className="text-lg sm:text-2xl font-bold text-card-foreground tracking-tight">
                                {kpi.value}
                            </h3>
                            <p className="text-xs text-muted-foreground font-medium mt-1">
                                {kpi.label}
                            </p>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}

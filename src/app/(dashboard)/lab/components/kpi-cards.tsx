"use client";

import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { Activity, Beaker, CheckCircle2, Clock, FlaskConical, Scale, Database, TrendingUp } from "lucide-react";

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
        { label: "Pendentes", value: stats.pending, color: "text-amber-500", icon: Clock, bg: "from-amber-500/10 to-transparent" },
        { label: "Em Análise", value: stats.in_analysis, color: "text-violet-500", icon: Beaker, bg: "from-violet-500/10 to-transparent" },
        { label: "Concluídas", value: stats.completed, color: "text-emerald-500", icon: CheckCircle2, bg: "from-emerald-500/10 to-transparent" },
        { label: "TAT Médio", value: stats.tat, color: "text-blue-400", icon: TrendingUp, bg: "from-blue-500/10 to-transparent" },
        { label: "Total Amostras", value: stats.total, color: "text-slate-200", icon: Database, bg: "from-slate-500/10 to-transparent" },
    ];

    return (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {kpis.map((kpi, idx) => (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    key={idx}
                    className={cn(
                        "relative overflow-hidden glass p-4 rounded-3xl border-slate-800/50 flex flex-col justify-between h-32 backdrop-blur-md transition-all group hover:border-emerald-500/20",
                        "bg-gradient-to-br", kpi.bg
                    )}
                >
                    <div className="flex justify-between items-start">
                        <div className={cn("p-2 rounded-xl bg-slate-950/50 border border-slate-800 group-hover:scale-110 transition-transform", kpi.color)}>
                            <kpi.icon className="h-4 w-4" />
                        </div>
                        <span className={cn("text-2xl font-bold tracking-tighter", kpi.color)}>
                            {kpi.value}
                        </span>
                    </div>

                    <div>
                        <p className="text-[10px] uppercase font-bold tracking-widest text-slate-500 mb-1 group-hover:text-slate-300 transition-colors">
                            {kpi.label}
                        </p>
                        <div className="h-1 w-full bg-slate-950/50 rounded-full overflow-hidden">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: "100%" }}
                                transition={{ duration: 1, delay: idx * 0.2 }}
                                className={cn("h-full opacity-30", kpi.color.replace("text-", "bg-"))}
                            />
                        </div>
                    </div>
                </motion.div>
            ))}
        </div>
    );
}


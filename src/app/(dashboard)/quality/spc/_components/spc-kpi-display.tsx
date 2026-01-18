"use client";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Activity, TrendingUp, TrendingDown, CheckCircle2, AlertTriangle, Target } from "lucide-react";

interface SPCKPIProps {
    statistics: {
        cpk: number | null;
        ppk: number | null;
        mean: number;
        sigmaShort: number;
        violations: any[];
    } | null;
    loading?: boolean;
}

export function SPCKPIDisplay({ statistics, loading }: SPCKPIProps) {
    if (!statistics && !loading) return null;

    const kpis = [
        {
            title: "Capacidade (Cpk)",
            value: statistics?.cpk?.toFixed(2) || "---",
            status: (statistics?.cpk || 0) >= 1.33 ? "success" : (statistics?.cpk || 0) >= 1.0 ? "warning" : "error",
            icon: Target,
            subtext: "Meta: > 1.33"
        },
        {
            title: "Performance (Ppk)",
            value: statistics?.ppk?.toFixed(2) || "---",
            status: "neutral",
            icon: Activity,
            subtext: "Longo Prazo"
        },
        {
            title: "Média Central",
            value: statistics?.mean?.toFixed(2) || "---",
            status: "neutral",
            icon: TrendingUp,
            subtext: `σ: ${statistics?.sigmaShort?.toFixed(3) || "---"}`
        },
        {
            title: "Estabilidade",
            value: statistics?.violations?.length === 0 ? "Estável" : "Instável",
            status: statistics?.violations?.length === 0 ? "success" : "error",
            icon: statistics?.violations?.length === 0 ? CheckCircle2 : AlertTriangle,
            subtext: statistics?.violations?.length ? `${statistics.violations.length} anomalias` : "Sem violações"
        }
    ];

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {kpis.map((kpi, idx) => (
                <Card key={idx} className="relative overflow-hidden border-white/10 bg-slate-950/50 backdrop-blur-md shadow-xl transition-all hover:bg-slate-900/60 group">
                    {/* Glow Effect */}
                    <div className={cn(
                        "absolute -right-6 -top-6 h-24 w-24 rounded-full blur-3xl opacity-20 transition-all group-hover:opacity-40",
                        kpi.status === 'success' && "bg-emerald-500",
                        kpi.status === 'warning' && "bg-amber-500",
                        kpi.status === 'error' && "bg-rose-500",
                        kpi.status === 'neutral' && "bg-blue-500"
                    )} />

                    <div className="p-5">
                        <div className="flex justify-between items-start mb-2">
                            <p className="text-xs font-bold uppercase tracking-widest text-slate-500">{kpi.title}</p>
                            <kpi.icon className={cn(
                                "h-4 w-4",
                                kpi.status === 'success' && "text-emerald-500",
                                kpi.status === 'warning' && "text-amber-500",
                                kpi.status === 'error' && "text-rose-500",
                                kpi.status === 'neutral' && "text-blue-500"
                            )} />
                        </div>
                        <div className="flex items-end gap-2">
                            {loading ? (
                                <div className="h-8 w-24 bg-slate-800/50 animate-pulse rounded" />
                            ) : (
                                <h3 className="text-2xl font-black text-white tracking-tight">{kpi.value}</h3>
                            )}
                        </div>
                        <p className="text-[10px] text-slate-400 font-mono mt-1">{kpi.subtext}</p>
                    </div>
                </Card>
            ))}
        </div>
    );
}

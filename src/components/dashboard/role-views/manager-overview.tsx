"use client";

import React from "react";
import { TrendingUp, ShieldCheck, AlertTriangle, Clock, Users } from "lucide-react";
import { KPISparkCard } from "@/components/ui/kpi-spark-card";
import {
    Card as ShadcnCard,
    CardContent as ShadcnCardContent,
    CardHeader as ShadcnCardHeader,
    CardTitle as ShadcnCardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface ManagerOverviewProps {
    stats: any;
    products?: any[];
    parameters?: any[];
    initialTrendData?: any[];
    initialSpecs?: any[];
}

const generateSparkline = () => Array.from({ length: 7 }, () => Math.floor(Math.random() * 20) + 10).map(v => ({ value: v }));

export function ManagerOverview({ stats }: ManagerOverviewProps) {
    const sparklines = stats?.sparklines || {
        samples: Array(7).fill({ value: 0 }),
        deviations: Array(7).fill({ value: 0 }),
        compliance: Array(7).fill({ value: 100 })
    };

    return (
        <div className="space-y-10">
            {/* 📊 STANDARDIZED KPI GRID */}
            <section className="space-y-6">
                <div className="flex items-center justify-between">
                    <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500 flex items-center gap-2">
                        <TrendingUp className="h-3 w-3" />
                        Executive Dashboard
                    </h2>
                    <Badge variant="outline" className="text-[9px] font-bold uppercase tracking-widest border-slate-800 text-slate-400">
                        Strategic Metrics
                    </Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <KPISparkCard
                        title="Eficiência Global"
                        value={`${stats?.overallEfficiency || 0}%`}
                        description="OEE Médio da Unidade"
                        trend={2.4}
                        sparklineData={generateSparkline()}
                        color="indigo"
                    />
                    <KPISparkCard
                        title="Conformidade QMS"
                        value={`${stats?.qualityCompliance || stats?.complianceRate.toFixed(1) || 0}%`}
                        description="Audit Readiness Rate"
                        trend={stats?.trends?.compliance}
                        sparklineData={sparklines.compliance}
                        color="emerald"
                    />
                    <KPISparkCard
                        title="Risk Index"
                        value={stats?.pendingCritical || stats?.recentDeviations || 0}
                        description="Incidentes Alta Priority"
                        trend={stats?.trends?.deviations}
                        sparklineData={sparklines.deviations}
                        color="amber"
                    />
                    <KPISparkCard
                        title="Workload (Batches)"
                        value={stats?.activeBatches || 0}
                        description="Lotes em Processamento"
                        trend={stats?.trends?.workload}
                        sparklineData={sparklines.samples}
                        color="purple"
                    />
                </div>
            </section>

            {/* 📈 OPERATIONAL OVERLAYS */}
            <div className="grid gap-8 lg:grid-cols-3">
                <ShadcnCard className="lg:col-span-2 bg-card border-slate-800 shadow-xl overflow-hidden">
                    <ShadcnCardHeader className="border-b border-slate-800 bg-slate-900/50 pb-4">
                        <ShadcnCardTitle className="text-[11px] font-black uppercase tracking-[0.2em] text-white flex items-center gap-2">
                            Yield Consolidado
                        </ShadcnCardTitle>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Performance Multi-Linha (30d)</p>
                    </ShadcnCardHeader>
                    <ShadcnCardContent className="p-6">
                        <div className="h-64 flex items-center justify-center opacity-20 italic font-black text-slate-400 uppercase text-[10px] tracking-widest bg-slate-950/20 rounded-2xl border border-dashed border-slate-800">
                            Consolidated Analytics Rendering...
                        </div>
                    </ShadcnCardContent>
                </ShadcnCard>

                <ShadcnCard className="bg-card border-slate-800 shadow-xl overflow-hidden">
                    <ShadcnCardHeader className="border-b border-slate-800 bg-slate-900/50 pb-4">
                        <ShadcnCardTitle className="text-[11px] font-black uppercase tracking-[0.2em] text-white flex items-center gap-2">
                            Equipas Ativas
                        </ShadcnCardTitle>
                    </ShadcnCardHeader>
                    <ShadcnCardContent className="p-0">
                        <div className="divide-y divide-slate-800/50">
                            {stats?.teamCount > 0 ? (
                                Array.from({ length: Math.min(stats.teamCount, 3) }).map((_, i) => (
                                    <div key={i} className="flex items-center justify-between p-4 hover:bg-slate-900/40 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className="h-8 w-8 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                                                <Users className="h-4 w-4" />
                                            </div>
                                            <div>
                                                <p className="text-xs font-black text-white italic uppercase tracking-tight">Equipa Operacional {i + 1}</p>
                                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Turno Ativo</p>
                                            </div>
                                        </div>
                                        <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[9px] font-black uppercase">
                                            Online
                                        </Badge>
                                    </div>
                                ))
                            ) : (
                                <div className="p-8 text-center text-[10px] font-bold text-slate-500 uppercase tracking-widest italic">
                                    Nenhuma equipa registada
                                </div>
                            )}
                        </div>
                        <div className="p-4 border-t border-slate-800 bg-slate-950/20">
                            <Link href="/production/teams" className="text-[10px] font-black uppercase tracking-widest text-blue-400 hover:text-blue-300 transition-colors flex items-center justify-center gap-2">
                                Ver Equipas
                                <TrendingUp className="h-3 w-3" />
                            </Link>
                        </div>
                    </ShadcnCardContent>
                </ShadcnCard>
            </div>
        </div>
    );
}

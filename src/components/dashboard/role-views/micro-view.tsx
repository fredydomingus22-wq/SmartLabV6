"use client";

import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Microscope,
    Activity,
    Calendar,
    ArrowRight,
    FlaskConical,
    ThermometerSnowflake,
    Zap,
    CheckCircle2,
    Timer,
    AlertTriangle
} from "lucide-react";
import Link from "next/link";
import {
    PremiumMetricCard,
    PremiumSection,
    PremiumListCard,
    PremiumListItem,
    PremiumStatBlock,
    PremiumActionCard
} from "@/components/premium";
import { cn } from "@/lib/utils";

interface MicroViewProps {
    user: any;
    stats: any;
    assignments: any[];
    activity: any;
}

export function MicroView({ user, stats, assignments, activity }: MicroViewProps) {
    const sparklines = stats?.sparklines || {
        samples: Array(7).fill({ value: 0 }),
        deviations: Array(7).fill({ value: 0 }),
        compliance: Array(7).fill({ value: 100 })
    };

    return (
        <div className="space-y-12">
            {/* KPI Section */}
            <PremiumSection title="Monitorização Biológica" badge="Lab Live Feed">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <PremiumMetricCard
                        variant="purple"
                        title="Em Incubação"
                        value={stats.micro?.incubating?.toString() || "0"}
                        description="Processo Térmico Ativo"
                        data={sparklines.samples}
                        dataKey="value"
                        icon={<ThermometerSnowflake className="h-3 w-3" />}
                    />

                    <PremiumMetricCard
                        variant="blue"
                        title="Leituras Hoje"
                        value={stats.micro?.readingsDue?.toString() || "0"}
                        description="Programadas p/ Turno"
                        data={sparklines.samples}
                        dataKey="value"
                        icon={<Timer className="h-3 w-3" />}
                    />

                    <PremiumMetricCard
                        variant="rose"
                        title="Resultados Críticos"
                        value={stats.micro?.critical?.toString() || "0"}
                        description="Positivos detectados"
                        data={sparklines.deviations}
                        dataKey="value"
                        icon={<AlertTriangle className="h-3 w-3" />}
                    />

                    <PremiumMetricCard
                        variant="emerald"
                        title="Taxa de Liberação"
                        value={`${stats.complianceRate?.toFixed(1) || "100"}%`}
                        description="TAT Compliance Rate"
                        trend={{ value: Math.abs(stats.trends?.compliance || 0), isPositive: stats.trends?.compliance > 0 }}
                        data={sparklines.compliance}
                        dataKey="value"
                        icon={<CheckCircle2 className="h-3 w-3" />}
                    />
                </div>
            </PremiumSection>

            {/* Main Content Area */}
            <div className="grid gap-8 lg:grid-cols-3">
                <div className="lg:col-span-2 space-y-6">
                    <PremiumSection title="Fluxo de Trabalho" badge="Biological Schedule">
                        <PremiumListCard
                            title="Agenda de Leituras"
                            icon={<Calendar className="h-5 w-5 text-cyan-400" />}
                            footerHref="/micro/reading"
                            footerLabel="Abrir Calendário de Leituras"
                        >
                            {assignments.length > 0 ? (
                                assignments.map((task) => (
                                    <Link key={task.id} href={`/lab/samples/${task.id}`}>
                                        <PremiumListItem
                                            title={task.title}
                                            subtitle={task.subtitle}
                                            status="pending"
                                            icon={<FlaskConical className="h-4 w-4 text-purple-400" />}
                                        />
                                    </Link>
                                ))
                            ) : (
                                <div className="p-12 text-center text-[10px] font-black uppercase tracking-[0.2em] text-slate-600 italic">
                                    Sem leituras programadas
                                </div>
                            )}
                        </PremiumListCard>
                    </PremiumSection>
                </div>

                <div className="space-y-8">
                    <PremiumSection title="Acompanhamento" badge="Hardware & Stats">
                        <div className="space-y-6">
                            <div className="p-8 rounded-[2rem] border border-white/5 bg-slate-950/40 glass">
                                <h3 className="text-[10px] font-black text-white uppercase tracking-widest mb-6 border-b border-white/5 pb-4">Status de Incubações</h3>
                                <div className="space-y-3">
                                    {stats.micro?.equipment?.length > 0 ? (
                                        stats.micro.equipment.map((eq: any, idx: number) => (
                                            <div key={idx} className="flex justify-between items-center bg-white/5 p-4 rounded-xl border border-white/5 hover:border-purple-500/30 transition-all">
                                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{eq.name}</span>
                                                <span className="text-emerald-400 font-mono text-xs font-black italic">{eq.temp}</span>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-[9px] font-bold text-slate-600 uppercase text-center py-4 italic">Sem equipamentos ativos</p>
                                    )}
                                </div>
                            </div>

                            <PremiumActionCard
                                title="Relatório Mensal"
                                description="Tendências biológicas e conformidade"
                                href="/reports/micro"
                                icon={<Microscope className="h-6 w-6" />}
                                color="purple"
                            />
                        </div>
                    </PremiumSection>
                </div>
            </div>
        </div>
    );
}

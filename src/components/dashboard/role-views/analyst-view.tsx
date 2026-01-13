"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import {
    ClipboardCheck,
    FlaskConical,
    Microscope,
    Beaker,
    Factory,
    RefreshCw,
    ShieldAlert,
    Plus,
    ArrowRight,
    Package,
    CheckCircle,
    TestTube2,
    Activity,
    History,
    AlertCircle,
    Clock,
    TrendingUp
} from "lucide-react";
import Link from "next/link";
import {
    PremiumMetricCard,
    PremiumSection,
    PremiumListCard,
    PremiumListItem,
    PremiumStatBlock
} from "@/components/premium";
import { cn } from "@/lib/utils";

interface AnalystViewProps {
    user: any;
    stats: any;
    assignments: any[];
    activity: any;
}

export function AnalystView({ user, stats, assignments, activity }: AnalystViewProps) {
    const isMicro = user.role === 'micro_analyst';
    const isLab = user.role === 'lab_analyst';

    const mockData1 = [8, 12, 7, 15, 12, 18, 14].map(v => ({ value: v }));
    const mockData2 = [5, 8, 4, 10, 6, 9, 7].map(v => ({ value: v }));
    const mockData3 = [4, 6, 3, 5, 4, 6, 2].map(v => ({ value: v }));
    const mockData4 = [95, 98, 96, 99, 97, 98, 99].map(v => ({ value: v }));

    return (
        <div className="space-y-10">
            {/* Quick Actions */}
            <div className="flex flex-wrap gap-4">
                <Button asChild className="h-12 px-8 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-black uppercase tracking-widest shadow-[0_0_20px_rgba(37,99,235,0.3)] transition-all hover:scale-105 active:scale-95 text-[10px]">
                    <Link href="/lab?create=true">
                        <Plus className="h-4 w-4 mr-3" /> Nova Amostra
                    </Link>
                </Button>
                {isLab && (
                    <>
                        <Button asChild variant="outline" className="h-12 px-6 rounded-2xl bg-white/5 border-white/5 hover:bg-white/10 text-slate-300 font-black uppercase tracking-widest text-[10px] transition-all">
                            <Link href="/production">
                                <Factory className="h-4 w-4 mr-2 text-blue-400" /> Produção MES
                            </Link>
                        </Button>
                        <Button asChild variant="outline" className="h-12 px-6 rounded-2xl bg-white/5 border-white/5 hover:bg-white/10 text-slate-300 font-black uppercase tracking-widest text-[10px] transition-all">
                            <Link href="/cip/register">
                                <RefreshCw className="h-4 w-4 mr-2 text-emerald-400" /> Registar CIP
                            </Link>
                        </Button>
                    </>
                )}
            </div>

            {/* Stats Grid */}
            <PremiumSection title="Amostragem e Performance" badge="Lab Metrics">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <PremiumMetricCard
                        variant="amber"
                        title="Amostras Pendentes"
                        value={(stats.roleAlerts || stats.pendingSamples).toString()}
                        description="Aguardando Processamento"
                        data={mockData1}
                        dataKey="value"
                        icon={<TestTube2 className="h-3 w-3" />}
                    />

                    <PremiumMetricCard
                        variant="blue"
                        title="Em Análise"
                        value={stats.inAnalysis.toString()}
                        description="Work in Progress (WIP)"
                        data={mockData2}
                        dataKey="value"
                        icon={<Beaker className="h-3 w-3" />}
                    />

                    <PremiumMetricCard
                        variant="indigo"
                        title="Lead Time Médio"
                        value={`${stats.avgLeadTime ? stats.avgLeadTime.toFixed(1) : '0.0'}h`}
                        description="Ciclo de Liberação"
                        trend={{ value: Math.abs(stats.trends?.leadTime || 0), isPositive: stats.trends?.leadTime < 0 }}
                        data={mockData3}
                        dataKey="value"
                        icon={<Activity className="h-3 w-3" />}
                    />

                    <PremiumMetricCard
                        variant="purple"
                        title="SLA de Turno"
                        value={`${stats.slaCompliance ? stats.slaCompliance.toFixed(1) : '100'}%`}
                        description="Concluintes < 8h"
                        trend={{ value: Math.abs(stats.trends?.sla || 0), isPositive: stats.trends?.sla > 0 }}
                        data={mockData4}
                        dataKey="value"
                        icon={<Clock className="h-3 w-3" />}
                    />
                </div>
            </PremiumSection>

            {/* Main Content */}
            <div className="grid gap-8 lg:grid-cols-3">
                <div className="lg:col-span-2 space-y-6">
                    <PremiumSection title="Fila de Trabalho" badge="Active Tasks">
                        <PremiumListCard
                            title="Recent Assignments"
                            icon={<ClipboardCheck className="h-5 w-5 text-cyan-400" />}
                            footerHref={isMicro ? "/micro/samples" : "/lab"}
                            footerLabel="Ver Fila Completa"
                        >
                            {assignments.length === 0 ? (
                                <div className="p-20 text-center space-y-4">
                                    <div className="p-5 rounded-3xl bg-emerald-500/10 w-20 h-20 flex items-center justify-center mx-auto mb-4 border border-emerald-500/20 shadow-[0_0_30px_rgba(16,185,129,0.1)]">
                                        <CheckCircle className="h-10 w-10 text-emerald-500" />
                                    </div>
                                    <h3 className="text-xl font-black tracking-tighter text-white uppercase italic">Tudo em dia!</h3>
                                    <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest italic leading-relaxed">Não existem análises pendentes para o seu perfil.</p>
                                </div>
                            ) : (
                                assignments.map((task: any) => (
                                    <Link key={task.id} href={task.type === 'micro' ? `/micro/reading` : `/lab/samples/${task.id}`}>
                                        <PremiumListItem
                                            title={task.title}
                                            subtitle={task.subtitle}
                                            icon={
                                                task.type === 'micro' ? <Microscope className="h-4 w-4" /> :
                                                    task.type === 'batch' ? <Package className="h-4 w-4" /> : <Beaker className="h-4 w-4" />
                                            }
                                            status={task.type === 'micro' ? "warning" : task.type === 'batch' ? "success" : "info"}
                                        />
                                    </Link>
                                ))
                            )}
                        </PremiumListCard>
                    </PremiumSection>
                </div>

                <div className="space-y-8">
                    <PremiumSection title="Acompanhamento" badge="Real-time Feed">
                        <div className="space-y-6">
                            <PremiumListCard title="Histórico Recente" icon={<History className="h-5 w-5 text-cyan-400" />}>
                                {activity.recentSamples.slice(0, 3).map((sample: any) => (
                                    <PremiumListItem
                                        key={sample.id}
                                        title={sample.code}
                                        subtitle="Registado recentemente"
                                        status="default"
                                    />
                                ))}
                            </PremiumListCard>

                            <PremiumStatBlock
                                title={`${stats.recentDeviations || 0} Não Conformidades`}
                                subtitle="Desvios registrados (24h)"
                                value={String(stats.recentDeviations || 0)}
                                icon={<AlertCircle className="h-6 w-6 text-cyan-400" />}
                                badge="NC MONITOR"
                                badgeVariant="error"
                                variant="highlight"
                            />

                            <PremiumStatBlock
                                title="Produtividade"
                                subtitle="Aprovação direta"
                                value={`${stats.complianceRate ? stats.complianceRate.toFixed(1) : '0'}%`}
                                icon={<TrendingUp className="h-6 w-6 text-cyan-400" />}
                                badge="STABLE"
                                badgeVariant="success"
                            />
                        </div>
                    </PremiumSection>
                </div>
            </div>
        </div>
    );
}

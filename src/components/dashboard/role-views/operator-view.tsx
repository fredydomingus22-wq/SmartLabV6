"use client";

import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription
} from "@/components/ui/card";
import {
    Factory,
    ClipboardCheck,
    Thermometer,
    Plus,
    AlertCircle,
    ArrowRight,
    Activity,
    Clock,
    ShieldAlert,
    Zap,
    LayoutGrid,
    TestTube2,
    TrendingUp,
    Beaker
} from "lucide-react";
import Link from "next/link";
import { KPISparkCard } from "@/components/ui/kpi-spark-card";
import { cn } from "@/lib/utils";
import { PremiumMetricCard } from "@/components/premium";

interface OperatorViewProps {
    stats: any;
    activity: any;
}


export function OperatorView({ stats, activity }: OperatorViewProps) {
    const sparklines = stats?.sparklines || {
        samples: Array(7).fill({ value: 0 }),
        deviations: Array(7).fill({ value: 0 }),
        compliance: Array(7).fill({ value: 100 })
    };

    return (
        <div className="space-y-12">
            {/* KPI Section */}
            <section className="space-y-6">
                <div className="flex items-center justify-between">
                    <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500 flex items-center gap-2 italic">
                        <Activity className="h-3 w-3" />
                        Performance Operacional
                    </h2>
                    <Badge variant="outline" className="text-[9px] font-bold uppercase tracking-widest border-slate-800 text-emerald-500 bg-emerald-500/5">
                        Live Shopfloor
                    </Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <PremiumMetricCard
                        variant="amber"
                        title="Amostras Pendentes"
                        value={(stats.roleAlerts || stats.pendingSamples).toString()}
                        description="Aguardando Processamento"
                        data={sparklines.samples}
                        dataKey="value"
                        icon={<TestTube2 className="h-3 w-3" />}
                    />

                    <PremiumMetricCard
                        variant="blue"
                        title="Em Análise"
                        value={stats.inAnalysis.toString()}
                        description="Work in Progress (WIP)"
                        data={sparklines.samples}
                        dataKey="value"
                        icon={<Beaker className="h-3 w-3" />}
                    />

                    <PremiumMetricCard
                        variant="indigo"
                        title="Lead Time Médio"
                        value={`${stats.avgLeadTime ? stats.avgLeadTime.toFixed(1) : '0.0'}h`}
                        description="Ciclo de Liberação"
                        trend={{ value: Math.abs(stats.trends?.leadTime || 0), isPositive: stats.trends?.leadTime < 0 }}
                        data={sparklines.samples}
                        dataKey="value"
                        icon={<Activity className="h-3 w-3" />}
                    />

                    <PremiumMetricCard
                        variant="purple"
                        title="SLA de Turno"
                        value={`${stats.slaCompliance ? stats.slaCompliance.toFixed(1) : '100'}%`}
                        description="Concluintes < 8h"
                        trend={{ value: Math.abs(stats.trends?.sla || 0), isPositive: stats.trends?.sla > 0 }}
                        data={sparklines.compliance}
                        dataKey="value"
                        icon={<Clock className="h-3 w-3" />}
                    />
                </div>
            </section>

            {/* Quick Actions */}
            <section className="space-y-6">
                <div className="flex items-center justify-between">
                    <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500 flex items-center gap-2 italic">
                        <Zap className="h-3 w-3" />
                        Ações de Chão de Fábrica
                    </h2>
                    <Badge variant="outline" className="text-[9px] font-bold uppercase tracking-widest border-slate-800 text-slate-400">
                        Quick Execution
                    </Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Link href="/production">
                        <Card className="bg-card border-slate-800 shadow-xl hover:bg-slate-900/40 transition-all cursor-pointer group overflow-hidden border-l-4 border-l-emerald-500">
                            <CardContent className="p-6 flex flex-col gap-4">
                                <div className="flex items-center justify-between">
                                    <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 group-hover:scale-110 transition-transform shadow-inner">
                                        <Plus className="h-6 w-6" />
                                    </div>
                                    <Badge className="bg-emerald-500/10 text-emerald-400 border-none text-[10px] font-black uppercase tracking-widest">
                                        {stats.activeBatches} Ativas
                                    </Badge>
                                </div>
                                <div>
                                    <h3 className="text-sm font-black text-white italic uppercase tracking-tight">Efetuar Carga</h3>
                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">{stats.activeBatches} lotes ativos aguardando</p>
                                </div>
                            </CardContent>
                        </Card>
                    </Link>

                    <Link href="/haccp/readings/new">
                        <Card className="bg-card border-slate-800 shadow-xl hover:bg-slate-900/40 transition-all cursor-pointer group overflow-hidden border-l-4 border-l-amber-500">
                            <CardContent className="p-6 flex flex-col gap-4">
                                <div className="flex items-center justify-between">
                                    <div className="h-12 w-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 group-hover:scale-110 transition-transform shadow-inner">
                                        <Thermometer className="h-6 w-6" />
                                    </div>
                                    <Badge className="bg-amber-500/10 text-amber-400 border-none text-[10px] font-black uppercase tracking-widest">
                                        {stats.recentDeviations} Desvios
                                    </Badge>
                                </div>
                                <div>
                                    <h3 className="text-sm font-black text-white italic uppercase tracking-tight">Registar CCP</h3>
                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">{stats.recentDeviations} desvios no turno atual</p>
                                </div>
                            </CardContent>
                        </Card>
                    </Link>

                    <Link href="/lab?create=true">
                        <Card className="bg-card border-slate-800 shadow-xl hover:bg-slate-900/40 transition-all cursor-pointer group overflow-hidden border-l-4 border-l-blue-500">
                            <CardContent className="p-6 flex flex-col gap-4">
                                <div className="flex items-center justify-between">
                                    <div className="h-12 w-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-500 group-hover:scale-110 transition-transform shadow-inner">
                                        <ClipboardCheck className="h-6 w-6" />
                                    </div>
                                    <Badge className="bg-blue-500/10 text-blue-400 border-none text-[10px] font-black uppercase tracking-widest">
                                        {stats.pendingSamples} Pendente
                                    </Badge>
                                </div>
                                <div>
                                    <h3 className="text-sm font-black text-white italic uppercase tracking-tight">Coleta Lab</h3>
                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">{stats.pendingSamples} amostras em fila de coleta</p>
                                </div>
                            </CardContent>
                        </Card>
                    </Link>
                </div>
            </section>

            {/* Main Content Area */}
            <div className="grid gap-8 lg:grid-cols-2">
                <div className="space-y-6">
                    <section className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500 flex items-center gap-2 italic">
                                <LayoutGrid className="h-3 w-3" />
                                Monitoramento de Linha
                            </h2>
                            <Badge variant="outline" className="text-[9px] font-bold uppercase tracking-widest border-slate-800 text-slate-400">
                                Production Status
                            </Badge>
                        </div>

                        <Card className="bg-card border-slate-800 shadow-xl overflow-hidden">
                            <CardHeader className="border-b border-slate-800 bg-slate-900/50 pb-4">
                                <CardTitle className="text-[11px] font-black uppercase tracking-[0.2em] text-white italic flex items-center gap-2">
                                    Status por Linha
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-0">
                                {activity.recentBatches.filter((b: any) => b.status === 'open').length > 0 ? (
                                    <div className="divide-y divide-slate-800/50">
                                        {activity.recentBatches.filter((b: any) => b.status === 'open').map((batch: any) => (
                                            <Link key={batch.id} href={`/production/${batch.id}`} className="flex items-center justify-between p-4 hover:bg-slate-900/40 transition-colors">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-8 w-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500">
                                                        <Activity className="h-4 w-4 animate-pulse" />
                                                    </div>
                                                    <div>
                                                        <p className="text-xs font-black text-white italic uppercase tracking-tight">Linha 01 - {batch.code}</p>
                                                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-none mt-1">Produto Acabado em Processamento</p>
                                                    </div>
                                                </div>
                                                <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[9px] font-black uppercase tracking-widest">
                                                    Ativa
                                                </Badge>
                                            </Link>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="p-20 text-center space-y-4">
                                        <div className="p-5 rounded-3xl bg-slate-900/20 w-16 h-16 flex items-center justify-center mx-auto mb-4 border border-slate-800 shadow-inner">
                                            <Factory className="h-8 w-8 text-slate-700" />
                                        </div>
                                        <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic">Nenhuma linha ativa no momento</h3>
                                    </div>
                                )}
                            </CardContent>
                            <div className="p-4 border-t border-slate-800 bg-slate-950/20">
                                <Link href="/production/lines" className="text-[10px] font-black uppercase tracking-widest text-cyan-400 hover:text-cyan-300 transition-colors flex items-center justify-center gap-2">
                                    Gestão de Linhas
                                    <ArrowRight className="h-3 w-3" />
                                </Link>
                            </div>
                        </Card>
                    </section>
                </div>

                <div className="space-y-6">
                    <section className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500 flex items-center gap-2 italic">
                                <ShieldAlert className="h-3 w-3" />
                                Atenção Necessária
                            </h2>
                            <Badge variant="outline" className="text-[9px] font-bold uppercase tracking-widest border-slate-800 text-rose-400 bg-rose-500/5">
                                Priority Alerts
                            </Badge>
                        </div>

                        <div className="space-y-6">
                            {stats.recentDeviations > 0 && (
                                <Card className="bg-rose-500/5 border-rose-500/20 shadow-xl overflow-hidden">
                                    <CardHeader className="bg-rose-500/10 border-b border-rose-500/10 pb-4">
                                        <div className="flex items-center justify-between">
                                            <CardTitle className="text-[11px] font-black uppercase tracking-[0.2em] text-rose-400 italic">
                                                {stats.recentDeviations} Desvios Detectados
                                            </CardTitle>
                                            <Badge className="bg-rose-500 text-white border-none text-[8px] font-black uppercase">Critical</Badge>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="p-6 flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="h-12 w-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-500 shadow-inner">
                                                <ShieldAlert className="h-6 w-6" />
                                            </div>
                                            <div>
                                                <p className="text-3xl font-black text-rose-400 italic tracking-tighter leading-none">{stats.recentDeviations}</p>
                                                <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-1">Iniciação de Investigação NC</p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            )}

                            <Card className="bg-card border-slate-800 shadow-xl overflow-hidden">
                                <div className="p-6 space-y-8">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 shadow-inner">
                                                <Clock className="h-5 w-5 text-amber-500" />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black text-white uppercase tracking-widest leading-none">Próxima Amostragem</p>
                                                <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest mt-1 italic">Industrial Schedule</p>
                                            </div>
                                        </div>
                                        <Badge variant="outline" className="border-amber-500/20 text-amber-500 bg-amber-500/5 text-[8px] font-black uppercase tracking-[0.2em] px-3 py-1">T-MINUS 15M</Badge>
                                    </div>

                                    <div className="space-y-6">
                                        <div className="space-y-3">
                                            <div className="flex justify-between text-[9px] font-black uppercase tracking-widest text-slate-400">
                                                <span>Linha 02 - Água de Processo</span>
                                                <span className="text-amber-500">75% Concluído</span>
                                            </div>
                                            <div className="h-2 w-full bg-slate-900/50 rounded-full overflow-hidden border border-slate-800/50 p-[1px]">
                                                <div className="h-full bg-amber-500 rounded-full w-[75%] shadow-[0_0_15px_rgba(245,158,11,0.4)] transition-all duration-1000" />
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between p-4 bg-rose-500/5 border border-rose-500/10 rounded-2xl">
                                            <div className="flex items-center gap-3">
                                                <div className="h-8 w-8 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-500">
                                                    <AlertCircle className="h-4 w-4" />
                                                </div>
                                                <div>
                                                    <p className="text-xs font-black text-rose-400 italic uppercase tracking-tight">Linha 04 - Microbiologia</p>
                                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-none mt-1">Coleta de amostra em atraso</p>
                                                </div>
                                            </div>
                                            <Badge variant="outline" className="text-rose-400 text-[10px] p-0 font-black italic border-none">ATRASO</Badge>
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
}

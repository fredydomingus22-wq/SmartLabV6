"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    AlertTriangle,
    Clock,
    CheckCircle,
    FileWarning,
    ArrowRight,
    ShieldAlert,
    BarChart3,
    Plus,
    History,
    Sparkles,
    Trophy,
    Zap
} from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { getGlobalQualityInsightAction } from "@/app/actions/qms";
import { KPICard } from "@/components/defaults/kpi-card"; // Standardized

interface QMSDashboardProps {
    kpis: {
        openNCs: number;
        overdueNCs: number;
        criticalNCs: number;
        openCAPAs: number;
    };
    recentNCs: any[];
}

export function QMSDashboard({ kpis, recentNCs }: QMSDashboardProps) {
    const [aiInsight, setAiInsight] = useState<string | null>(null);
    const [aiLoading, setAiLoading] = useState(false);

    useEffect(() => {
        async function fetchAIInsight() {
            setAiLoading(true);
            const result = await getGlobalQualityInsightAction();
            if (result.success && result.insight) {
                setAiInsight(result.insight);
            }
            setAiLoading(false);
        }
        fetchAIInsight();
    }, []);

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* KPI Standardized Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <KPICard
                    title="NCs Abertas"
                    value={kpis.openNCs}
                    icon={FileWarning}
                    description="Investigation Pending"
                    trend="Requires Action"
                    trendDirection="neutral"
                />
                <KPICard
                    title="NCs Críticas"
                    value={kpis.criticalNCs}
                    icon={ShieldAlert}
                    description="High Impact Risk"
                    trend="Needs Attention"
                    trendDirection="down"
                />
                <KPICard
                    title="Atrasadas"
                    value={kpis.overdueNCs}
                    icon={Clock}
                    description="SLA Breached"
                    trend="Critical"
                    trendDirection="down"
                />
                <KPICard
                    title="CAPAs Ativas"
                    value={kpis.openCAPAs}
                    icon={CheckCircle}
                    description="Actions in Progress"
                    trend="On Track"
                    trendDirection="up"
                />
            </div>

            {/* Main Action Hub */}
            <div className="grid gap-6 md:grid-cols-3">
                <ActionCard
                    title="Não Conformidades"
                    description="Registe e controle falhas de qualidade internas ou de fornecedores com rastreio total."
                    href="/quality/qms"
                    icon={AlertTriangle}
                    stats={`${kpis.openNCs} Abertas`}
                />
                <ActionCard
                    title="Ações CAPA"
                    description="Gestão estruturada de Ações Corretivas e Preventivas para eliminar causas raiz."
                    href="/quality/qms/capa"
                    icon={ShieldAlert}
                    stats={`${kpis.openCAPAs} Ativas`}
                />
                <ActionCard
                    title="Relatórios 8D"
                    description="Metodologia estruturada para resolução de problemas complexos e garantia de qualidade."
                    href="/quality/qms/8d"
                    icon={BarChart3}
                    stats="8 Passos Elite"
                />
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {/* Recent NCs */}
                <Card className="lg:col-span-2 border-slate-800 shadow-2xl overflow-hidden rounded-2xl bg-card">
                    <CardHeader className="flex flex-row items-center justify-between pb-6 border-b border-slate-800 bg-slate-900/50 px-6">
                        <div className="space-y-1">
                            <CardTitle className="text-sm font-black uppercase tracking-widest italic text-white flex items-center gap-3">
                                <History className="h-4 w-4 text-indigo-400" />
                                Ocorrências Recentes
                            </CardTitle>
                            <CardDescription className="text-[10px] font-black uppercase tracking-tight text-slate-500">
                                Monitorização em Tempo Real • Log Industrial
                            </CardDescription>
                        </div>
                        <Link href="/quality/qms">
                            <Button variant="ghost" size="sm" className="text-slate-500 hover:text-white hover:bg-slate-800 text-[10px] font-black uppercase tracking-[0.2em] italic">
                                Arquivo Completo
                                <ArrowRight className="ml-2 h-3.5 w-3.5" />
                            </Button>
                        </Link>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="divide-y divide-slate-800/40">
                            {recentNCs.length > 0 ? (
                                recentNCs.slice(0, 5).map((nc) => (
                                    <Link key={nc.id} href={`/quality/qms/${nc.id}`} className="block hover:bg-slate-900/40 transition-all p-5 group">
                                        <div className="flex justify-between items-center">
                                            <div className="flex items-center gap-5">
                                                <div className={cn("h-12 w-12 rounded-xl flex flex-col items-center justify-center border shadow-inner transition-all group-hover:scale-105",
                                                    nc.severity === 'critical' ? 'bg-rose-500/10 border-rose-500/20 text-rose-500' :
                                                        nc.severity === 'major' ? 'bg-amber-500/10 border-amber-500/20 text-amber-500' :
                                                            'bg-slate-900/50 border-slate-800 text-slate-600'
                                                )}>
                                                    <span className="text-[10px] font-black tracking-tighter uppercase leading-none">SEV</span>
                                                    <span className="text-xs font-black uppercase mt-0.5">{nc.severity === 'critical' ? 'CR' : nc.severity === 'major' ? 'MJ' : 'MN'}</span>
                                                </div>
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-3">
                                                        <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-slate-950 text-indigo-400 font-black border border-slate-800 italic">
                                                            {nc.nc_number}
                                                        </span>
                                                        <h4 className="text-sm font-black text-white italic tracking-tight group-hover:text-indigo-400 transition-colors">{nc.title}</h4>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-1.5">
                                                            <div className="h-1 w-1 rounded-full bg-slate-800" />
                                                            Tipo: {nc.nc_type.replace('_', ' ')}
                                                        </p>
                                                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-600 flex items-center gap-1.5">
                                                            <Clock className="h-2.5 w-2.5" />
                                                            {nc.detected_date ? new Date(nc.detected_date).toLocaleDateString() : '-'}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <Badge variant="outline" className="text-[9px] font-black uppercase tracking-[0.2em] px-3 py-1 border-slate-800 text-slate-500 bg-slate-950/50 italic shadow-inner">
                                                    {nc.status.replace('_', ' ')}
                                                </Badge>
                                                <ArrowRight className="h-4 w-4 text-slate-700 group-hover:text-indigo-400 group-hover:translate-x-1 transition-all" />
                                            </div>
                                        </div>
                                    </Link>
                                ))
                            ) : (
                                <div className="p-20 text-center space-y-4">
                                    <div className="h-16 w-16 bg-slate-950 border border-slate-800 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
                                        <History className="h-8 w-8 text-slate-800" />
                                    </div>
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-600 italic">Workstation Limpa • Nenhuma Ocorrência</p>
                                </div>
                            )}
                        </div>
                    </CardContent>
                    <CardFooter className="p-4 bg-slate-950/20 border-t border-slate-800 flex justify-center">
                        <p className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-700 italic">
                            SmartLab Quality Analytics Hub
                        </p>
                    </CardFooter>
                </Card>

                {/* AI & Quick Actions */}
                <div className="space-y-6">
                    <Card className="bg-card border-slate-800 shadow-2xl overflow-hidden rounded-2xl">
                        <CardHeader className="pb-4 bg-slate-900/50 border-b border-slate-800">
                            <CardTitle className="text-[11px] font-black uppercase tracking-[0.2em] italic text-white flex items-center gap-2">
                                <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
                                Insights Inteligentes
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4 pt-6">
                            {aiLoading ? (
                                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3 animate-pulse shadow-inner">
                                    <div className="h-2 w-3/4 bg-slate-900 rounded-full" />
                                    <div className="h-2 w-1/2 bg-slate-900 rounded-full" />
                                </div>
                            ) : aiInsight ? (
                                <div className="p-5 rounded-xl bg-slate-950/50 border border-slate-800 shadow-inner relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 p-2 opacity-20 group-hover:opacity-100 transition-opacity">
                                        <Zap className="h-3 w-3 text-emerald-500" />
                                    </div>
                                    <p className="text-xs text-slate-400 font-medium leading-relaxed italic relative z-10">
                                        "{aiInsight}"
                                    </p>
                                    <div className="mt-6 flex items-center justify-between border-t border-slate-800/50 pt-4">
                                        <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-600 italic">SmartLab AI Assistant • v4.0</span>
                                        <Trophy className="h-3 w-3 text-amber-500/40" />
                                    </div>
                                </div>
                            ) : (
                                <div className="p-8 rounded-xl bg-slate-950/20 border border-slate-800 border-dashed text-center">
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-700 italic">Workstation em Standby...</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card className="bg-card border-slate-800 shadow-2xl rounded-2xl overflow-hidden">
                        <CardHeader className="pb-4 bg-slate-900/50 border-b border-slate-800">
                            <CardTitle className="text-[11px] font-black uppercase tracking-[0.2em] italic text-white flex items-center gap-2">
                                <Zap className="h-3.5 w-3.5 text-amber-400" />
                                Operação Prioritária
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="grid gap-3 p-6">
                            <QuickActionBtn href="/quality/qms" label="Registar NC" icon={Plus} />
                            <QuickActionBtn href="/quality/qms/capa" label="Plano CAPA" icon={ShieldAlert} />
                            <QuickActionBtn href="/quality/qms/8d" label="Relatório 8D" icon={BarChart3} />
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}

function ActionCard({ title, description, href, icon: Icon, stats }: any) {
    return (
        <Link href={href}>
            <Card className="h-full hover:shadow-[0_0_20px_rgba(79,70,229,0.1)] transition-all group overflow-hidden border-slate-800 bg-card hover:border-indigo-500/50 rounded-2xl relative">
                <div className="absolute top-0 right-0 p-4">
                    <Badge variant="outline" className="text-[9px] font-black uppercase tracking-[0.2em] border-slate-800 text-slate-500 bg-slate-950/50 italic shadow-inner px-2 py-0.5">
                        {stats}
                    </Badge>
                </div>
                <CardHeader className="pt-8 px-6 pb-2">
                    <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 group-hover:border-indigo-500/30 transition-all shadow-inner w-fit">
                        <Icon className="h-5 w-5 text-slate-500 group-hover:text-indigo-400 transition-colors" />
                    </div>
                </CardHeader>
                <CardContent className="px-6 pb-8 pt-4 space-y-2">
                    <CardTitle className="text-base font-black text-white italic tracking-tight">{title}</CardTitle>
                    <p className="text-[11px] text-slate-500 font-medium leading-relaxed italic">{description}</p>
                </CardContent>
            </Card>
        </Link>
    );
}

function QuickActionBtn({ href, label, icon: Icon }: any) {
    return (
        <Link href={href} className="flex items-center gap-4 p-4 rounded-xl bg-slate-950 border border-slate-800 hover:border-indigo-500/30 hover:bg-slate-900/50 transition-all group shadow-inner">
            <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 group-hover:border-indigo-500/20">
                <Icon className="h-3.5 w-3.5 text-slate-500 group-hover:text-indigo-400 transition-colors" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 group-hover:text-white transition-colors italic">{label}</span>
            <ArrowRight className="ml-auto h-3.5 w-3.5 text-slate-700 group-hover:text-indigo-400 opacity-0 group-hover:opacity-100 transition-all transform group-hover:translate-x-0 -translate-x-2" />
        </Link>
    );
}

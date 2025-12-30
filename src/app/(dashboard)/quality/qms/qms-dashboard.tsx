"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    AlertTriangle,
    AlertCircle,
    Clock,
    CheckCircle,
    FileWarning,
    ArrowRight,
    FileText,
    ShieldAlert,
    BarChart3,
    Plus,
    History,
    Zap,
    Sparkles,
    Trophy
} from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { getGlobalQualityInsightAction } from "@/app/actions/qms";

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
        <div className="space-y-12 animate-in fade-in duration-1000">
            {/* KPI Overview */}
            <div className="grid gap-6 md:grid-cols-4">
                <KPICard
                    title="NCs Abertas"
                    value={kpis.openNCs}
                    icon={FileWarning}
                    description="Investigation Pending"
                    color="text-indigo-400"
                    bgColor="bg-indigo-500/10"
                    borderColor="border-indigo-500/20"
                />
                <KPICard
                    title="NCs Críticas"
                    value={kpis.criticalNCs}
                    icon={ShieldAlert}
                    description="High Impact Risk"
                    color="text-rose-400"
                    bgColor="bg-rose-500/10"
                    borderColor="border-rose-500/40 shadow-[0_0_20px_rgba(244,63,94,0.1)]"
                />
                <KPICard
                    title="Atrasadas"
                    value={kpis.overdueNCs}
                    icon={Clock}
                    description="SLA Breached"
                    color="text-amber-400"
                    bgColor="bg-amber-500/10"
                    borderColor="border-amber-500/40 shadow-[0_0_20px_rgba(245,158,11,0.1)]"
                />
                <KPICard
                    title="CAPAs Ativas"
                    value={kpis.openCAPAs}
                    icon={CheckCircle}
                    description="Actions in Progress"
                    color="text-emerald-400"
                    bgColor="bg-emerald-500/10"
                    borderColor="border-emerald-500/20"
                />
            </div>

            {/* Main Action Hub */}
            <div className="grid gap-8 md:grid-cols-3">
                <ActionCard
                    title="Não Conformidades"
                    description="Registe e controle falhas de qualidade internas ou de fornecedores com rastreio total."
                    href="/quality/qms"
                    icon={AlertTriangle}
                    stats={`${kpis.openNCs} Abertas`}
                    color="to-indigo-500/10"
                    borderColor="border-indigo-500/20"
                />
                <ActionCard
                    title="Ações CAPA"
                    description="Gestão estruturada de Ações Corretivas e Preventivas para eliminar causas raiz."
                    href="/quality/qms/capa"
                    icon={ShieldAlert}
                    stats={`${kpis.openCAPAs} Ativas`}
                    color="to-emerald-500/10"
                    borderColor="border-emerald-500/20"
                />
                <ActionCard
                    title="Relatórios 8D"
                    description="Metodologia estruturada para resolução de problemas complexos e garantia de qualidade."
                    href="/quality/qms/8d"
                    icon={BarChart3}
                    stats="8 Passos Elite"
                    color="to-amber-500/10"
                    borderColor="border-amber-500/20"
                />
            </div>

            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                {/* Recent NCs */}
                <Card className="glass-dark lg:col-span-2 border-white/5 shadow-2xl overflow-hidden rounded-3xl">
                    <CardHeader className="flex flex-row items-center justify-between pb-6 border-b border-white/5 px-8">
                        <div>
                            <CardTitle className="text-xl font-black flex items-center gap-3 uppercase tracking-wider">
                                <History className="h-5 w-5 text-indigo-400" />
                                Ocorrências Recentes
                            </CardTitle>
                            <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mt-1">Real-time Feed</CardDescription>
                        </div>
                        <Link href="/quality/qms">
                            <Button variant="ghost" size="sm" className="text-indigo-400 font-bold uppercase tracking-widest text-[10px] hover:bg-indigo-500/10">
                                Ver todas
                                <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                        </Link>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="divide-y divide-white/5">
                            {recentNCs.length > 0 ? (
                                recentNCs.slice(0, 5).map((nc) => (
                                    <Link key={nc.id} href={`/quality/qms/${nc.id}`} className="block hover:bg-white/[0.02] transition-colors p-6 group">
                                        <div className="flex justify-between items-center">
                                            <div className="flex items-center gap-6">
                                                <div className={cn("h-12 w-12 rounded-2xl flex items-center justify-center border font-black text-xs",
                                                    nc.severity === 'critical' ? 'bg-rose-500/10 border-rose-500/20 text-rose-400' :
                                                        nc.severity === 'major' ? 'bg-orange-500/10 border-orange-500/20 text-orange-400' :
                                                            'bg-slate-500/10 border-white/10 text-slate-400'
                                                )}>
                                                    {nc.severity === 'critical' ? 'CR' : nc.severity === 'major' ? 'MJ' : 'MN'}
                                                </div>
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-3">
                                                        <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-bold">{nc.nc_number}</span>
                                                        <h4 className="text-sm font-bold group-hover:text-indigo-400 transition-colors">{nc.title}</h4>
                                                    </div>
                                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                                                        {nc.nc_type} • {nc.detected_date ? new Date(nc.detected_date).toLocaleDateString() : '-'}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <Badge variant="outline" className="text-[9px] font-black uppercase px-2 py-0 border-white/10 text-slate-400">
                                                    {nc.status.replace('_', ' ')}
                                                </Badge>
                                                <ArrowRight className="h-4 w-4 text-slate-700 group-hover:text-indigo-400 group-hover:translate-x-1 transition-all" />
                                            </div>
                                        </div>
                                    </Link>
                                ))
                            ) : (
                                <div className="p-12 text-center">
                                    <p className="text-sm text-slate-500 font-bold uppercase tracking-widest italic">Nenhuma ocorrência registada.</p>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* AI & Quick Actions */}
                <div className="space-y-6">
                    <Card className="glass-dark border-indigo-500/20 shadow-2xl overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-500/10 to-transparent">
                        <CardHeader className="pb-4">
                            <CardTitle className="text-lg font-black flex items-center gap-3 uppercase tracking-wider">
                                <Sparkles className="h-5 w-5 text-indigo-400" />
                                Insights Inteligentes
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {aiLoading ? (
                                <div className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-3 animate-pulse">
                                    <div className="h-2 w-3/4 bg-white/10 rounded-full" />
                                    <div className="h-2 w-1/2 bg-white/10 rounded-full" />
                                </div>
                            ) : aiInsight ? (
                                <div className="p-5 rounded-2xl bg-indigo-500/10 border border-indigo-500/20">
                                    <p className="text-[11px] text-indigo-300 font-medium leading-relaxed italic">
                                        "{aiInsight}"
                                    </p>
                                    <div className="mt-4 flex items-center justify-between">
                                        <span className="text-[8px] font-black uppercase tracking-widest text-indigo-400/50">SmartLab AI Assistant</span>
                                        <Trophy className="h-4 w-4 text-amber-500/40" />
                                    </div>
                                </div>
                            ) : (
                                <div className="p-5 rounded-2xl bg-white/5 border border-white/5">
                                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest text-center">Aguardando dados...</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card className="glass border-white/5 shadow-2xl rounded-3xl overflow-hidden">
                        <CardHeader className="pb-4">
                            <CardTitle className="text-lg font-black flex items-center gap-3 uppercase tracking-wider">
                                <Zap className="h-5 w-5 text-amber-400" />
                                Ações Rápidas
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="grid gap-3 p-4 pt-0">
                            <QuickActionBtn href="/quality/qms" label="Registar NC" icon={Plus} color="hover:bg-indigo-500/10 hover:text-indigo-400" />
                            <QuickActionBtn href="/quality/qms/capa" label="Plano CAPA" icon={ShieldAlert} color="hover:bg-emerald-500/10 hover:text-emerald-400" />
                            <QuickActionBtn href="/quality/qms/8d" label="Relatório 8D" icon={BarChart3} color="hover:bg-amber-500/10 hover:text-amber-400" />
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}

function KPICard({ title, value, icon: Icon, description, color, bgColor, borderColor }: any) {
    return (
        <Card className={cn("glass-dark border border-white/5 shadow-xl transition-all rounded-3xl overflow-hidden group hover:border-white/10", borderColor)}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 group-hover:text-slate-400 transition-colors">
                    {title}
                </CardTitle>
                <div className={cn("h-8 w-8 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110", bgColor)}>
                    <Icon className={cn("h-4 w-4", color)} />
                </div>
            </CardHeader>
            <CardContent>
                <div className="text-3xl font-black font-mono tracking-tighter group-hover:translate-x-1 transition-transform">{value}</div>
                <p className="text-[9px] font-bold uppercase tracking-widest text-slate-600 mt-2">
                    {description}
                </p>
            </CardContent>
        </Card>
    );
}

function ActionCard({ title, description, href, icon: Icon, stats, color, borderColor }: any) {
    return (
        <Link href={href}>
            <Card className={cn("glass-dark border border-white/5 shadow-2xl h-full transition-all group overflow-hidden bg-gradient-to-br from-transparent rounded-[2.5rem] hover:-translate-y-1 hover:border-white/10", color, borderColor)}>
                <CardHeader className="pt-8 px-8">
                    <div className="flex justify-between items-start">
                        <div className="h-14 w-14 rounded-3xl bg-white/5 flex items-center justify-center border border-white/10 group-hover:bg-white/10 transition-all">
                            <Icon className="h-7 w-7 text-indigo-400 group-hover:scale-110 transition-transform" />
                        </div>
                        <Badge variant="outline" className="glass text-[9px] font-black uppercase tracking-widest px-3 py-1 border-white/10 bg-white/5 text-slate-300">
                            {stats}
                        </Badge>
                    </div>
                </CardHeader>
                <CardContent className="space-y-3 px-8 pb-8">
                    <CardTitle className="text-2xl font-black">{title}</CardTitle>
                    <p className="text-[11px] text-slate-500 font-bold leading-relaxed">{description}</p>
                </CardContent>
                <CardFooter className="px-8 pb-8 pt-0">
                    <div className="flex items-center text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400 group-hover:gap-2 transition-all">
                        Gestão Completa
                        <ArrowRight className="ml-2 h-3 w-3" />
                    </div>
                </CardFooter>
            </Card>
        </Link>
    );
}

function QuickActionBtn({ href, label, icon: Icon, color }: any) {
    return (
        <Link href={href} className={cn("flex items-center gap-4 p-4 rounded-2xl bg-white/[0.03] border border-white/5 transition-all group font-black uppercase tracking-widest text-[10px] text-slate-400", color)}>
            <div className="h-6 w-6 rounded-lg bg-white/5 flex items-center justify-center group-hover:bg-white/10">
                <Icon className="h-3 w-3" />
            </div>
            <span>{label}</span>
            <ArrowRight className="ml-auto h-3 w-3 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
        </Link>
    );
}

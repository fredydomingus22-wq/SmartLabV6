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
    History
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
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* KPI Overview */}
            <div className="grid gap-4 md:grid-cols-4">
                <KPICard
                    title="NCs Abertas"
                    value={kpis.openNCs}
                    icon={FileWarning}
                    description="Requerendo investigação"
                    color="text-indigo-400"
                    bgColor="bg-indigo-500/10"
                />
                <KPICard
                    title="NCs Críticas"
                    value={kpis.criticalNCs}
                    icon={ShieldAlert}
                    description="Alto risco para qualidade"
                    color="text-rose-400"
                    bgColor="bg-rose-500/10"
                    borderColor="border-rose-500/30"
                />
                <KPICard
                    title="Atrasadas"
                    value={kpis.overdueNCs}
                    icon={Clock}
                    description="Data limite ultrapassada"
                    color="text-amber-400"
                    bgColor="bg-amber-500/10"
                    borderColor="border-amber-500/30"
                />
                <KPICard
                    title="CAPAs Ativas"
                    value={kpis.openCAPAs}
                    icon={CheckCircle}
                    description="Ações em progresso"
                    color="text-emerald-400"
                    bgColor="bg-emerald-500/10"
                />
            </div>

            {/* Main Action Hub */}
            <div className="grid gap-6 md:grid-cols-3">
                <ActionCard
                    title="Não Conformidades"
                    description="Registe, investigue e controle falhas de qualidade internas ou de fornecedores."
                    href="/quality/qms"
                    icon={AlertTriangle}
                    stats={`${kpis.openNCs} abertas`}
                    color="from-indigo-600/20 to-indigo-600/5"
                    borderColor="hover:border-indigo-500/50"
                />
                <ActionCard
                    title="Ações CAPA"
                    description="Gerencie Ações Corretivas e Preventivas para eliminar as causas raiz."
                    href="/quality/qms/capa"
                    icon={CheckCircle}
                    stats={`${kpis.openCAPAs} em curso`}
                    color="from-emerald-600/20 to-emerald-600/5"
                    borderColor="hover:border-emerald-500/50"
                />
                <ActionCard
                    title="Relatórios 8D"
                    description="Metodologia estruturada para solução de problemas complexos."
                    href="/quality/qms/8d"
                    icon={BarChart3}
                    stats="Solução estruturada"
                    color="from-amber-600/20 to-amber-600/5"
                    borderColor="hover:border-amber-500/50"
                />
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {/* Recent NCs */}
                <Card className="glass lg:col-span-2 border-none shadow-xl overflow-hidden">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 bg-gradient-to-r from-muted/50 to-transparent border-b border-border/50">
                        <div>
                            <CardTitle className="text-xl flex items-center gap-2">
                                <History className="h-5 w-5 text-indigo-400" />
                                Ocorrências Recentes
                            </CardTitle>
                            <CardDescription>Últimas não conformidades detetadas</CardDescription>
                        </div>
                        <Link href="/quality/qms">
                            <Button variant="ghost" size="sm" className="text-indigo-400">
                                Ver todas
                                <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                        </Link>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="divide-y divide-border/50">
                            {recentNCs.length > 0 ? (
                                recentNCs.map((nc) => (
                                    <Link key={nc.id} href={`/quality/qms/${nc.id}`} className="block hover:bg-muted/30 transition-colors p-4 group">
                                        <div className="flex justify-between items-start">
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-mono text-xs text-indigo-400 font-bold">{nc.nc_number}</span>
                                                    <h4 className="text-sm font-semibold group-hover:text-primary transition-colors">{nc.title}</h4>
                                                </div>
                                                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                                    <span className="capitalize">{nc.nc_type === 'internal' ? 'Interna' : nc.nc_type}</span>
                                                    <span>•</span>
                                                    <span>{nc.detected_date}</span>
                                                </div>
                                            </div>
                                            <div className="flex flex-col items-end gap-2">
                                                <Badge variant={nc.severity === 'critical' ? 'destructive' : nc.severity === 'major' ? 'warning' : 'secondary'} className="text-[10px] uppercase font-bold tracking-wider px-2">
                                                    {nc.severity === 'critical' ? 'Crítica' : nc.severity === 'major' ? 'Maior' : 'Menor'}
                                                </Badge>
                                                <span className="text-[10px] text-muted-foreground uppercase">{nc.status.replace('_', ' ')}</span>
                                            </div>
                                        </div>
                                    </Link>
                                ))
                            ) : (
                                <div className="p-8 text-center text-muted-foreground italic">
                                    Nenhuma ocorrência recente registada.
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Automation & Insights */}
                <Card className="glass border-none shadow-xl bg-gradient-to-br from-indigo-500/5 to-transparent">
                    <CardHeader>
                        <CardTitle className="text-xl flex items-center gap-2">
                            <Plus className="h-5 w-5 text-indigo-400" />
                            Ações Rápidas
                        </CardTitle>
                        <CardDescription>Atalhos para tarefas rotineiras</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <QuickAction
                            href="/quality/qms"
                            label="Registar Nova NC"
                            icon={AlertCircle}
                        />
                        <QuickAction
                            href="/quality/qms/capa"
                            label="Criar Ação Preventiva"
                            icon={ShieldAlert}
                        />
                        <QuickAction
                            href="/quality/qms/8d"
                            label="Iniciar Análise 8D"
                            icon={BarChart3}
                        />

                        {/* Dynamic AI Insights Section */}
                        <div className="pt-4 border-t border-border/50">
                            <div className="flex items-center justify-between mb-4">
                                <h5 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Insights IA</h5>
                                {aiLoading && <Clock className="h-3 w-3 animate-spin text-indigo-400" />}
                            </div>

                            {aiInsight ? (
                                <div className="p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-xs text-indigo-300 italic animate-in fade-in slide-in-from-bottom-2 duration-700">
                                    "{aiInsight}"
                                </div>
                            ) : aiLoading ? (
                                <div className="p-4 rounded-xl bg-muted/30 border border-border/50 text-xs text-muted-foreground animate-pulse">
                                    Analisando tendências recentes...
                                </div>
                            ) : (
                                <div className="p-4 rounded-xl bg-muted/20 border border-border/50 text-xs text-muted-foreground italic">
                                    Sem dados suficientes para gerar conselhos táticos.
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

function KPICard({ title, value, icon: Icon, description, color, bgColor, borderColor }: any) {
    return (
        <Card className={cn("glass border-none shadow-md hover:shadow-lg transition-all", borderColor)}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
                <div className={cn("p-2 rounded-lg", bgColor)}>
                    <Icon className={cn("h-4 w-4", color)} />
                </div>
            </CardHeader>
            <CardContent>
                <div className="text-3xl font-bold">{value}</div>
                <p className="text-xs text-muted-foreground mt-1">
                    {description}
                </p>
            </CardContent>
        </Card>
    );
}

function ActionCard({ title, description, href, icon: Icon, stats, color, borderColor }: any) {
    return (
        <Link href={href}>
            <Card className={cn("glass border-none shadow-lg h-full hover:scale-[1.02] transition-all group overflow-hidden bg-gradient-to-br", color, borderColor)}>
                <CardHeader>
                    <div className="flex justify-between items-start">
                        <div className="p-3 rounded-2xl bg-white/5 backdrop-blur-md group-hover:scale-110 transition-transform">
                            <Icon className="h-6 w-6 text-indigo-400" />
                        </div>
                        <Badge variant="outline" className="glass text-[10px] uppercase font-bold text-indigo-300 border-indigo-500/30">
                            {stats}
                        </Badge>
                    </div>
                </CardHeader>
                <CardContent className="space-y-2">
                    <CardTitle className="text-xl">{title}</CardTitle>
                    <p className="text-sm text-muted-foreground">{description}</p>
                </CardContent>
                <CardFooter>
                    <div className="flex items-center text-xs font-bold text-indigo-400 group-hover:gap-2 transition-all">
                        Aceder Módulo
                        <ArrowRight className="ml-1 h-3 w-3" />
                    </div>
                </CardFooter>
            </Card>
        </Link>
    );
}

function QuickAction({ href, label, icon: Icon }: any) {
    return (
        <Link href={href} className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted transition-colors border border-transparent hover:border-border">
            <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center">
                <Icon className="h-4 w-4 text-muted-foreground" />
            </div>
            <span className="text-sm font-medium">{label}</span>
            <ArrowRight className="ml-auto h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
        </Link>
    );
}

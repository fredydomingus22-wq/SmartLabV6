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
import { ActionCard } from "@/components/defaults/action-card";
import { QuickAction } from "@/components/defaults/quick-action";
import { KPICard } from "@/components/defaults/kpi-card";
import { RecentActivityCard } from "@/components/defaults/recent-activity-card";
import { AIInsightCard } from "@/components/defaults/ai-insight-card";

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
                <div className="lg:col-span-2">
                    <RecentActivityCard
                        title="Ocorrências Recentes"
                        description="Monitorização em Tempo Real • Log Industrial"
                        items={recentNCs.map(nc => ({
                            id: nc.id,
                            title: nc.title,
                            code: nc.nc_number,
                            status: nc.status,
                            date: nc.detected_date,
                            severity: nc.severity,
                            type: nc.nc_type,
                            href: `/quality/qms/${nc.id}`
                        }))}
                        viewAllHref="/quality/qms"
                        emptyMessage="Workstation Limpa • Nenhuma Ocorrência"
                    />
                </div>

                {/* AI & Quick Actions */}
                <div className="space-y-6">
                    <AIInsightCard
                        insight={aiInsight}
                        loading={aiLoading}
                    />

                    <Card className="bg-card border-slate-800 shadow-2xl rounded-2xl overflow-hidden">
                        <CardHeader className="pb-4 bg-slate-900/50 border-b border-slate-800">
                            <CardTitle className="text-[11px] font-black uppercase tracking-[0.2em] italic text-white flex items-center gap-2">
                                <Zap className="h-3.5 w-3.5 text-amber-400" />
                                Operação Prioritária
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="grid gap-3 p-6">
                            <QuickAction href="/quality/qms" label="Registar NC" icon={Plus} />
                            <QuickAction href="/quality/qms/capa" label="Plano CAPA" icon={ShieldAlert} />
                            <QuickAction href="/quality/qms/8d" label="Relatório 8D" icon={BarChart3} />
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}

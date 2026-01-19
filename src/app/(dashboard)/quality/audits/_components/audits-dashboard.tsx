"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { KPISparkCard } from "@/components/ui/kpi-spark-card";
import { QuickAction } from "@/components/defaults/quick-action";
import { RecentActivityCard } from "@/components/defaults/recent-activity-card";
import { ActionCard } from "@/components/defaults/action-card";
import { AuditDashboardCharts } from "../dashboard/_components/audit-dashboard-charts";
import {
    ClipboardCheck,
    Target,
    FileWarning,
    Lightbulb,
    AlertTriangle,
    Clock,
    Plus,
    FileText,
    ArrowRight,
    CalendarCheck,
    BarChart3
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface AuditsDashboardProps {
    kpis: any;
    dashboardKpis: any;
    trendData: any;
    ncsByProcess: any;
    auditsByType: any;
    complianceByStandard: any;
    recentAudits: any[];
    overdueAudits: any[];
}

export function AuditsDashboard({
    kpis,
    dashboardKpis,
    trendData,
    ncsByProcess,
    auditsByType,
    complianceByStandard,
    recentAudits,
    overdueAudits
}: AuditsDashboardProps) {
    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Dashboard KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-6">
                <KPISparkCard
                    variant="emerald"
                    title="Volume de Auditorias"
                    value={dashboardKpis.totalAudits.toString().padStart(2, '0')}
                    description={`${dashboardKpis.completedAudits} concluídas`}
                    icon={<ClipboardCheck className="h-4 w-4" />}
                    data={[kpis.total - 2, kpis.total - 1, kpis.total].map((v: number) => ({ value: v }))}
                    dataKey="value"
                />
                <KPISparkCard
                    variant={dashboardKpis.complianceRate >= 80 ? "emerald" : dashboardKpis.complianceRate >= 60 ? "amber" : "rose"}
                    title="Grau de Conformidade"
                    value={`${dashboardKpis.complianceRate}%`}
                    description={`${dashboardKpis.compliantItems}/${dashboardKpis.totalItems} pontos verificados`}
                    icon={<Target className="h-4 w-4" />}
                    data={[75, 78, 80, 82, 85].map((v: number) => ({ value: v }))}
                    dataKey="value"
                />
                <KPISparkCard
                    variant="rose"
                    title="Casos NC"
                    value={dashboardKpis.nonConformities.toString().padStart(2, '0')}
                    description="Não Conformidades Ativas"
                    icon={<FileWarning className="h-4 w-4" />}
                    data={[5, 4, 3, 4, 2].map((v: number) => ({ value: v }))}
                    dataKey="value"
                />
                <KPISparkCard
                    variant="amber"
                    title="Melhoria Contínua"
                    value={dashboardKpis.improvements.toString().padStart(2, '0')}
                    description="OFI / Observações"
                    icon={<Lightbulb className="h-4 w-4" />}
                    data={[2, 3, 2, 4, 3].map((v: number) => ({ value: v }))}
                    dataKey="value"
                />
                <KPISparkCard
                    variant="rose"
                    title="Prazos Excedidos"
                    value={kpis.overdue.toString().padStart(2, '0')}
                    description="Incumprimento de Calendário"
                    icon={<AlertTriangle className="h-4 w-4" />}
                    data={[1, 0, 1, 0, kpis.overdue].map((v: number) => ({ value: v }))}
                    dataKey="value"
                />
            </div>

            {/* Action Cards */}
            <div className="grid gap-4 md:grid-cols-3">
                <ActionCard
                    title="Auditorias & Checklists"
                    description="Execução de auditorias, checklists de verificação e gestão de não conformidades."
                    href="/quality/audits?tab=list"
                    icon={ClipboardCheck}
                    stats={`${dashboardKpis.ongoing} Em Curso`}
                />
                <ActionCard
                    title="Planeamento Anual"
                    description="Calendário de auditorias internas e externas, gestão de auditores e recursos."
                    href="/quality/audits?tab=planning"
                    icon={CalendarCheck}
                    stats={`${dashboardKpis.planned} Agendadas`}
                />
                <ActionCard
                    title="Relatórios de Auditoria"
                    description="Análise de tendências, relatórios de conformidade e exportação de dados."
                    href="/quality/audits?tab=reports"
                    icon={BarChart3}
                    stats="Analytics"
                />
            </div>

            {/* Main Content Grid */}
            <div className="grid gap-6 lg:grid-cols-3">
                {/* Charts Section - 2 cols */}
                <div className="lg:col-span-2">
                    <AuditDashboardCharts
                        trendData={trendData}
                        ncsByProcess={ncsByProcess}
                        auditsByType={auditsByType}
                        complianceByStandard={complianceByStandard}
                    />
                </div>

                {/* Quick Actions & Recent Panel - 1 col */}
                <div className="space-y-6">
                    {/* Quick Actions */}
                    <Card className="glass border-none shadow-xl bg-gradient-to-br from-emerald-500/5 to-transparent">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-[11px] font-black uppercase tracking-[0.2em] italic text-white flex items-center gap-3">
                                <Plus className="h-4 w-4 text-emerald-400" />
                                Operações de Sistema
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <QuickAction
                                href="/quality/audits?tab=list"
                                label="Ver Auditorias em Atraso"
                                icon={AlertTriangle}
                                badge={kpis.overdue > 0 ? kpis.overdue.toString() : undefined}
                                badgeColor="rose"
                            />
                            <QuickAction
                                href="/quality/audits?tab=list&status=in_progress"
                                label="Auditorias em Curso"
                                icon={Clock}
                                badge={kpis.ongoing > 0 ? kpis.ongoing.toString() : undefined}
                                badgeColor="amber"
                            />
                            <QuickAction
                                href="/quality/qms"
                                label="Ver Não Conformidades"
                                icon={FileWarning}
                            />
                        </CardContent>
                    </Card>

                    {/* Overdue Alerts */}
                    {overdueAudits.length > 0 && (
                        <Card className="glass border-rose-500/30 shadow-xl bg-gradient-to-br from-rose-500/10 to-transparent">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-[11px] font-black uppercase tracking-[0.2em] italic text-rose-400 flex items-center gap-3">
                                    <AlertTriangle className="h-4 w-4" />
                                    Alertas de Incumprimento
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                {overdueAudits.map((audit: any) => (
                                    <Link
                                        key={audit.id}
                                        href={`/quality/audits/${audit.id}`}
                                        className="block p-3 rounded-xl hover:bg-rose-500/10 transition-colors border border-transparent hover:border-rose-500/20"
                                    >
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-sm font-medium text-slate-200 truncate max-w-[180px]">
                                                    {audit.title}
                                                </p>
                                                <p className="text-[10px] text-slate-500 font-mono">
                                                    {audit.audit_number}
                                                </p>
                                            </div>
                                            <Badge variant="destructive" className="text-[9px]">
                                                {audit.planned_date}
                                            </Badge>
                                        </div>
                                    </Link>
                                ))}
                            </CardContent>
                        </Card>
                    )}

                    {/* Recent Audits */}
                    <RecentActivityCard
                        title="Log de Auditorias Recentes"
                        description="Registo de Atividade de Auditoria"
                        items={recentAudits.map((audit: any) => ({
                            id: audit.id,
                            title: audit.title,
                            code: audit.audit_number,
                            status: audit.status,
                            date: audit.planned_date,
                            href: `/quality/audits/${audit.id}`
                        }))}
                        viewAllHref="/quality/audits?tab=list"
                        viewAllLabel="Consultar Histórico"
                        emptyMessage="Nenhuma auditoria registada."
                    />
                </div>
            </div>
        </div>
    );
}

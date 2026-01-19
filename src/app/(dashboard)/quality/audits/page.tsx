import { Suspense } from "react";
import { getAudits, getAuditKpis, getAuditChecklists } from "@/lib/queries/audits";
import { getUsers } from "@/lib/queries/users";
import {
    getAuditDashboardKpis,
    getAuditTrendByMonth,
    getNCsByProcess,
    getAuditsByType,
    getComplianceByStandard,
} from "@/lib/queries/audit-dashboard";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { KPISparkCard } from "@/components/ui/kpi-spark-card"; // This is correct, keeping KPISparkCard for sparklines
import {
    ClipboardCheck,
    Calendar,
    Clock,
    AlertTriangle,
    ListChecks,
    LayoutDashboard
} from "lucide-react";
import { CreateAuditDialog } from "./_components/create-audit-dialog";
import { AuditListClient } from "./_components/audit-list-client";
import { AuditsDashboard } from "./_components/audits-dashboard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/layout/page-header";

export const dynamic = "force-dynamic";

interface PageProps {
    searchParams: Promise<{ status?: string; tab?: string }>;
}

export default async function AuditsPage({ searchParams }: PageProps) {
    const params = await searchParams;
    const activeTab = params.tab || "dashboard";

    // Parallel data fetching
    const [
        kpis,
        { data: audits },
        { data: checklists },
        { data: users },
        dashboardKpis,
        trendData,
        ncsByProcess,
        auditsByType,
        complianceByStandard,
    ] = await Promise.all([
        getAuditKpis(),
        getAudits({ status: params.status }),
        getAuditChecklists(),
        getUsers(),
        getAuditDashboardKpis(),
        getAuditTrendByMonth(),
        getNCsByProcess(),
        getAuditsByType(),
        getComplianceByStandard(),
    ]);

    // Recent audits for dashboard
    const recentAudits = audits.slice(0, 5);
    const overdueAudits = audits.filter((a: any) =>
        a.status === 'planned' && new Date(a.planned_date) < new Date()
    ).slice(0, 3);

    return (
        <div className="space-y-6 px-6 pb-20">
            {/* Header */}
            <PageHeader
                variant="emerald"
                icon={<ClipboardCheck className="h-4 w-4" />}
                overline="GQ • Ciclo de Controlo e Auditoria"
                title="Sistemas de Auditoria Industrial"
                description="Planeamento, execução e análise crítica de auditorias sob norma ISO 9001:2015."
                actions={<CreateAuditDialog checklists={checklists} users={users} />}
            />

            {/* Tabs: Dashboard vs Lista */}
            <Tabs defaultValue={activeTab} className="space-y-6">
                <TabsList className="glass border-none shadow-md p-1">
                    <TabsTrigger
                        value="dashboard"
                        className="data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-400 data-[state=active]:shadow-md gap-2"
                    >
                        <LayoutDashboard className="h-4 w-4" />
                        Resumo Operativo
                    </TabsTrigger>
                    <TabsTrigger
                        value="list"
                        className="data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-400 data-[state=active]:shadow-md gap-2"
                    >
                        <ListChecks className="h-4 w-4" />
                        Mapa de Auditorias
                    </TabsTrigger>
                </TabsList>

                {/* Dashboard Tab */}
                <TabsContent value="dashboard" className="m-0 outline-none">
                    <AuditsDashboard
                        kpis={kpis}
                        dashboardKpis={dashboardKpis}
                        trendData={trendData}
                        ncsByProcess={ncsByProcess}
                        auditsByType={auditsByType}
                        complianceByStandard={complianceByStandard}
                        recentAudits={recentAudits}
                        overdueAudits={overdueAudits}
                    />
                </TabsContent>

                {/* List Tab */}
                <TabsContent value="list" className="space-y-6 animate-in fade-in duration-500 border-none p-0 outline-none">
                    {/* Status KPIs (kept local for specific list view context, or could be moved) */}
                    <div className="grid gap-6 md:grid-cols-4">
                        <KPISparkCard
                            variant="slate"
                            title="Total"
                            value={kpis.total.toString().padStart(2, '0')}
                            description="No ciclo atual"
                            icon={<ClipboardCheck className="h-4 w-4" />}
                            data={[10, 12, 11, 13].map((v: number) => ({ value: v }))}
                            dataKey="value"
                        />
                        <KPISparkCard
                            variant="emerald"
                            title="Planeadas"
                            value={kpis.planned.toString().padStart(2, '0')}
                            description="A aguardar execução"
                            icon={<Calendar className="h-4 w-4" />}
                            data={[2, 4, 3, 5].map((v: number) => ({ value: v }))}
                            dataKey="value"
                        />
                        <KPISparkCard
                            variant="amber"
                            title="Em Curso"
                            value={kpis.ongoing.toString().padStart(2, '0')}
                            description="Execução ativa"
                            icon={<Clock className="h-4 w-4" />}
                            data={[1, 2, 1, 3].map((v: number) => ({ value: v }))}
                            dataKey="value"
                        />
                        <KPISparkCard
                            variant="rose"
                            title="Em Atraso"
                            value={kpis.overdue.toString().padStart(2, '0')}
                            description="Prazos ultrapassados"
                            icon={<AlertTriangle className="h-4 w-4" />}
                            data={[0, 1, 0, kpis.overdue].map((v: number) => ({ value: v }))}
                            dataKey="value"
                        />
                    </div>

                    {/* Audit List */}
                    <Card className="glass border-none shadow-xl overflow-hidden">
                        <CardHeader className="bg-gradient-to-r from-muted/50 to-transparent border-b border-slate-800/50">
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="text-lg">Plano Anual de Auditorias</CardTitle>
                                    <CardDescription>
                                        {audits.length} auditoria(s) no sistema
                                    </CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            <AuditListClient audits={audits} />
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Footer */}
            <div className="flex items-center justify-between pt-6 border-t border-slate-800/50 opacity-60">
                <span className="text-[9px] text-slate-500 font-black tracking-[0.3em] uppercase italic">SmartLab Audit Engine • ISO 9001 Regulatory Hub</span>
                <div className="flex items-center gap-3">
                    <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse" />
                    <span className="text-[9px] text-emerald-500 font-black uppercase tracking-[0.2em] italic">SGQ-Sync: Ativo</span>
                </div>
            </div>
        </div>
    );
}

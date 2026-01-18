import { Suspense } from "react";
import Link from "next/link";
import { getAudits, getAuditKpis, getAuditChecklists } from "@/lib/queries/audits";
import { getUsers } from "@/lib/queries/users";
import {
    getAuditDashboardKpis,
    getAuditTrendByMonth,
    getNCsByProcess,
    getAuditsByType,
    getComplianceByStandard,
} from "@/lib/queries/audit-dashboard";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    ClipboardCheck,
    Calendar,
    Clock,
    AlertTriangle,
    BarChart3,
    ListChecks,
    Target,
    FileWarning,
    Lightbulb,
    LayoutDashboard,
    ArrowRight,
    Plus,
    CheckCircle,
    FileText,
    TrendingUp,
} from "lucide-react";
import { CreateAuditDialog } from "./_components/create-audit-dialog";
import { AuditListClient } from "./_components/audit-list-client";
import { AuditDashboardCharts } from "./dashboard/_components/audit-dashboard-charts";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/page-header";
import { KPISparkCard } from "@/components/ui/kpi-spark-card";
import { cn } from "@/lib/utils";

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

    // Recent audits for quick view
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
                <TabsContent value="dashboard" className="space-y-6 animate-in fade-in duration-500 border-none p-0 outline-none">
                    {/* Dashboard KPI Cards */}
                    <div className="grid grid-cols-2 lg:grid-cols-5 gap-6">
                        <KPISparkCard
                            variant="emerald"
                            title="Volume de Auditorias"
                            value={dashboardKpis.totalAudits.toString().padStart(2, '0')}
                            description={`${dashboardKpis.completedAudits} concluídas`}
                            icon={<ClipboardCheck className="h-4 w-4" />}
                            data={[kpis.total - 2, kpis.total - 1, kpis.total].map(v => ({ value: v }))}
                            dataKey="value"
                        />
                        <KPISparkCard
                            variant={dashboardKpis.complianceRate >= 80 ? "emerald" : dashboardKpis.complianceRate >= 60 ? "amber" : "rose"}
                            title="Grau de Conformidade"
                            value={`${dashboardKpis.complianceRate}%`}
                            description={`${dashboardKpis.compliantItems}/${dashboardKpis.totalItems} pontos verificados`}
                            icon={<Target className="h-4 w-4" />}
                            data={[75, 78, 80, 82, 85].map(v => ({ value: v }))}
                            dataKey="value"
                        />
                        <KPISparkCard
                            variant="rose"
                            title="Casos NC"
                            value={dashboardKpis.nonConformities.toString().padStart(2, '0')}
                            description="Não Conformidades Ativas"
                            icon={<FileWarning className="h-4 w-4" />}
                            data={[5, 4, 3, 4, 2].map(v => ({ value: v }))}
                            dataKey="value"
                        />
                        <KPISparkCard
                            variant="amber"
                            title="Melhoria Contínua"
                            value={dashboardKpis.improvements.toString().padStart(2, '0')}
                            description="OFI / Observações"
                            icon={<Lightbulb className="h-4 w-4" />}
                            data={[2, 3, 2, 4, 3].map(v => ({ value: v }))}
                            dataKey="value"
                        />
                        <KPISparkCard
                            variant="rose"
                            title="Prazos Excedidos"
                            value={kpis.overdue.toString().padStart(2, '0')}
                            description="Incumprimento de Calendário"
                            icon={<AlertTriangle className="h-4 w-4" />}
                            data={[1, 0, 1, 0, kpis.overdue].map(v => ({ value: v }))}
                            dataKey="value"
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
                            <Card className="glass border-none shadow-xl">
                                <CardHeader className="pb-3 border-b border-slate-800/50">
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="text-[11px] font-black uppercase tracking-[0.2em] italic text-white flex items-center gap-3">
                                            <FileText className="h-4 w-4 text-slate-500" />
                                            Log de Auditorias Recentes
                                        </CardTitle>
                                        <Link href="/quality/audits?tab=list">
                                            <Button variant="ghost" size="sm" className="text-emerald-400 text-[10px] font-black uppercase tracking-widest italic group">
                                                Consultar Histórico
                                                <ArrowRight className="ml-2 h-3 w-3 group-hover:translate-x-1 transition-transform" />
                                            </Button>
                                        </Link>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-0">
                                    <div className="divide-y divide-slate-800/50">
                                        {recentAudits.length > 0 ? (
                                            recentAudits.map((audit: any) => (
                                                <Link
                                                    key={audit.id}
                                                    href={`/quality/audits/${audit.id}`}
                                                    className="block p-4 hover:bg-slate-800/30 transition-colors group"
                                                >
                                                    <div className="flex items-center justify-between">
                                                        <div className="space-y-1">
                                                            <p className="text-sm font-medium text-slate-200 group-hover:text-emerald-400 transition-colors truncate max-w-[200px]">
                                                                {audit.title}
                                                            </p>
                                                            <div className="flex items-center gap-2 text-[10px] text-slate-500">
                                                                <span className="font-mono">{audit.audit_number}</span>
                                                                <span>•</span>
                                                                <span>{audit.planned_date}</span>
                                                            </div>
                                                        </div>
                                                        <Badge
                                                            variant="outline"
                                                            className={cn(
                                                                "text-[9px] uppercase",
                                                                audit.status === 'completed' && "border-emerald-500/30 text-emerald-400",
                                                                audit.status === 'in_progress' && "border-amber-500/30 text-amber-400",
                                                                audit.status === 'planned' && "border-slate-600 text-slate-400"
                                                            )}
                                                        >
                                                            {audit.status === 'completed' ? 'Concluída' :
                                                                audit.status === 'in_progress' ? 'Em Curso' : 'Planeada'}
                                                        </Badge>
                                                    </div>
                                                </Link>
                                            ))
                                        ) : (
                                            <div className="p-8 text-center text-slate-500 italic">
                                                Nenhuma auditoria registada.
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </TabsContent>

                {/* List Tab */}
                <TabsContent value="list" className="space-y-6 animate-in fade-in duration-500 border-none p-0 outline-none">
                    {/* Status KPIs */}
                    <div className="grid gap-6 md:grid-cols-4">
                        <KPISparkCard
                            variant="slate"
                            title="Total"
                            value={kpis.total.toString().padStart(2, '0')}
                            description="No ciclo atual"
                            icon={<ClipboardCheck className="h-4 w-4" />}
                            data={[10, 12, 11, 13].map(v => ({ value: v }))}
                            dataKey="value"
                        />
                        <KPISparkCard
                            variant="emerald"
                            title="Planeadas"
                            value={kpis.planned.toString().padStart(2, '0')}
                            description="A aguardar execução"
                            icon={<Calendar className="h-4 w-4" />}
                            data={[2, 4, 3, 5].map(v => ({ value: v }))}
                            dataKey="value"
                        />
                        <KPISparkCard
                            variant="amber"
                            title="Em Curso"
                            value={kpis.ongoing.toString().padStart(2, '0')}
                            description="Execução ativa"
                            icon={<Clock className="h-4 w-4" />}
                            data={[1, 2, 1, 3].map(v => ({ value: v }))}
                            dataKey="value"
                        />
                        <KPISparkCard
                            variant="rose"
                            title="Em Atraso"
                            value={kpis.overdue.toString().padStart(2, '0')}
                            description="Prazos ultrapassados"
                            icon={<AlertTriangle className="h-4 w-4" />}
                            data={[0, 1, 0, kpis.overdue].map(v => ({ value: v }))}
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

function KPICard({
    title,
    value,
    subtitle,
    icon: Icon,
    color,
    highlight,
}: {
    title: string;
    value: string | number;
    subtitle: string;
    icon: any;
    color: "emerald" | "rose" | "amber" | "blue" | "slate";
    highlight?: boolean;
}) {
    const colors = {
        emerald: { text: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/30" },
        rose: { text: "text-rose-400", bg: "bg-rose-500/10", border: "border-rose-500/30" },
        amber: { text: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/30" },
        blue: { text: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/30" },
        slate: { text: "text-slate-400", bg: "bg-slate-500/10", border: "border-slate-700" },
    };

    return (
        <Card className={cn(
            "glass border-none shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all duration-300",
            highlight && colors[color].border
        )}>
            <CardContent className="p-4">
                <div className="flex items-start justify-between">
                    <div>
                        <p className="text-[10px] uppercase tracking-wider font-bold text-slate-500 mb-1">
                            {title}
                        </p>
                        <p className={cn("text-2xl font-bold", highlight ? colors[color].text : "text-slate-100")}>{value}</p>
                        <p className="text-[10px] text-slate-500 mt-1">{subtitle}</p>
                    </div>
                    <div className={cn("p-2 rounded-xl", colors[color].bg)}>
                        <Icon className={cn("h-4 w-4", colors[color].text)} />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

function QuickAction({
    href,
    label,
    icon: Icon,
    badge,
    badgeColor,
}: {
    href: string;
    label: string;
    icon: any;
    badge?: string;
    badgeColor?: "rose" | "amber" | "emerald";
}) {
    const badgeColors = {
        rose: "bg-rose-500/20 text-rose-400 border-rose-500/30",
        amber: "bg-amber-500/20 text-amber-400 border-amber-500/30",
        emerald: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    };

    return (
        <Link
            href={href}
            className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-800/50 transition-colors border border-transparent hover:border-slate-700 group"
        >
            <div className="h-8 w-8 rounded-lg bg-slate-800/50 flex items-center justify-center group-hover:bg-emerald-500/10 transition-colors">
                <Icon className="h-4 w-4 text-slate-400 group-hover:text-emerald-400 transition-colors" />
            </div>
            <span className="text-sm font-medium flex-1">{label}</span>
            {badge && (
                <Badge variant="outline" className={cn("text-[10px]", badgeColors[badgeColor || "emerald"])}>
                    {badge}
                </Badge>
            )}
            <ArrowRight className="h-4 w-4 text-slate-600 group-hover:text-emerald-400 group-hover:translate-x-1 transition-all" />
        </Link>
    );
}

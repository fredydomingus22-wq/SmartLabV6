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
import Link from "next/link";
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
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3 text-slate-100">
                        <div className="p-2 rounded-xl bg-emerald-500/10">
                            <ClipboardCheck className="h-7 w-7 text-emerald-400" />
                        </div>
                        Gestão de Auditorias
                    </h1>
                    <p className="text-muted-foreground mt-1 ml-14">
                        Planeamento, execução e análise de auditorias (ISO 9001 Clause 9.2)
                    </p>
                </div>
                <CreateAuditDialog checklists={checklists} users={users} />
            </div>

            {/* Tabs: Dashboard vs Lista */}
            <Tabs defaultValue={activeTab} className="space-y-6">
                <TabsList className="glass border-none shadow-md p-1">
                    <TabsTrigger
                        value="dashboard"
                        className="data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-400 data-[state=active]:shadow-md gap-2"
                    >
                        <LayoutDashboard className="h-4 w-4" />
                        Dashboard
                    </TabsTrigger>
                    <TabsTrigger
                        value="list"
                        className="data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-400 data-[state=active]:shadow-md gap-2"
                    >
                        <ListChecks className="h-4 w-4" />
                        Lista de Auditorias
                    </TabsTrigger>
                </TabsList>

                {/* Dashboard Tab */}
                <TabsContent value="dashboard" className="space-y-6 animate-in fade-in duration-500 border-none p-0 outline-none">
                    {/* Dashboard KPI Cards */}
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                        <KPICard
                            title="Total de Auditorias"
                            value={dashboardKpis.totalAudits}
                            subtitle={`${dashboardKpis.completedAudits} concluídas`}
                            icon={ClipboardCheck}
                            color="emerald"
                        />
                        <KPICard
                            title="Taxa de Conformidade"
                            value={`${dashboardKpis.complianceRate}%`}
                            subtitle={`${dashboardKpis.compliantItems}/${dashboardKpis.totalItems} itens`}
                            icon={Target}
                            color={dashboardKpis.complianceRate >= 80 ? "emerald" : dashboardKpis.complianceRate >= 60 ? "amber" : "rose"}
                            highlight={dashboardKpis.complianceRate < 80}
                        />
                        <KPICard
                            title="Não Conformidades"
                            value={dashboardKpis.nonConformities}
                            subtitle="NC Menores e Maiores"
                            icon={FileWarning}
                            color="rose"
                        />
                        <KPICard
                            title="Oport. Melhoria"
                            value={dashboardKpis.improvements}
                            subtitle="OFIs identificadas"
                            icon={Lightbulb}
                            color="amber"
                        />
                        <KPICard
                            title="Em Atraso"
                            value={kpis.overdue}
                            subtitle="Data limite ultrapassada"
                            icon={AlertTriangle}
                            color="rose"
                            highlight={kpis.overdue > 0}
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
                                    <CardTitle className="text-base flex items-center gap-2">
                                        <Plus className="h-4 w-4 text-emerald-400" />
                                        Ações Rápidas
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
                                        <CardTitle className="text-base flex items-center gap-2 text-rose-400">
                                            <AlertTriangle className="h-4 w-4" />
                                            Auditorias em Atraso
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
                                        <CardTitle className="text-base flex items-center gap-2">
                                            <FileText className="h-4 w-4 text-slate-400" />
                                            Auditorias Recentes
                                        </CardTitle>
                                        <Link href="/quality/audits?tab=list">
                                            <Button variant="ghost" size="sm" className="text-emerald-400 text-xs">
                                                Ver todas
                                                <ArrowRight className="ml-1 h-3 w-3" />
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
                    <div className="grid gap-4 md:grid-cols-4">
                        <KPICard title="Total" value={kpis.total} subtitle="No ciclo atual" icon={ClipboardCheck} color="slate" />
                        <KPICard title="Planeadas" value={kpis.planned} subtitle="A aguardar execução" icon={Calendar} color="emerald" />
                        <KPICard title="Em Curso" value={kpis.ongoing} subtitle="Execução ativa" icon={Clock} color="amber" />
                        <KPICard title="Em Atraso" value={kpis.overdue} subtitle="Data limite ultrapassada" icon={AlertTriangle} color="rose" highlight={kpis.overdue > 0} />
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
            <div className="flex items-center justify-between pt-4 border-t border-slate-800/50">
                <span className="text-[10px] text-slate-500 font-mono tracking-widest uppercase">ISO 9001:2015 Clause 9.2 Compliant</span>
                <div className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[10px] text-emerald-500/80 font-bold uppercase tracking-widest">Sincronizado</span>
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
    icon: React.ElementType;
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
    icon: React.ElementType;
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

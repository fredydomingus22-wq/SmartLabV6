import {
    getAuditDashboardKpis,
    getAuditTrendByMonth,
    getNCsByProcess,
    getAuditsByType,
    getComplianceByStandard,
} from "@/lib/queries/audit-dashboard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    ClipboardCheck,
    CheckCircle2,
    AlertTriangle,
    TrendingUp,
    Target,
    FileWarning,
    Lightbulb,
    BarChart3,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AuditDashboardCharts } from "./_components/audit-dashboard-charts";

export default async function AuditDashboardPage() {
    const [kpis, trendData, ncsByProcess, auditsByType, complianceByStandard] = await Promise.all([
        getAuditDashboardKpis(),
        getAuditTrendByMonth(),
        getNCsByProcess(),
        getAuditsByType(),
        getComplianceByStandard(),
    ]);

    return (
        <div className="p-6 space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-100">
                        Dashboard de Auditorias
                    </h1>
                    <p className="text-slate-400 mt-1">
                        Visão geral do desempenho e conformidade das auditorias
                    </p>
                </div>
                <Link href="/quality/audits">
                    <Button variant="outline" className="border-slate-800 text-slate-300">
                        <ClipboardCheck className="h-4 w-4 mr-2" />
                        Ver Auditorias
                    </Button>
                </Link>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                <KpiCard
                    title="Total de Auditorias"
                    value={kpis.totalAudits}
                    subtitle={`${kpis.completedAudits} concluídas`}
                    icon={ClipboardCheck}
                    color="emerald"
                />
                <KpiCard
                    title="Taxa de Conformidade"
                    value={`${kpis.complianceRate}%`}
                    subtitle={`${kpis.compliantItems} de ${kpis.totalItems} itens`}
                    icon={Target}
                    color={kpis.complianceRate >= 80 ? "emerald" : kpis.complianceRate >= 60 ? "amber" : "rose"}
                />
                <KpiCard
                    title="Não Conformidades"
                    value={kpis.nonConformities}
                    subtitle="NC Menores e Maiores"
                    icon={FileWarning}
                    color="rose"
                />
                <KpiCard
                    title="Oportunidades Melhoria"
                    value={kpis.improvements}
                    subtitle="OFIs identificadas"
                    icon={Lightbulb}
                    color="amber"
                />
                <KpiCard
                    title="Itens Avaliados"
                    value={kpis.totalItems}
                    subtitle="Total de verificações"
                    icon={CheckCircle2}
                    color="blue"
                />
            </div>

            {/* Charts Section */}
            <AuditDashboardCharts
                trendData={trendData}
                ncsByProcess={ncsByProcess}
                auditsByType={auditsByType}
                complianceByStandard={complianceByStandard}
            />
        </div>
    );
}

function KpiCard({
    title,
    value,
    subtitle,
    icon: Icon,
    color,
}: {
    title: string;
    value: string | number;
    subtitle: string;
    icon: any;
    color: "emerald" | "rose" | "amber" | "blue" | "slate";
}) {
    const colors = {
        emerald: "text-emerald-400 bg-emerald-500/10",
        rose: "text-rose-400 bg-rose-500/10",
        amber: "text-amber-400 bg-amber-500/10",
        blue: "text-blue-400 bg-blue-500/10",
        slate: "text-slate-400 bg-slate-500/10",
    };

    return (
        <Card className="glass border-slate-800/50 hover:border-slate-700/50 transition-all">
            <CardContent className="p-5">
                <div className="flex items-start justify-between">
                    <div>
                        <p className="text-[10px] uppercase tracking-wider font-bold text-slate-500 mb-1">
                            {title}
                        </p>
                        <p className="text-3xl font-bold text-slate-100">{value}</p>
                        <p className="text-xs text-slate-500 mt-1">{subtitle}</p>
                    </div>
                    <div className={`p-2.5 rounded-xl ${colors[color]}`}>
                        <Icon className="h-5 w-5" />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

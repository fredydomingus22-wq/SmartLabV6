import { getQualityKPIs, getNCTrends, getTopDefects } from "@/lib/queries/quality";
import { Badge } from "@/components/ui/badge";
import {
    TrendingUp,
    ClipboardList,
    Target,
    Activity,
    Scale,
    ShieldAlert,
    Timer,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/layout/page-header";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
    CardFooter
} from "@/components/ui/card";
import { KPISparkCard } from "@/components/ui/kpi-spark-card";
import { QualityDashboardTrendChart } from "./_components/quality-dashboard-trend-chart";

export const dynamic = "force-dynamic";

export default async function QualityDashboardPage() {
    const { kpis } = await getQualityKPIs();
    const { trends } = await getNCTrends(30);
    const { defects } = await getTopDefects(5);

    const actionsArr = [
        { label: "Gráficos SPC", href: "/quality/spc", icon: TrendingUp },
        { label: "Não Conformidades", href: "/quality/qms", icon: ClipboardList },
        { label: "Planos CAPA", href: "/quality/qms/capa", icon: Target }
    ];

    return (
        <div className="space-y-6 p-6 pb-20">
            <PageHeader
                title="Consola de Qualidade"
                overline="Sistema de Gestão da Qualidade (SGQ)"
                description="Monitorização analítica e conformidade em tempo real"
                icon={<Scale className="h-4 w-4" />}
                actions={
                    <div className="flex items-center gap-2">
                        {actionsArr.map((action) => (
                            <Link key={action.href} href={action.href}>
                                <Button variant="outline" className="h-9 text-[9px] uppercase font-bold tracking-widest px-4">
                                    <action.icon className="h-3.5 w-3.5 mr-2 opacity-70" />
                                    {action.label}
                                </Button>
                            </Link>
                        ))}
                    </div>
                }
            />

            {/* KPI Section */}
            <div className="space-y-6">
                <div className="flex items-center gap-2 px-1">
                    <TrendingUp className="h-4 w-4 text-emerald-400" />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                        Indicadores Críticos • Métricas da Qualidade
                    </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <KPISparkCard
                        variant="emerald"
                        title="First Pass Yield (FPY)"
                        value={`${kpis.fpy}%`}
                        description={`${kpis.totalAnalysis} análises (30 dias)`}
                        icon={<TrendingUp className="h-4 w-4" />}
                        data={kpis.sparklines.fpy}
                    />
                    <KPISparkCard
                        variant="rose"
                        title="Não Conformidades"
                        value={kpis.openNCs.toString()}
                        description={`${kpis.inProgressNCs} em investigação`}
                        icon={<ShieldAlert className="h-4 w-4" />}
                        data={kpis.sparklines.nc}
                    />
                    <KPISparkCard
                        variant="amber"
                        title="Planos CAPA Abertos"
                        value={kpis.openCAPAs.toString()}
                        description={`${kpis.totalCAPAs} ações registadas`}
                        icon={<Target className="h-4 w-4" />}
                        data={kpis.sparklines.capa}
                    />
                    <KPISparkCard
                        variant="purple"
                        title="Taxa de Não Conformidade"
                        value={`${kpis.ncRate}%`}
                        description="por cada 100 análises"
                        icon={<Activity className="h-4 w-4" />}
                        data={kpis.sparklines.nc}
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Trends Chart */}
                <Card className="lg:col-span-2 bg-card border-slate-800 shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                        <TrendingUp className="h-32 w-32 text-rose-500" />
                    </div>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 relative z-10 pb-0">
                        <div>
                            <CardTitle className="text-xl font-black tracking-tight text-white uppercase italic">Tendência de NC</CardTitle>
                            <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Histórico de Não Conformidades • Últimos 30 Dias</CardDescription>
                        </div>
                        <Badge variant="outline" className="text-[10px] font-black tracking-widest text-rose-400 border-rose-500/20 bg-rose-500/10">MONITORIZAÇÃO DE ALERTA</Badge>
                    </CardHeader>
                    <CardContent className="relative z-10 pt-4">
                        <QualityDashboardTrendChart data={trends} />
                    </CardContent>
                </Card>

                {/* Side Stats */}
                <div className="space-y-6">
                    <Card className="bg-card border-slate-800 shadow-xl">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                            <CardTitle className="text-[11px] font-black uppercase tracking-[0.2em] text-white italic">Pareto de Defeitos</CardTitle>
                            <ShieldAlert className="h-4 w-4 text-rose-400" />
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {defects.length > 0 ? (
                                (() => {
                                    const maxCount = Math.max(...defects.map((d: any) => d.count));
                                    return defects.map((defect: any) => {
                                        const percentage = maxCount > 0 ? (defect.count / maxCount) * 100 : 0;
                                        return (
                                            <div key={defect.type} className="relative overflow-hidden group">
                                                <div
                                                    className="absolute inset-0 bg-rose-500/5 group-hover:bg-rose-500/10 transition-colors"
                                                    style={{ width: `${percentage}%` }}
                                                />
                                                <div className="relative flex items-center justify-between p-3 rounded-lg border border-slate-800/50 bg-slate-950/30">
                                                    <div className="flex items-center gap-3">
                                                        <div className="p-2 rounded-lg bg-rose-500/10 text-rose-500">
                                                            <ShieldAlert className="h-4 w-4" />
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-black text-white uppercase tracking-tight italic">{defect.type}</p>
                                                            <p className="text-[10px] text-slate-500 uppercase font-black">{defect.count} ocorrências</p>
                                                        </div>
                                                    </div>
                                                    <Badge variant="outline" className="text-[9px] font-black tracking-widest text-rose-400 border-rose-500/20 bg-rose-500/5">
                                                        {Math.round(percentage)}%
                                                    </Badge>
                                                </div>
                                            </div>
                                        );
                                    });
                                })()
                            ) : (
                                <p className="text-[10px] font-black text-slate-600 uppercase italic tracking-widest text-center py-10">Sem desvios registrados</p>
                            )}
                        </CardContent>
                    </Card>

                    <Card className="bg-card border-slate-800 p-4 border-l-4 border-l-primary shadow-xl">
                        <div className="flex items-start justify-between">
                            <div className="space-y-1">
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Tempo de Resposta</p>
                                <h4 className="text-2xl font-black text-white italic tracking-tighter">4.2h</h4>
                                <p className="text-[10px] text-slate-600 font-black uppercase tracking-tight italic">Média de Investigação</p>
                            </div>
                            <div className="p-2 rounded-lg bg-primary/10 text-primary">
                                <Timer className="h-6 w-6" />
                            </div>
                        </div>
                        <div className="mt-4">
                            <Badge className="text-[9px] font-black tracking-[0.2em] bg-indigo-500/20 text-indigo-400 border-indigo-500/30 italic uppercase">Eficiência Ativa</Badge>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}

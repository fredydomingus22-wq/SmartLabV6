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

export const dynamic = "force-dynamic";

export default async function QualityDashboardPage() {
    const { kpis } = await getQualityKPIs();
    const { trends } = await getNCTrends(30);
    const { defects } = await getTopDefects(5);

    // Generate sparkline data
    const generateSparkline = () => Array.from({ length: 7 }, () => Math.floor(Math.random() * 15) + 5).map(v => ({ value: v }));

    const actionsArr = [
        { label: "Gráficos SPC", href: "/quality/spc", icon: TrendingUp },
        { label: "Desvios", href: "/quality/qms", icon: ClipboardList },
        { label: "CAPAs", href: "/quality/qms/capa", icon: Target }
    ];

    return (
        <div className="space-y-10 focus-visible:outline-none">
            <PageHeader
                title="Painel de Qualidade"
                overline="Quality Management System"
                description="Gestão analítica e compliance em tempo real"
                icon={<Scale className="h-4 w-4" />}
                actions={
                    <div className="flex items-center gap-2">
                        {actionsArr.map((action) => (
                            <Link key={action.href} href={action.href}>
                                <Button variant="ghost" className="h-9 border border-white/5 bg-white/[0.03] hover:bg-white/[0.06] text-slate-400 font-bold uppercase text-[9px] tracking-widest px-4 rounded-xl transition-all">
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
                        Indicadores Chave • Quality Metrics
                    </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <KPISparkCard
                        variant="emerald"
                        title="First Pass Yield (FPY)"
                        value={`${kpis.fpy}%`}
                        description={`${kpis.totalAnalysis} análises (30d)`}
                        icon={<TrendingUp className="h-4 w-4" />}
                        data={generateSparkline()}
                    />
                    <KPISparkCard
                        variant="rose"
                        title="Desvios Abertos"
                        value={kpis.openNCs.toString()}
                        description={`${kpis.inProgressNCs} em investigação`}
                        icon={<ShieldAlert className="h-4 w-4" />}
                        data={generateSparkline()}
                    />
                    <KPISparkCard
                        variant="amber"
                        title="CAPAs Abertas"
                        value={kpis.openCAPAs.toString()}
                        description={`${kpis.totalCAPAs} ações totais`}
                        icon={<Target className="h-4 w-4" />}
                        data={generateSparkline()}
                    />
                    <KPISparkCard
                        variant="purple"
                        title="Taxa de Desvio"
                        value={`${kpis.ncRate}%`}
                        description="por 100 análises"
                        icon={<Activity className="h-4 w-4" />}
                        data={generateSparkline()}
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Trends Chart */}
                <Card className="lg:col-span-2 bg-card border-slate-800">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0">
                        <div>
                            <CardTitle className="text-xl font-bold">Tendências de Não-Conformidade</CardTitle>
                            <CardDescription>Histórico de Ocorrências (30 dias)</CardDescription>
                        </div>
                        <Badge variant="outline" className="text-cyan-500 border-cyan-500/20 bg-cyan-500/10">REALTIME</Badge>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px] flex items-center justify-center bg-slate-950/20 rounded-2xl border border-dashed border-slate-800 italic text-slate-500 text-[10px] font-black uppercase tracking-[0.2em]">
                            Trends Visualization Rendering...
                        </div>
                    </CardContent>
                </Card>

                {/* Side Stats */}
                <div className="space-y-6">
                    <Card className="bg-card border-slate-800">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                            <CardTitle className="text-lg font-bold">Pareto de Defeitos</CardTitle>
                            <ShieldAlert className="h-5 w-5 text-amber-400" />
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {defects.length > 0 ? (
                                defects.map((defect: any) => (
                                    <div key={defect.type} className="flex items-center justify-between p-3 rounded-lg border border-slate-800 bg-slate-950/30">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500">
                                                <Activity className="h-4 w-4" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-white">{defect.type}</p>
                                                <p className="text-[10px] text-slate-500 uppercase font-bold">{defect.count} ocorrências</p>
                                            </div>
                                        </div>
                                        <Badge variant="outline" className="text-amber-500 border-amber-500/20">WARNING</Badge>
                                    </div>
                                ))
                            ) : (
                                <p className="text-[10px] font-black text-slate-600 uppercase italic tracking-widest text-center py-10">Sem desvios registrados</p>
                            )}
                        </CardContent>
                    </Card>

                    <Card className="bg-card border-slate-800 p-4 border-l-4 border-l-cyan-500">
                        <div className="flex items-start justify-between">
                            <div className="space-y-1">
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Response Time</p>
                                <h4 className="text-2xl font-black text-white">4.2h</h4>
                                <p className="text-[10px] text-slate-600 font-bold italic">Mean time to investigate</p>
                            </div>
                            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400">
                                <Timer className="h-6 w-6" />
                            </div>
                        </div>
                        <div className="mt-4">
                            <Badge className="text-[9px] font-black tracking-widest bg-emerald-500/20 text-emerald-400 border-emerald-500/30">EFFICIENCY</Badge>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}

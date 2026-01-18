import { getHACCPPerformanceStats, getPCCLogs, getHACCPInsights } from "@/lib/queries/haccp";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/smart/stat-card";
import { ControlChart } from "@/components/smart/control-chart";
import { ShieldCheck, AlertCircle, FileStack, TrendingUp, Brain, BarChart3 } from "lucide-react";
import { AIIntelligencePanel } from "./_components/ai-intelligence-panel";
import { PageHeader } from "@/components/layout/page-header";

export const dynamic = "force-dynamic";

export default async function FoodSafetyPerformancePage() {
    // 1. Fetch Stats & Active Plan
    const stats = await getHACCPPerformanceStats();

    // 2. Fetch Trend Data (Last 20 logs for default view)
    // We fetch logs for the last 30 days to extract a meaningful trend for the first available hazard
    const logs = await getPCCLogs({ days: 30, limit: 100 });
    const trendPccId = logs?.[0]?.hazard_id;

    const trendData = logs
        ?.filter(l => l.hazard_id === trendPccId)
        .slice(0, 20)
        .reverse()
        .map((l, i) => ({
            index: i + 1,
            value: l.actual_value,
            label: new Date(l.checked_at).toLocaleDateString(),
            violation: !l.is_compliant
        })) || [];

    const trendHazard = logs?.find(l => l.hazard_id === trendPccId)?.hazard;

    // 3. Fetch AI Insights
    const aiInsights = await getHACCPInsights();

    const formattedInsights = aiInsights?.map(i => ({
        id: i.id,
        insight_type: i.insight_type as any,
        content: i.message,
        severity: (i.confidence > 0.8 ? "high" : i.confidence > 0.5 ? "medium" : "low") as "low" | "medium" | "high",
        created_at: i.created_at
    })) || [];

    return (
        <div className="space-y-6 px-6 pb-10">
            <PageHeader
                variant="blue"
                icon={<BarChart3 className="h-4 w-4" />}
                overline="Compliance Analytics • SmartLab AI"
                title="Performance de Segurança Alimentar"
                description="Monitorização em tempo real da conformidade e integridade do plano HACCP."
                backHref="/haccp"
                actions={
                    <Badge variant="outline" className="glass py-1.5 px-3 border-blue-500/30 text-blue-400 font-bold flex items-center gap-2">
                        <Brain className="h-4 w-4" />
                        Powered by SmartLab AI
                    </Badge>
                }
            />

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <StatCard
                    title="Conformidade Total (30d)"
                    value={`${stats.complianceRate.toFixed(1)}%`}
                    icon={ShieldCheck}
                    trend={stats.complianceRate >= 99 ? "up" : "down"}
                    description={`${stats.compliantChecks}/${stats.totalChecks} verificações conformes`}
                />
                <StatCard
                    title="Desvios em Aberto"
                    value={stats.openDeviations.toString()}
                    icon={AlertCircle}
                    trend={stats.openDeviations > 0 ? "down" : "up"}
                    description="PCCs fora dos limites críticos"
                    className={stats.openDeviations > 0 ? "border-red-500/50" : ""}
                />
                <StatCard
                    title="Plano HACCP Ativo"
                    value={stats.activeVersion?.version_number || "Sem Versão"}
                    icon={FileStack}
                    description={`Efetivo desde ${stats.activeVersion?.effective_date ? new Date(stats.activeVersion.effective_date).toLocaleDateString() : 'N/A'}`}
                />
                <StatCard
                    title="Verificações/Dia"
                    value={(stats.totalChecks / 30).toFixed(1)}
                    icon={TrendingUp}
                    description="Média de logs manuais"
                />
            </div>

            <div className="grid gap-8 lg:grid-cols-4">
                {/* Trend Chart */}
                <div className="lg:col-span-3 space-y-8">
                    <ControlChart
                        data={trendData}
                        xKey="label"
                        yKey="value"
                        title={`Tendência: ${trendHazard?.process_step || 'PCC Principal'}`}
                        description={trendHazard?.hazard_description}
                        highlightOOC={true}
                        height={400}
                    />

                    {/* Recent Deviations List */}
                    <Card className="glass h-full">
                        <CardHeader>
                            <CardTitle className="text-lg">Desvios Recentes</CardTitle>
                            <CardDescription>Ultimos desvios que requerem revisão</CardDescription>
                        </CardHeader>
                        <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {logs?.filter(l => !l.is_compliant).slice(0, 6).map(log => (
                                <div key={log.id} className="p-3 rounded-xl border border-red-500/20 bg-red-500/5 space-y-1">
                                    <div className="flex justify-between items-start">
                                        <span className="font-bold text-[10px] text-red-400 uppercase tracking-widest">{log.hazard?.process_step}</span>
                                        <span className="text-[10px] text-muted-foreground">{new Date(log.checked_at).toLocaleDateString()}</span>
                                    </div>
                                    <p className="text-xs">Valor: <span className="font-bold">{log.actual_value}</span> (Limites: {log.critical_limit_min || '-'}/{log.critical_limit_max || '-'})</p>
                                    {log.action_taken && <p className="text-[10px] italic pt-1 border-t border-red-500/10 text-muted-foreground">Ação: {log.action_taken}</p>}
                                </div>
                            ))}
                            {stats.openDeviations === 0 && (
                                <div className="col-span-full text-center py-10 text-muted-foreground text-sm">
                                    <ShieldCheck className="mx-auto h-8 w-8 mb-2 opacity-20" />
                                    Nenhum desvio detectado nos últimos 30 dias.
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* AI Insights Sidebar */}
                <div className="lg:col-span-1">
                    <AIIntelligencePanel insights={formattedInsights} />
                </div>
            </div>
        </div>
    );
}

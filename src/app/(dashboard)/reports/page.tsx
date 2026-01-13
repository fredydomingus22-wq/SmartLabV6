import { getReportHistory, getBatchesForReport, getSamplesForCoA, getReportsAnalytics } from "@/lib/queries/reports";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, Package, Microscope, Download, Clock, CheckCircle, TrendingUp, Sparkles, ChevronRight } from "lucide-react";
import Link from "next/link";
import { PremiumAnalyticsCard } from "@/components/dashboard/premium-analytics-card";
import { PremiumActionCard } from "@/components/dashboard/premium-action-card";
import { cn } from "@/lib/utils";

import { PageHeader } from "@/components/layout/page-header";

export const dynamic = "force-dynamic";

export default async function ReportsPage() {
    // Parallel data fetching for performance
    const [
        { data: recentReports },
        { data: samples },
        { data: batches },
        analytics
    ] = await Promise.all([
        getReportHistory({ limit: 8 }),
        getSamplesForCoA(),
        getBatchesForReport(),
        getReportsAnalytics()
    ]);

    const reportTypeIcons: Record<string, any> = {
        coa: FileText,
        batch_report: Package,
        micro_report: Microscope,
    };

    const reportTypeColors: Record<string, string> = {
        coa: "#3b82f6",
        batch_report: "#10b981",
        micro_report: "#8b5cf6",
    };

    return (
        <div className="space-y-12 pb-10">
            <PageHeader
                title="Relatórios & Analytics"
                overline="Intelligent Insights"
                description="Gere Certificados, acompanhe a produção e exporte dados vitais."
                icon={<Sparkles className="h-4 w-4" />}
                variant="blue"
                actions={
                    <Badge variant="outline" className="h-10 px-4 glass border-emerald-500/20 text-emerald-500 bg-emerald-500/5">
                        <TrendingUp className="h-4 w-4 mr-2" />
                        Sistema: Operacional
                    </Badge>
                }
            />

            {/* Trending Insights - Real Data Integration */}
            <div className="grid gap-6 md:grid-cols-3">
                <PremiumAnalyticsCard
                    title="Volume de Análises (7d)"
                    value={analytics.volume.total.toLocaleString()}
                    description="Total de análises validadas no laboratório"
                    trend={analytics.volume.trend}
                    data={analytics.volume.series}
                    dataKey="value"
                    color="#3b82f6"
                />
                <PremiumAnalyticsCard
                    title="Conformidade Global"
                    value={`${analytics.quality.rate}%`}
                    description="Percentual de resultados dentro da especificação"
                    trend={analytics.quality.trend}
                    data={analytics.quality.series}
                    dataKey="value"
                    color="#10b981"
                />
                <PremiumAnalyticsCard
                    title="Lead Time Médio"
                    value={analytics.leadTime.value}
                    description="Tempo médio entre coleta e aprovação final"
                    trend={analytics.leadTime.trend}
                    data={analytics.volume.series.map(v => ({ ...v, value: v.value * 0.8 }))} // Simulated distribution
                    dataKey="value"
                    color="#f59e0b"
                />
            </div>

            {/* Core Actions - Premium UX */}
            <div>
                <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-primary" />
                    Ações Prioritárias
                </h2>
                <div className="grid gap-6 md:grid-cols-4">
                    <PremiumActionCard
                        title="CoA"
                        description="Certificados de Análise"
                        href="/reports/coa"
                        icon={<FileText className="h-6 w-6" />}
                        color="#3b82f6"
                        stats={samples.length}
                        statsLabel="Prontos para envio"
                    />
                    <PremiumActionCard
                        title="Batch Report"
                        description="Rastreabilidade & Produção"
                        href="/reports/batch"
                        icon={<Package className="h-6 w-6" />}
                        color="#10b981"
                        stats={batches.length}
                        statsLabel="Lotes disponíveis"
                    />
                    <PremiumActionCard
                        title="Micro Report"
                        description="Sessões de Microbiologia"
                        href="/reports/micro"
                        icon={<Microscope className="h-6 w-6" />}
                        color="#8b5cf6"
                    />
                    <PremiumActionCard
                        title="Export Data"
                        description="CSV / Excel Avançado"
                        href="/reports/export"
                        icon={<Download className="h-6 w-6" />}
                        color="#f59e0b"
                    />
                </div>
            </div>

            {/* Secondary Actions */}
            <div className="grid gap-6 md:grid-cols-4">
                <PremiumActionCard
                    title="Relatório Turno"
                    description="Resumo completo da operação"
                    href="/reports/shift"
                    icon={<Clock className="h-6 w-6" />}
                    color="#6366f1"
                />
                <PremiumActionCard
                    title="Statistical Trending"
                    description="SPC & Cartas de Controle"
                    href="/reports/trending"
                    icon={<TrendingUp className="h-6 w-6" />}
                    color="#06b6d4"
                />
                <PremiumActionCard
                    title="CIP Reports"
                    description="Ciclos de Higienização"
                    href="/reports/cip"
                    icon={<FileText className="h-6 w-6" />}
                    color="#14b8a6"
                />
                <PremiumActionCard
                    title="Audit Reports"
                    description="Histórico de Auditoria & NCs"
                    href="/reports/audit"
                    icon={<FileText className="h-6 w-6" />}
                    color="#f59e0b"
                />
            </div>

            {/* Recent Activity - Premium List View */}
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <Clock className="h-5 w-5 text-primary" />
                        Atividade Recente
                    </h2>
                    <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-primary">
                        Ver histórico completo
                    </Button>
                </div>

                <Card className="glass border-white/10 overflow-hidden">
                    <CardContent className="p-0">
                        {recentReports.length === 0 ? (
                            <div className="text-center py-20 text-muted-foreground">
                                <FileText className="h-12 w-12 mx-auto mb-4 opacity-20" />
                                <p className="text-lg">Nenhum relatório gerado recentemente</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-white/5">
                                {recentReports.map((report: any, index: number) => {
                                    const Icon = reportTypeIcons[report.report_type] || FileText;
                                    const color = reportTypeColors[report.report_type] || "#ffffff";
                                    return (
                                        <div
                                            key={report.id}
                                            className="flex items-center justify-between p-5 hover:bg-white/5 transition-colors group cursor-pointer"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div
                                                    className="h-12 w-12 rounded-xl glass flex items-center justify-center transition-transform group-hover:scale-110"
                                                    style={{ color }}
                                                >
                                                    <Icon className="h-6 w-6" />
                                                </div>
                                                <div>
                                                    <p className="font-mono font-bold text-sm">
                                                        {report.report_number}
                                                    </p>
                                                    <p className="text-sm font-medium text-muted-foreground">
                                                        {report.title}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-6">
                                                <div className="hidden sm:block text-right">
                                                    <p className="text-xs uppercase tracking-widest text-muted-foreground font-bold">Data</p>
                                                    <p className="text-sm font-semibold">
                                                        {new Date(report.generated_at).toLocaleDateString()}
                                                    </p>
                                                </div>
                                                <Badge
                                                    variant={report.status === "signed" ? "default" : "outline"}
                                                    className={cn(
                                                        "h-8 px-3 glass font-bold",
                                                        report.status === "signed" && "bg-green-500/10 text-green-500 border-green-500/20"
                                                    )}
                                                >
                                                    {report.status}
                                                </Badge>
                                                <ChevronRight className="h-5 w-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0" />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

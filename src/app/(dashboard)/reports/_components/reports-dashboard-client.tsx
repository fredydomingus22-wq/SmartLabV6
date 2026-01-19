"use client";

import { Card, CardContent, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, Package, Microscope, Download, Clock, CheckCircle, TrendingUp, Sparkles, ChevronRight } from "lucide-react";
import Link from "next/link";
import { PremiumAnalyticsCard } from "@/components/dashboard/premium-analytics-card";
import { PremiumActionCard } from "@/components/dashboard/premium-action-card";
import { cn } from "@/lib/utils";

interface ReportsDashboardClientProps {
    recentReports: any[];
    samples: any[];
    batches: any[];
    analytics: any;
}

export default function ReportsDashboardClient({
    recentReports,
    samples,
    batches,
    analytics
}: ReportsDashboardClientProps) {
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
        <div className="space-y-10">
            {/* Trending Insights */}
            <div className="grid gap-6 md:grid-cols-3">
                <PremiumAnalyticsCard
                    title="Carga Analítica (7d)"
                    value={analytics.volume.total.toLocaleString()}
                    description="Volume absoluto de determinações validadas"
                    trend={analytics.volume.trend}
                    data={analytics.volume.series}
                    dataKey="value"
                    color="#3b82f6"
                />
                <PremiumAnalyticsCard
                    title="Índice de Conformidade"
                    value={`${analytics.quality.rate}%`}
                    description="Percentagem de resultados 'On-Spec'"
                    trend={analytics.quality.trend}
                    data={analytics.quality.series}
                    dataKey="value"
                    color="#10b981"
                />
                <PremiumAnalyticsCard
                    title="Ciclo Médio (TAT)"
                    value={analytics.leadTime.value}
                    description="Lead-time médio de validação final"
                    trend={analytics.leadTime.trend}
                    data={analytics.volume.series.map((v: any) => ({ ...v, value: v.value * 0.8 }))}
                    dataKey="value"
                    color="#f59e0b"
                />
            </div>

            {/* Core Actions */}
            <div>
                <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-6 flex items-center gap-2 italic">
                    <CheckCircle className="h-3 w-3" />
                    Protocolos Prioritários
                </h2>
                <div className="grid gap-6 md:grid-cols-4">
                    <PremiumActionCard
                        title="CoA (Análises)"
                        description="Certificados de Análise"
                        href="/reports/coa"
                        icon={<FileText className="h-6 w-6" />}
                        color="#3b82f6"
                        stats={samples.length}
                        statsLabel="Aptos para emissão"
                    />
                    <PremiumActionCard
                        title="Relatórios de Lote"
                        description="Rastreabilidade & Engenharia"
                        href="/reports/batch"
                        icon={<Package className="h-6 w-6" />}
                        color="#10b981"
                        stats={batches.length}
                        statsLabel="Lotes rastreados"
                    />
                    <PremiumActionCard
                        title="Dossiê Micro"
                        description="Sessões de Microbiologia"
                        href="/reports/micro"
                        icon={<Microscope className="h-6 w-6" />}
                        color="#8b5cf6"
                    />
                    <PremiumActionCard
                        title="Extração de Dados"
                        description="Exportação Técnica (CSV/XLS)"
                        href="/reports/export"
                        icon={<Download className="h-6 w-6" />}
                        color="#f59e0b"
                    />
                </div>
            </div>

            {/* Secondary Actions */}
            <div className="grid gap-6 md:grid-cols-4">
                <PremiumActionCard
                    title="Relatórios de Turno"
                    description="Resumo Operacional Diário"
                    href="/reports/shift"
                    icon={<Clock className="h-6 w-6" />}
                    color="#6366f1"
                />
                <PremiumActionCard
                    title="Statistical Control"
                    description="SPC & Cartas Centrais"
                    href="/reports/trending"
                    icon={<TrendingUp className="h-6 w-6" />}
                    color="#06b6d4"
                />
                <PremiumActionCard
                    title="Relatórios CIP"
                    description="Ciclos de Higienização"
                    href="/reports/cip"
                    icon={<FileText className="h-6 w-6" />}
                    color="#14b8a6"
                />
                <PremiumActionCard
                    title="Audit Trail"
                    description="Histórico de Auditoria & NC"
                    href="/reports/audit"
                    icon={<FileText className="h-6 w-6" />}
                    color="#f59e0b"
                />
            </div>

            {/* Recent Activity */}
            <div className="space-y-6">
                <div className="flex justify-between items-center px-1">
                    <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 flex items-center gap-2 italic">
                        <Clock className="h-3 w-3" />
                        Histórico de Emissão
                    </h2>
                    <Button variant="ghost" className="rounded-xl h-8 px-4 font-black text-[9px] uppercase tracking-[0.2em] text-slate-500 hover:text-white transition-colors">
                        Consultar Arquivo Completo
                    </Button>
                </div>

                <Card className="border-white/5 overflow-hidden bg-slate-900/40 backdrop-blur-xl">
                    <CardContent className="p-0">
                        {recentReports.length === 0 ? (
                            <div className="text-center py-20 text-muted-foreground">
                                <FileText className="h-12 w-12 mx-auto mb-4 opacity-20" />
                                <p className="text-lg">Nenhum relatório gerado recentemente</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-white/5">
                                {recentReports.map((report: any) => {
                                    const Icon = reportTypeIcons[report.report_type] || FileText;
                                    const color = reportTypeColors[report.report_type] || "#ffffff";
                                    return (
                                        <Link key={report.id} href={`/reports/${report.id}`}>
                                            <div
                                                className="flex items-center justify-between p-5 hover:bg-white/5 transition-colors group cursor-pointer"
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div
                                                        className="h-12 w-12 rounded-lg bg-white/5 border border-white/5 flex items-center justify-center transition-transform group-hover:scale-110"
                                                        style={{ color }}
                                                    >
                                                        <Icon className="h-6 w-6" />
                                                    </div>
                                                    <div>
                                                        <p className="font-mono font-black text-sm text-white italic tracking-tighter">
                                                            {report.report_number}
                                                        </p>
                                                        <p className="text-sm font-medium text-muted-foreground">
                                                            {report.title}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-6">
                                                    <div className="hidden sm:block text-right">
                                                        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground font-bold">Data</p>
                                                        <p className="text-sm font-semibold">
                                                            {new Date(report.generated_at).toLocaleDateString()}
                                                        </p>
                                                    </div>
                                                    <Badge
                                                        variant={report.status === "signed" ? "default" : "outline"}
                                                        className={cn(
                                                            "h-7 px-3 font-black uppercase tracking-[0.2em] text-[9px] italic border-slate-800",
                                                            report.status === "signed" && "bg-success/10 text-success border-success/20 shadow-inner"
                                                        )}
                                                    >
                                                        {report.status === 'signed' ? 'Assinado' : report.status === 'draft' ? 'Rascunho' : report.status}
                                                    </Badge>
                                                    <ChevronRight className="h-5 w-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0" />
                                                </div>
                                            </div>
                                        </Link>
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

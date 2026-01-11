"use client";

import React, { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ShieldCheck, ShieldAlert, Zap, LayoutGrid, FileText, ClipboardCheck, ArrowRight, Loader2 } from "lucide-react";
import Link from "next/link";
import { IndustrialCard, IndustrialGrid } from "@/components/shared/industrial-card";
import { IndustrialChart } from "@/components/shared/industrial-chart";
import { PremiumListItem } from "@/components/dashboard/premium-list-item";
import { exportDataAction } from "@/app/actions/reports";
import { toast } from "sonner";
import type { EChartsOption } from "echarts";
import { Box, Typography, Stack } from "@mui/material";
import { cn } from "@/lib/utils";

interface HACCPViewProps {
    stats: any;
    activity: any;
}

export function HACCPView({ stats, activity }: HACCPViewProps) {
    const [exporting, setExporting] = useState(false);

    const handleExport = async () => {
        setExporting(true);
        try {
            const formData = new FormData();
            formData.set("data_type", "pcc_logs");
            const start = new Date();
            start.setDate(start.getDate() - 30);
            formData.set("start_date", start.toISOString());
            formData.set("end_date", new Date().toISOString());

            const result = await exportDataAction(formData);

            if (result.success && result.data) {
                const data = result.data as any[];
                if (data.length === 0) {
                    toast.error("Nenhum dado encontrado");
                    return;
                }
                const headers = Object.keys(data[0]);
                const csvContent = [
                    headers.join(","),
                    ...data.map(row => headers.map(h => {
                        const val = row[h];
                        return (typeof val === "string" && val.includes(",")) ? `"${val}"` : val ?? "";
                    }).join(","))
                ].join("\n");

                const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = result.filename || "haccp_logs.csv";
                a.click();
                URL.revokeObjectURL(url);
                toast.success(`Exportado: ${data.length} registos`);
            }
        } catch (error) { toast.error("Erro ao exportar"); } finally { setExporting(false); }
    };

    const getSparklineOption = (color: string, data: number[]): EChartsOption => ({
        xAxis: { type: "category", show: false },
        yAxis: { type: "value", show: false, min: "dataMin", max: "dataMax" },
        series: [{
            type: "line", data, smooth: true, showSymbol: false,
            lineStyle: { color, width: 2 },
            areaStyle: {
                color: {
                    type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
                    colorStops: [{ offset: 0, color }, { offset: 1, color: 'transparent' }]
                },
                opacity: 0.1
            }
        }],
        grid: { left: 0, right: 0, top: 0, bottom: 0 }
    });

    return (
        <Box className="space-y-10">
            {/* KPI Grid */}
            <IndustrialGrid cols={3}>
                <IndustrialCard
                    variant="analytics"
                    title="Desvios CCP (Turno)"
                    value={stats.recentDeviations.toString()}
                    description="Violações de limites críticos"
                    tooltip="Ocorrências registradas onde os parâmetros de controle ultrapassaram os limites críticos de segurança alimentar."
                    status={stats.recentDeviations > 0 ? "error" : "success"}
                    trend={{ value: Math.abs(stats.trends.deviations), isPositive: stats.trends.deviations <= 0 }}
                >
                    <IndustrialChart option={getSparklineOption(stats.recentDeviations > 0 ? "#ef4444" : "#10b981", [2, 1, 0, 3, 2, 0, stats.recentDeviations])} height="100%" />
                </IndustrialCard>

                <IndustrialCard
                    variant="analytics"
                    title="Conformidade APPCC"
                    value={`${stats.haccpCompliance.toFixed(1)}%`}
                    description="Leituras dentro do target"
                    tooltip="Percentual de leituras de monitoramento que estão dentro dos limites operacionais seguros."
                    status={stats.haccpCompliance >= 98 ? "success" : "warning"}
                    trend={{ value: Math.abs(stats.trends.haccpCompliance), isPositive: stats.trends.haccpCompliance >= 0 }}
                >
                    <IndustrialChart option={getSparklineOption("#10b981", [98, 97, 99, 98, 99, 98, stats.haccpCompliance])} height="100%" />
                </IndustrialCard>

                <IndustrialCard
                    variant="analytics"
                    title="CCP Mais Crítico"
                    value={stats.problematicCCP}
                    description="Maior frequência de alertas"
                    tooltip="O Ponto Crítico de Controle que apresentou maior instabilidade estatística nas últimas 24h."
                    status="neutral"
                >
                    <IndustrialChart option={getSparklineOption("#f59e0b", [5, 10, 8, 12, 6, 8, 10])} height="100%" />
                </IndustrialCard>
            </IndustrialGrid>

            {/* Main Content */}
            <Box className="grid gap-8 lg:grid-cols-3">
                <Box className="lg:col-span-2 space-y-6">
                    <Box className="flex justify-between items-center px-1">
                        <Typography className="text-xl font-bold flex items-center gap-2 text-white">
                            <ShieldAlert className="h-5 w-5 text-red-500" />
                            Log de Monitoramento (Recent)
                        </Typography>
                        <Button asChild variant="ghost" size="sm" className="text-muted-foreground hover:text-primary">
                            <Link href="/haccp/logs">
                                Histórico Completo <ArrowRight className="h-4 w-4 ml-2" />
                            </Link>
                        </Button>
                    </Box>

                    <IndustrialCard bodyClassName="p-0">
                        {stats.recentHaccpLogs?.length > 0 ? (
                            <Box className="divide-y divide-white/5">
                                {stats.recentHaccpLogs.map((log: any) => (
                                    <PremiumListItem
                                        key={log.id}
                                        title={log.hazard?.process_step || "CCP Indefinido"}
                                        subtitle={`${log.equipment?.name || "Geral"} • ${log.is_compliant ? "Conforme" : "DESVIO DETECTADO"}`}
                                        variant={log.is_compliant ? "default" : "danger"}
                                        status={log.actual_value !== null ? `${log.actual_value}` : log.actual_value_text}
                                        icon={log.is_compliant ? <ShieldCheck className="h-6 w-6 text-emerald-500" /> : <ShieldAlert className="h-6 w-6 text-red-500 animate-pulse" />}
                                        href={`/haccp/logs/${log.id}`}
                                        time={new Date(log.checked_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    />
                                ))}
                            </Box>
                        ) : (
                            <Box className="p-20 text-center">
                                <Box className="p-4 rounded-full bg-emerald-500/10 w-16 h-16 flex items-center justify-center mx-auto mb-4">
                                    <ShieldCheck className="h-8 w-8 text-emerald-500" />
                                </Box>
                                <Typography className="text-lg font-medium text-white">Plano de Segurança Saudável</Typography>
                                <Typography className="text-sm text-slate-400">Nenhuma leitura registada agora.</Typography>
                            </Box>
                        )}
                    </IndustrialCard>
                </Box>

                <Box className="space-y-6">
                    <Typography className="text-xl font-bold flex items-center gap-2 px-1 text-white">
                        <Zap className="h-5 w-5 text-yellow-400" />
                        Status por Linha
                    </Typography>

                    <Box className="space-y-4">
                        {stats.lines?.map((line: any) => (
                            <IndustrialCard key={line.id} className="p-4" bodyClassName="p-0">
                                <Box className="flex justify-between items-center mb-3">
                                    <Stack direction="row" spacing={1} alignItems="center">
                                        <LayoutGrid className="h-4 w-4 text-blue-500" />
                                        <Typography className="text-[10px] font-black uppercase tracking-widest text-white">{line.name}</Typography>
                                    </Stack>
                                    <Badge className={cn(
                                        "border-none font-black text-[9px] h-5",
                                        line.isProtected ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-red-500 animate-pulse"
                                    )}>
                                        {line.isProtected ? "Protegido" : "EM ALERTA"}
                                    </Badge>
                                </Box>
                                <Box className="flex justify-between items-end">
                                    <Box>
                                        <Typography className="text-[9px] font-bold text-slate-500 uppercase">Última Verificação</Typography>
                                        <Typography className="text-xs font-bold text-slate-300">
                                            {line.lastCheck ? new Date(line.lastCheck).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "---"}
                                        </Typography>
                                    </Box>
                                    <Stack direction="row" spacing={0.5}>
                                        {line.lastReadings.slice(0, 3).map((r: any, i: number) => (
                                            <Box key={i} className={cn("h-1.5 w-1.5 rounded-full", r === true ? "bg-emerald-500" : r === false ? "bg-red-500" : "bg-white/5")} />
                                        ))}
                                    </Stack>
                                </Box>
                            </IndustrialCard>
                        ))}
                    </Box>

                    <Box className="p-6 rounded-2xl glass border-blue-500/20 bg-blue-500/5 group">
                        <FileText className="h-8 w-8 text-blue-500 mb-3 group-hover:scale-110 transition-transform" />
                        <Typography className="font-black text-[10px] uppercase tracking-widest text-white mb-2">Auditoria APPCC</Typography>
                        <Typography className="text-[10px] text-slate-400 leading-relaxed mb-4">
                            Logs prontos para exportação (GAMP 5).
                        </Typography>
                        <Button
                            onClick={handleExport}
                            disabled={exporting}
                            className="w-full h-10 glass-primary rounded-xl flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-widest"
                        >
                            {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <ClipboardCheck className="h-4 w-4" />}
                            Exportar Log
                        </Button>
                    </Box>
                </Box>
            </Box>
        </Box>
    );
}

"use client";

import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Factory,
    ClipboardCheck,
    Thermometer,
    Plus,
    AlertCircle,
    ArrowRight,
    Activity,
    Clock,
    ShieldAlert,
    Zap,
    LayoutGrid
} from "lucide-react";
import Link from "next/link";
import { IndustrialCard, IndustrialGrid } from "@/components/shared/industrial-card";
import { IndustrialChart } from "@/components/shared/industrial-chart";
import { PremiumListItem } from "@/components/dashboard/premium-list-item";
import type { EChartsOption } from "echarts";
import { Box, Typography, Stack } from "@mui/material";

interface OperatorViewProps {
    stats: any;
    activity: any;
}

export function OperatorView({ stats, activity }: OperatorViewProps) {
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
            {/* KPI Section */}
            <IndustrialGrid cols={3}>
                <IndustrialCard
                    variant="analytics"
                    title="Linhas em Operação"
                    value="4 / 6"
                    description="Status produtivo em tempo real"
                    tooltip="Quantidade de linhas de produção com lotes ativos e processamento em curso."
                    status="success"
                >
                    <IndustrialChart option={getSparklineOption("#10b981", [3, 4, 4, 5, 4, 3, 4])} height="100%" />
                </IndustrialCard>

                <IndustrialCard
                    variant="analytics"
                    title="Alarmes de Qualidade"
                    value={stats.recentDeviations.toString()}
                    description="Ocorrências nos últimos 60 min"
                    tooltip="Desvios de conformidade ou falhas de controle detectadas por sensores de linha ou registros manuais."
                    status={stats.recentDeviations > 0 ? "error" : "success"}
                >
                    <IndustrialChart option={getSparklineOption("#ef4444", [0, 1, 0, 2, 0, 3, 1])} height="100%" />
                </IndustrialCard>

                <IndustrialCard
                    variant="analytics"
                    title="Amostras Pendentes"
                    value={stats.pendingSamples.toString()}
                    description="Fluxo de amostragem do turno"
                    tooltip="Total de amostras coletadas na linha que estão aguardando transporte ou processamento no laboratório."
                    status="neutral"
                >
                    <IndustrialChart option={getSparklineOption("#3b82f6", [12, 15, 14, 18, 16, 17, 15])} height="100%" />
                </IndustrialCard>
            </IndustrialGrid>

            {/* Quick Actions */}
            <Box className="space-y-4">
                <Box className="flex items-center gap-2 px-1">
                    <Zap className="h-5 w-5 text-yellow-400" />
                    <Typography className="text-xl font-bold text-white">Ações de Chão de Fábrica</Typography>
                </Box>
                <IndustrialGrid cols={3}>
                    <IndustrialCard
                        title="Efetuar Carga"
                        subtitle="Novo Lote / Ordem de Produção"
                        icon={Plus}
                        status="success"
                        description={`${stats.activeBatches} lotes ativos no momento.`}
                        footer={<Button asChild variant="ghost" size="sm" className="w-full text-[10px] font-black uppercase tracking-widest"><Link href="/production/batches/new">Iniciar carga <ArrowRight className="h-3 w-3 ml-2" /></Link></Button>}
                    />
                    <IndustrialCard
                        title="Registar CCP"
                        subtitle="Segurança Alimentar"
                        icon={Thermometer}
                        status="warning"
                        description={`${stats.recentDeviations} desvios detectados no turno.`}
                        footer={<Button asChild variant="ghost" size="sm" className="w-full text-[10px] font-black uppercase tracking-widest"><Link href="/haccp/readings/new">Efetuar leitura <ArrowRight className="h-3 w-3 ml-2" /></Link></Button>}
                    />
                    <IndustrialCard
                        title="Coleta Lab"
                        subtitle="Nova Amostra LIMS"
                        icon={ClipboardCheck}
                        status="neutral"
                        description={`${stats.pendingSamples} amostras em fila analítica.`}
                        footer={<Button asChild variant="ghost" size="sm" className="w-full text-[10px] font-black uppercase tracking-widest"><Link href="/lab?create=true">Registar coleta <ArrowRight className="h-3 w-3 ml-2" /></Link></Button>}
                    />
                </IndustrialGrid>
            </Box>

            {/* Main Content */}
            <Box className="grid gap-8 lg:grid-cols-2">
                <Box className="space-y-4">
                    <Box className="flex items-center justify-between px-1">
                        <Typography className="text-xl font-bold flex items-center gap-2 text-white">
                            <LayoutGrid className="h-5 w-5 text-primary" />
                            Status por Linha
                        </Typography>
                        <Badge variant="outline" className="glass text-[9px] uppercase tracking-widest font-black">LIVE MONITORING</Badge>
                    </Box>
                    <IndustrialCard bodyClassName="p-0">
                        <Box className="divide-y divide-white/5">
                            {activity.recentBatches.filter((b: any) => b.status === 'open').length > 0 ? (
                                activity.recentBatches.filter((b: any) => b.status === 'open').map((batch: any) => (
                                    <PremiumListItem
                                        key={batch.id}
                                        title={`Linha 01 - ${batch.code}`}
                                        subtitle="Produto Acabado"
                                        status="Running"
                                        variant="success"
                                        icon={<Activity className="h-5 w-5 text-emerald-500 animate-pulse" />}
                                        href={`/production/${batch.id}`}
                                    />
                                ))
                            ) : (
                                <Box className="p-12 text-center">
                                    <Factory className="h-10 w-10 text-slate-700 mx-auto mb-3" />
                                    <Typography className="text-xs font-bold text-slate-500 uppercase tracking-widest">Nenhuma linha ativa</Typography>
                                </Box>
                            )}
                        </Box>
                    </IndustrialCard>
                </Box>

                <Box className="space-y-4">
                    <Typography className="text-xl font-bold flex items-center gap-2 px-1 text-white">
                        <ShieldAlert className="h-5 w-5 text-red-500" />
                        Alarmes Críticos
                    </Typography>

                    <Box className="space-y-4">
                        {stats.recentDeviations > 0 && (
                            <Box className="p-6 rounded-2xl glass border-red-500/20 bg-red-500/5 relative overflow-hidden group">
                                <Box className="absolute top-0 right-0 p-3 opacity-10 group-hover:rotate-12 transition-transform">
                                    <AlertCircle className="h-12 w-12 text-red-500" />
                                </Box>
                                <Stack spacing={2}>
                                    <Typography className="text-[9px] font-black text-red-400 uppercase tracking-widest">Desvio de Segurança (CCP)</Typography>
                                    <Typography className="text-2xl font-black text-white">{stats.recentDeviations} Ocorrências</Typography>
                                    <Typography className="text-[10px] text-slate-400 leading-relaxed mb-2">
                                        Fora dos limites críticos detectados nos sensores. Workflow de Não Conformidade (NC) automático.
                                    </Typography>
                                    <Button asChild size="sm" className="h-9 bg-red-600 hover:bg-red-700 text-white text-[10px] font-black uppercase tracking-widest border-none">
                                        <Link href="/haccp/deviations">Investigar agora</Link>
                                    </Button>
                                </Stack>
                            </Box>
                        )}

                        <IndustrialCard className="p-6" bodyClassName="p-0">
                            <Box className="flex items-center justify-between mb-4">
                                <Stack direction="row" spacing={1.5} alignItems="center">
                                    <Clock className="h-4 w-4 text-orange-400" />
                                    <Typography className="text-[9px] font-black uppercase tracking-widest text-white">Planos de Amostragem</Typography>
                                </Stack>
                                <Badge className="bg-orange-500/10 text-orange-400 border-none text-[8px] font-black">SHIFT TASK</Badge>
                            </Box>
                            <Stack spacing={3}>
                                <Box className="flex justify-between items-center">
                                    <Typography className="text-[10px] text-slate-400 font-medium italic">Linha 02 - Próximo ponto: 15min</Typography>
                                    <Box className="h-1.5 w-24 bg-white/5 rounded-full overflow-hidden border border-white/5">
                                        <Box className="h-full bg-orange-500" sx={{ width: "75%" }} />
                                    </Box>
                                </Box>
                                <Box className="flex justify-between items-center">
                                    <Typography className="text-[10px] text-slate-400 font-medium italic">Linha 04 - Amostra em atraso</Typography>
                                    <Typography className="text-red-400 font-black text-[9px] uppercase tracking-widest">Retardado</Typography>
                                </Box>
                            </Stack>
                        </IndustrialCard>
                    </Box>
                </Box>
            </Box>
        </Box>
    );
}

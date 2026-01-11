"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import {
    ClipboardCheck,
    FlaskConical,
    Microscope,
    Beaker,
    Factory,
    RefreshCw,
    ShieldAlert,
    Plus,
    ArrowRight,
    Package,
    CheckCircle
} from "lucide-react";
import Link from "next/link";
import { IndustrialCard, IndustrialGrid } from "@/components/shared/industrial-card";
import { IndustrialChart } from "@/components/shared/industrial-chart";
import { PremiumListItem } from "@/components/dashboard/premium-list-item";
import type { EChartsOption } from "echarts";
import { Box, Typography } from "@mui/material";

interface AnalystViewProps {
    user: any;
    stats: any;
    assignments: any[];
    activity: any;
}

export function AnalystView({ user, stats, assignments, activity }: AnalystViewProps) {
    const isMicro = user.role === 'micro_analyst';
    const isLab = user.role === 'lab_analyst';

    const getSparklineOption = (color: string, data: number[]): EChartsOption => ({
        xAxis: { type: "category", show: false },
        yAxis: { type: "value", show: false, min: "dataMin", max: "dataMax" },
        tooltip: {
            show: true,
            trigger: "axis",
            formatter: (params: any) => `<b>${params[0].value}</b>`,
            position: ["50%", "-10%"],
            backgroundColor: "rgba(15, 23, 42, 0.9)",
            padding: [4, 8],
            className: "border-white/10"
        },
        series: [{
            type: "line",
            data,
            smooth: 0.4,
            showSymbol: false,
            lineStyle: { color, width: 2.5 },
            areaStyle: {
                color: {
                    type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
                    colorStops: [
                        { offset: 0, color: color },
                        { offset: 1, color: 'rgba(0,0,0,0)' }
                    ]
                },
                opacity: 0.2
            }
        }],
        grid: { left: -10, right: -10, top: 0, bottom: 0 }
    });

    return (
        <Box className="space-y-10">
            {/* Quick Actions */}
            <Box className="flex flex-wrap gap-3">
                <Button asChild className="h-11 px-6 rounded-xl glass-primary shadow-lg shadow-primary/20 hover:scale-105 transition-all">
                    <Link href="/lab?create=true">
                        <Plus className="h-4 w-4 mr-2" /> Nova Amostra
                    </Link>
                </Button>
                {isLab && (
                    <>
                        <Button asChild variant="outline" className="h-11 px-6 rounded-xl glass border-blue-500/20 hover:bg-blue-500/10 transition-all">
                            <Link href="/production">
                                <Factory className="h-4 w-4 mr-2 text-blue-400" /> Produção MES
                            </Link>
                        </Button>
                        <Button asChild variant="outline" className="h-11 px-6 rounded-xl glass border-cyan-500/20 hover:bg-cyan-500/10 transition-all">
                            <Link href="/cip/register">
                                <RefreshCw className="h-4 w-4 mr-2 text-cyan-400" /> Registar CIP
                            </Link>
                        </Button>
                    </>
                )}
            </Box>

            {/* Stats Grid */}
            <IndustrialGrid cols={4}>
                <IndustrialCard
                    variant="analytics"
                    title="Amostras Pendentes"
                    value={(stats.roleAlerts || stats.pendingSamples).toString()}
                    description="Aguardando início de análise"
                    tooltip="Total de amostras registradas que ainda não iniciaram o processo analítico."
                    status={(stats.roleAlerts > 10) ? "error" : "warning"}
                >
                    <IndustrialChart option={getSparklineOption("#f97316", [8, 12, 7, 15, 12, 18, 14])} height="100%" />
                </IndustrialCard>

                <IndustrialCard
                    variant="analytics"
                    title="Em Análise"
                    value={stats.inAnalysis.toString()}
                    description="Em processamento no laboratório"
                    tooltip="Amostras que já iniciaram a fase de bancada e leitura de resultados."
                >
                    <IndustrialChart option={getSparklineOption("#3b82f6", [5, 8, 4, 10, 6, 9, 7])} height="100%" />
                </IndustrialCard>

                <IndustrialCard
                    variant="analytics"
                    title="Lead Time Médio"
                    value={`${stats.avgLeadTime ? stats.avgLeadTime.toFixed(1) : '0.0'}h`}
                    description="Ciclo total (Registro -> Liberação)"
                    tooltip="Tempo médio decorrido desde a coleta até a assinatura final do resultado."
                    trend={{ value: Math.abs(stats.trends?.leadTime || 0), isPositive: (stats.trends?.leadTime || 0) >= 0 }}
                >
                    <IndustrialChart option={getSparklineOption("#06b6d4", [4, 6, 3, 5, 4, 6, 2])} height="100%" />
                </IndustrialCard>

                <IndustrialCard
                    variant="analytics"
                    title="SLA de Turno"
                    value={`${stats.slaCompliance ? stats.slaCompliance.toFixed(1) : '100'}%`}
                    description="Amostras aprovadas em < 8h"
                    tooltip="Percentual de amostras concluídas dentro da janela de 8 horas do turno."
                    trend={{ value: Math.abs(stats.trends?.sla || 0), isPositive: (stats.trends?.sla || 0) >= 0 }}
                >
                    <IndustrialChart option={getSparklineOption("#8b5cf6", [95, 98, 96, 99, 97, 98, 99])} height="100%" />
                </IndustrialCard>
            </IndustrialGrid>

            {/* Main Content */}
            <Box className="grid gap-8 lg:grid-cols-3">
                <Box className="lg:col-span-2 space-y-6">
                    <Box className="flex justify-between items-center px-1">
                        <Typography className="text-xl font-bold flex items-center gap-2 text-white">
                            <ClipboardCheck className="h-5 w-5 text-blue-500" />
                            Minha Fila de Trabalho
                        </Typography>
                        <Button asChild variant="ghost" size="sm" className="text-muted-foreground hover:text-primary">
                            <Link href={isMicro ? "/micro/samples" : "/lab"}>
                                Ver fila completa <ArrowRight className="h-4 w-4 ml-2" />
                            </Link>
                        </Button>
                    </Box>

                    <IndustrialCard bodyClassName="p-0">
                        {assignments.length === 0 ? (
                            <Box className="p-20 text-center text-muted-foreground">
                                <Box className="p-4 rounded-full bg-emerald-500/10 w-16 h-16 flex items-center justify-center mx-auto mb-4">
                                    <CheckCircle className="h-8 w-8 text-emerald-500" />
                                </Box>
                                <Typography className="text-lg font-medium">Tudo em dia!</Typography>
                                <Typography className="text-sm">Sem tarefas pendentes agora.</Typography>
                            </Box>
                        ) : (
                            <Box className="divide-y divide-white/5">
                                {assignments.map((task: any) => (
                                    <PremiumListItem
                                        key={task.id}
                                        title={task.title}
                                        subtitle={task.subtitle}
                                        time={new Date(task.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        icon={
                                            task.type === 'micro' ? <Microscope className="h-6 w-6" /> :
                                                task.type === 'batch' ? <Package className="h-6 w-6" /> : <Beaker className="h-6 w-6" />
                                        }
                                        variant={task.type === 'micro' ? "warning" : task.type === 'batch' ? "success" : "info"}
                                        href={task.type === 'micro' ? `/micro/reading` : `/lab/samples/${task.id}`}
                                    />
                                ))}
                            </Box>
                        )}
                    </IndustrialCard>
                </Box>

                <Box className="space-y-6">
                    <Typography className="text-xl font-bold flex items-center gap-2 px-1 text-white">
                        <FlaskConical className="h-5 w-5 text-blue-500" />
                        Atividade Recente
                    </Typography>
                    <IndustrialCard bodyClassName="p-0">
                        <Box className="divide-y divide-white/5">
                            {activity.recentSamples.map((sample: any) => (
                                <PremiumListItem
                                    key={sample.id}
                                    title={sample.code}
                                    subtitle="Registado recentemente"
                                    status={sample.status.replace("_", " ")}
                                    variant="default"
                                />
                            ))}
                        </Box>
                    </IndustrialCard>

                    <Box className="p-5 rounded-2xl glass border-red-500/20 bg-red-500/5 relative overflow-hidden group">
                        <Box className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-125 transition-transform">
                            <ShieldAlert className="h-16 w-16 text-red-500" />
                        </Box>
                        <Typography className="text-sm font-bold text-red-400 uppercase tracking-widest mb-1">Status Crítico</Typography>
                        <Typography className="text-2xl font-black tracking-tighter mb-2 text-white">{stats.recentDeviations || 0} NCs</Typography>
                        <Typography className="text-xs text-slate-400 leading-relaxed">
                            Desvios CCP registrados nas últimas 24h.
                        </Typography>
                        <Button variant="link" className="text-red-400 p-0 h-auto mt-3 text-xs font-bold uppercase tracking-widest">
                            Ver Desvios →
                        </Button>
                    </Box>
                </Box>
            </Box>
        </Box>
    );
}

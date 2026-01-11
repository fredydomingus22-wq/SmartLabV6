"use client";

import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Microscope,
    Activity,
    Calendar,
    ArrowRight,
    FlaskConical
} from "lucide-react";
import Link from "next/link";
import { IndustrialCard, IndustrialGrid } from "@/components/shared/industrial-card";
import { IndustrialChart } from "@/components/shared/industrial-chart";
import { PremiumListItem } from "@/components/dashboard/premium-list-item";
import type { EChartsOption } from "echarts";
import { Box, Typography, Stack } from "@mui/material";

interface MicroViewProps {
    user: any;
    stats: any;
    assignments: any[];
    activity: any;
}

export function MicroView({ user, stats, assignments, activity }: MicroViewProps) {
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
            <IndustrialGrid cols={4}>
                <IndustrialCard
                    variant="analytics"
                    title="Em Incubação"
                    value="24"
                    description="Amostras em processo térmico"
                    tooltip="Total de amostras atualmente nas estufas aguardando o tempo regulamentar de crescimento."
                    status="neutral"
                >
                    <IndustrialChart option={getSparklineOption("#a855f7", [18, 22, 20, 25, 23, 26, 24])} height="100%" />
                </IndustrialCard>

                <IndustrialCard
                    variant="analytics"
                    title="Leituras Hoje"
                    value="12"
                    description="Análises programadas"
                    tooltip="Número de amostras que atingiram o tempo de incubação e devem ser lidas no turno atual."
                    status="warning"
                >
                    <IndustrialChart option={getSparklineOption("#3b82f6", [8, 10, 7, 12, 9, 11, 12])} height="100%" />
                </IndustrialCard>

                <IndustrialCard
                    variant="analytics"
                    title="Resultados Críticos"
                    value="1"
                    description="Positivos / Fora de especificação"
                    tooltip="Detecções confirmadas de patógenos ou contagens que violam as especificações de segurança."
                    status="error"
                >
                    <IndustrialChart option={getSparklineOption("#ef4444", [0, 1, 0, 0, 2, 0, 1])} height="100%" />
                </IndustrialCard>

                <IndustrialCard
                    variant="analytics"
                    title="Taxa de Liberação"
                    value="88.5%"
                    description="Conclusão vs Prazos"
                    tooltip="Percentual de análises concluídas e liberadas dentro do tempo máximo estipulado (TAT)."
                    status="success"
                    trend={{ value: 1.5, isPositive: true }}
                >
                    <IndustrialChart option={getSparklineOption("#10b981", [85, 87, 86, 89, 88, 87, 88.5])} height="100%" />
                </IndustrialCard>
            </IndustrialGrid>

            {/* Main Content */}
            <Box className="grid gap-8 lg:grid-cols-3">
                <Box className="lg:col-span-2 space-y-6">
                    <Box className="flex justify-between items-center px-1">
                        <Typography className="text-xl font-bold flex items-center gap-2 text-white">
                            <Calendar className="h-5 w-5 text-purple-400" />
                            Agenda de Leituras do Turno
                        </Typography>
                        <Button asChild variant="ghost" size="sm" className="text-muted-foreground hover:text-purple-400">
                            <Link href="/micro/reading">
                                Abrir Calendário <ArrowRight className="h-4 w-4 ml-2" />
                            </Link>
                        </Button>
                    </Box>

                    <IndustrialCard bodyClassName="p-0">
                        <Box className="divide-y divide-white/5">
                            {[1, 2, 3].map((i) => (
                                <PremiumListItem
                                    key={i}
                                    title={`AM-2024${i}02 - Água Industrial`}
                                    subtitle="Contagem Total Mesófilos • 48h Reading"
                                    status="Pronto"
                                    time="Vence em 2h"
                                    variant="info"
                                    icon={<FlaskConical className="h-6 w-6 text-purple-400" />}
                                />
                            ))}
                        </Box>
                    </IndustrialCard>
                </Box>

                <Box className="space-y-6">
                    <Typography className="text-xl font-bold flex items-center gap-2 px-1 text-white">
                        <Activity className="h-5 w-5 text-purple-400" />
                        Status de Incubações
                    </Typography>

                    <IndustrialCard className="p-5" bodyClassName="p-0">
                        <Stack spacing={2}>
                            <Box className="flex justify-between items-center bg-white/5 p-3 rounded-xl border border-white/5">
                                <Typography className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Estufa 01 (35°C)</Typography>
                                <Typography className="text-emerald-400 font-mono text-xs font-black">35.2°C</Typography>
                            </Box>
                            <Box className="flex justify-between items-center bg-white/5 p-3 rounded-xl border border-white/5">
                                <Typography className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Estufa 02 (25°C)</Typography>
                                <Typography className="text-emerald-400 font-mono text-xs font-black">24.8°C</Typography>
                            </Box>
                        </Stack>

                        <Box className="pt-4 mt-4 border-t border-white/5">
                            <Typography className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-3">Busca Rápida de Matriz</Typography>
                            <Box className="grid grid-cols-2 gap-2">
                                {['Água', 'Xarope', 'Superfície', 'Ambiente'].map(tag => (
                                    <Button key={tag} variant="outline" size="sm" className="h-8 glass text-[9px] font-black uppercase tracking-widest border-white/5 hover:border-purple-400/50">
                                        {tag}
                                    </Button>
                                ))}
                            </Box>
                        </Box>
                    </IndustrialCard>

                    <Box className="p-6 rounded-2xl glass border-purple-500/20 bg-purple-500/5 group text-center">
                        <Microscope className="h-10 w-10 text-purple-400 mx-auto mb-3 group-hover:rotate-12 transition-transform" />
                        <Typography className="font-black text-[10px] uppercase tracking-widest text-white mb-2">Relatório Mensal Micro</Typography>
                        <Typography className="text-[10px] text-slate-400 leading-relaxed mb-4">
                            Resumo de tendências e conformidade microbiológica ambiental.
                        </Typography>
                        <Button className="w-full h-10 glass-primary font-bold uppercase tracking-widest text-[10px] rounded-xl transition-all">
                            Gerar Relatório
                        </Button>
                    </Box>
                </Box>
            </Box>
        </Box>
    );
}

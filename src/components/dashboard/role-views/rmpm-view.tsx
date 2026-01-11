"use client";

import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Package,
    Truck,
    History,
    ArrowRight,
    Boxes
} from "lucide-react";
import Link from "next/link";
import { IndustrialCard, IndustrialGrid } from "@/components/shared/industrial-card";
import { IndustrialChart } from "@/components/shared/industrial-chart";
import { PremiumListItem } from "@/components/dashboard/premium-list-item";
import type { EChartsOption } from "echarts";
import { Box, Typography, Stack } from "@mui/material";

interface RMPMViewProps {
    stats: any;
    activity: any;
}

export function RMPMView({ stats, activity }: RMPMViewProps) {
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
                    title="Lotes MP Pendentes"
                    value="12"
                    description="Matéria Prima aguardando"
                    tooltip="Quantidade de lotes de matéria-prima que foram recebidos mas ainda não foram inspecionados ou liberados."
                    status="warning"
                >
                    <IndustrialChart option={getSparklineOption("#3b82f6", [10, 14, 12, 16, 13, 15, 12])} height="100%" />
                </IndustrialCard>

                <IndustrialCard
                    variant="analytics"
                    title="Taxa de Rejeição"
                    value="1.8%"
                    description="Desvio de specs na recepção"
                    tooltip="Percentual de lotes rejeitados por não conformidade com as especificações técnicas de qualidade."
                    status="error"
                >
                    <IndustrialChart option={getSparklineOption("#ef4444", [2, 1.5, 2.5, 1.2, 2.1, 1.8, 1.8])} height="100%" />
                </IndustrialCard>

                <IndustrialCard
                    variant="analytics"
                    title="Fornecedores Críticos"
                    value="3"
                    description="Pendências de qualidade"
                    tooltip="Número de fornecedores que apresentam desvios recorrentes ou documentos de qualificação vencidos."
                    status="error"
                >
                    <IndustrialChart option={getSparklineOption("#f59e0b", [2, 2, 3, 3, 4, 3, 3])} height="100%" />
                </IndustrialCard>

                <IndustrialCard
                    variant="analytics"
                    title="Lead Time Recepção"
                    value="4.2h"
                    description="Tempo médio de inspeção"
                    tooltip="Tempo médio decorrido desde a chegada do veículo até a liberação do lote no almoxarifado."
                    status="success"
                    trend={{ value: 12, isPositive: true }}
                >
                    <IndustrialChart option={getSparklineOption("#06b6d4", [5, 4.8, 5.2, 4.5, 4.3, 4.2, 4.2])} height="100%" />
                </IndustrialCard>
            </IndustrialGrid>

            {/* Main Content */}
            <Box className="grid gap-8 lg:grid-cols-3">
                <Box className="lg:col-span-2 space-y-6">
                    <Box className="flex justify-between items-center px-1">
                        <Typography className="text-xl font-bold flex items-center gap-2 text-white">
                            <Truck className="h-5 w-5 text-blue-400" />
                            Recebimentos em Inspeção
                        </Typography>
                        <Button asChild variant="ghost" size="sm" className="text-muted-foreground hover:text-blue-400">
                            <Link href="/rmpm/inspections">
                                Ver Inventário Global <ArrowRight className="h-4 w-4 ml-2" />
                            </Link>
                        </Button>
                    </Box>

                    <IndustrialCard bodyClassName="p-0">
                        <Box className="divide-y divide-white/5">
                            {[1, 2, 3].map((i) => (
                                <PremiumListItem
                                    key={i}
                                    title={`MP-2024-0${i}8 - Açúcar Cristal`}
                                    subtitle="Fornecedor: Usina Central • Lote: 88293-A"
                                    status="Em Verificação"
                                    variant="info"
                                    time="SLA: 18h remanescentes"
                                    icon={<Package className="h-6 w-6 text-blue-400" />}
                                />
                            ))}
                        </Box>
                    </IndustrialCard>
                </Box>

                <Box className="space-y-6">
                    <Typography className="text-xl font-bold flex items-center gap-2 px-1 text-white">
                        <Boxes className="h-5 w-5 text-blue-400" />
                        Qualidade de Embalagens
                    </Typography>

                    <IndustrialCard className="p-5" bodyClassName="p-0">
                        <Stack spacing={3}>
                            {[
                                { name: "Garrafas PET 500ml", status: "Conforme", variant: "success" },
                                { name: "Rótulos Termoencolhíveis", status: "Atenção", variant: "warning" },
                                { name: "Tampas Flip-Top", status: "Conforme", variant: "success" }
                            ].map(item => (
                                <Box key={item.name} className="flex items-center justify-between">
                                    <Typography className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{item.name}</Typography>
                                    <Badge className={item.variant === "success" ? "bg-emerald-500/10 text-emerald-400 border-none text-[8px] font-black" : "bg-orange-500/10 text-orange-400 border-none text-[8px] font-black"}>{item.status}</Badge>
                                </Box>
                            ))}
                        </Stack>

                        <Box className="pt-4 mt-4 border-t border-white/5">
                            <Typography className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-3">Linha de Fornecedores (SLA %)</Typography>
                            <Stack spacing={3}>
                                {[
                                    { name: "Tetra Pak", score: 98 },
                                    { name: "SIG Combibloc", score: 95 },
                                    { name: "Plastipak", score: 82 },
                                ].map(f => (
                                    <Box key={f.name} className="space-y-1.5">
                                        <Box className="flex justify-between text-[9px] font-black uppercase text-white">
                                            <span>{f.name}</span>
                                            <span>{f.score}%</span>
                                        </Box>
                                        <Box className="h-1 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
                                            <Box
                                                className={f.score > 90 ? "bg-emerald-500 h-full" : "bg-orange-500 h-full"}
                                                sx={{ width: `${f.score}%` }}
                                            />
                                        </Box>
                                    </Box>
                                ))}
                            </Stack>
                        </Box>
                    </IndustrialCard>

                    <Box className="p-6 rounded-2xl glass border-blue-500/20 bg-blue-500/5 group text-center">
                        <History className="h-10 w-10 text-blue-400 mx-auto mb-3 group-hover:scale-110 transition-transform" />
                        <Typography className="font-black text-[10px] uppercase tracking-widest text-white mb-2">Certificados Recepção</Typography>
                        <Typography className="text-[10px] text-slate-400 leading-relaxed mb-4">
                            Emita o certificado de conformidade de entrada para lotes liberados.
                        </Typography>
                        <Button className="w-full h-10 glass-primary font-bold uppercase tracking-widest text-[10px] rounded-xl transition-all">
                            Gerar Certificados
                        </Button>
                    </Box>
                </Box>
            </Box>
        </Box>
    );
}

"use client";

import React from "react";
import { TrendingUp } from "lucide-react";
import { IndustrialCard, IndustrialGrid } from "@/components/shared/industrial-card";
import { IndustrialChart } from "@/components/shared/industrial-chart";
import { DashboardTrendsClient } from "@/components/dashboard/dashboard-trends-client";
import type { EChartsOption } from "echarts";
import { Box, Typography } from "@mui/material";

interface ManagerOverviewProps {
    stats: any;
    products: any[];
    parameters: any[];
    initialTrendData: any[];
    initialSpecs: any;
}

export function ManagerOverview({ stats, products, parameters, initialTrendData, initialSpecs }: ManagerOverviewProps) {

    // Helper to generate premium ECharts sparkline options
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
                    type: 'linear',
                    x: 0, y: 0, x2: 0, y2: 1,
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

    const mockData1 = [92, 94, 93, 95, 96, 94, 95];
    const mockData2 = [4, 3, 5, 2, 4, 1, 2];
    const mockData3 = [88, 90, 89, 91, 92, 90, 91];
    const mockData4 = [96, 97, 96, 98, 99, 97, 98];

    return (
        <Box className="space-y-10">
            {/* KPI Grid - Replaced PremiumAnalyticsCard with IndustrialCard[variant=analytics] */}
            <IndustrialGrid cols={4}>
                <IndustrialCard
                    variant="analytics"
                    title="Conformidade Global"
                    value={`${stats.complianceRate.toFixed(1)}%`}
                    description="Taxa de aprovação em primeira análise"
                    tooltip="Média ponderada de amostras aprovadas sem necessidade de reanálise ou correção."
                    trend={{
                        value: Math.abs(stats.trends?.compliance || 0),
                        isPositive: (stats.trends?.compliance || 0) >= 0
                    }}
                    status={(stats.complianceRate >= 95) ? "success" : "warning"}
                >
                    <IndustrialChart option={getSparklineOption("#10b981", mockData1)} height="100%" />
                </IndustrialCard>

                <IndustrialCard
                    variant="analytics"
                    title="Desvios de Calibragem"
                    value={stats.recentDeviations.toString()}
                    description="Ocorrências críticas de CCP/OPRP"
                    tooltip="Número total de violações de limites críticos monitorados por sensores ou inspeções manuais."
                    trend={{
                        value: Math.abs(stats.trends?.deviations || 0),
                        isPositive: (stats.trends?.deviations || 0) <= 0
                    }}
                    status={(stats.recentDeviations === 0) ? "success" : "error"}
                >
                    <IndustrialChart option={getSparklineOption("#f43f5e", mockData2)} height="100%" />
                </IndustrialCard>

                <IndustrialCard
                    variant="analytics"
                    title="OTD Liberação"
                    value={`${stats.otdRate.toFixed(1)}%`}
                    description="Lotes liberados dentro do SLA"
                    tooltip="Percentual de lotes de produção liberados para expedição no prazo acordado de 48h."
                    trend={{
                        value: Math.abs(stats.trends?.otd || 0),
                        isPositive: (stats.trends?.otd || 0) >= 0
                    }}
                >
                    <IndustrialChart option={getSparklineOption("#3b82f6", mockData3)} height="100%" />
                </IndustrialCard>

                <IndustrialCard
                    variant="analytics"
                    title="Compliance Amostragem"
                    value={`${stats.samplingCompliance.toFixed(1)}%`}
                    description="Pontos realizados vs. planeados"
                    tooltip="Aderência ao plano de coleta de amostras programado para o período."
                    trend={{
                        value: Math.abs(stats.trends?.sampling || 0),
                        isPositive: (stats.trends?.sampling || 0) >= 0
                    }}
                >
                    <IndustrialChart option={getSparklineOption("#f59e0b", mockData4)} height="100%" />
                </IndustrialCard>
            </IndustrialGrid>

            {/* Quality Trends Section */}
            <Box className="space-y-4">
                <Box className="flex items-center gap-2 px-1">
                    <TrendingUp className="h-5 w-5 text-blue-500" />
                    <Typography className="text-xl font-bold tracking-tight text-white">
                        Análise de Tendências Estatísticas
                    </Typography>
                </Box>
                <DashboardTrendsClient
                    products={products}
                    parameters={parameters}
                    initialData={initialTrendData}
                    initialSpecs={initialSpecs}
                />
            </Box>
        </Box>
    );
}

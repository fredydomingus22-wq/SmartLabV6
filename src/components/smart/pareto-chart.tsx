"use client";

import React from "react";
import { IndustrialCard } from "@/components/shared/industrial-card";
import { IndustrialChart } from "@/components/shared/industrial-chart";
import type { EChartsOption } from "echarts";
import { Box, Typography } from "@mui/material";

interface ParetoDataPoint {
    name: string;
    count: number;
    percentage: number;
    cumulativePercentage: number;
}

interface ParetoChartProps {
    data: ParetoDataPoint[];
    title: string;
    description?: string;
    height?: number;
}

/**
 * ParetoChart: Quality Tool using ECharts.
 * Visualizes the 80/20 rule for root cause analysis.
 */
export function ParetoChart({
    data,
    title,
    description,
    height = 400
}: ParetoChartProps) {

    // Transform data for ECharts
    const categories = data.map(d => d.name);
    const counts = data.map(d => d.count);
    const cumulative = data.map(d => d.cumulativePercentage);

    const option: EChartsOption = {
        xAxis: {
            type: "category",
            data: categories,
            axisLabel: { interval: 0, rotate: data.length > 5 ? 30 : 0 }
        },
        yAxis: [
            {
                type: "value",
                name: "Frequência",
                splitLine: { lineStyle: { color: "rgba(255,255,255,0.05)" } }
            },
            {
                type: "value",
                name: "Acumulado %",
                min: 0,
                max: 100,
                axisLabel: { formatter: "{value}%" },
                splitLine: { show: false }
            }
        ],
        series: [
            {
                name: "Frequência",
                type: "bar",
                data: counts,
                barWidth: "60%",
                itemStyle: {
                    color: (params: any) => {
                        // Highlight 80% rule
                        return data[params.dataIndex].cumulativePercentage <= 80
                            ? "#3b82f6" // blue-500
                            : "#64748b"; // slate-500
                    },
                    borderRadius: [4, 4, 0, 0]
                }
            },
            {
                name: "Acumulado",
                type: "line",
                yAxisIndex: 1,
                data: cumulative,
                smooth: true,
                symbol: "circle",
                symbolSize: 8,
                lineStyle: { width: 3, color: "#10b981" }, // emerald-500
                itemStyle: { color: "#10b981", borderWidth: 2, borderColor: "#0f172a" }
            }
        ]
    };

    const footer = (
        <Box className="flex items-center justify-between">
            <Box>
                <Typography className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                    Princípio de Pareto (80/20)
                </Typography>
                <Typography className="text-[10px] text-slate-400">
                    80% dos problemas costumam provir de 20% das causas.
                </Typography>
            </Box>
            <Box className="flex gap-4">
                <Box className="flex items-center gap-2">
                    <Box className="h-2 w-2 rounded-sm bg-blue-500" />
                    <Typography className="text-[9px] font-bold text-slate-300 uppercase">Prioritário</Typography>
                </Box>
                <Box className="flex items-center gap-2">
                    <Box className="h-2 w-2 rounded-sm bg-slate-500" />
                    <Typography className="text-[9px] font-bold text-slate-300 uppercase">Secundário</Typography>
                </Box>
            </Box>
        </Box>
    );

    return (
        <IndustrialCard
            title={title}
            subtitle={description}
            footer={footer}
            className="h-full"
        >
            <IndustrialChart option={option} height={height - 100} />
        </IndustrialCard>
    );
}

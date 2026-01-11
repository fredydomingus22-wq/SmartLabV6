"use client";

import type { EChartsOption } from "echarts";
import { IndustrialCard } from "@/components/shared/industrial-card";
import { IndustrialChart } from "@/components/shared/industrial-chart";
import { GitCommit, Activity } from "lucide-react";
import { Box, Typography, Stack } from "@mui/material";

interface CorrelationPoint {
    x: number;
    y: number;
    name: string;
}

interface CorrelationChartProps {
    data: CorrelationPoint[];
    xLabel: string;
    yLabel: string;
    correlation: number;
    title: string;
    description?: string;
    height?: number;
}

export function CorrelationChart({
    data,
    xLabel,
    yLabel,
    correlation,
    title,
    description,
    height = 400
}: CorrelationChartProps) {

    const correlationText = correlation > 0.7 ? "Forte Positiva" :
        correlation > 0.3 ? "Moderada Positiva" :
            correlation > -0.3 ? "Fraca / Nula" :
                correlation > -0.7 ? "Moderada Negativa" : "Forte Negativa";

    const correlationColor = Math.abs(correlation) > 0.7 ? "#10b981" :
        Math.abs(correlation) > 0.3 ? "#3b82f6" : "#64748b";

    const option: EChartsOption = {
        grid: { top: 40, right: 30, bottom: 50, left: 60 },
        xAxis: {
            type: 'value',
            name: xLabel,
            nameLocation: 'middle',
            nameGap: 30,
            nameTextStyle: { color: "#64748b", fontWeight: "bold", fontSize: 10 },
            axisLabel: { color: "#64748b", fontSize: 10 },
            splitLine: { lineStyle: { color: "rgba(255,255,255,0.03)" } }
        },
        yAxis: {
            type: 'value',
            name: yLabel,
            nameLocation: 'middle',
            nameGap: 45,
            nameTextStyle: { color: "#64748b", fontWeight: "bold", fontSize: 10 },
            axisLabel: { color: "#64748b", fontSize: 10 },
            splitLine: { lineStyle: { color: "rgba(255,255,255,0.03)" } }
        },
        tooltip: {
            trigger: "item",
            formatter: (params: any) => {
                const d = params.data;
                return `
                    <div style="padding: 4px">
                        <div style="font-weight: bold; margin-bottom: 4px; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 4px;">
                            ${d[2]}
                        </div>
                        <div style="display: flex; justify-content: space-between; gap: 20px;">
                            <span style="color: #94a3b8">${xLabel}:</span>
                            <span style="font-weight: bold; color: #10b981">${d[0]}</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; gap: 20px;">
                            <span style="color: #94a3b8">${yLabel}:</span>
                            <span style="font-weight: bold; color: #3b82f6">${d[1]}</span>
                        </div>
                    </div>
                `;
            }
        },
        series: [{
            type: 'scatter',
            data: data.map(p => [p.x, p.y, p.name]),
            symbolSize: 10,
            itemStyle: {
                color: "#3b82f6",
                opacity: 0.6,
                borderColor: "rgba(255,255,255,0.1)",
                borderWidth: 1
            },
            emphasis: {
                itemStyle: {
                    color: "#10b981",
                    opacity: 1
                }
            }
        }]
    };

    const actions = (
        <Box className="bg-slate-900/80 border border-slate-800 rounded-xl px-4 py-1.5 flex flex-col items-center">
            <Typography className="text-[9px] font-black text-slate-500 uppercase tracking-widest whitespace-nowrap">Pearson (r)</Typography>
            <Typography className="text-lg font-black" sx={{ color: correlationColor }}>{correlation.toFixed(3)}</Typography>
            <Typography className="text-[9px] font-bold uppercase" sx={{ color: correlationColor }}>{correlationText}</Typography>
        </Box>
    );

    const footer = (
        <Box className="flex items-center gap-3">
            <Box className="h-2 w-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
            <Typography className="text-[10px] text-slate-400 font-medium">
                A análise de correlação identifica se mudanças em <b>{xLabel}</b> influenciam proporcionalmente em <b>{yLabel}</b>.
            </Typography>
        </Box>
    );

    return (
        <IndustrialCard
            title={title}
            subtitle={description}
            icon={GitCommit}
            actions={actions}
            footer={footer}
            className="h-full"
        >
            <IndustrialChart option={option} height={height} />
        </IndustrialCard>
    );
}

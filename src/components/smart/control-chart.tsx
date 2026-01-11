"use client";

import React from "react";
import { IndustrialCard } from "@/components/shared/industrial-card";
import { IndustrialChart } from "@/components/shared/industrial-chart";
import type { EChartsOption } from "echarts";
import { Box, Typography, Stack } from "@mui/material";

interface ControlChartProps {
    data: any[];
    xKey: string;
    yKey: string;
    title: string;
    description?: string;
    ucl?: number;
    lcl?: number;
    mean?: number;
    usl?: number;
    lsl?: number;
    target?: number;
    unit?: string;
    height?: number;
    highlightOOC?: boolean;
}

/**
 * ControlChart: Statistical Process Control (SPC) Chart using ECharts.
 * Standard tool for monitoring process stability and specification compliance.
 */
export function ControlChart({
    data,
    xKey,
    yKey,
    title,
    description,
    ucl,
    lcl,
    mean,
    usl,
    lsl,
    target,
    unit = "",
    height = 350,
    highlightOOC = true,
}: ControlChartProps) {

    const categories = data.map(d => d[xKey]);
    const values = data.map(d => d[yKey]);

    // Build MarkLines for Limits
    const markLines: any[] = [];

    if (ucl !== undefined) markLines.push({ yAxis: ucl, label: { formatter: 'LSC' }, lineStyle: { color: "#ef4444", type: "dashed" } });
    if (lcl !== undefined) markLines.push({ yAxis: lcl, label: { formatter: 'LIC' }, lineStyle: { color: "#ef4444", type: "dashed" } });
    if (mean !== undefined) markLines.push({ yAxis: mean, label: { formatter: 'Média' }, lineStyle: { color: "#94a3b8", type: "dotted" } });
    if (target !== undefined) markLines.push({ yAxis: target, label: { formatter: 'Alvo' }, lineStyle: { color: "#10b981", type: "solid" } });
    if (usl !== undefined) markLines.push({ yAxis: usl, label: { formatter: 'LSE', position: 'start' }, lineStyle: { color: "#dc2626", width: 2 } });
    if (lsl !== undefined) markLines.push({ yAxis: lsl, label: { formatter: 'LIE', position: 'start' }, lineStyle: { color: "#dc2626", width: 2 } });

    const option: EChartsOption = {
        xAxis: {
            type: "category",
            data: categories,
            axisLabel: { color: "#64748b", fontSize: 10 }
        },
        yAxis: {
            type: "value",
            scale: true,
            axisLabel: { formatter: `{value} ${unit}`, color: "#64748b", fontSize: 10 },
            splitLine: { lineStyle: { color: "rgba(255,255,255,0.03)" } }
        },
        series: [
            {
                name: "Valor",
                type: "line",
                data: values,
                smooth: false,
                symbol: (val: any, params: any) => {
                    const payload = data[params.dataIndex];
                    if (payload.violation || (highlightOOC && ((ucl && val > ucl) || (lcl && val < lcl)))) {
                        return "circle";
                    }
                    return "circle";
                },
                symbolSize: (val: any, params: any) => {
                    const payload = data[params.dataIndex];
                    if (payload.violation || (highlightOOC && ((ucl && val > ucl) || (lcl && val < lcl)))) {
                        return 10;
                    }
                    return 6;
                },
                itemStyle: {
                    color: (params: any) => {
                        const val = params.data;
                        const payload = data[params.dataIndex];
                        if (payload.violation || (highlightOOC && ((ucl && val > ucl) || (lcl && val < lcl)))) {
                            return "#f43f5e"; // rose-500 for violations
                        }
                        return "#3b82f6"; // blue-500
                    }
                },
                lineStyle: { width: 3, color: "#3b82f6" },
                markLine: {
                    symbol: ["none", "none"],
                    data: markLines,
                    label: { show: true, fontSize: 9, fontWeight: "bold" }
                }
            }
        ]
    };

    const footer = (
        <Stack direction="row" spacing={3} alignItems="center">
            <Box className="flex items-center gap-2">
                <Box className="h-1 w-4 bg-emerald-500" />
                <Typography className="text-[9px] font-bold text-slate-400 uppercase">Especificação</Typography>
            </Box>
            <Box className="flex items-center gap-2">
                <Box className="h-1 w-4 border-t border-rose-500 border-dashed" />
                <Typography className="text-[9px] font-bold text-slate-400 uppercase">Limites de Controle</Typography>
            </Box>
            <Box className="flex items-center gap-2">
                <Box className="h-2 w-2 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)]" />
                <Typography className="text-[9px] font-bold text-rose-400 uppercase">Fora de Controle (OOC)</Typography>
            </Box>
        </Stack>
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

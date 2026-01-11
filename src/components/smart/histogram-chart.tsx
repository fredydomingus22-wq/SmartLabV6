"use client";

import React, { useMemo } from 'react';
import { IndustrialCard } from "@/components/shared/industrial-card";
import { IndustrialChart } from "@/components/shared/industrial-chart";
import type { EChartsOption } from "echarts";
import { Box, Typography, Stack } from "@mui/material";

interface HistogramChartProps {
    data: number[];
    lsl?: number;
    usl?: number;
    target?: number;
    title: string;
    description?: string;
    unit?: string;
    height?: number;
}

/**
 * HistogramChart: Quality Tool for data distribution analysis.
 * Features a normal distribution curve and key statistical metrics.
 */
export function HistogramChart({
    data,
    lsl,
    usl,
    target,
    title,
    description,
    unit,
    height = 350
}: HistogramChartProps) {

    const stats = useMemo(() => {
        if (!data.length) return null;
        const mean = data.reduce((a, b) => a + b, 0) / data.length;
        const variance = data.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / data.length;
        const stdDev = Math.sqrt(variance);
        const skewness = data.reduce((a, b) => a + Math.pow((b - mean) / stdDev, 3), 0) / data.length;
        return { mean, stdDev, skewness, min: Math.min(...data), max: Math.max(...data) };
    }, [data]);

    const chartData = useMemo(() => {
        if (!stats || !data.length) return { bins: [], counts: [], curve: [] };

        const binsCount = 15;
        const min = stats.min - (stats.stdDev * 0.5);
        const max = stats.max + (stats.stdDev * 0.5);
        const range = max - min;
        const binWidth = range / binsCount;

        const counts = Array(binsCount).fill(0);
        data.forEach(v => {
            const idx = Math.min(Math.floor((v - min) / binWidth), binsCount - 1);
            if (idx >= 0) counts[idx]++;
        });

        const binLabels = Array(binsCount).fill(0).map((_, i) => (min + (i + 0.5) * binWidth).toFixed(2));

        const curve = binLabels.map(label => {
            const x = parseFloat(label);
            const pdf = (1 / (stats.stdDev * Math.sqrt(2 * Math.PI))) *
                Math.exp(-0.5 * Math.pow((x - stats.mean) / stats.stdDev, 2));
            return pdf * data.length * binWidth;
        });

        return { labels: binLabels, counts, curve };
    }, [data, stats]);

    if (!stats) return null;

    const option: EChartsOption = {
        xAxis: {
            type: "category",
            data: chartData.labels,
            axisLabel: { color: "#64748b", fontSize: 10 }
        },
        yAxis: {
            type: "value",
            show: false
        },
        series: [
            {
                name: "Frequência",
                type: "bar",
                data: chartData.counts,
                itemStyle: { color: "#3b82f6", opacity: 0.4 },
                barWidth: "95%"
            },
            {
                name: "Distribuição Normal",
                type: "line",
                data: chartData.curve,
                smooth: true,
                showSymbol: false,
                lineStyle: { width: 2, color: "#10b981" },
                areaStyle: { color: "rgba(16, 185, 129, 0.05)" }
            }
        ]
    };

    const footer = (
        <Stack direction="row" spacing={2} justifyContent="space-between">
            <Box className="flex flex-col">
                <Typography className="text-[10px] text-slate-500 font-bold uppercase">Média</Typography>
                <Typography className="text-sm font-bold text-white">{stats.mean.toFixed(3)} {unit}</Typography>
            </Box>
            <Box className="flex flex-col border-l border-white/5 pl-4">
                <Typography className="text-[10px] text-slate-500 font-bold uppercase">Desvio Padrão</Typography>
                <Typography className="text-sm font-bold text-white">{stats.stdDev.toFixed(3)}</Typography>
            </Box>
            <Box className="flex flex-col border-l border-white/5 pl-4">
                <Typography className="text-[10px] text-slate-500 font-bold uppercase">Assimetria</Typography>
                <Typography className="text-sm font-bold text-emerald-400">{stats.skewness.toFixed(2)}</Typography>
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
            <IndustrialChart option={option} height={height - 120} />
        </IndustrialCard>
    );
}

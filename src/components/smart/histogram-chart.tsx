"use client";

import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell,
    Line,
    ComposedChart,
    Area,
    ReferenceLine
} from "recharts";

interface HistogramChartProps {
    data: number[];
    lsl?: number;
    usl?: number;
    target?: number;
    title: string;
    description?: string;
    unit?: string;
}

export function HistogramChart({ data, lsl, usl, target, title, description, unit }: HistogramChartProps) {
    const stats = useMemo(() => {
        if (!data.length) return null;
        const mean = data.reduce((a, b) => a + b, 0) / data.length;
        const variance = data.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / data.length;
        const stdDev = Math.sqrt(variance);

        // Skewness
        const skewness = data.reduce((a, b) => a + Math.pow((b - mean) / stdDev, 3), 0) / data.length;

        return { mean, stdDev, skewness, min: Math.min(...data), max: Math.max(...data) };
    }, [data]);

    const chartData = useMemo(() => {
        if (!stats || !data.length) return [];

        const bins = 15;
        const min = stats.min - (stats.stdDev * 0.5);
        const max = stats.max + (stats.stdDev * 0.5);
        const range = max - min;
        const binWidth = range / bins;

        const distribution = Array(bins).fill(0);
        data.forEach(v => {
            const idx = Math.min(Math.floor((v - min) / binWidth), bins - 1);
            if (idx >= 0) distribution[idx]++;
        });

        // Generate normal distribution curve points
        return distribution.map((count, i) => {
            const x = min + (i + 0.5) * binWidth;
            // Normal PDF formula
            const pdf = (1 / (stats.stdDev * Math.sqrt(2 * Math.PI))) *
                Math.exp(-0.5 * Math.pow((x - stats.mean) / stats.stdDev, 2));

            // Scale PDF to match bar height (heuristic)
            const scaledPdf = pdf * data.length * binWidth;

            return {
                bin: x.toFixed(2),
                count,
                curve: scaledPdf,
                x
            };
        });
    }, [data, stats]);

    if (!stats) return null;

    return (
        <Card className="glass border-slate-800/50">
            <CardHeader className="pb-2">
                <CardTitle className="text-base font-bold text-white">{title}</CardTitle>
                {description && <CardDescription className="text-xs text-slate-400">{description}</CardDescription>}
            </CardHeader>
            <CardContent>
                <div className="h-[250px] w-full mt-4">
                    <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <XAxis
                                dataKey="bin"
                                stroke="#475569"
                                fontSize={10}
                                tickLine={false}
                                axisLine={false}
                            />
                            <YAxis hide />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#020617', border: '1px solid #1e293b', borderRadius: '8px' }}
                                itemStyle={{ fontSize: '10px' }}
                            />
                            <Bar dataKey="count" fill="#3b82f6" fillOpacity={0.4} radius={[2, 2, 0, 0]} />
                            <Area
                                type="monotone"
                                dataKey="curve"
                                stroke="#10b981"
                                fill="#10b981"
                                fillOpacity={0.05}
                                strokeWidth={2}
                                dot={false}
                            />

                            {lsl !== undefined && (
                                <ReferenceLine x={String(lsl)} stroke="#ef4444" strokeDasharray="3 3" label={{ position: 'top', value: 'LIE', fill: '#ef4444', fontSize: 10 }} />
                            )}
                            {usl !== undefined && (
                                <ReferenceLine x={String(usl)} stroke="#ef4444" strokeDasharray="3 3" label={{ position: 'top', value: 'LSE', fill: '#ef4444', fontSize: 10 }} />
                            )}
                            {target !== undefined && (
                                <ReferenceLine x={String(target)} stroke="#3b82f6" strokeDasharray="5 5" label={{ position: 'top', value: 'Target', fill: '#3b82f6', fontSize: 10 }} />
                            )}
                        </ComposedChart>
                    </ResponsiveContainer>
                </div>

                <div className="grid grid-cols-3 gap-2 mt-4">
                    <div className="p-2 bg-slate-900/50 rounded-lg border border-slate-800/50">
                        <span className="text-[10px] text-slate-500 uppercase font-bold block">Média</span>
                        <span className="text-sm font-bold text-white">{stats.mean.toFixed(3)} {unit}</span>
                    </div>
                    <div className="p-2 bg-slate-900/50 rounded-lg border border-slate-800/50">
                        <span className="text-[10px] text-slate-500 uppercase font-bold block">Desvio Padrão</span>
                        <span className="text-sm font-bold text-white">{stats.stdDev.toFixed(3)}</span>
                    </div>
                    <div className="p-2 bg-slate-900/50 rounded-lg border border-slate-800/50">
                        <span className="text-[10px] text-slate-500 uppercase font-bold block">Assimetria</span>
                        <span className="text-sm font-bold text-emerald-400">{stats.skewness.toFixed(2)}</span>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

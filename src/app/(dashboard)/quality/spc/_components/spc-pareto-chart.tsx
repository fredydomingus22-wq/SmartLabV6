"use client";

import { useMemo } from 'react';
import { Card } from "@/components/ui/card";
import { ResponsiveContainer, ComposedChart, Bar, Line, XAxis, YAxis, Tooltip, CartesianGrid, LabelList } from 'recharts';
import { Loader2 } from "lucide-react";

interface ParetoDataPoint {
    name: string;
    count: number;
    percentage: number;
    cumulativePercentage: number;
}

interface SPCParetoProps {
    data: ParetoDataPoint[];
    title?: string;
    loading?: boolean;
}

export function SPCParetoChart({ data, title, loading }: SPCParetoProps) {
    if (loading) {
        return (
            <Card className="h-[450px] w-full flex items-center justify-center bg-slate-950/50 border-white/10 backdrop-blur-md">
                <Loader2 className="h-8 w-8 text-indigo-500 animate-spin" />
            </Card>
        )
    }

    if (!data || data.length === 0) {
        return (
            <Card className="h-[450px] w-full flex items-center justify-center bg-slate-950/50 border-white/10 backdrop-blur-md text-slate-500 text-sm font-mono">
                Sem dados para diagrama de Pareto
            </Card>
        );
    }

    return (
        <Card className="h-[450px] w-full p-4 bg-slate-950/50 border-white/10 backdrop-blur-md relative overflow-hidden">
            <div className="absolute top-4 left-6 z-10">
                <h3 className="text-sm font-bold text-slate-200">{title || "Diagrama de Pareto"}</h3>
                <p className="text-xs text-slate-500">Regra 80/20 - Frequência vs Impacto Acumulado</p>
            </div>

            <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={data} margin={{ top: 40, right: 30, left: 20, bottom: 40 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                    <XAxis
                        dataKey="name"
                        stroke="#475569"
                        fontSize={10}
                        tickMargin={10}
                        interval={0}
                        angle={-30}
                        textAnchor="end"
                    />
                    <YAxis
                        yAxisId="left"
                        stroke="#475569"
                        fontSize={10}
                        label={{ value: 'Frequência', angle: -90, position: 'insideLeft', fill: '#64748b', fontSize: 10 }}
                    />
                    <YAxis
                        yAxisId="right"
                        orientation="right"
                        stroke="#10b981"
                        fontSize={10}
                        domain={[0, 100]}
                        tickFormatter={(v) => `${v}%`}
                    />
                    <Tooltip
                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#f8fafc' }}
                        itemStyle={{ fontSize: '12px' }}
                        labelStyle={{ color: '#94a3b8', fontSize: '10px', marginBottom: '5px' }}
                    />
                    <Bar
                        yAxisId="left"
                        dataKey="count"
                        fill="#3b82f6"
                        radius={[4, 4, 0, 0]}
                        barSize={40}
                        name="Frequência"
                    >
                        <LabelList dataKey="count" position="top" fill="#94a3b8" fontSize={10} />
                    </Bar>
                    <Line
                        yAxisId="right"
                        type="monotone"
                        dataKey="cumulativePercentage"
                        stroke="#10b981"
                        strokeWidth={2}
                        dot={{ r: 4, strokeWidth: 0, fill: "#10b981" }}
                        name="Acumulado %"
                    />
                    {/* 80% Cutoff Line */}
                    <Line yAxisId="right" type="linear" dataKey={() => 80} stroke="#f59e0b" strokeDasharray="5 5" strokeWidth={1} dot={false} name="Corte 80%" />
                </ComposedChart>
            </ResponsiveContainer>
        </Card>
    );
}

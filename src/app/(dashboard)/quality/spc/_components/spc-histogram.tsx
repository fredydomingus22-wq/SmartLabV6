"use client";

import { useMemo } from 'react';
import { Card } from "@/components/ui/card";
import { ResponsiveContainer, ComposedChart, Bar, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface SPCHistogramProps {
    data: number[];
    unit?: string;
    loading?: boolean;
}

export function SPCHistogram({ data, unit, loading }: SPCHistogramProps) {
    const stats = useMemo(() => {
        if (!data || data.length === 0) return null;
        const mean = data.reduce((a, b) => a + b, 0) / data.length;
        const variance = data.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / data.length;
        const stdDev = Math.sqrt(variance);
        const skewness = data.reduce((a, b) => a + Math.pow((b - mean) / stdDev, 3), 0) / data.length;
        return { mean, stdDev, skewness, min: Math.min(...data), max: Math.max(...data) };
    }, [data]);

    const chartData = useMemo(() => {
        if (!stats || !data || data.length === 0) return [];

        const binsCount = 15;
        // Add buffer to min/max for better visualization
        const min = stats.min - (stats.stdDev * 0.5);
        const max = stats.max + (stats.stdDev * 0.5);
        const range = max - min;
        const binWidth = range / binsCount;

        const histogramData = Array(binsCount).fill(0).map((_, i) => {
            const binStart = min + i * binWidth;
            const binEnd = binStart + binWidth;
            const binMid = binStart + binWidth / 2;

            // Count frequencies
            const count = data.filter(v => v >= binStart && v < binEnd).length;

            // Calculate Normal Distribution Curve PDF
            const pdf = (1 / (stats.stdDev * Math.sqrt(2 * Math.PI))) *
                Math.exp(-0.5 * Math.pow((binMid - stats.mean) / stats.stdDev, 2));

            // Scale PDF to match histogram count frequency approx
            const curveValue = pdf * data.length * binWidth;

            return {
                bin: binMid.toFixed(2),
                count,
                curve: curveValue,
                range: `${binStart.toFixed(2)} - ${binEnd.toFixed(2)}`
            };
        });

        return histogramData;
    }, [data, stats]);

    const tooltipFormatter = (value: any, name: string | number | undefined): [string | number, string] => {
        const val = typeof value === 'number' ? value : parseFloat(value);
        return [
            name === 'curve' ? (isNaN(val) ? value : val.toFixed(2)) : value,
            name === 'curve' ? 'Curva Normal' : 'Frequência'
        ];
    };

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
                Sem dados para histograma
            </Card>
        );
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <Card className="lg:col-span-3 h-[450px] p-4 bg-slate-950/50 border-white/10 backdrop-blur-md relative overflow-hidden">
                <div className="absolute top-4 left-6 z-10">
                    <h3 className="text-sm font-bold text-slate-200">Histograma de Frequência</h3>
                    <p className="text-xs text-slate-500">Distribuição vs Curva Normal</p>
                </div>
                <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={chartData} margin={{ top: 40, right: 30, left: 10, bottom: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                        <XAxis dataKey="bin" stroke="#475569" fontSize={10} tickMargin={10} />
                        <YAxis stroke="#475569" fontSize={10} />
                        <Tooltip
                            contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#f8fafc' }}
                            itemStyle={{ fontSize: '12px' }}
                            labelStyle={{ color: '#94a3b8', fontSize: '10px', marginBottom: '5px' }}
                            formatter={tooltipFormatter}
                            labelFormatter={(label) => `Centro: ${label}`}
                        />
                        <Bar dataKey="count" fill="#3b82f6" opacity={0.6} barSize={30} radius={[4, 4, 0, 0]} name="frequency" />
                        <Line type="monotone" dataKey="curve" stroke="#10b981" strokeWidth={2} dot={false} name="curve" />
                    </ComposedChart>
                </ResponsiveContainer>
            </Card>

            <div className="space-y-4">
                <Card className="p-4 bg-slate-950/50 border-white/10 backdrop-blur-md">
                    <h4 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-4">Estatísticas</h4>
                    <div className="space-y-4">
                        <div className="flex justify-between items-center border-b border-white/5 pb-2">
                            <span className="text-xs text-slate-400">Média (μ)</span>
                            <span className="text-sm font-mono font-bold text-white">{stats?.mean.toFixed(3)} <span className="text-[10px] text-slate-500">{unit}</span></span>
                        </div>
                        <div className="flex justify-between items-center border-b border-white/5 pb-2">
                            <span className="text-xs text-slate-400">Desvio Padrão (σ)</span>
                            <span className="text-sm font-mono font-bold text-white">{stats?.stdDev.toFixed(3)}</span>
                        </div>
                        <div className="flex justify-between items-center border-b border-white/5 pb-2">
                            <span className="text-xs text-slate-400">Mínimo</span>
                            <span className="text-sm font-mono font-bold text-slate-300">{stats?.min.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center border-b border-white/5 pb-2">
                            <span className="text-xs text-slate-400">Máximo</span>
                            <span className="text-sm font-mono font-bold text-slate-300">{stats?.max.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-xs text-slate-400">Assimetria</span>
                            <span className={cn(
                                "text-sm font-mono font-bold",
                                Math.abs(stats?.skewness || 0) > 0.5 ? "text-amber-500" : "text-emerald-500"
                            )}>{stats?.skewness.toFixed(3)}</span>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
}

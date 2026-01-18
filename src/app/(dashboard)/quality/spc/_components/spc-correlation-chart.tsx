"use client";

import { Card } from "@/components/ui/card";
import { ResponsiveContainer, ScatterChart, Scatter, XAxis, YAxis, ZAxis, Tooltip, CartesianGrid } from 'recharts';
import { Loader2 } from "lucide-react";

interface CorrelationPoint {
    x: number;
    y: number;
    name: string;
}

interface SPCCorrelationProps {
    data: CorrelationPoint[];
    xLabel: string;
    yLabel: string;
    correlation: number;
    loading?: boolean;
}

export function SPCCorrelationChart({ data, xLabel, yLabel, correlation, loading }: SPCCorrelationProps) {
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
                Sem dados para correlação
            </Card>
        );
    }

    const correlationText = correlation > 0.7 ? "Forte Positiva" :
        correlation > 0.3 ? "Moderada Positiva" :
            correlation > -0.3 ? "Fraca / Nula" :
                correlation > -0.7 ? "Moderada Negativa" : "Forte Negativa";

    const correlationColor = Math.abs(correlation) > 0.7 ? "text-emerald-500" :
        Math.abs(correlation) > 0.3 ? "text-blue-500" : "text-slate-500";


    return (
        <Card className="h-[450px] w-full p-4 bg-slate-950/50 border-white/10 backdrop-blur-md relative overflow-hidden">
            <div className="flex justify-between items-start absolute top-4 left-6 right-6 z-10">
                <div>
                    <h3 className="text-sm font-bold text-slate-200">Dispersão & Correlação</h3>
                    <p className="text-xs text-slate-500">{xLabel} vs. {yLabel}</p>
                </div>
                <div className="flex flex-col items-end">
                    <span className="text-[10px] uppercase font-bold text-slate-500 tracking-widest">Pearson (r)</span>
                    <span className={`text-xl font-black font-mono ${correlationColor}`}>{correlation.toFixed(3)}</span>
                    <span className={`text-[9px] font-bold uppercase ${correlationColor}`}>{correlationText}</span>
                </div>
            </div>

            <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 60, right: 30, left: 10, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis
                        type="number"
                        dataKey="x"
                        name={xLabel}
                        stroke="#475569"
                        fontSize={10}
                        tickMargin={10}
                        label={{ value: xLabel, position: 'insideBottom', offset: -10, fill: '#64748b', fontSize: 10 }}
                    />
                    <YAxis
                        type="number"
                        dataKey="y"
                        name={yLabel}
                        stroke="#475569"
                        fontSize={10}
                        label={{ value: yLabel, angle: -90, position: 'insideLeft', fill: '#64748b', fontSize: 10 }}
                    />
                    <Tooltip
                        cursor={{ strokeDasharray: '3 3' }}
                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#f8fafc' }}
                        itemStyle={{ fontSize: '12px' }}
                        formatter={(value: number) => value.toFixed(2)}
                    />
                    <Scatter name="Amostras" data={data} fill="#3b82f6" shape="circle" />
                </ScatterChart>
            </ResponsiveContainer>
        </Card>
    );
}

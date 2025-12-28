"use client";

import {
    ScatterChart as RechartsScatterChart,
    Scatter,
    XAxis,
    YAxis,
    ZAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Label
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

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

    const correlationColor = Math.abs(correlation) > 0.7 ? "text-emerald-400" :
        Math.abs(correlation) > 0.3 ? "text-blue-400" : "text-slate-400";

    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="rounded-xl border border-slate-800 bg-slate-950 p-3 shadow-xl">
                    <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                            {payload[0].payload.name}
                        </span>
                        <div className="flex items-center justify-between gap-4 mt-1">
                            <span className="text-sm text-slate-300">{xLabel}:</span>
                            <span className="text-sm font-bold text-white">{payload[0].value}</span>
                        </div>
                        <div className="flex items-center justify-between gap-4">
                            <span className="text-sm text-slate-300">{yLabel}:</span>
                            <span className="text-sm font-bold text-white">{payload[1].value}</span>
                        </div>
                    </div>
                </div>
            );
        }
        return null;
    };

    return (
        <Card className="glass border-slate-800/50">
            <CardHeader className="pb-4">
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle className="text-lg font-bold text-white uppercase tracking-tight">{title}</CardTitle>
                        {description && <CardDescription className="text-sm text-slate-400">{description}</CardDescription>}
                    </div>
                    <div className="bg-slate-900/80 border border-slate-800 rounded-xl px-4 py-2 flex flex-col items-center">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest whitespace-nowrap">Coef. de Pearson (r)</span>
                        <span className={`text-xl font-black ${correlationColor}`}>{correlation.toFixed(3)}</span>
                        <span className={`text-[10px] font-bold uppercase ${correlationColor}`}>{correlationText}</span>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <div style={{ width: "100%", height }}>
                    <ResponsiveContainer>
                        <RechartsScatterChart
                            margin={{ top: 20, right: 30, left: 10, bottom: 20 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                            <XAxis
                                type="number"
                                dataKey="x"
                                name={xLabel}
                                stroke="#475569"
                                fontSize={11}
                                tickLine={false}
                                axisLine={false}
                            >
                                <Label value={xLabel} position="bottom" offset={0} fill="#64748b" style={{ fontSize: '10px', textTransform: 'uppercase', fontWeight: 'bold' }} />
                            </XAxis>
                            <YAxis
                                type="number"
                                dataKey="y"
                                name={yLabel}
                                stroke="#475569"
                                fontSize={11}
                                tickLine={false}
                                axisLine={false}
                            >
                                <Label value={yLabel} angle={-90} position="left" offset={0} fill="#64748b" style={{ fontSize: '10px', textTransform: 'uppercase', fontWeight: 'bold' }} />
                            </YAxis>
                            <ZAxis type="number" range={[64, 64]} />
                            <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3' }} />
                            <Scatter
                                name="Relacionamento"
                                data={data}
                                fill="#3b82f6"
                                fillOpacity={0.6}
                                stroke="#1e293b"
                                strokeWidth={1}
                            />
                        </RechartsScatterChart>
                    </ResponsiveContainer>
                </div>
                <div className="mt-6 p-4 rounded-xl bg-slate-900/50 border border-slate-800">
                    <div className="flex items-center gap-3">
                        <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
                        <p className="text-xs text-slate-400">
                            A análise de correlação ajuda a identificar se mudanças em <b>{xLabel}</b> influenciam proporcionalmente em <b>{yLabel}</b>.
                            Útil para detecção de causas raiz em processos industriais.
                        </p>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

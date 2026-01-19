"use client";

import { ResponsiveContainer, ComposedChart, Line, Area, CartesianGrid, XAxis, YAxis, Tooltip, ReferenceLine, Dot } from 'recharts';
import { Card } from "@/components/ui/card";
import { format } from "date-fns";
import { Loader2 } from "lucide-react";

interface SPCTrendChartProps {
    data: any[];
    ucl: number;
    lcl: number;
    mean: number;
    usl?: number | null;
    lsl?: number | null;
    target?: number | null;
    loading?: boolean;
    unit?: string;
}

const CustomDot = (props: any) => {
    const { cx, cy, payload } = props;
    if (payload.violation) {
        return (
            <circle cx={cx} cy={cy} r={6} fill="#ef4444" stroke="#fff" strokeWidth={2} className="animate-pulse" />
        );
    }
    return <circle cx={cx} cy={cy} r={3} fill="#3b82f6" stroke="none" />;
};

export function SPCTrendChart({ data, ucl, lcl, mean, usl, lsl, target, loading, unit }: SPCTrendChartProps) {
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
                Sem dados para visualizar
            </Card>
        );
    }

    // Calculate dynamic domain to center the chart
    const allValues = data.map(d => d.value);
    const maxVal = Math.max(...allValues, ucl + (ucl * 0.1), usl || -Infinity);
    const minVal = Math.min(...allValues, lcl - (lcl * 0.1), lsl || Infinity);
    const padding = (maxVal - minVal) * 0.1;

    return (
        <Card className="h-[450px] w-full p-4 bg-slate-950/50 border-white/10 backdrop-blur-md relative overflow-hidden">
            <div className="absolute top-4 left-6 z-10">
                <h3 className="text-sm font-bold text-slate-200">Carta de Controlo (I-Chart)</h3>
                <p className="text-xs text-slate-500">Monitorização em tempo real</p>
            </div>

            <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={data} margin={{ top: 20, right: 30, left: 10, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                    <XAxis
                        dataKey="date"
                        stroke="#475569"
                        fontSize={10}
                        tickFormatter={(val) => format(new Date(val), "dd/MM")}
                        tickMargin={10}
                    />
                    <YAxis
                        stroke="#475569"
                        fontSize={10}
                        domain={[minVal - padding, maxVal + padding]}
                        tickFormatter={(val) => val.toFixed(2)}
                    />
                    <Tooltip
                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#f8fafc' }}
                        itemStyle={{ fontSize: '12px' }}
                        labelStyle={{ color: '#94a3b8', fontSize: '10px', marginBottom: '5px' }}
                        formatter={(value: any) => [`${Number(value).toFixed(3)} ${unit || ''}`, "Valor"]}
                        labelFormatter={(label) => format(new Date(label), "dd MMM yyyy, HH:mm")}
                    />

                    {/* Zones */}
                    <ReferenceLine y={ucl} stroke="#f59e0b" strokeDasharray="5 5" label={{ value: 'UCL', fill: '#f59e0b', fontSize: 10, position: 'right' }} />
                    <ReferenceLine y={lcl} stroke="#f59e0b" strokeDasharray="5 5" label={{ value: 'LCL', fill: '#f59e0b', fontSize: 10, position: 'right' }} />
                    <ReferenceLine y={mean} stroke="#22d3ee" strokeWidth={2} label={{ value: 'X̄', fill: '#22d3ee', fontSize: 12, position: 'right' }} />

                    {/* Specs */}
                    {usl && <ReferenceLine y={usl} stroke="#ef4444" strokeDasharray="3 3" label={{ value: 'USL', fill: '#ef4444', fontSize: 10, position: 'insideTopRight' }} />}
                    {lsl && <ReferenceLine y={lsl} stroke="#ef4444" strokeDasharray="3 3" label={{ value: 'LSL', fill: '#ef4444', fontSize: 10, position: 'insideBottomRight' }} />}
                    {target && <ReferenceLine y={target} stroke="#10b981" strokeDasharray="8 8" opacity={0.5} />}

                    <Line
                        type="monotone"
                        dataKey="value"
                        stroke="#3b82f6"
                        strokeWidth={2}
                        dot={<CustomDot />}
                        activeDot={{ r: 6, strokeWidth: 0 }}
                        isAnimationActive={true}
                    />
                </ComposedChart>
            </ResponsiveContainer>
        </Card>
    );
}

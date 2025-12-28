"use client";

import {
    BarChart,
    Bar,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    ComposedChart,
    Cell
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

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

export function ParetoChart({
    data,
    title,
    description,
    height = 400
}: ParetoChartProps) {

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="rounded-xl border border-slate-800 bg-slate-950 p-3 shadow-xl">
                    <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                            {label}
                        </span>
                        <div className="flex items-center justify-between gap-4 mt-1">
                            <span className="text-sm text-slate-300">Frequência:</span>
                            <span className="text-sm font-bold text-white">{payload[0].value}</span>
                        </div>
                        <div className="flex items-center justify-between gap-4">
                            <span className="text-sm text-slate-300">Acumulado:</span>
                            <span className="text-sm font-bold text-emerald-400">{payload[1].value.toFixed(1)}%</span>
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
                <CardTitle className="text-lg font-bold text-white">{title}</CardTitle>
                {description && <CardDescription className="text-sm text-slate-400">{description}</CardDescription>}
            </CardHeader>
            <CardContent>
                <div style={{ width: "100%", height }}>
                    <ResponsiveContainer>
                        <ComposedChart
                            data={data}
                            margin={{ top: 20, right: 30, left: 0, bottom: 0 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                            <XAxis
                                dataKey="name"
                                stroke="#475569"
                                fontSize={11}
                                tickLine={false}
                                axisLine={false}
                                dy={10}
                            />
                            <YAxis
                                yAxisId="left"
                                stroke="#475569"
                                fontSize={11}
                                tickLine={false}
                                axisLine={false}
                                label={{ value: 'Frequência', angle: -90, position: 'insideLeft', fill: '#475569', fontSize: 10 }}
                            />
                            <YAxis
                                yAxisId="right"
                                orientation="right"
                                stroke="#475569"
                                fontSize={11}
                                tickLine={false}
                                axisLine={false}
                                domain={[0, 100]}
                                label={{ value: 'Acumulado %', angle: 90, position: 'insideRight', fill: '#475569', fontSize: 10 }}
                            />
                            <Tooltip content={<CustomTooltip />} />

                            <Bar
                                yAxisId="left"
                                dataKey="count"
                                fill="#3b82f6"
                                radius={[4, 4, 0, 0]}
                                barSize={40}
                            >
                                {data.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.cumulativePercentage <= 80 ? '#3b82f6' : '#64748b'} fillOpacity={0.8} />
                                ))}
                            </Bar>

                            <Line
                                yAxisId="right"
                                type="monotone"
                                dataKey="cumulativePercentage"
                                stroke="#10b981"
                                strokeWidth={3}
                                dot={{ fill: '#10b981', r: 4, strokeWidth: 2, stroke: '#0f172a' }}
                                activeDot={{ r: 6 }}
                            />
                        </ComposedChart>
                    </ResponsiveContainer>
                </div>
                <div className="mt-6 p-4 rounded-xl bg-slate-900/50 border border-slate-800 flex items-center justify-between">
                    <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Princípio de Pareto (80/20)</span>
                        <p className="text-xs text-slate-400">80% dos problemas costumam provir de 20% das causas.</p>
                    </div>
                    <div className="flex gap-4">
                        <div className="flex items-center gap-2">
                            <div className="h-3 w-3 rounded-sm bg-blue-500/80" />
                            <span className="text-[10px] text-slate-300 font-bold uppercase tracking-tighter">Prioritário</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="h-3 w-3 rounded-sm bg-slate-500/80" />
                            <span className="text-[10px] text-slate-300 font-bold uppercase tracking-tighter">Secundário</span>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

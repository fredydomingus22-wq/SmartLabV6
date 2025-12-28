"use client";

import { useMemo } from "react";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    ReferenceLine,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { format } from "date-fns";

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
    yDomain?: [number | "auto", number | "auto"];
    highlightOOC?: boolean;
    violations?: any[]; // Array of { pointIndexes: number[], rule: number, description: string }
}

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
    yDomain = ["auto", "auto"],
    highlightOOC = false,
    violations = []
}: ControlChartProps) {

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="rounded-xl border border-slate-800 bg-slate-950 p-3 shadow-xl">
                    <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                            Lote / Amostra: {label}
                        </span>
                        <span className="text-sm font-bold text-white">
                            Valor: {payload[0].value} {unit}
                        </span>
                        {payload[0].payload.violation && (
                            <span className="text-[10px] text-rose-400 font-bold mt-1">
                                ⚠ Violação: Regra {payload[0].payload.rules?.join(", ")}
                            </span>
                        )}
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
                        <LineChart
                            data={data}
                            margin={{ top: 10, right: 60, left: 0, bottom: 0 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                            <XAxis
                                dataKey={xKey}
                                stroke="#475569"
                                fontSize={11}
                                tickLine={false}
                                axisLine={false}
                                dy={10}
                            />
                            <YAxis
                                stroke="#475569"
                                fontSize={11}
                                tickLine={false}
                                axisLine={false}
                                domain={yDomain}
                            />
                            <Tooltip content={<CustomTooltip />} />

                            {/* Control Limits (LSC/LIC) */}
                            {ucl !== undefined && (
                                <ReferenceLine
                                    y={ucl}
                                    stroke="#ef4444"
                                    strokeDasharray="3 3"
                                    label={{ position: 'right', value: 'LSC', fill: '#ef4444', fontSize: 10, fontWeight: 'bold' }}
                                />
                            )}
                            {lcl !== undefined && (
                                <ReferenceLine
                                    y={lcl}
                                    stroke="#ef4444"
                                    strokeDasharray="3 3"
                                    label={{ position: 'right', value: 'LIC', fill: '#ef4444', fontSize: 10, fontWeight: 'bold' }}
                                />
                            )}

                            {/* Center Line (LC) */}
                            {mean !== undefined && (
                                <ReferenceLine
                                    y={mean}
                                    stroke="#94a3b8"
                                    strokeDasharray="5 5"
                                    label={{ position: 'right', value: 'Média', fill: '#94a3b8', fontSize: 10 }}
                                />
                            )}

                            {/* Target (Alvo) */}
                            {target !== undefined && (
                                <ReferenceLine
                                    y={target}
                                    stroke="#10b981"
                                    strokeWidth={1}
                                    label={{ position: 'right', value: 'Alvo', fill: '#10b981', fontSize: 10, fontWeight: 'bold' }}
                                />
                            )}

                            {/* Engineering Limits (LSE/LIE) - USL/LSL */}
                            {usl !== undefined && (
                                <ReferenceLine
                                    y={usl}
                                    stroke="#dc2626"
                                    strokeWidth={2}
                                    label={{ position: 'left', value: 'LSE', fill: '#dc2626', fontSize: 11, fontWeight: 'black' }}
                                />
                            )}
                            {lsl !== undefined && (
                                <ReferenceLine
                                    y={lsl}
                                    stroke="#dc2626"
                                    strokeWidth={2}
                                    label={{ position: 'left', value: 'LIE', fill: '#dc2626', fontSize: 11, fontWeight: 'black' }}
                                />
                            )}

                            <Line
                                type="monotone"
                                dataKey={yKey}
                                stroke="#3b82f6"
                                strokeWidth={3}
                                dot={(props: any) => {
                                    const { cx, cy, payload } = props;
                                    const value = payload[yKey];
                                    let isOOC = payload.violation || false;

                                    if (highlightOOC && !isOOC) {
                                        if (ucl !== undefined && value > ucl) isOOC = true;
                                        if (lcl !== undefined && value < lcl) isOOC = true;
                                    }

                                    if (isOOC) {
                                        return <circle key={`dot-${props.index}`} cx={cx} cy={cy} r={6} fill="#ef4444" stroke="white" strokeWidth={2} className="animate-pulse" />;
                                    }
                                    return <circle key={`dot-${props.index}`} cx={cx} cy={cy} r={4} fill="#3b82f6" stroke="#0f172a" strokeWidth={1} />;
                                }}
                                activeDot={{ r: 8, strokeWidth: 0 }}
                                isAnimationActive={true}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
}

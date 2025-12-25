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
    ucl?: number; // Upper Control Limit
    lcl?: number; // Lower Control Limit
    mean?: number; // Mean / Average Line
    usl?: number; // Upper Specification Limit
    lsl?: number; // Lower Specification Limit
    target?: number; // Target Value
    height?: number;
    yDomain?: [number | "auto", number | "auto"];
    highlightOOC?: boolean; // Highlight Out Of Control points
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
    height = 350,
    yDomain = ["auto", "auto"],
    highlightOOC = false,
}: ControlChartProps) {

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="rounded-lg border bg-background p-2 shadow-sm">
                    <div className="grid grid-cols-2 gap-2">
                        <div className="flex flex-col">
                            <span className="text-[0.70rem] uppercase text-muted-foreground">
                                {xKey}
                            </span>
                            <span className="font-bold text-muted-foreground">
                                {label}
                            </span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[0.70rem] uppercase text-muted-foreground">
                                Value
                            </span>
                            <span className="font-bold">
                                {payload[0].value}
                            </span>
                        </div>
                    </div>
                </div>
            );
        }
        return null;
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>{title}</CardTitle>
                {description && <CardDescription>{description}</CardDescription>}
            </CardHeader>
            <CardContent>
                <div style={{ width: "100%", height }}>
                    <ResponsiveContainer>
                        <LineChart
                            data={data}
                            margin={{
                                top: 5,
                                right: 30, // Increased right margin for labels
                                left: 0,
                                bottom: 0,
                            }}
                        >
                            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                            <XAxis
                                dataKey={xKey}
                                stroke="#888888"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                            />
                            <YAxis
                                stroke="#888888"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                                domain={yDomain}
                            />
                            <Tooltip content={<CustomTooltip />} />

                            {/* Control Limits */}
                            {ucl && (
                                <ReferenceLine
                                    y={ucl}
                                    stroke="hsl(var(--destructive))"
                                    strokeDasharray="3 3"
                                    label={{ position: 'right', value: 'UCL', fill: 'hsl(var(--destructive))', fontSize: 10 }}
                                />
                            )}
                            {lcl && (
                                <ReferenceLine
                                    y={lcl}
                                    stroke="hsl(var(--destructive))"
                                    strokeDasharray="3 3"
                                    label={{ position: 'right', value: 'LCL', fill: 'hsl(var(--destructive))', fontSize: 10 }}
                                />
                            )}

                            {/* Mean / Target */}
                            {mean && (
                                <ReferenceLine
                                    y={mean}
                                    stroke="#22c55e"
                                    strokeDasharray="5 5"
                                    label={{ position: 'right', value: 'Mean', fill: '#22c55e', fontSize: 10 }}
                                />
                            )}
                            {target && (
                                <ReferenceLine
                                    y={target}
                                    stroke="hsl(var(--primary))"
                                    label={{ position: 'right', value: 'Target', fill: 'hsl(var(--primary))', fontSize: 10 }}
                                />
                            )}

                            {/* Specification Limits */}
                            {usl && (
                                <ReferenceLine
                                    y={usl}
                                    stroke="#f97316"
                                    label={{ position: 'insideTopRight', value: 'USL', fill: '#f97316', fontSize: 10 }}
                                />
                            )}
                            {lsl && (
                                <ReferenceLine
                                    y={lsl}
                                    stroke="#f97316"
                                    label={{ position: 'insideBottomRight', value: 'LSL', fill: '#f97316', fontSize: 10 }}
                                />
                            )}

                            <Line
                                type="monotone"
                                dataKey={yKey}
                                stroke="hsl(var(--primary))"
                                strokeWidth={2}
                                dot={(props: any) => {
                                    const { cx, cy, payload } = props;
                                    const value = payload[yKey];
                                    let isOOC = false;

                                    if (highlightOOC) {
                                        if (ucl !== undefined && value > ucl) isOOC = true;
                                        if (lcl !== undefined && value < lcl) isOOC = true;
                                    }

                                    if (isOOC) {
                                        return (
                                            <circle
                                                key={`dot-${props.index}`}
                                                cx={cx}
                                                cy={cy}
                                                r={5}
                                                fill="hsl(var(--destructive))"
                                                stroke="white"
                                                strokeWidth={2}
                                            />
                                        );
                                    }
                                    return (
                                        <circle
                                            key={`dot-${props.index}`}
                                            cx={cx}
                                            cy={cy}
                                            r={4}
                                            fill="hsl(var(--primary))"
                                        />
                                    );
                                }}
                                activeDot={{ r: 6 }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
}

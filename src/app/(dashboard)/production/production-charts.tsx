"use client";

import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"];

interface ProductionChartsProps {
    batches: any[];
    volumeData: { name: string; batches: number }[];
}

export function ProductionCharts({ batches, volumeData }: ProductionChartsProps) {
    // Aggregate Data for Sample Charts

    // 1. Status Distribution
    const statusCounts: Record<string, number> = {};
    batches.forEach((b) => {
        statusCounts[b.status] = (statusCounts[b.status] || 0) + 1;
    });
    const pieData = Object.keys(statusCounts).map((key) => ({
        name: key,
        value: statusCounts[key],
    }));

    if (batches.length === 0) {
        return (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <div className="col-span-full p-6 text-center text-muted-foreground glass rounded-xl border-dashed">
                    No data available for analytics
                </div>
            </div>
        )
    }

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-4 glass border-none shadow-none">
                <CardHeader>
                    <CardTitle>Production Volume (Week)</CardTitle>
                </CardHeader>
                <CardContent className="pl-2">
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={volumeData}>
                            <XAxis
                                dataKey="name"
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
                                tickFormatter={(value) => `${value}`}
                            />
                            <Tooltip
                                cursor={{ fill: 'rgba(255,255,255,0.1)' }}
                                contentStyle={{ borderRadius: '8px', border: 'none', background: 'rgba(255, 255, 255, 0.8)', backdropFilter: 'blur(4px)' }}
                            />
                            <Bar dataKey="batches" fill="currentColor" radius={[4, 4, 0, 0]} className="fill-primary" />
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
            <Card className="col-span-3 glass border-none shadow-none">
                <CardHeader>
                    <CardTitle>Batch Status</CardTitle>
                </CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie
                                data={pieData}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {pieData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip />
                        </PieChart>
                    </ResponsiveContainer>
                    <div className="flex justify-center gap-4 text-xs text-muted-foreground mt-4">
                        {pieData.map((entry, index) => (
                            <div key={index} className="flex items-center gap-1">
                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                                {entry.name} ({entry.value})
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

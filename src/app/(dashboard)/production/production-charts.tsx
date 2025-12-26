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
}

export function ProductionCharts({ batches }: ProductionChartsProps) {
    if (batches.length === 0) {
        return (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <div className="col-span-full p-6 text-center text-muted-foreground glass rounded-xl border-dashed">
                    Sem dados suficientes para análise estatística.
                </div>
            </div>
        )
    }

    // 1. Throughput (Released per Day - last 7 days)
    const today = new Date();
    const last7Days = Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(today.getDate() - (6 - i));
        return d.toISOString().split('T')[0];
    });

    const throughputData = last7Days.map(date => {
        const count = batches.filter(b =>
            (b.status === 'released' || b.status === 'closed') &&
            b.end_date && b.end_date.split('T')[0] === date
        ).length;
        return { name: date.split('-').slice(1).join('/'), batches: count };
    });

    // 2. Quality Health (Released vs Blocked/Rejected)
    const qualityStats = {
        released: batches.filter(b => b.status === 'released' || b.status === 'closed').length,
        deviations: batches.filter(b => b.status === 'blocked' || b.status === 'rejected').length,
        inProgress: batches.filter(b => b.status === 'in_progress' || b.status === 'open' || b.status === 'completed').length
    };

    const pieData = [
        { name: 'Conformes', value: qualityStats.released, color: '#10b981' },
        { name: 'Desvios', value: qualityStats.deviations, color: '#f43f5e' },
        { name: 'Processamento', value: qualityStats.inProgress, color: '#f59e0b' }
    ].filter(d => d.value > 0);

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-4 glass border-none shadow-none">
                <CardHeader className="pb-2">
                    <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                        <div className="w-1.5 h-4 bg-primary rounded-full" />
                        Throughput Industrial (Lotes/Dia)
                    </CardTitle>
                </CardHeader>
                <CardContent className="pl-2 pt-4">
                    <ResponsiveContainer width="100%" height={260}>
                        <BarChart data={throughputData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                            <XAxis
                                dataKey="name"
                                stroke="#888888"
                                fontSize={10}
                                tickLine={false}
                                axisLine={false}
                                fontWeight="500"
                            />
                            <YAxis
                                stroke="#888888"
                                fontSize={10}
                                tickLine={false}
                                axisLine={false}
                                tickFormatter={(value) => `${value}`}
                                fontWeight="500"
                            />
                            <Tooltip
                                cursor={{ fill: 'rgba(0,0,0,0.02)' }}
                                contentStyle={{ borderRadius: '12px', border: 'none', background: 'white', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                            />
                            <Bar dataKey="batches" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={32} />
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            <Card className="col-span-3 glass border-none shadow-none">
                <CardHeader className="pb-0">
                    <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                        <div className="w-1.5 h-4 bg-emerald-500 rounded-full" />
                        Health Check de Qualidade
                    </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                    <ResponsiveContainer width="100%" height={260}>
                        <PieChart>
                            <Pie
                                data={pieData}
                                cx="50%"
                                cy="50%"
                                innerRadius={70}
                                outerRadius={85}
                                paddingAngle={8}
                                dataKey="value"
                                stroke="none"
                            >
                                {pieData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Pie>
                            <Tooltip
                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                    <div className="grid grid-cols-3 gap-2 px-2 -mt-4">
                        {pieData.map((entry, index) => (
                            <div key={index} className="flex flex-col items-center p-2 rounded-xl bg-muted/20">
                                <span className="text-[8px] font-bold uppercase text-muted-foreground mb-0.5">{entry.name}</span>
                                <span className="text-sm font-bold" style={{ color: entry.color }}>{entry.value}</span>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

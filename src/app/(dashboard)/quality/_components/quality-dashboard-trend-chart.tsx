"use client";

import {
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Area,
    AreaChart,
} from "recharts";
import { format } from "date-fns";

interface QualityDashboardTrendChartProps {
    data: any[];
}

export function QualityDashboardTrendChart({ data }: QualityDashboardTrendChartProps) {
    if (!data || data.length === 0) {
        return (
            <div className="h-full flex items-center justify-center text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] italic py-10">
                Sem dados de tendência disponíveis
            </div>
        );
    }

    // Process data to ensure correct format for Recharts
    const chartData = data.map(item => ({
        date: format(new Date(item.date), "dd/MM"),
        count: item.count || 0,
        critical: item.critical || 0
    }));

    return (
        <div className="h-[260px] w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                        <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="colorCritical" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#ef4444" stopOpacity={0.5} />
                            <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" opacity={0.5} />
                    <XAxis
                        dataKey="date"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#64748b', fontSize: 9, fontWeight: 700 }}
                        dy={10}
                    />
                    <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#64748b', fontSize: 9, fontWeight: 700 }}
                        dx={-10}
                    />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: '#0f172a',
                            border: '1px solid #1e293b',
                            borderRadius: '12px',
                            color: '#f8fafc',
                            fontSize: '11px',
                            fontWeight: 700
                        }}
                        itemStyle={{ fontWeight: 900 }}
                        cursor={{ stroke: '#f43f5e', strokeWidth: 1, strokeDasharray: '3 3' }}
                    />
                    <Area
                        type="monotone"
                        dataKey="count"
                        name="Total NCs"
                        stroke="#f43f5e"
                        strokeWidth={3}
                        fillOpacity={1}
                        fill="url(#colorCount)"
                        animationDuration={1500}
                    />
                    <Area
                        type="monotone"
                        dataKey="critical"
                        name="Críticas"
                        stroke="#ef4444"
                        strokeWidth={2}
                        strokeDasharray="5 5"
                        fillOpacity={1}
                        fill="url(#colorCritical)"
                        animationDuration={1500}
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
}

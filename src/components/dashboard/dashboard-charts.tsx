"use client";

import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    AreaChart,
    Area
} from "recharts";

interface ChartData {
    name: string;
    samples: number;
    quality: number;
}

interface DashboardChartsProps {
    data: ChartData[];
}

export function DashboardCharts({ data }: DashboardChartsProps) {
    return (
        <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
                <defs>
                    <linearGradient id="colorSamples" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip
                    contentStyle={{ backgroundColor: '#020617', border: '1px solid #1e293b', borderRadius: '8px' }}
                    itemStyle={{ fontSize: '12px' }}
                />
                <Area type="monotone" dataKey="samples" stroke="#3b82f6" fillOpacity={1} fill="url(#colorSamples)" strokeWidth={2} />
                <Line type="monotone" dataKey="quality" stroke="#10b981" strokeWidth={2} dot={{ r: 4, fill: '#10b981' }} />
            </AreaChart>
        </ResponsiveContainer>
    );
}

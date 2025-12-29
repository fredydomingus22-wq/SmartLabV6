"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    Activity,
    Database,
    Server,
    Clock,
    Zap,
    ShieldCheck,
    BarChart3,
    ArrowUpRight,
    Search,
    Monitor
} from "lucide-react";
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    BarChart,
    Bar,
    Cell
} from 'recharts';

interface HealthClientProps {
    data: {
        volumes: { table: string, count: number }[];
        throughput: number;
        latency: number;
        databaseState: string;
        uptime: string;
        lastBackup: string;
    }
}

export function HealthClient({ data }: HealthClientProps) {
    // Generate some mock historical data for the chart
    const historyData = Array.from({ length: 24 }).map((_, i) => ({
        time: `${i}:00`,
        load: Math.floor(Math.random() * 40) + 20,
        latency: Math.floor(Math.random() * 15) + 5
    }));

    const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f59e0b', '#10b981', '#06b6d4'];

    return (
        <div className="space-y-8">
            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: "Cluster Status", value: "Operational", sub: "Global Edge Nodes", icon: ShieldCheck, color: "text-emerald-400", bg: "bg-emerald-500/10" },
                    { label: "Database Latency", value: `${data.latency}ms`, sub: "Avg Query Response", icon: Zap, color: "text-amber-400", bg: "bg-amber-500/10" },
                    { label: "Avg Throughput", value: `${data.throughput.toFixed(2)}`, sub: "Ops Per Minute", icon: Activity, color: "text-blue-400", bg: "bg-blue-500/10" },
                    { label: "System Uptime", value: data.uptime, sub: "Last 30 Days", icon: Server, color: "text-indigo-400", bg: "bg-indigo-500/10" }
                ].map((stat, i) => (
                    <Card key={i} className="bg-slate-950/40 border-slate-800 shadow-lg hover:border-slate-700 transition-all">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div className={`p-2.5 rounded-xl ${stat.bg} ${stat.color}`}>
                                    <stat.icon className="h-5 w-5" />
                                </div>
                                <ArrowUpRight className="h-4 w-4 text-slate-600" />
                            </div>
                            <div className="mt-4 space-y-1">
                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{stat.label}</p>
                                <h3 className="text-2xl font-black text-white">{stat.value}</h3>
                                <p className="text-[10px] text-slate-400">{stat.sub}</p>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Latency & Load Chart */}
                <Card className="lg:col-span-2 bg-slate-950/40 border-slate-800 shadow-xl overflow-hidden">
                    <CardHeader className="border-b border-slate-800 bg-slate-900/20">
                        <div className="flex items-center justify-between">
                            <div className="space-y-1">
                                <CardTitle className="text-sm font-bold flex items-center gap-2">
                                    <BarChart3 className="h-4 w-4 text-blue-400" />
                                    Desempenho da Infraestrutura
                                </CardTitle>
                                <CardDescription className="text-[10px]">Padrão de carga e latência nas últimas 24 horas.</CardDescription>
                            </div>
                            <Badge variant="outline" className="text-[9px] font-mono bg-slate-900">LIVE TELEMETRY</Badge>
                        </div>
                    </CardHeader>
                    <CardContent className="p-6">
                        <div className="h-[280px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={historyData}>
                                    <defs>
                                        <linearGradient id="colorLoad" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                                    <XAxis
                                        dataKey="time"
                                        stroke="#475569"
                                        fontSize={10}
                                        tickLine={false}
                                        axisLine={false}
                                        interval={3}
                                    />
                                    <YAxis
                                        stroke="#475569"
                                        fontSize={10}
                                        tickLine={false}
                                        axisLine={false}
                                    />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px', fontSize: '10px' }}
                                        itemStyle={{ color: '#fff' }}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="load"
                                        stroke="#3b82f6"
                                        fillOpacity={1}
                                        fill="url(#colorLoad)"
                                        strokeWidth={2}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* Data Distribution */}
                <Card className="bg-slate-950/40 border-slate-800 shadow-xl overflow-hidden">
                    <CardHeader className="border-b border-slate-800 bg-slate-900/20">
                        <CardTitle className="text-sm font-bold flex items-center gap-2">
                            <Database className="h-4 w-4 text-purple-400" />
                            Distribuição de Dados
                        </CardTitle>
                        <CardDescription className="text-[10px]">Volume total por entidade relacional.</CardDescription>
                    </CardHeader>
                    <CardContent className="p-6">
                        <div className="h-[280px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={data.volumes} layout="vertical">
                                    <XAxis type="number" hide />
                                    <YAxis
                                        dataKey="table"
                                        type="category"
                                        stroke="#475569"
                                        fontSize={9}
                                        width={80}
                                        tickLine={false}
                                        axisLine={false}
                                    />
                                    <Tooltip
                                        cursor={{ fill: 'transparent' }}
                                        contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px', fontSize: '10px' }}
                                    />
                                    <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={12}>
                                        {data.volumes.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Technical Metadata */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <Card className="bg-slate-900/20 border-slate-800 border-dashed lg:col-span-2">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <Search className="h-5 w-5 text-slate-500" />
                                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-widest">Metadata de Infraestrutura</h4>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                                <span className="text-[9px] font-mono text-emerald-500">OPTIMIZED</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
                            {[
                                { label: "Engine", value: "PostgreSQL 15.x", icon: Database },
                                { label: "Next.js Build", value: "v15.0-Turbo", icon: Zap },
                                { label: "Backup State", value: "Healthy", icon: BarChart3 },
                                { label: "Last Scan", value: "2m ago", icon: Clock }
                            ].map((item, i) => (
                                <div key={i} className="space-y-1">
                                    <p className="text-[8px] font-bold text-slate-600 uppercase tracking-tighter">{item.label}</p>
                                    <div className="flex items-center gap-2">
                                        <item.icon className="h-3 w-3 text-slate-500" />
                                        <p className="text-xs font-mono text-slate-300">{item.value}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-blue-600/5 border-blue-500/20">
                    <CardContent className="p-6">
                        <div className="flex flex-col items-center text-center gap-4">
                            <Monitor className="h-10 w-10 text-blue-500/50" />
                            <div className="space-y-2">
                                <h4 className="text-xs font-bold text-blue-200 uppercase tracking-widest">Nodos de Disponibilidade</h4>
                                <p className="text-[10px] text-blue-400/70 leading-relaxed">
                                    O cluster global está a operar com redundância total. Todas as regiões reportam latências sub-100ms.
                                </p>
                            </div>
                            <Badge className="bg-blue-500/20 text-blue-300 text-[9px] border-blue-500/30">
                                4 Active Regions
                            </Badge>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

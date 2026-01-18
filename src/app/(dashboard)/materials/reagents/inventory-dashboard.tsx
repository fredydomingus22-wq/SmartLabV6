"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    Archive,
    FlaskConical,
    AlertCircle,
    BarChart3,
    TrendingDown,
    CheckCircle
} from "lucide-react";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from "recharts";
import { KPISparkCard } from "@/components/ui/kpi-spark-card";

interface InventoryDashboardProps {
    totalReagents: number;
    lowStockCount: number;
    activeReagents: number;
    mostUsed: { name: string; quantity: number }[];
    lowStockItems: { name: string; current: number; min: number; unit: string }[];
    expiringBatches: { reagent: string; batch: string; expiry: string }[];
    stockInTrend: any[];
    stockOutTrend: any[];
    totalTrend: any[];
}

export function InventoryDashboard({
    totalReagents,
    lowStockCount,
    activeReagents,
    mostUsed,
    lowStockItems,
    expiringBatches,
    stockInTrend = [],
    stockOutTrend = [],
    totalTrend = []
}: InventoryDashboardProps) {
    return (
        <div className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <KPISparkCard
                    variant="blue"
                    title="Total de Reagentes"
                    value={String(totalReagents).padStart(3, '0')}
                    description="Químicos registados"
                    icon={<Archive className="h-4 w-4 stroke-[1.5px]" />}
                    sparklineData={totalTrend}
                />

                <KPISparkCard
                    variant="emerald"
                    title="Stock Ativo"
                    value={String(activeReagents).padStart(3, '0')}
                    description="Itens disponíveis"
                    icon={<FlaskConical className="h-4 w-4 stroke-[1.5px]" />}
                    sparklineData={stockInTrend}
                />

                <KPISparkCard
                    variant={lowStockCount > 0 ? "rose" : "slate"}
                    title="Alertas de Stock"
                    value={String(lowStockCount).padStart(3, '0')}
                    description="Abaixo do nível mínimo"
                    icon={<AlertCircle className="h-4 w-4 stroke-[1.5px]" />}
                    sparklineData={stockOutTrend}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-7 gap-6">
                {/* Usage Chart */}
                <Card className="lg:col-span-4 bg-slate-900/40 border-slate-800 shadow-xl rounded-2xl overflow-hidden group">
                    <CardHeader className="border-b border-slate-800/50 bg-slate-900/20">
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="text-sm font-black uppercase tracking-widest text-white italic">Consumo por Reagente</CardTitle>
                                <CardDescription className="text-[10px] text-slate-500 font-bold uppercase tracking-tight mt-1">Volume de utilização por entidade química</CardDescription>
                            </div>
                            <BarChart3 className="h-4 w-4 text-blue-500 stroke-[1.5px]" />
                        </div>
                    </CardHeader>
                    <CardContent className="p-6">
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={mostUsed}>
                                    <CartesianGrid strokeDasharray="3 3" opacity={0.05} vertical={false} stroke="#64748b" />
                                    <XAxis
                                        dataKey="name"
                                        stroke="#475569"
                                        fontSize={9}
                                        tickLine={false}
                                        axisLine={false}
                                        tick={{ fill: '#64748b', fontWeight: 700 }}
                                    />
                                    <YAxis
                                        stroke="#475569"
                                        fontSize={9}
                                        tickLine={false}
                                        axisLine={false}
                                        tickFormatter={(value) => `${value}`}
                                        tick={{ fill: '#64748b', fontWeight: 700 }}
                                    />
                                    <Tooltip
                                        contentStyle={{
                                            background: 'rgba(15, 23, 42, 0.9)',
                                            border: '1px solid rgba(51, 65, 85, 0.5)',
                                            borderRadius: '12px',
                                            boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)',
                                            fontSize: '10px',
                                            fontWeight: 'bold',
                                            color: '#fff'
                                        }}
                                        cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                                    />
                                    <Bar
                                        dataKey="quantity"
                                        fill="url(#blueGradient)"
                                        radius={[6, 6, 0, 0]}
                                        barSize={32}
                                    />
                                    <defs>
                                        <linearGradient id="blueGradient" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.8} />
                                            <stop offset="100%" stopColor="#1d4ed8" stopOpacity={0.3} />
                                        </linearGradient>
                                    </defs>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* Status Column */}
                <div className="lg:col-span-3 space-y-6">
                    {/* Low Stock List */}
                    <Card className="bg-slate-900/40 border-slate-800 shadow-xl rounded-2xl overflow-hidden">
                        <CardHeader className="border-b border-slate-800/50 bg-slate-900/20">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-sm font-black uppercase tracking-widest text-white italic">Níveis Críticos</CardTitle>
                                <TrendingDown className="h-4 w-4 text-rose-500 stroke-[1.5px]" />
                            </div>
                        </CardHeader>
                        <CardContent className="p-4">
                            <div className="space-y-3">
                                {lowStockItems.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-10 text-center opacity-30">
                                        <CheckCircle className="h-8 w-8 mb-3 text-emerald-500" />
                                        <p className="text-[10px] font-black uppercase tracking-widest italic">Stock em conformidade</p>
                                    </div>
                                ) : (
                                    lowStockItems.map((item, i) => (
                                        <div key={i} className="group p-3 rounded-xl bg-slate-950/40 border border-rose-500/10 hover:border-rose-500/30 transition-all">
                                            <div className="flex justify-between items-start">
                                                <span className="text-xs font-black text-white italic tracking-tight uppercase">{item.name}</span>
                                                <Badge variant="outline" className="bg-rose-500/10 text-rose-500 border-none text-[8px] font-black uppercase">Crítico</Badge>
                                            </div>
                                            <div className="mt-2 flex items-center justify-between text-[10px]">
                                                <span className="text-slate-500 font-bold uppercase tracking-widest italic">Stock Atual</span>
                                                <span className="text-rose-400 font-black">{item.current} <span className="text-slate-600">/ {item.min} {item.unit}</span></span>
                                            </div>
                                            <div className="mt-2 w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-rose-500 transition-all duration-1000"
                                                    style={{ width: `${Math.min((item.current / item.min) * 100, 100)}%` }}
                                                />
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Expiring Soon List */}
                    <Card className="bg-slate-900/40 border-slate-800 shadow-xl rounded-2xl overflow-hidden">
                        <CardHeader className="border-b border-slate-800/50 bg-slate-900/20">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-sm font-black uppercase tracking-widest text-white italic">Próximas Validades</CardTitle>
                                <AlertCircle className="h-4 w-4 text-amber-500 stroke-[1.5px]" />
                            </div>
                        </CardHeader>
                        <CardContent className="p-4">
                            <div className="space-y-3">
                                {expiringBatches.length === 0 ? (
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-600 text-center py-8 italic opacity-30">Sem validades críticas</p>
                                ) : (
                                    expiringBatches.map((item, i) => (
                                        <div key={i} className="flex items-center justify-between p-3 border rounded-xl bg-slate-950/40 border-amber-500/10 hover:border-amber-500/30 transition-all">
                                            <div className="flex flex-col">
                                                <span className="text-[11px] font-black text-white italic tracking-tight uppercase leading-none">{item.reagent}</span>
                                                <span className="text-[9px] text-slate-500 font-mono mt-1">{item.batch}</span>
                                            </div>
                                            <div className="text-right">
                                                <span className="text-[9px] font-black text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/10 shadow-inner tracking-widest">
                                                    {new Date(item.expiry).toLocaleDateString('pt-PT')}
                                                </span>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}

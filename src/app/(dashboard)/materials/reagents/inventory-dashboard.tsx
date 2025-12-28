"use client";

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Archive, BarChart3, FlaskConical, TrendingDown, LayoutDashboard } from "lucide-react";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from "recharts";

interface InventoryDashboardProps {
    totalReagents: number;
    lowStockCount: number;
    activeReagents: number;
    mostUsed: { name: string; quantity: number }[];
    lowStockItems: { name: string; current: number; min: number; unit: string }[];
    expiringBatches: { reagent: string; batch: string; expiry: string }[];
}

export function InventoryDashboard({
    totalReagents,
    lowStockCount,
    activeReagents,
    mostUsed,
    lowStockItems,
    expiringBatches,
}: InventoryDashboardProps) {
    return (
        <div className="space-y-4 mb-8">
            <div className="flex items-center gap-2 mb-4">
                <LayoutDashboard className="h-5 w-5 text-custom-teal-500" />
                <h2 className="text-xl font-semibold tracking-tight text-slate-100">Análise de Stock</h2>
            </div>

            {/* KPI Cards */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card className="bg-slate-900/40 border-slate-800">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Total de Reagentes
                        </CardTitle>
                        <Archive className="h-4 w-4 text-slate-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-slate-100">{totalReagents}</div>
                        <p className="text-xs text-slate-400">
                            Químicos registados
                        </p>
                    </CardContent>
                </Card>

                <Card className="bg-slate-900/40 border-slate-800">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Stock Ativo
                        </CardTitle>
                        <FlaskConical className="h-4 w-4 text-slate-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-slate-100">{activeReagents}</div>
                        <p className="text-xs text-slate-400">
                            Com quantidade {'>'} 0
                        </p>
                    </CardContent>
                </Card>

                <Card className="bg-slate-900/40 border-slate-800">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Alertas de Stock Baixo
                        </CardTitle>
                        <AlertCircle className={`h-4 w-4 ${lowStockCount > 0 ? "text-red-400" : "text-slate-400"}`} />
                    </CardHeader>
                    <CardContent>
                        <div className={`text-2xl font-bold ${lowStockCount > 0 ? "text-red-400" : "text-slate-100"}`}>{lowStockCount}</div>
                        <p className="text-xs text-slate-400">
                            Abaixo do nível mínimo
                        </p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                {/* Usage Chart */}
                <Card className="col-span-4 bg-slate-900/40 border-slate-800">
                    <CardHeader>
                        <CardTitle className="text-slate-100">Top Reagentes Consumidos</CardTitle>
                        <CardDescription className="text-slate-400">
                            Químicos mais utilizados por quantidade
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="pl-2">
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={mostUsed}>
                                <CartesianGrid strokeDasharray="3 3" opacity={0.1} vertical={false} />
                                <XAxis
                                    dataKey="name"
                                    stroke="#64748b"
                                    fontSize={12}
                                    tickLine={false}
                                    axisLine={false}
                                />
                                <YAxis
                                    stroke="#64748b"
                                    fontSize={12}
                                    tickLine={false}
                                    axisLine={false}
                                    tickFormatter={(value) => `${value}`}
                                />
                                <Tooltip
                                    contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px' }}
                                    cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                                />
                                <Bar dataKey="quantity" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Low Stock List */}
                <Card className="col-span-3 bg-slate-900/40 border-slate-800 text-slate-100">
                    <CardHeader>
                        <CardTitle>Níveis de Stock Crítico</CardTitle>
                        <CardDescription className="text-slate-400">
                            Itens que necessitam de reposição imediata
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {lowStockItems.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-8 text-center text-slate-400">
                                    <TrendingDown className="h-8 w-8 mb-2 opacity-50" />
                                    <p>Níveis de stock estão saudáveis</p>
                                </div>
                            ) : (
                                lowStockItems.map((item, i) => (
                                    <Alert key={i} variant="destructive" className="bg-red-500/10 border-red-500/20 text-red-400">
                                        <AlertCircle className="h-4 w-4" />
                                        <AlertTitle className="text-sm font-semibold">{item.name}</AlertTitle>
                                        <AlertDescription className="flex justify-between items-center text-xs opacity-90">
                                            <span>Atual: {item.current} {item.unit}</span>
                                            <span className="font-medium">Mín: {item.min}</span>
                                        </AlertDescription>
                                    </Alert>
                                ))
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Expiring Soon List */}
                <Card className="col-span-4 lg:col-span-7 mt-4 bg-slate-900/40 border-slate-800 text-slate-100">
                    <CardHeader>
                        <CardTitle className="text-amber-400 flex items-center gap-2">
                            <AlertCircle className="h-5 w-5" />
                            A Expirar Brevemente (Próximos 30 Dias)
                        </CardTitle>
                        <CardDescription className="text-slate-400">
                            Lotes próximos da data de validade
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {expiringBatches.length === 0 ? (
                                <p className="text-slate-400 text-sm col-span-full text-center py-4">Sem itens a expirar brevemente.</p>
                            ) : (
                                expiringBatches.map((item, i) => (
                                    <div key={i} className="flex items-center justify-between p-3 border rounded-lg bg-amber-500/5 border-amber-500/10">
                                        <div>
                                            <p className="font-medium text-sm text-slate-200">{item.reagent}</p>
                                            <p className="text-xs text-slate-500">{item.batch}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs font-bold text-amber-500">
                                                {new Date(item.expiry).toLocaleDateString('pt-PT')}
                                            </p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

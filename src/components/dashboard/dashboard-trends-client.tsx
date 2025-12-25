"use client";

import { useState, useMemo } from "react";
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    ReferenceLine,
} from "recharts";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Filter } from "lucide-react";

interface DashboardTrendsClientProps {
    products: any[];
    parameters: any[];
    initialData: any[];
    initialSpecs: {
        min_value: number | null;
        max_value: number | null;
        target_value: number | null;
    } | null;
}

import { getTrendDataAction } from "@/app/(dashboard)/dashboard/actions";

export function DashboardTrendsClient({ products, parameters, initialData, initialSpecs }: DashboardTrendsClientProps) {
    const [selectedProduct, setSelectedProduct] = useState(products[0]?.id || "");
    const [selectedParameter, setSelectedParameter] = useState(parameters[0]?.id || "");

    // Local state to handle updates
    const [data, setData] = useState(initialData);
    const [specs, setSpecs] = useState(initialSpecs);
    const [loading, setLoading] = useState(false);

    // Fetch new data when filters change
    // Using a simple effect that skips the very first render if needed, 
    // but here we simply compare with initial props or just fetch.
    // To avoid double fetch on mount (since initialData is already there), user interaction triggers change.

    const handleFilterChange = async (prodId: string, paramId: string) => {
        if (!prodId || !paramId) return;

        setLoading(true);
        try {
            const result = await getTrendDataAction(prodId, paramId);
            setData(result.data);
            setSpecs(result.specs);
        } catch (error) {
            console.error("Failed to fetch trend data", error);
        } finally {
            setLoading(false);
        }
    };

    const chartData = useMemo(() => {
        return data.map(d => ({
            name: d.batchCode || d.sampleCode,
            value: d.value,
            sampleCode: d.sampleCode,
            batchCode: d.batchCode
        })).reverse();
    }, [data]);

    const LSL = specs?.min_value;
    const USL = specs?.max_value;

    return (
        <Card className="glass border-slate-800/50 overflow-hidden">
            <CardHeader className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/50 bg-slate-900/20 px-4 py-4 md:px-8 md:py-6">
                <div>
                    <CardTitle className="text-xl font-extrabold text-slate-100 flex items-center gap-2 tracking-tight">
                        <TrendingUp className="h-5 w-5 text-emerald-400" />
                        Tendências de Qualidade
                    </CardTitle>
                    <CardDescription className="text-slate-400 font-medium italic mt-0.5">
                        Performance real vs. Limites de Especificação.
                    </CardDescription>
                </div>
                <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0 scrollbar-none">
                    <Select
                        value={selectedProduct}
                        onValueChange={(val) => {
                            setSelectedProduct(val);
                            handleFilterChange(val, selectedParameter);
                        }}
                    >
                        <SelectTrigger className="w-[140px] h-8 md:h-9 text-[10px] md:text-xs bg-slate-950/50 border-slate-800 text-slate-300">
                            <SelectValue placeholder="Produto" />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-950 border-slate-800">
                            {products.map(p => (
                                <SelectItem key={p.id} value={p.id} className="text-xs">{p.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Select
                        value={selectedParameter}
                        onValueChange={(val) => {
                            setSelectedParameter(val);
                            handleFilterChange(selectedProduct, val);
                        }}
                    >
                        <SelectTrigger className="w-[130px] h-8 md:h-9 text-[10px] md:text-xs bg-slate-950/50 border-slate-800 text-slate-300">
                            <SelectValue placeholder="Parâmetro" />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-950 border-slate-800">
                            {parameters.map(p => (
                                <SelectItem key={p.id} value={p.id} className="text-xs">{p.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </CardHeader>
            <CardContent className="p-4 md:p-8">
                <div className={`h-[250px] md:h-[350px] w-full transition-opacity duration-300 ${loading ? 'opacity-50' : 'opacity-100'}`}>
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} opacity={0.5} />
                            <XAxis
                                dataKey="name"
                                stroke="#475569"
                                fontSize={10}
                                tickLine={false}
                                axisLine={false}
                                tick={{ fill: '#64748b', fontWeight: 600 }}
                            />
                            <YAxis
                                stroke="#475569"
                                fontSize={10}
                                tickLine={false}
                                axisLine={false}
                                tick={{ fill: '#64748b', fontWeight: 600 }}
                                domain={['auto', 'auto']}
                            />
                            <Tooltip
                                content={({ active, payload, label }) => {
                                    if (active && payload && payload.length) {
                                        const d = payload[0].payload;
                                        return (
                                            <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl shadow-2xl space-y-2 min-w-[160px]">
                                                <div className="flex justify-between items-center border-b border-slate-800 pb-2 mb-2">
                                                    <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Amostra</span>
                                                    <Badge variant="outline" className="text-[10px] font-mono">{d.sampleCode}</Badge>
                                                </div>
                                                <div className="space-y-1">
                                                    <div className="flex justify-between items-center text-xs">
                                                        <span className="text-slate-400">Valor:</span>
                                                        <span className="font-bold text-emerald-400">{d.value}</span>
                                                    </div>
                                                    {d.batchCode && (
                                                        <div className="flex justify-between items-center text-[10px]">
                                                            <span className="text-slate-500">Lote:</span>
                                                            <span className="text-slate-300 font-medium">{d.batchCode}</span>
                                                        </div>
                                                    )}
                                                    {USL != null && d.value > USL && (
                                                        <div className="text-[10px] text-red-400 flex items-center gap-1 font-bold pt-1">
                                                            ⚠ Fora de Limite (Alto)
                                                        </div>
                                                    )}
                                                    {LSL != null && d.value < LSL && (
                                                        <div className="text-[10px] text-red-400 flex items-center gap-1 font-bold pt-1">
                                                            ⚠ Fora de Limite (Baixo)
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    }
                                    return null;
                                }}
                            />

                            {USL != null && (
                                <ReferenceLine
                                    y={USL}
                                    stroke="#ef4444"
                                    strokeDasharray="4 4"
                                    label={{ value: 'USL', position: 'right', fill: '#ef4444', fontSize: 10, fontWeight: 'bold' }}
                                />
                            )}
                            {LSL != null && (
                                <ReferenceLine
                                    y={LSL}
                                    stroke="#ef4444"
                                    strokeDasharray="4 4"
                                    label={{ value: 'LSL', position: 'right', fill: '#ef4444', fontSize: 10, fontWeight: 'bold' }}
                                />
                            )}

                            <Area
                                type="monotone"
                                dataKey="value"
                                stroke="#10b981"
                                fillOpacity={1}
                                fill="url(#colorValue)"
                                strokeWidth={3}
                                animationDuration={1500}
                                dot={{ r: 4, fill: '#10b981', strokeWidth: 2, stroke: '#020617' }}
                                activeDot={{ r: 6, fill: '#10b981', strokeWidth: 2, stroke: '#fff' }}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>

                <div className="mt-4 md:mt-8 flex flex-wrap items-center justify-center gap-3 md:gap-8 border-t border-slate-800/50 pt-4 md:pt-6">
                    <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Resultado Atual</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="h-0.5 w-6 border-t-2 border-dashed border-red-500/50" />
                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Limites Críticos</span>
                    </div>
                    <Badge variant="outline" className="hidden sm:inline-flex bg-slate-900 border-slate-800 text-[10px] text-slate-500 font-mono">
                        Amostragem: Últimos 10 Pontos
                    </Badge>
                </div>
            </CardContent>
        </Card>
    );
}

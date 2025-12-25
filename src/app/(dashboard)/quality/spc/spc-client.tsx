"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { SearchableSelect } from "@/components/smart/searchable-select";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    ReferenceLine,
    AreaChart,
    Area,
    Bar,
    Cell
} from "recharts";
import {
    TrendingUp,
    Download,
    AlertCircle,
    BarChart3,
    Calendar,
    Filter,
    Activity,
    CheckCircle2
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { getSPCDataAction, getProductBatchesAction } from "./actions";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface SPCClientProps {
    parameters: any[];
    products: any[];
    initialData: any[];
    initialSpecs: {
        min_value: number | null;
        max_value: number | null;
        target_value: number | null;
    } | null;
    user: any;
    alerts?: any[];
}

export function SPCClient({ parameters, products, initialData, initialSpecs, user, alerts = [] }: SPCClientProps) {
    const [selectedProduct, setSelectedProduct] = useState(products[0]?.id || "");
    const [selectedParameter, setSelectedParameter] = useState(parameters[0]?.id || "");
    const [selectedBatch, setSelectedBatch] = useState("all");

    // Default: Last 30 days
    const [startDate, setStartDate] = useState(() => {
        const d = new Date();
        d.setDate(d.getDate() - 30);
        return d.toISOString().split('T')[0];
    });
    const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);

    const [data, setData] = useState(initialData);
    const [specs, setSpecs] = useState(initialSpecs);
    const [batches, setBatches] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    // Initial fetch if initialData is empty but we have filters
    useEffect(() => {
        if (initialData.length === 0 && selectedProduct && selectedParameter) {
            handleFetchData();
        }
    }, []);

    // Load batches for selected product
    useEffect(() => {
        if (selectedProduct) {
            getProductBatchesAction(selectedProduct).then(setBatches);
        }
    }, [selectedProduct]);

    const handleFetchData = useCallback(async (
        pId = selectedProduct,
        paramId = selectedParameter,
        bId = selectedBatch,
        start = startDate,
        end = endDate
    ) => {
        setLoading(true);
        try {
            const result = await getSPCDataAction({
                productId: pId,
                parameterId: paramId,
                batchId: bId,
                startDate: start ? new Date(start).toISOString() : undefined,
                endDate: end ? new Date(end).toISOString() : undefined
            });
            setData(result.data);
            setSpecs(result.specs);
        } catch (error) {
            console.error("Failed to fetch SPC data", error);
        } finally {
            setLoading(false);
        }
    }, [selectedProduct, selectedParameter, selectedBatch, startDate, endDate]);

    const handleExportCSV = () => {
        if (!data.length) return;

        const headers = ["Data", "Valor", "Amostra", "Lote", "Violação Nelson"];
        const csvContent = [
            headers.join(","),
            ...data.map((d, i) => {
                const violation = (statistics?.violations?.[i]?.length ?? 0) > 0 ? "Sim" : "Não";
                return [
                    format(new Date(d.date), "dd/MM/yyyy HH:mm"),
                    d.value,
                    d.sampleCode || "",
                    d.batchCode || "",
                    violation
                ].join(",");
            })
        ].join("\n");

        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `spc_export_${selectedProduct}_${selectedParameter}.csv`);
        link.style.visibility = "hidden";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Statistical Core
    const statistics = useMemo(() => {
        if (!data.length) return null;

        const values = data.map(d => d.value).filter(v => typeof v === 'number');
        if (!values.length) return null;

        const n = values.length;
        const mean = values.reduce((a, b) => a + b, 0) / n;

        // Short-term variation (Moving Range)
        let totalMR = 0;
        for (let i = 1; i < values.length; i++) {
            totalMR += Math.abs(values[i] - values[i - 1]);
        }
        const avgMR = totalMR / (n - 1);
        const sigma_short = avgMR / 1.128; // d2 for n=2 is 1.128

        // Long-term variation (Standard Deviation)
        const variance = values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / (n - 1);
        const sigma_long = Math.sqrt(variance);

        // Control Limits (3-sigma)
        const UCL = mean + 3 * sigma_short;
        const LCL = mean - 3 * sigma_short;

        // Capability
        const USL = specs?.max_value;
        const LSL = specs?.min_value;

        let cpk = 0;
        let cp = 0;
        if (USL != null && LSL != null && sigma_short > 0) {
            cp = (USL - LSL) / (6 * sigma_short);
            const cpu = (USL - mean) / (3 * sigma_short);
            const cpl = (mean - LSL) / (3 * sigma_short);
            cpk = Math.min(cpu, cpl);
        }

        let ppk = 0;
        if (USL != null && LSL != null && sigma_long > 0) {
            const ppu = (USL - mean) / (3 * sigma_long);
            const ppl = (mean - LSL) / (3 * sigma_long);
            ppk = Math.min(ppu, ppl);
        }

        // Nelson Rules Check
        const violations = values.map((v, i) => {
            const rules = [];

            // Rule 1: Point > 3-sigma
            if (v > UCL || v < LCL) rules.push(1);

            // Rule 2: 9 points on one side
            if (i >= 8) {
                const last9 = values.slice(i - 8, i + 1);
                if (last9.every(x => x > mean) || last9.every(x => x < mean)) rules.push(2);
            }

            // Rule 4: 14 points alternating up and down
            if (i >= 13) {
                const last14 = values.slice(i - 13, i + 1);
                let alternating = true;
                for (let j = 1; j < last14.length; j++) {
                    const diffNow = last14[j] - last14[j - 1];
                    const diffPrev = j > 1 ? last14[j - 1] - last14[j - 2] : 0;
                    if (j > 1 && ((diffNow > 0 && diffPrev > 0) || (diffNow < 0 && diffPrev < 0))) {
                        alternating = false;
                        break;
                    }
                }
                if (alternating) rules.push(4);
            }

            return rules;
        });

        return {
            mean,
            sigma_short,
            sigma_long,
            UCL,
            LCL,
            cp,
            cpk,
            ppk,
            violations,
            values
        };
    }, [data, specs]);

    // Histogram Data
    const histogramData = useMemo(() => {
        if (!statistics) return [];
        const { values, mean, sigma_long } = statistics;
        const min = Math.min(...values);
        const max = Math.max(...values);
        const range = max - min;
        const bins = 10;
        const binWidth = range > 0 ? range / bins : 1;

        const counts = Array(bins).fill(0);
        values.forEach(v => {
            const binIdx = Math.min(Math.floor((v - min) / binWidth), bins - 1);
            counts[binIdx]++;
        });

        return counts.map((count, i) => {
            const x = min + (i + 0.5) * binWidth;
            // PDF of Normal Distribution for Bell Curve overlay
            const bell = (sigma_long > 0) ? (1 / (sigma_long * Math.sqrt(2 * Math.PI))) *
                Math.exp(-0.5 * Math.pow((x - mean) / sigma_long, 2)) : 0;

            return {
                range: `${(min + i * binWidth).toFixed(2)}-${(min + (i + 1) * binWidth).toFixed(2)}`,
                count,
                bell: bell * values.length * binWidth // Scale bell curve to match histogram
            };
        });
    }, [statistics]);

    const chartData = useMemo(() => {
        return data.map((d, i) => ({
            id: d.id, // Unique identifier
            batch: d.batchCode || d.sampleCode,
            value: d.value,
            ucl: statistics?.UCL,
            lcl: statistics?.LCL,
            mean: statistics?.mean,
            violation: (statistics?.violations?.[i]?.length ?? 0) > 0,
            rules: statistics?.violations?.[i]
        })).reverse();
    }, [data, statistics]);

    return (
        <div className="space-y-8 pb-20">
            {/* Unified Control Panel */}
            <div className="glass rounded-2xl border-slate-800/50 p-8 space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
                            <BarChart3 className="h-8 w-8 text-emerald-500" />
                            SPC Lean Six Sigma Professional
                        </h1>
                        <p className="text-slate-400 font-medium mt-1">Análise avançada de variações de processo e estabilidade estatística.</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 px-3 py-1 text-xs font-bold">
                            <Activity className="h-3 w-3 mr-1.5" /> MONITORIZAÇÃO ATIVA
                        </Badge>
                        <Button
                            variant="outline"
                            className="border-slate-800 bg-slate-900/50 text-slate-300 hover:text-white"
                            onClick={handleExportCSV}
                            disabled={!data.length}
                        >
                            <Download className="h-4 w-4 mr-2" /> Exportar Dados (CSV)
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-5 gap-4 pt-4 border-t border-slate-800/50">
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">Produto</label>
                        <SearchableSelect
                            value={selectedProduct}
                            onValueChange={(val: string) => {
                                setSelectedProduct(val);
                                handleFetchData(val, selectedParameter, selectedBatch, startDate, endDate);
                            }}
                            options={products.map(p => ({ value: p.id, label: p.name }))}
                            placeholder="Produto"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">Parâmetro QA</label>
                        <SearchableSelect
                            value={selectedParameter}
                            onValueChange={(val: string) => {
                                setSelectedParameter(val);
                                handleFetchData(selectedProduct, val, selectedBatch, startDate, endDate);
                            }}
                            options={parameters.map(p => ({ value: p.id, label: p.name }))}
                            placeholder="Parâmetro"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">Lote (Batch)</label>
                        <SearchableSelect
                            value={selectedBatch}
                            onValueChange={(val: string) => {
                                setSelectedBatch(val);
                                handleFetchData(selectedProduct, selectedParameter, val, startDate, endDate);
                            }}
                            options={[
                                { value: "all", label: "Todos os Lotes" },
                                ...batches.map(b => ({ value: b.id, label: b.code }))
                            ]}
                            placeholder="Todos os Lotes"
                        />
                    </div>

                    <div className="space-y-1.5 lg:col-span-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">Intervalo de Datas</label>
                        <div className="flex gap-2">
                            <div className="relative flex-1">
                                <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                                <input
                                    type="date"
                                    className="w-full bg-slate-950/50 border border-slate-800 rounded-md h-10 pl-10 pr-3 text-sm text-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                    value={startDate}
                                    onChange={(e) => {
                                        setStartDate(e.target.value);
                                        handleFetchData(selectedProduct, selectedParameter, selectedBatch, e.target.value, endDate);
                                    }}
                                />
                            </div>
                            <div className="relative flex-1">
                                <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                                <input
                                    type="date"
                                    className="w-full bg-slate-950/50 border border-slate-800 rounded-md h-10 pl-10 pr-3 text-sm text-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                    value={endDate}
                                    onChange={(e) => {
                                        setEndDate(e.target.value);
                                        handleFetchData(selectedProduct, selectedParameter, selectedBatch, startDate, e.target.value);
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Statistics Dashboard */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="glass border-emerald-500/20 bg-slate-950/30">
                    <CardHeader className="pb-2 flex flex-row items-center justify-between">
                        <CardTitle className="text-xs font-bold uppercase tracking-widest text-slate-400">Capacidade (Cpk)</CardTitle>
                        <TrendingUp className="h-4 w-4 text-emerald-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-4xl font-black text-emerald-400">
                            {statistics?.cpk.toFixed(2) || "---"}
                        </div>
                        <div className="mt-2 flex items-center gap-2">
                            <Badge className={cn(
                                "text-[10px]",
                                (statistics?.cpk || 0) >= 1.33 ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"
                            )}>
                                {(statistics?.cpk || 0) >= 1.33 ? "Processo Capaz" : "Acção Necessária"}
                            </Badge>
                            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter">Cp: {statistics?.cp?.toFixed(2) || "---"}</span>
                        </div>
                    </CardContent>
                </Card>

                <Card className="glass border-purple-500/20 bg-slate-950/30">
                    <CardHeader className="pb-2 flex flex-row items-center justify-between">
                        <CardTitle className="text-xs font-bold uppercase tracking-widest text-slate-400">Performance (Ppk)</CardTitle>
                        <Filter className="h-4 w-4 text-purple-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-4xl font-black text-purple-400">
                            {statistics?.ppk.toFixed(2) || "---"}
                        </div>
                        <p className="text-[10px] text-slate-500 mt-2 font-medium italic">Variação a longo prazo (σ total)</p>
                    </CardContent>
                </Card>

                <Card className="glass border-blue-500/20 bg-slate-950/30">
                    <CardHeader className="pb-2 flex flex-row items-center justify-between">
                        <CardTitle className="text-xs font-bold uppercase tracking-widest text-slate-400">Média & Sigma</CardTitle>
                        <Activity className="h-4 w-4 text-blue-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-baseline gap-2">
                            <span className="text-2xl font-bold text-white">μ: {statistics?.mean.toFixed(2)}</span>
                            <span className="text-sm text-slate-400 font-mono">σ: {statistics?.sigma_short.toFixed(3)}</span>
                        </div>
                        <div className="mt-3 flex gap-1">
                            <div className="h-1 flex-1 bg-emerald-500 rounded-full" />
                            <div className="h-1 flex-1 bg-emerald-400 rounded-full" />
                            <div className="h-1 flex-1 bg-emerald-300 rounded-full" />
                            <div className="h-1 flex-1 bg-slate-800 rounded-full" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="glass border-orange-500/20 bg-slate-950/30">
                    <CardHeader className="pb-2 flex flex-row items-center justify-between">
                        <CardTitle className="text-xs font-bold uppercase tracking-widest text-slate-400">Alertas Nelson</CardTitle>
                        <AlertCircle className="h-4 w-4 text-orange-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-black text-white">
                            {statistics?.violations.flat().length || 0}
                        </div>
                        <p className="text-[10px] text-slate-400 mt-2 font-bold uppercase tracking-wider">
                            {statistics?.violations.flat().length ? "Sinais fora de controle detectados" : "Processo Estável"}
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Control Chart */}
                <Card className="lg:col-span-2 glass border-slate-800/50">
                    <CardHeader className="flex flex-row items-center justify-between border-b border-slate-800/50">
                        <div>
                            <CardTitle className="text-lg font-bold">Carta de Controlo Individual (X-Chart)</CardTitle>
                            <CardDescription>Monitorização de 3-Sigma com Regras de Nelson</CardDescription>
                        </div>
                        <div className="flex gap-4 text-[10px] font-bold text-slate-400">
                            <div className="flex items-center gap-1.5">
                                <span className="h-1.5 w-1.5 rounded-full bg-red-500" /> UCL/LCL
                            </div>
                            <div className="flex items-center gap-1.5">
                                <span className="h-1.5 w-1.5 rounded-full bg-slate-500" /> Média
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-6">
                        {data.length > 0 ? (
                            <div className={cn("h-[450px] w-full transition-opacity", loading && "opacity-50")}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                                        <XAxis
                                            dataKey="id"
                                            stroke="#475569"
                                            fontSize={11}
                                            tickLine={false}
                                            axisLine={false}
                                            dy={10}
                                            tickFormatter={(val) => {
                                                const point = chartData.find(d => d.id === val);
                                                return point?.batch || "";
                                            }}
                                        />
                                        <YAxis stroke="#475569" fontSize={11} tickLine={false} axisLine={false} domain={['auto', 'auto']} />
                                        <Tooltip
                                            contentStyle={{ backgroundColor: '#020617', border: '1px solid #1e293b', borderRadius: '12px' }}
                                            itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                                            labelFormatter={(val) => {
                                                const point = chartData.find(d => d.id === val);
                                                return `Lote: ${point?.batch || "---"}`;
                                            }}
                                        />

                                        {/* Statistical Control Limits */}
                                        <ReferenceLine y={statistics?.UCL} stroke="#ef4444" strokeWidth={1} strokeDasharray="3 3" label={{ position: 'right', value: 'UCL', fill: '#ef4444', fontSize: 10, fontWeight: 'bold' }} />
                                        <ReferenceLine y={statistics?.LCL} stroke="#ef4444" strokeWidth={1} strokeDasharray="3 3" label={{ position: 'right', value: 'LCL', fill: '#ef4444', fontSize: 10, fontWeight: 'bold' }} />
                                        <ReferenceLine y={statistics?.mean} stroke="#94a3b8" strokeWidth={1} label={{ position: 'right', value: 'CL', fill: '#94a3b8', fontSize: 10 }} />

                                        {/* Specification Limits */}
                                        {specs?.max_value && <ReferenceLine y={specs.max_value} stroke="#dc2626" strokeWidth={2} label={{ position: 'left', value: 'USL', fill: '#dc2626', fontSize: 11, fontWeight: 'black' }} />}
                                        {specs?.min_value && <ReferenceLine y={specs.min_value} stroke="#dc2626" strokeWidth={2} label={{ position: 'left', value: 'LSL', fill: '#dc2626', fontSize: 11, fontWeight: 'black' }} />}

                                        <Line
                                            type="monotone"
                                            dataKey="value"
                                            stroke="#3b82f6"
                                            strokeWidth={3}
                                            dot={(props: any) => {
                                                const { cx, cy, payload } = props;
                                                if (payload.violation) {
                                                    return <circle cx={cx} cy={cy} r={6} fill="#ef4444" stroke="#fff" strokeWidth={2} className="animate-pulse" />;
                                                }
                                                return <circle cx={cx} cy={cy} r={4} fill="#3b82f6" stroke="#0f172a" strokeWidth={1} />;
                                            }}
                                            activeDot={{ r: 8, strokeWidth: 0 }}
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        ) : (
                            <div className="h-[450px] w-full flex flex-col items-center justify-center text-slate-500">
                                <Activity className="h-12 w-12 mb-4 opacity-20" />
                                <p className="font-medium">Nenhum dado encontrado para os filtros selecionados.</p>
                                <p className="text-xs">Tente ajustar o intervalo de datas ou selecionar outro parâmetro.</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Histogram & Distribution */}
                <div className="space-y-8">
                    <Card className="glass border-slate-800/50">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-base font-bold flex items-center gap-2">
                                <TrendingUp className="h-4 w-4 text-blue-400" />
                                Análise de Distribuição
                            </CardTitle>
                            <CardDescription>Histograma & Curva de Gauss (Normalidade)</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="h-[250px] w-full">
                                {data.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={histogramData}>
                                            <XAxis dataKey="range" hide />
                                            <YAxis hide />
                                            <Tooltip />
                                            <Area
                                                type="monotone"
                                                dataKey="bell"
                                                stroke="#10b981"
                                                fill="#10b981"
                                                fillOpacity={0.1}
                                                strokeWidth={2}
                                            />
                                            <Bar dataKey="count" fill="#3b82f6" fillOpacity={0.3} radius={[4, 4, 0, 0]}>
                                                {histogramData.map((_entry, index) => (
                                                    <Cell key={`cell-${index}`} />
                                                ))}
                                            </Bar>
                                        </AreaChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="h-full w-full flex items-center justify-center text-slate-600">
                                        <p className="text-xs italic">A aguardar dados...</p>
                                    </div>
                                )}
                            </div>
                            <div className="mt-4 p-4 rounded-xl bg-slate-900/50 border border-slate-800">
                                <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 mb-3 uppercase tracking-wider">
                                    <span>CONFORMIDADE</span>
                                    <span className={cn(
                                        (statistics?.cpk || 0) > 1.33 ? "text-emerald-400" : "text-red-400"
                                    )}>
                                        {(statistics?.cpk || 0) > 1.33 ? "ESTÁVEL" : "Risco Crítico"}
                                    </span>
                                </div>
                                <div className="space-y-3">
                                    <div className="flex items-center gap-3">
                                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                                        <span className="text-xs text-slate-200">Zonas Sigma Calculadas (d2 Standard)</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                                        <span className="text-xs text-slate-200">Validação Nelson Rules Ativa</span>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="glass border-slate-800/50">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-xs font-bold uppercase tracking-widest text-slate-500">Limites de Projecto</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3 font-mono text-sm">
                            <div className="flex justify-between p-2 rounded bg-red-500/5 border border-red-500/10">
                                <span className="text-slate-400">USL</span>
                                <span className="text-red-400 font-bold">{specs?.max_value || "---"}</span>
                            </div>
                            <div className="flex justify-between p-2 rounded bg-emerald-500/5 border border-emerald-500/10">
                                <span className="text-slate-400">Target</span>
                                <span className="text-emerald-400 font-bold">{specs?.target_value || "---"}</span>
                            </div>
                            <div className="flex justify-between p-2 rounded bg-red-500/5 border border-red-500/10">
                                <span className="text-slate-400">LSL</span>
                                <span className="text-red-400 font-bold">{specs?.min_value || "---"}</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Audit Data Table */}
            <Card className="glass border-slate-800/50">
                <CardHeader>
                    <CardTitle className="text-lg font-bold flex items-center gap-2">
                        <Filter className="h-5 w-5 text-slate-400" />
                        Tabela de Auditoria (Dados Brutos)
                    </CardTitle>
                    <CardDescription>Detalhamento item-a-item para validação cruzada.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border border-slate-800">
                        <Table>
                            <TableHeader className="bg-slate-900/50">
                                <TableRow className="border-slate-800 hover:bg-transparent">
                                    <TableHead className="text-slate-400 font-bold">Data/Hora</TableHead>
                                    <TableHead className="text-slate-400 font-bold">Amostra</TableHead>
                                    <TableHead className="text-slate-400 font-bold">Lote</TableHead>
                                    <TableHead className="text-slate-400 font-bold text-right">Valor</TableHead>
                                    <TableHead className="text-slate-400 font-bold text-center">Estado</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {data.length > 0 ? (
                                    data.map((row, idx) => {
                                        const violation = (statistics?.violations?.[idx]?.length ?? 0) > 0;
                                        return (
                                            <TableRow key={row.id} className="border-slate-800 hover:bg-slate-900/30">
                                                <TableCell className="text-slate-300 py-3">
                                                    {format(new Date(row.date), "dd MMM yyyy, HH:mm", { locale: ptBR })}
                                                </TableCell>
                                                <TableCell className="font-medium text-slate-200">{row.sampleCode || "---"}</TableCell>
                                                <TableCell className="text-slate-400">{row.batchCode || "---"}</TableCell>
                                                <TableCell className="text-right font-mono font-bold text-emerald-400">{row.value}</TableCell>
                                                <TableCell className="text-center">
                                                    {violation ? (
                                                        <Badge className="bg-red-500/20 text-red-400 border-none animate-pulse">
                                                            ANOMALIA
                                                        </Badge>
                                                    ) : (
                                                        <Badge className="bg-emerald-500/10 text-emerald-500 border-none">
                                                            NORMAL
                                                        </Badge>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-24 text-center text-slate-500 italic">
                                            Nenhum registro para exibir.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

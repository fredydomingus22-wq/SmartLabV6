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
import { ControlChart } from "@/components/smart/control-chart";
import { ParetoChart } from "@/components/smart/pareto-chart";
import { CorrelationChart } from "@/components/smart/correlation-chart";
import { IshikawaChart } from "@/components/smart/ishikawa-chart";
import { HistogramChart } from "@/components/smart/histogram-chart";
import { FiveWhyTool } from "@/components/smart/five-why-tool";
import { CheckSheet } from "@/components/smart/check-sheet";
import { ProcessFlowchart } from "@/components/smart/process-flowchart";
import { DashboardConfig, DashboardToolsConfig } from "@/components/smart/dashboard-config";
import { AIAuditorCard } from "@/components/smart/ai-auditor-card";
import { ClientOnly } from "@/components/client-only";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    getSPCDataAction,
    getProductBatchesAction,
    getParetoDataAction,
    getCorrelationDataAction,
    analyzeSPCTrendsAction,
    saveQualityAnalysisAction,
    getQualityAnalysisAction
} from "./actions";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";


interface SPCClientProps {
    parameters: any[];
    products: any[];
    sampleTypes: { id: string, name: string }[];
    initialSPCResult: any;
    user: any;
    alerts?: any[];
}

export function SPCClient({ parameters, products, sampleTypes, initialSPCResult, user, alerts = [] }: SPCClientProps) {
    const [selectedProduct, setSelectedProduct] = useState(products[0]?.id || "");
    const [selectedParameter, setSelectedParameter] = useState(parameters[0]?.id || "");
    const [selectedBatch, setSelectedBatch] = useState("all");

    // Default Sample Type: Finished Product / Produto Final (if found)
    const [selectedSampleType, setSelectedSampleType] = useState(() => {
        const finalType = sampleTypes.find(st => {
            const name = st.name.toLowerCase();
            return name.includes("final") || name.includes("finished");
        });
        return finalType?.id || "all";
    });

    // Default: Last 30 days
    const [startDate, setStartDate] = useState(() => {
        const d = new Date();
        d.setDate(d.getDate() - 30);
        return d.toISOString().split('T')[0];
    });
    const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);

    const [data, setData] = useState(initialSPCResult?.data || []);
    const [subgroups, setSubgroups] = useState<any[]>(initialSPCResult?.subgroups || []);
    const [specs, setSpecs] = useState(initialSPCResult?.specLimits || null);
    const [subgroupSize, setSubgroupSize] = useState(1);
    const [chartType, setChartType] = useState<'individual' | 'xbar' | 'r' | 's'>('individual');

    const [statistics, setStatistics] = useState<any>(initialSPCResult ? {
        mean: initialSPCResult.mean,
        sigmaShort: initialSPCResult.sigmaShort,
        sigmaLong: initialSPCResult.sigmaLong,
        ucl: initialSPCResult.ucl,
        lcl: initialSPCResult.lcl,
        uclR: initialSPCResult.uclR,
        lclR: initialSPCResult.lclR,
        uclS: initialSPCResult.uclS,
        lclS: initialSPCResult.lclS,
        avgRange: initialSPCResult.avgRange,
        avgStdDev: initialSPCResult.avgStdDev,
        cpk: initialSPCResult.processCapability?.cpk,
        cp: initialSPCResult.processCapability?.cp,
        ppk: initialSPCResult.processCapability?.ppk,
        violations: initialSPCResult.violations
    } : null);

    const [batches, setBatches] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [paretoData, setParetoData] = useState<any[]>([]);
    const [paretoDimension, setParetoDimension] = useState<"category" | "nc_type" | "severity">("nc_type");

    // Correlation State
    const [secondaryParameter, setSecondaryParameter] = useState(parameters[1]?.id || "");
    const [correlationResult, setCorrelationResult] = useState<any>(null);

    // Visibility Config
    const [toolsConfig, setToolsConfig] = useState<DashboardToolsConfig>(() => {
        if (typeof window !== "undefined") {
            const saved = localStorage.getItem("spc_tools_config");
            if (saved) return JSON.parse(saved);
        }
        return {
            spc: true,
            histogram: true,
            pareto: true,
            correlation: true,
            ishikawa: true,
            fiveWhy: true,
            checkSheet: true,
            flowchart: true
        };
    });

    // Persistent Analysis Data
    const [ishikawaData, setIshikawaData] = useState<any>(null);
    const [fiveWhyData, setFiveWhyData] = useState<any>(null);
    const [checkSheetData, setCheckSheetData] = useState<any>(null);
    const [isSavingAnalysis, setIsSavingAnalysis] = useState<Record<string, boolean>>({});

    useEffect(() => {
        if (typeof window !== "undefined") {
            localStorage.setItem("spc_tools_config", JSON.stringify(toolsConfig));
        }
    }, [toolsConfig]);

    // Load Persistent Data
    useEffect(() => {
        if (selectedProduct && selectedParameter) {
            getQualityAnalysisAction({
                productId: selectedProduct,
                parameterId: selectedParameter,
                batchId: selectedBatch,
                analysisType: 'ishikawa'
            }).then(res => setIshikawaData(res?.data));

            getQualityAnalysisAction({
                productId: selectedProduct,
                parameterId: selectedParameter,
                batchId: selectedBatch,
                analysisType: '5why'
            }).then(res => setFiveWhyData(res?.data));

            getQualityAnalysisAction({
                productId: selectedProduct,
                parameterId: selectedParameter,
                batchId: selectedBatch,
                analysisType: 'check_sheet'
            }).then(res => setCheckSheetData(res?.data));
        }
    }, [selectedProduct, selectedParameter, selectedBatch]);

    useEffect(() => {
        getParetoDataAction(paretoDimension).then(setParetoData);
    }, [paretoDimension]);

    useEffect(() => {
        if (selectedParameter && secondaryParameter) {
            setCorrelationResult(null); // Clear previous to show loading and avoid mismatch
            getCorrelationDataAction(selectedParameter, secondaryParameter, {
                productId: selectedProduct,
                batchId: selectedBatch,
                startDate,
                endDate,
                sampleTypeId: selectedSampleType !== "all" ? selectedSampleType : undefined
            }).then(setCorrelationResult);
        }
    }, [selectedParameter, secondaryParameter, selectedProduct, selectedBatch, startDate, endDate, selectedSampleType]);

    // Load batches for selected product
    useEffect(() => {
        if (selectedProduct) {
            getProductBatchesAction(selectedProduct).then(setBatches);
        }
    }, [selectedProduct]);

    const handleFetchData = useCallback(async (
        pId: string = selectedProduct,
        paramId: string = selectedParameter,
        bId: string = selectedBatch,
        stId: string = selectedSampleType,
        start: string = startDate,
        end: string = endDate,
        sz: number = subgroupSize
    ) => {
        setLoading(true);
        try {
            const result = await getSPCDataAction({
                productId: pId,
                parameterId: paramId,
                batchId: bId,
                sampleTypeId: stId !== "all" ? stId : undefined,
                startDate: start,
                endDate: end,
                subgroupSize: sz
            });
            setData(result.data);
            setSubgroups(result.subgroups);
            setSpecs(result.specs);
            setStatistics(result.statistics);
        } catch (error) {
            console.error("Failed to fetch SPC data", error);
        } finally {
            setLoading(false);
        }
    }, [selectedProduct, selectedParameter, selectedBatch, startDate, endDate, subgroupSize]);

    const handleExportCSV = () => {
        if (!data.length) return;

        const headers = ["Data", "Valor", "Amostra", "Lote", "Violação Nelson"];
        const csvContent = [
            headers.join(","),
            ...data.map((d: any, i: number) => {
                const isViolated = statistics?.violations?.some((v: any) => v.pointIndexes.includes(i));
                return [
                    format(new Date(d.date), "dd/MM/yyyy HH:mm"),
                    d.value,
                    d.sampleCode || "",
                    d.batchCode || "",
                    isViolated ? "Sim" : "Não"
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

    // Histogram Data (simplified for preview)
    const histogramData = useMemo(() => {
        if (!data.length || !statistics) return [];
        const values = data.map((d: any) => d.value).filter((v: any) => typeof v === 'number');
        const min = Math.min(...values);
        const max = Math.max(...values);
        const range = max - min;
        const bins = 10;
        const binWidth = range > 0 ? range / bins : 1;

        const counts = Array(bins).fill(0);
        values.forEach((v: any) => {
            const binIdx = Math.min(Math.floor((v - min) / binWidth), bins - 1);
            counts[binIdx]++;
        });

        return counts.map((count, i) => ({
            range: `${(min + i * binWidth).toFixed(2)}-${(min + (i + 1) * binWidth).toFixed(2)}`,
            count
        }));
    }, [data, statistics]);

    const chartData = useMemo(() => {
        return data.map((d: any, i: number) => {
            const pointViolations = statistics?.violations?.filter((v: any) => v.pointIndexes.includes(i));
            return {
                ...d,
                batch: d.batchCode || d.sampleCode,
                violation: pointViolations?.length > 0,
                rules: pointViolations?.map((v: any) => v.rule)
            };
        });
    }, [data, statistics]);

    const currentParameter = parameters.find(p => p.id === selectedParameter);

    const handleAIAnalysis = async () => {
        return analyzeSPCTrendsAction({
            parameterName: currentParameter?.name || "Parâmetro Desconhecido",
            unit: currentParameter?.unit || "",
            data: data.slice(-30),
            statistics: {
                mean: statistics.mean,
                ucl: statistics.ucl,
                lcl: statistics.lcl,
                sigmaShort: statistics.sigmaShort,
                cpk: statistics.cpk,
                violations: statistics.violations
            },
            specLimits: specs
        });
    };

    const handleSaveAnalysis = async (type: 'ishikawa' | '5why' | 'check_sheet' | 'flowchart', analysisData: any) => {
        setIsSavingAnalysis(prev => ({ ...prev, [type]: true }));
        try {
            await saveQualityAnalysisAction({
                productId: selectedProduct,
                parameterId: selectedParameter,
                batchId: selectedBatch,
                analysisType: type,
                data: analysisData
            });
        } catch (error) {
            console.error(`Failed to save ${type} analysis`, error);
        } finally {
            setIsSavingAnalysis(prev => ({ ...prev, [type]: false }));
        }
    };

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
                        <DashboardConfig config={toolsConfig} onChange={setToolsConfig} />
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
                                handleFetchData(val, selectedParameter, selectedBatch, selectedSampleType, startDate, endDate);
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
                                handleFetchData(selectedProduct, val, selectedBatch, selectedSampleType, startDate, endDate);
                            }}
                            options={parameters.map(p => ({ value: p.id, label: p.name }))}
                            placeholder="Parâmetro"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">Tipo de Amostra</label>
                        <SearchableSelect
                            value={selectedSampleType}
                            onValueChange={(val: string) => {
                                setSelectedSampleType(val);
                                handleFetchData(selectedProduct, selectedParameter, selectedBatch, val, startDate, endDate);
                            }}
                            options={[
                                { value: "all", label: "Todos os Tipos" },
                                ...sampleTypes.map(st => ({ value: st.id, label: st.name }))
                            ]}
                            placeholder="Tipo Amostra"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">Lote (Batch)</label>
                        <SearchableSelect
                            value={selectedBatch}
                            onValueChange={(val: string) => {
                                setSelectedBatch(val);
                                handleFetchData(selectedProduct, selectedParameter, val, selectedSampleType, startDate, endDate);
                            }}
                            options={[
                                { value: "all", label: "Todos os Lotes" },
                                ...batches.map(b => ({ value: b.id, label: b.code }))
                            ]}
                            placeholder="Todos os Lotes"
                        />
                    </div>

                    <div className="space-y-1.5 min-w-[120px]">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">Tamanho Subgrupo</label>
                        <SearchableSelect
                            value={subgroupSize.toString()}
                            onValueChange={(val: string) => {
                                const sz = parseInt(val);
                                setSubgroupSize(sz);
                                if (sz > 1 && chartType === 'individual') setChartType('xbar');
                                if (sz === 1) setChartType('individual');
                                handleFetchData(selectedProduct, selectedParameter, selectedBatch, selectedSampleType, startDate, endDate, sz);
                            }}
                            options={[
                                { value: "1", label: "Individual (n=1)" },
                                { value: "2", label: "n=2" },
                                { value: "3", label: "n=3" },
                                { value: "4", label: "n=4" },
                                { value: "5", label: "n=5" },
                                { value: "10", label: "n=10" },
                            ]}
                            placeholder="Tamanho"
                        />
                    </div>
                </div>

                <div className="flex flex-wrap gap-2 pt-4 border-t border-slate-800/50">
                    <Button
                        variant={chartType === 'individual' ? "default" : "outline"}
                        size="sm"
                        className={cn(chartType === 'individual' ? "bg-emerald-600 hover:bg-emerald-700" : "border-slate-800 text-slate-400")}
                        onClick={() => {
                            setChartType('individual');
                            setSubgroupSize(1);
                            handleFetchData(selectedProduct, selectedParameter, selectedBatch, selectedSampleType, startDate, endDate, 1);
                        }}
                    >
                        Individual (I-Chart)
                    </Button>
                    <Button
                        variant={chartType === 'xbar' ? "default" : "outline"}
                        size="sm"
                        disabled={subgroupSize <= 1}
                        className={cn(chartType === 'xbar' ? "bg-emerald-600 hover:bg-emerald-700" : "border-slate-800 text-slate-400")}
                        onClick={() => setChartType('xbar')}
                    >
                        X-Bar Chart
                    </Button>
                    <Button
                        variant={chartType === 'r' ? "default" : "outline"}
                        size="sm"
                        disabled={subgroupSize <= 1}
                        className={cn(chartType === 'r' ? "bg-emerald-600 hover:bg-emerald-700" : "border-slate-800 text-slate-400")}
                        onClick={() => setChartType('r')}
                    >
                        R-Chart (Amplitude)
                    </Button>
                    <Button
                        variant={chartType === 's' ? "default" : "outline"}
                        size="sm"
                        disabled={subgroupSize <= 1}
                        className={cn(chartType === 's' ? "bg-emerald-600 hover:bg-emerald-700" : "border-slate-800 text-slate-400")}
                        onClick={() => setChartType('s')}
                    >
                        S-Chart (Desvio Padrão)
                    </Button>
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
                            {statistics?.cpk?.toFixed(2) || "---"}
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
                            {statistics?.ppk?.toFixed(2) || "---"}
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
                            <span className="text-2xl font-bold text-white">μ: {statistics?.mean?.toFixed(2) || "---"}</span>
                            <span className="text-sm text-slate-400 font-mono">σ: {statistics?.sigmaShort?.toFixed(3) || "---"}</span>
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
                            {statistics?.violations?.length || 0}
                        </div>
                        <p className="text-[10px] text-slate-400 mt-2 font-bold uppercase tracking-wider">
                            {statistics?.violations?.length ? "Sinais fora de controle detectados" : "Processo Estável"}
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Main Tabs Selection */}
            <ClientOnly>
                <Tabs defaultValue="spc" className="w-full">
                    <TabsList className="bg-slate-900 border-slate-800 p-1 rounded-xl h-12">
                        <TabsTrigger value="spc" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white rounded-lg px-6 font-bold">
                            Cartas de Controlo SPC
                        </TabsTrigger>
                        <TabsTrigger value="tools" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white rounded-lg px-6 font-bold">
                            Ferramentas da Qualidade (QC Tools)
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="spc" className="mt-8 space-y-8">
                        {/* AI Auditor Section */}
                        <AIAuditorCard onAnalyze={handleAIAnalysis} />

                        {/* Charts Section */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            {/* Main Control Chart */}
                            <div className="lg:col-span-2">
                                {data.length > 0 ? (
                                    <>
                                        {chartType === 'individual' && (
                                            <ControlChart
                                                data={chartData}
                                                xKey="batch"
                                                yKey="value"
                                                title="Carta de Controlo Individual (X-Chart)"
                                                description="Monitorização de 3-Sigma com Regras de Nelson"
                                                ucl={statistics?.ucl}
                                                lcl={statistics?.lcl}
                                                mean={statistics?.mean}
                                                usl={specs?.max_value}
                                                lsl={specs?.min_value}
                                                target={specs?.target_value}
                                                unit={currentParameter?.unit || ""}
                                            />
                                        )}
                                        {chartType === 'xbar' && (
                                            <ControlChart
                                                data={subgroups}
                                                xKey="label"
                                                yKey="mean"
                                                title="Carta X-Bar (Médias)"
                                                description={`Subgrupos de tamanho n=${subgroupSize}`}
                                                ucl={statistics?.ucl}
                                                lcl={statistics?.lcl}
                                                mean={statistics?.mean}
                                                usl={specs?.max_value}
                                                lsl={specs?.min_value}
                                                target={specs?.target_value}
                                                unit={currentParameter?.unit || ""}
                                            />
                                        )}
                                        {chartType === 'r' && (
                                            <ControlChart
                                                data={subgroups}
                                                xKey="label"
                                                yKey="range"
                                                title="Carta R (Amplitude)"
                                                description="Variabilidade dentro dos subgrupos"
                                                ucl={statistics?.uclR}
                                                lcl={statistics?.lclR}
                                                mean={statistics?.avgRange}
                                                unit={currentParameter?.unit || ""}
                                            />
                                        )}
                                        {chartType === 's' && (
                                            <ControlChart
                                                data={subgroups}
                                                xKey="label"
                                                yKey="stdDev"
                                                title="Carta S (Desvio Padrão)"
                                                description="Consistência do processo nos subgrupos"
                                                ucl={statistics?.uclS}
                                                lcl={statistics?.lclS}
                                                mean={statistics?.avgStdDev}
                                                unit={currentParameter?.unit || ""}
                                            />
                                        )}
                                    </>
                                ) : (
                                    <Card className="glass border-slate-800/50">
                                        <CardContent className="h-[450px] w-full flex flex-col items-center justify-center text-slate-500">
                                            <Activity className="h-12 w-12 mb-4 opacity-20" />
                                            <p className="font-medium">Nenhum dado encontrado para os filtros selecionados.</p>
                                            <p className="text-xs">Tente ajustar o intervalo de datas ou selecionar outro parâmetro.</p>
                                        </CardContent>
                                    </Card>
                                )}
                            </div>

                            {/* Histogram & Distribution */}
                            <div className="space-y-8">
                                <HistogramChart
                                    data={data.map((d: any) => d.value)}
                                    lsl={specs?.min_value}
                                    usl={specs?.max_value}
                                    target={specs?.target_value}
                                    unit={currentParameter?.unit || ""}
                                    title="Análise de Distribuição"
                                    description="Histograma com Curva de Gauss (Normalidade)"
                                />

                                <Card className="glass border-slate-800/50">
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-xs font-bold uppercase tracking-widest text-slate-500">Limites de Projecto</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-3 font-mono text-sm">
                                        <div className="flex justify-between p-2 rounded bg-red-500/5 border border-red-500/10">
                                            <span className="text-slate-400">LSE / USL</span>
                                            <span className="text-red-400 font-bold">{specs?.usl || specs?.max_value || "---"}</span>
                                        </div>
                                        <div className="flex justify-between p-2 rounded bg-emerald-500/5 border border-emerald-500/10">
                                            <span className="text-slate-400">Alvo / Target</span>
                                            <span className="text-emerald-400 font-bold">{specs?.target || specs?.target_value || "---"}</span>
                                        </div>
                                        <div className="flex justify-between p-2 rounded bg-red-500/5 border border-red-500/10">
                                            <span className="text-slate-400">LIE / LSL</span>
                                            <span className="text-red-400 font-bold">{specs?.lsl || specs?.min_value || "---"}</span>
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
                                <div className="rounded-md border border-slate-800 overflow-hidden">
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
                                                data.map((row: any, idx: number) => {
                                                    const pointViolations = statistics?.violations?.filter((v: any) => v.pointIndexes.includes(idx));
                                                    const isViolated = pointViolations?.length > 0;
                                                    return (
                                                        <TableRow key={row.id} className="border-slate-800 hover:bg-slate-900/30">
                                                            <TableCell className="text-slate-300 py-3">
                                                                {format(new Date(row.date), "dd MMM yyyy, HH:mm", { locale: ptBR })}
                                                            </TableCell>
                                                            <TableCell className="font-medium text-slate-200">{row.sampleCode || "---"}</TableCell>
                                                            <TableCell className="text-slate-400">{row.batchCode || "---"}</TableCell>
                                                            <TableCell className="text-right font-mono font-bold text-emerald-400">{row.value}</TableCell>
                                                            <TableCell className="text-center">
                                                                {isViolated ? (
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
                    </TabsContent>

                    <TabsContent value="tools" className="mt-8">
                        <div className="flex justify-end mb-4">
                            <div className="flex bg-slate-900/50 p-1 rounded-lg border border-slate-800">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className={cn("text-[10px] h-8 px-3 rounded-md", paretoDimension === 'nc_type' ? "bg-emerald-600 text-white" : "text-slate-500")}
                                    onClick={() => setParetoDimension('nc_type')}
                                >
                                    TIPO
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className={cn("text-[10px] h-8 px-3 rounded-md", paretoDimension === 'category' ? "bg-emerald-600 text-white" : "text-slate-500")}
                                    onClick={() => setParetoDimension('category')}
                                >
                                    CATEGORIA
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className={cn("text-[10px] h-8 px-3 rounded-md", paretoDimension === 'severity' ? "bg-emerald-600 text-white" : "text-slate-500")}
                                    onClick={() => setParetoDimension('severity')}
                                >
                                    GRAVIDADE
                                </Button>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            {toolsConfig.pareto && (
                                <ParetoChart
                                    data={paretoData}
                                    title={`Análise de Pareto: ${paretoDimension === 'nc_type' ? 'Tipo de NC' : paretoDimension === 'category' ? 'Categoria' : 'Gravidade'}`}
                                    description="Visualização da frequência relativa e impacto acumulado."
                                />
                            )}

                            {toolsConfig.correlation && (
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Correlação de Parâmetros</h3>
                                        <div className="w-64">
                                            <SearchableSelect
                                                value={secondaryParameter}
                                                onValueChange={setSecondaryParameter}
                                                options={parameters
                                                    .filter(p => p.id !== selectedParameter)
                                                    .map(p => ({ value: p.id, label: p.name }))
                                                }
                                                placeholder="Selecionar 2º Parâmetro"
                                            />
                                        </div>
                                    </div>

                                    {correlationResult && correlationResult.data ? (
                                        <CorrelationChart
                                            data={correlationResult.data}
                                            correlation={correlationResult.correlation}
                                            xLabel={correlationResult?.param1?.name ?? "X"}
                                            yLabel={correlationResult?.param2?.name ?? "Y"}
                                            title="Diagrama de Dispersão (Scatter)"
                                            description={`Correlação entre ${correlationResult?.param1?.name ?? ""} e ${correlationResult?.param2?.name ?? ""}`}
                                        />
                                    ) : (
                                        <Card className="glass border-slate-800/50 aspect-video flex items-center justify-center text-slate-500 italic">
                                            A carregar dados de correlação...
                                        </Card>
                                    )}
                                </div>
                            )}

                            {toolsConfig.ishikawa && (
                                <div className="lg:col-span-2">
                                    <IshikawaChart
                                        key={`${selectedProduct}-${selectedParameter}-${selectedBatch}-ishikawa`}
                                        effect={currentParameter?.name ? `Desvio de ${currentParameter.name}` : "Anomalia Detectada"}
                                        initialCategories={ishikawaData}
                                        onSave={(cat) => handleSaveAnalysis('ishikawa', cat)}
                                        isSaving={isSavingAnalysis['ishikawa']}
                                    />
                                </div>
                            )}

                            {toolsConfig.fiveWhy && (
                                <div>
                                    <FiveWhyTool
                                        key={`${selectedProduct}-${selectedParameter}-${selectedBatch}-fivewhy`}
                                        problem={currentParameter?.name ? `Por que o parâmetro ${currentParameter.name} saiu do controlo?` : "Porquê o desvio?"}
                                        initialWhys={fiveWhyData}
                                        onSave={(whys) => handleSaveAnalysis('5why', whys)}
                                        isSaving={isSavingAnalysis['5why']}
                                    />
                                </div>
                            )}

                            {toolsConfig.checkSheet && (
                                <div>
                                    <CheckSheet
                                        key={`${selectedProduct}-${selectedParameter}-${selectedBatch}-checksheet`}
                                        initialItems={checkSheetData}
                                        onSave={(items) => handleSaveAnalysis('check_sheet', items)}
                                    />
                                </div>
                            )}

                            {toolsConfig.flowchart && (
                                <div className="lg:col-span-2">
                                    <ProcessFlowchart />
                                </div>
                            )}
                        </div>
                    </TabsContent>
                </Tabs>
            </ClientOnly>
        </div>
    );
}


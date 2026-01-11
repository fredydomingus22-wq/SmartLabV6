"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
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
    TrendingUp,
    Download,
    AlertCircle,
    BarChart3,
    Filter,
    Activity,
    CheckCircle2,
    Database,
    Zap
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
import { IndustrialCard, IndustrialGrid } from "@/components/shared/industrial-card";
import { IndustrialChart } from "@/components/shared/industrial-chart";
import { Box, Typography, Stack } from "@mui/material";

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

    const [selectedSampleType, setSelectedSampleType] = useState(() => {
        const finalType = sampleTypes.find(st => {
            const name = st.name.toLowerCase();
            return name.includes("final") || name.includes("finished");
        });
        return finalType?.id || "all";
    });

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

    const [secondaryParameter, setSecondaryParameter] = useState(parameters[1]?.id || "");
    const [correlationResult, setCorrelationResult] = useState<any>(null);

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

    const [ishikawaData, setIshikawaData] = useState<any>(null);
    const [fiveWhyData, setFiveWhyData] = useState<any>(null);
    const [checkSheetData, setCheckSheetData] = useState<any>(null);
    const [isSavingAnalysis, setIsSavingAnalysis] = useState<Record<string, boolean>>({});

    useEffect(() => {
        if (typeof window !== "undefined") {
            localStorage.setItem("spc_tools_config", JSON.stringify(toolsConfig));
        }
    }, [toolsConfig]);

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
            setCorrelationResult(null);
            getCorrelationDataAction(selectedParameter, secondaryParameter, {
                productId: selectedProduct,
                batchId: selectedBatch,
                startDate,
                endDate,
                sampleTypeId: selectedSampleType !== "all" ? selectedSampleType : undefined
            }).then(setCorrelationResult);
        }
    }, [selectedParameter, secondaryParameter, selectedProduct, selectedBatch, startDate, endDate, selectedSampleType]);

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
        <Box className="space-y-8 pb-20">
            {/* Control Panel */}
            <IndustrialCard
                icon={BarChart3}
                title="SPC Lean Six Sigma Professional"
                subtitle="Análise avançada de variações de processo e estabilidade estatística."
                status="neutral"
                actions={
                    <Stack direction="row" spacing={2} alignItems="center">
                        <DashboardConfig config={toolsConfig} onChange={setToolsConfig} />
                        <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 py-1 text-[10px] font-black uppercase tracking-widest">
                            <Activity className="h-3 w-3 mr-1" /> MONITORIZAÇÃO ATIVA
                        </Badge>
                        <Button variant="outline" size="sm" className="h-8 text-[10px] uppercase font-black tracking-widest bg-slate-900 border-slate-800" onClick={handleExportCSV}>
                            <Download className="h-3 w-3 mr-2" /> Exportar CSV
                        </Button>
                    </Stack>
                }
            >
                <Box className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-5 gap-4 pt-4">
                    <Box className="space-y-1">
                        <Typography className="text-[9px] font-black uppercase tracking-widest text-slate-500 ml-1">Produto</Typography>
                        <SearchableSelect value={selectedProduct} onValueChange={(val) => { setSelectedProduct(val); handleFetchData(val, selectedParameter, selectedBatch, selectedSampleType, startDate, endDate); }} options={products.map(p => ({ value: p.id, label: p.name }))} placeholder="Produto" />
                    </Box>
                    <Box className="space-y-1">
                        <Typography className="text-[9px] font-black uppercase tracking-widest text-slate-500 ml-1">Parâmetro QA</Typography>
                        <SearchableSelect value={selectedParameter} onValueChange={(val) => { setSelectedParameter(val); handleFetchData(selectedProduct, val, selectedBatch, selectedSampleType, startDate, endDate); }} options={parameters.map(p => ({ value: p.id, label: p.name }))} placeholder="Parâmetro" />
                    </Box>
                    <Box className="space-y-1">
                        <Typography className="text-[9px] font-black uppercase tracking-widest text-slate-500 ml-1">Tipo Amostra</Typography>
                        <SearchableSelect value={selectedSampleType} onValueChange={(val) => { setSelectedSampleType(val); handleFetchData(selectedProduct, selectedParameter, selectedBatch, val, startDate, endDate); }} options={[{ value: "all", label: "Tudo" }, ...sampleTypes.map(st => ({ value: st.id, label: st.name }))]} placeholder="Tipo" />
                    </Box>
                    <Box className="space-y-1">
                        <Typography className="text-[9px] font-black uppercase tracking-widest text-slate-500 ml-1">Lote</Typography>
                        <SearchableSelect value={selectedBatch} onValueChange={(val) => { setSelectedBatch(val); handleFetchData(selectedProduct, selectedParameter, val, selectedSampleType, startDate, endDate); }} options={[{ value: "all", label: "Todos os Lotes" }, ...batches.map(b => ({ value: b.id, label: b.code }))]} placeholder="Lote" />
                    </Box>
                    <Box className="space-y-1">
                        <Typography className="text-[9px] font-black uppercase tracking-widest text-slate-500 ml-1">Subgrupo (n)</Typography>
                        <SearchableSelect value={subgroupSize.toString()} onValueChange={(val) => { const sz = parseInt(val); setSubgroupSize(sz); setChartType(sz > 1 ? 'xbar' : 'individual'); handleFetchData(selectedProduct, selectedParameter, selectedBatch, selectedSampleType, startDate, endDate, sz); }} options={["1", "2", "3", "4", "5", "10"].map(v => ({ value: v, label: `n=${v}` }))} placeholder="Tamanho" />
                    </Box>
                </Box>
                <Box className="mt-4 flex gap-2">
                    {['individual', 'xbar', 'r', 's'].map(type => (
                        <Button key={type} variant={chartType === type ? "default" : "outline"} size="sm" disabled={type !== 'individual' && subgroupSize <= 1} className={cn("h-7 text-[9px] font-black uppercase tracking-widest", chartType === type ? "bg-emerald-600 border-none" : "bg-slate-900 border-slate-800 text-slate-400")} onClick={() => setChartType(type as any)}>
                            {type === 'individual' ? 'I-Chart' : type === 'xbar' ? 'X-Bar' : type === 'r' ? 'R-Chart' : 'S-Chart'}
                        </Button>
                    ))}
                </Box>
            </IndustrialCard>

            {/* Statistics */}
            <IndustrialGrid cols={4}>
                <IndustrialCard variant="analytics" title="Capacidade (Cpk)" value={statistics?.cpk?.toFixed(2) || "---"} description="Process capability index" status={(statistics?.cpk || 0) >= 1.33 ? "success" : "error"} trend={{ value: statistics?.cp || 0, isPositive: true }}>
                    <Box className="h-1 w-full bg-slate-800 rounded-full mt-2 overflow-hidden"><Box className="h-full bg-emerald-500" sx={{ width: `${Math.min((statistics?.cpk || 0) * 50, 100)}%` }} /></Box>
                </IndustrialCard>
                <IndustrialCard variant="analytics" title="Performance (Ppk)" value={statistics?.ppk?.toFixed(2) || "---"} description="Process performance index" status="neutral">
                    <Box className="flex items-center gap-2 mt-2"><Typography className="text-[10px] text-slate-500 font-bold">SIGMA (σ):</Typography><Typography className="text-xs font-mono text-white">{statistics?.sigmaShort?.toFixed(3) || "---"}</Typography></Box>
                </IndustrialCard>
                <IndustrialCard variant="analytics" title="Média Central" value={statistics?.mean?.toFixed(2) || "---"} description="Média do processo" status="neutral">
                    <Box className="flex gap-1 mt-3">{[...Array(4)].map((_, i) => <Box key={i} className="h-1 flex-1 bg-blue-500/30 rounded-full" />)}</Box>
                </IndustrialCard>
                <IndustrialCard variant="analytics" title="Alertas de Estabilidade" value={statistics?.violations?.length || "0"} description="Sinais detectados" status={statistics?.violations?.length > 0 ? "warning" : "success"}>
                    <Typography className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-2">{statistics?.violations?.length ? "Nelson Rules Violated" : "Stable Process"}</Typography>
                </IndustrialCard>
            </IndustrialGrid>

            {/* Tabs Content */}
            <ClientOnly>
                <Tabs defaultValue="spc" className="w-full">
                    <TabsList className="bg-slate-950/50 backdrop-blur-xl border border-slate-800 p-1 rounded-2xl h-14 w-full justify-start gap-2">
                        <TabsTrigger value="spc" className="data-[state=active]:bg-blue-600/20 data-[state=active]:text-blue-400 data-[state=active]:border-blue-500/30 border border-transparent rounded-xl px-8 font-black uppercase tracking-widest text-xs h-12 transition-all">
                            Cartas de Controlo SPC
                        </TabsTrigger>
                        <TabsTrigger value="tools" className="data-[state=active]:bg-emerald-600/20 data-[state=active]:text-emerald-400 data-[state=active]:border-emerald-500/30 border border-transparent rounded-xl px-8 font-black uppercase tracking-widest text-xs h-12 transition-all">
                            Ferramentas da Qualidade (7 QC Tools)
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="spc" className="mt-10 space-y-10">
                        <AIAuditorCard onAnalyze={handleAIAnalysis} />
                        <Box className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            <Box className="lg:col-span-2">
                                {data.length > 0 ? (
                                    <>
                                        {chartType === 'individual' && <ControlChart data={chartData} xKey="batch" yKey="value" title="I-Chart: Individuais" ucl={statistics?.ucl} lcl={statistics?.lcl} mean={statistics?.mean} usl={specs?.max_value} lsl={specs?.min_value} target={specs?.target_value} unit={currentParameter?.unit || ""} />}
                                        {chartType === 'xbar' && <ControlChart data={subgroups} xKey="label" yKey="mean" title="X-Bar Chart: Médias" ucl={statistics?.ucl} lcl={statistics?.lcl} mean={statistics?.mean} usl={specs?.max_value} lsl={specs?.min_value} target={specs?.target_value} unit={currentParameter?.unit || ""} />}
                                        {chartType === 'r' && <ControlChart data={subgroups} xKey="label" yKey="range" title="R-Chart: Amplitude" ucl={statistics?.uclR} lcl={statistics?.lclR} mean={statistics?.avgRange} unit={currentParameter?.unit || ""} />}
                                        {chartType === 's' && <ControlChart data={subgroups} xKey="label" yKey="stdDev" title="S-Chart: Desvio Padrão" ucl={statistics?.uclS} lcl={statistics?.lclS} mean={statistics?.avgStdDev} unit={currentParameter?.unit || ""} />}
                                    </>
                                ) : (
                                    <IndustrialCard className="h-[450px] flex items-center justify-center text-slate-500"><Box className="text-center"><Activity className="h-12 w-12 mx-auto mb-4 opacity-10" /><Typography>Selecionar dados para visualizar análise</Typography></Box></IndustrialCard>
                                )}
                            </Box>
                            <Box className="space-y-8">
                                <HistogramChart data={data.map((d: any) => d.value)} lsl={specs?.min_value} usl={specs?.max_value} target={specs?.target_value} unit={currentParameter?.unit || ""} title="Distribuição" />
                                <IndustrialCard title="Limites Técnicos" icon={Zap}>
                                    <Stack spacing={2} className="mt-4">
                                        {[
                                            { label: "USL (LSE)", value: specs?.usl || specs?.max_value, color: "text-red-400" },
                                            { label: "TARGET (ALVO)", value: specs?.target || specs?.target_value, color: "text-emerald-400" },
                                            { label: "LSL (LIE)", value: specs?.lsl || specs?.min_value, color: "text-red-400" }
                                        ].map(s => (
                                            <Box key={s.label} className="flex justify-between p-3 rounded-xl bg-slate-900 border border-slate-800">
                                                <Typography className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{s.label}</Typography>
                                                <Typography className={cn("font-mono font-black", s.color)}>{s.value || "---"}</Typography>
                                            </Box>
                                        ))}
                                    </Stack>
                                </IndustrialCard>
                            </Box>
                        </Box>

                        <IndustrialCard title="Dados de Auditoria (Raw Data)" icon={Database} bodyClassName="p-0">
                            <Table>
                                <TableHeader className="bg-slate-950/50"><TableRow className="border-slate-800"><TableHead className="text-slate-500 font-bold text-[10px] uppercase">Data/Hora</TableHead><TableHead className="text-slate-500 font-bold text-[10px] uppercase">Amostra</TableHead><TableHead className="text-slate-500 font-bold text-[10px] uppercase">Lote</TableHead><TableHead className="text-slate-500 font-bold text-[10px] uppercase text-right">Valor</TableHead><TableHead className="text-slate-400 font-bold text-center text-[10px] uppercase">Estado</TableHead></TableRow></TableHeader>
                                <TableBody>
                                    {data.map((row: any, idx: number) => {
                                        const pointViolations = statistics?.violations?.filter((v: any) => v.pointIndexes.includes(idx));
                                        return (
                                            <TableRow key={row.id} className="border-slate-900 hover:bg-white/5 transition-colors">
                                                <TableCell className="text-slate-400 py-4 font-mono text-[11px]">{format(new Date(row.date), "dd MMM, HH:mm", { locale: ptBR })}</TableCell>
                                                <TableCell className="font-bold text-slate-200">{row.sampleCode || "---"}</TableCell>
                                                <TableCell className="text-slate-500 text-[11px] font-medium">{row.batchCode || "---"}</TableCell>
                                                <TableCell className="text-right font-mono font-black text-blue-400">{row.value}</TableCell>
                                                <TableCell className="text-center">{pointViolations?.length > 0 ? <Badge className="bg-red-500/10 text-red-500 border-none text-[9px] font-black">ANOMALIA</Badge> : <Badge className="bg-emerald-500/5 text-emerald-500/70 border-none text-[9px] font-bold">NORMAL</Badge>}</TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </IndustrialCard>
                    </TabsContent>

                    <TabsContent value="tools" className="mt-10 space-y-10">
                        <Box className="flex justify-end mb-6">
                            <Stack direction="row" className="bg-slate-900 border border-slate-800 p-1 rounded-xl" spacing={1}>
                                {['nc_type', 'category', 'severity'].map(dim => (
                                    <Button key={dim} variant="ghost" size="sm" className={cn("text-[9px] font-black tracking-widest uppercase h-8 px-4 rounded-lg transition-all", paretoDimension === dim ? "bg-emerald-600 text-white" : "text-slate-500")} onClick={() => setParetoDimension(dim as any)}>{dim.replace('_', ' ')}</Button>
                                ))}
                            </Stack>
                        </Box>
                        <Box className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            {toolsConfig.pareto && <ParetoChart data={paretoData} title={`Pareto: ${paretoDimension.toUpperCase()}`} description="Frequência vs. Impacto Acumulado" />}
                            {toolsConfig.correlation && <CorrelationChart data={correlationResult?.points || []} xLabel={currentParameter?.name || "X"} yLabel={parameters.find(p => p.id === secondaryParameter)?.name || "Y"} correlation={correlationResult?.coefficient || 0} title="Análise de Correlação" description="Relação entre variáveis industriais" />}
                        </Box>
                        {toolsConfig.ishikawa && <IshikawaChart effect={`Variação em ${currentParameter?.name}`} initialCategories={ishikawaData?.categories} onSave={(d) => handleSaveAnalysis('ishikawa', d)} isSaving={isSavingAnalysis.ishikawa} />}
                    </TabsContent>
                </Tabs>
            </ClientOnly>
        </Box>
    );
}

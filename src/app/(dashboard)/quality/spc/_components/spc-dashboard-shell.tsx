"use client";

import { useState, useEffect, useCallback } from "react";
import { SPCFilters } from "./spc-filters";
import { SPCKPIDisplay } from "./spc-kpi-display";
import { SPCTrendChart } from "./spc-trend-chart";
import { SPCHistogram } from "./spc-histogram";
import { SPCParetoChart } from "./spc-pareto-chart";
import { SPCCorrelationChart } from "./spc-correlation-chart";
import { SPCIshikawaChart } from "./spc-ishikawa-chart";

import { getSPCDataAction, getParetoDataAction, getCorrelationDataAction, saveQualityAnalysisAction, getQualityAnalysisAction, getProductBatchesAction } from "../actions";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LayoutDashboard, TableProperties, BarChart3, GitCommit, GitPullRequest } from "lucide-react";

interface SPCDashboardProps {
    initialProducts: any[];
    initialParameters: any[];
    sampleTypes: any[];
    allSpecifications: any[];
}

export function SPCDashboardShell({ initialProducts, initialParameters, sampleTypes, allSpecifications }: SPCDashboardProps) {
    const [selectedSampleType, setSelectedSampleType] = useState("all");
    const [selectedProduct, setSelectedProduct] = useState("all");
    const [selectedBatch, setSelectedBatch] = useState("all");
    const [availableBatches, setAvailableBatches] = useState<any[]>([]);
    const [selectedParameter, setSelectedParameter] = useState(initialParameters[0]?.id || "");
    const [startDate, setStartDate] = useState(() => {
        const d = new Date();
        d.setDate(d.getDate() - 30);
        return d.toISOString().split('T')[0];
    });
    const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);

    // SPC Data
    const [data, setData] = useState<any[]>([]);
    const [statistics, setStatistics] = useState<any>(null);
    const [specs, setSpecs] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    // QC Tools Data
    const [paretoData, setParetoData] = useState<any[]>([]);
    const [correlationData, setCorrelationData] = useState<any>(null);
    const [ishikawaData, setIshikawaData] = useState<any>(null);

    // Tools UI State
    const [activeTab, setActiveTab] = useState("spc");
    const [secondaryParameter, setSecondaryParameter] = useState(initialParameters[1]?.id || "");

    // Fetch batches when product changes
    useEffect(() => {
        async function fetchBatches() {
            if (selectedProduct && selectedProduct !== "all") {
                try {
                    const fetchedBatches = await getProductBatchesAction(selectedProduct);
                    setAvailableBatches(fetchedBatches || []);
                } catch (error) {
                    console.error("Error fetching batches:", error);
                    setAvailableBatches([]);
                }
            } else {
                setAvailableBatches([]);
            }
            setSelectedBatch("all");
        }
        fetchBatches();
    }, [selectedProduct]);

    const fetchData = useCallback(async () => {
        if (!selectedParameter) return;

        setLoading(true);
        try {
            const params = {
                productId: selectedProduct === "all" ? undefined : selectedProduct,
                parameterId: selectedParameter,
                batchId: selectedBatch === "all" ? undefined : selectedBatch,
                sampleTypeId: selectedSampleType === "all" ? undefined : selectedSampleType,
                startDate,
                endDate
            };
            console.log("[SPC] Fetching with params:", params);
            const result = await getSPCDataAction(params);

            setData(result.data || []);
            setStatistics(result.statistics || null);
            setSpecs(result.specs || null);
        } catch (error) {
            console.error("SPC Fetch Error:", error);
            toast.error("Erro ao carregar dados SPC");
        } finally {
            setLoading(false);
        }
    }, [selectedProduct, selectedParameter, selectedBatch, selectedSampleType, startDate, endDate]);

    // Fetch QC Tools Data
    const fetchToolsData = useCallback(async () => {
        // Pareto (Global or Product context if implemented)
        getParetoDataAction("nc_type").then(setParetoData);

        // Ishikawa
        getQualityAnalysisAction({
            productId: selectedProduct === "all" ? undefined : selectedProduct,
            parameterId: selectedParameter,
            batchId: selectedBatch === "all" ? undefined : selectedBatch,
            analysisType: 'ishikawa'
        }).then(res => setIshikawaData(res?.data));

    }, [selectedProduct, selectedParameter, selectedBatch]);

    // Fetch Correlation when needed
    useEffect(() => {
        if (activeTab === "correlation" && selectedParameter && secondaryParameter) {
            getCorrelationDataAction(selectedParameter, secondaryParameter, {
                productId: selectedProduct === "all" ? undefined : selectedProduct,
                batchId: selectedBatch === "all" ? undefined : selectedBatch,
                startDate,
                endDate
            }).then(setCorrelationData);
        }
    }, [activeTab, selectedParameter, secondaryParameter, selectedProduct, selectedBatch, startDate, endDate]);


    // Initial load & Filter change effect
    useEffect(() => {
        fetchData();
        fetchToolsData();
    }, [fetchData, fetchToolsData]);


    const handleSaveIshikawa = async (nodesEdges: any) => {
        try {
            await saveQualityAnalysisAction({
                productId: selectedProduct === "all" ? undefined : selectedProduct,
                parameterId: selectedParameter,
                batchId: selectedBatch === "all" ? undefined : selectedBatch,
                analysisType: 'ishikawa',
                data: nodesEdges
            });
            toast.success("Diagrama de Ishikawa guardado com sucesso!");
        } catch (e) {
            toast.error("Erro ao salvar diagrama");
        }
    };

    // Correlation Logic
    const filteredProducts = initialProducts.filter(p => {
        if (selectedSampleType === "all") return true;
        return allSpecifications.some(s => s.product_id === p.id && s.sample_type_id === selectedSampleType);
    });

    const filteredParameters = initialParameters.filter(p => {
        // Must have at least one specification to be relevant for SPC
        const hasSpecs = allSpecifications.some(s => s.qa_parameter_id === p.id);
        if (!hasSpecs) return false;

        let match = true;
        if (selectedSampleType !== "all") {
            match = match && allSpecifications.some(s => s.qa_parameter_id === p.id && s.sample_type_id === selectedSampleType);
        }
        if (selectedProduct !== "all") {
            match = match && allSpecifications.some(s => s.qa_parameter_id === p.id && s.product_id === selectedProduct);
        }
        return match;
    });

    // Reset parameter if it's no longer valid in the filtered list (must be after declaration)
    useEffect(() => {
        if (filteredParameters.length > 0 && !filteredParameters.some(p => p.id === selectedParameter)) {
            setSelectedParameter(filteredParameters[0].id);
        }
    }, [filteredParameters, selectedParameter]);

    return (
        <div className="flex h-[calc(100vh-100px)] overflow-hidden rounded-xl border border-white/10 bg-slate-950 shadow-2xl">
            {/* Sidebar */}
            <div className="w-80 flex-shrink-0 hidden md:block">
                <SPCFilters
                    products={filteredProducts}
                    parameters={filteredParameters}
                    sampleTypes={sampleTypes}
                    batches={availableBatches}
                    selectedSampleType={selectedSampleType}
                    onSampleTypeChange={(val) => {
                        setSelectedSampleType(val);
                        setSelectedProduct("all"); // Reset product when sample type changes
                    }}
                    selectedProduct={selectedProduct}
                    onProductChange={setSelectedProduct}
                    selectedBatch={selectedBatch}
                    onBatchChange={setSelectedBatch}
                    selectedParameter={selectedParameter}
                    onParameterChange={setSelectedParameter}
                    startDate={startDate}
                    onStartDateChange={setStartDate}
                    endDate={endDate}
                    onEndDateChange={setEndDate}
                />
            </div>

            {/* Main Content */}
            <div className="flex-1 min-w-0 bg-[url('/grid.svg')] bg-repeat bg-[length:32px_32px]">
                <ScrollArea className="h-full w-full">
                    <div className="p-6 space-y-6 max-w-7xl mx-auto">

                        {/* Header Stats */}
                        <SPCKPIDisplay statistics={statistics} loading={loading} />

                        {/* Chart Area */}
                        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                            <div className="flex items-center justify-between mb-4">
                                <TabsList className="bg-slate-900 border border-white/10 h-10">
                                    <TabsTrigger value="spc" className="text-xs uppercase data-[state=active]:bg-indigo-500/20 data-[state=active]:text-indigo-400"><LayoutDashboard className="h-3 w-3 mr-2" /> SPC</TabsTrigger>
                                    <TabsTrigger value="pareto" className="text-xs uppercase data-[state=active]:bg-indigo-500/20 data-[state=active]:text-indigo-400"><BarChart3 className="h-3 w-3 mr-2" /> Pareto</TabsTrigger>
                                    <TabsTrigger value="ishikawa" className="text-xs uppercase data-[state=active]:bg-indigo-500/20 data-[state=active]:text-indigo-400"><GitPullRequest className="h-3 w-3 mr-2" /> Ishikawa</TabsTrigger>
                                    <TabsTrigger value="correlation" className="text-xs uppercase data-[state=active]:bg-indigo-500/20 data-[state=active]:text-indigo-400"><GitCommit className="h-3 w-3 mr-2" /> Correlação</TabsTrigger>
                                </TabsList>
                            </div>

                            <TabsContent value="spc" className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
                                <div className="grid grid-cols-1 gap-6">
                                    <SPCTrendChart
                                        data={data}
                                        ucl={statistics?.ucl || 0}
                                        lcl={statistics?.lcl || 0}
                                        mean={statistics?.mean || 0}
                                        usl={specs?.max_value}
                                        lsl={specs?.min_value}
                                        target={specs?.target_value}
                                        loading={loading}
                                        unit=""
                                    />

                                    <SPCHistogram
                                        data={data.map(d => d.value)}
                                        unit=""
                                        loading={loading}
                                    />
                                </div>
                            </TabsContent>

                            <TabsContent value="pareto" className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                                <SPCParetoChart data={paretoData} title="Análise de Pareto: Incidência de Não Conformidades" loading={loading} />
                            </TabsContent>

                            <TabsContent value="ishikawa" className="h-[600px] animate-in fade-in slide-in-from-bottom-2 duration-500">
                                <SPCIshikawaChart
                                    effect={`Variação em ${initialParameters.find(p => p.id === selectedParameter)?.name || 'Processo'}`}
                                    description="Análise de Causa-Raiz (Método 6M)"
                                    initialCategories={ishikawaData?.categories}
                                    onSave={handleSaveIshikawa}
                                />
                            </TabsContent>

                            <TabsContent value="correlation" className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
                                <div className="flex gap-4 items-center bg-slate-900 p-4 rounded-lg border border-white/10">
                                    <span className="text-xs text-slate-400 font-black uppercase tracking-widest italic">Análise de Correlação:</span>
                                    <Select value={secondaryParameter} onValueChange={setSecondaryParameter}>
                                        <SelectTrigger className="w-[200px] h-8 text-xs bg-slate-950 border-white/20">
                                            <SelectValue placeholder="Selecione..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {initialParameters.map(p => (
                                                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <SPCCorrelationChart
                                    data={correlationData?.data || []}
                                    correlation={correlationData?.correlation || 0}
                                    xLabel={initialParameters.find(p => p.id === selectedParameter)?.name || "Parâmetro X"}
                                    yLabel={initialParameters.find(p => p.id === secondaryParameter)?.name || "Parâmetro Y"}
                                    loading={!correlationData}
                                />
                            </TabsContent>
                        </Tabs>
                    </div>
                </ScrollArea>
            </div>
        </div>
    );
}

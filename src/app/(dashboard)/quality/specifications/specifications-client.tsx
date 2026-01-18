"use client";

import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Target,
    Activity,
    ShieldAlert,
    FileText,
    Globe,
    Scale,
    ClipboardList,
    Settings2,
    Beaker,
    Microscope,
    Info,
    ChevronRight,
    Search,
    FlaskConical
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/layout/page-header";
import { KPISparkCard } from "@/components/ui/kpi-spark-card";
import { cn } from "@/lib/utils";
import { ProductSelector } from "./product-selector";
import { SpecDialog } from "./spec-dialog";
import { CopySpecsDialog } from "./copy-specs-dialog";
import { isFinishedProduct, isIntermediateProduct } from "@/lib/constants/lab";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
    HoverCard,
    HoverCardContent,
    HoverCardTrigger,
} from "@/components/ui/hover-card";

export function SpecificationsClient({
    specifications,
    selectedProductId,
    isGlobalMode,
    products,
    sampleTypes,
    samplingPoints,
    availableParameters
}: any) {

    const [activeTab, setActiveTab] = React.useState("finished");

    const getCategoryColor = (cat: string) => {
        const colors: Record<string, string> = {
            physico_chemical: "text-blue-400",
            microbiological: "text-emerald-400",
            sensory: "text-purple-400",
            process: "text-amber-400",
            other: "text-slate-400"
        };
        return colors[cat] || "text-slate-400";
    };

    const getFrequencyLabel = (freq: string) => {
        const labels: Record<string, string> = {
            per_batch: "Por Lote",
            hourly: "Horária",
            per_shift: "Por Turno",
            daily: "Diária",
            weekly: "Semanal"
        };
        return labels[freq] || freq;
    };

    const mockData1 = [10, 12, 11, 13, 12, 14, 13].map(v => ({ value: v }));
    const mockData2 = [2, 3, 2, 4, 3, 4, 4].map(v => ({ value: v }));
    const mockData3 = [4, 4, 5, 5, 4, 5, 5].map(v => ({ value: v }));

    return (
        <div className="space-y-6 px-6 pb-20">
            <PageHeader
                title={isGlobalMode ? "Benchmarks Globais" : "Perfil de Especificações"}
                description={isGlobalMode ? "Configurações transversais para monitorização técnica" : "Limites críticos e tolerâncias para conformidade normativa."}
                icon={isGlobalMode ? <Globe className="h-4 w-4" /> : <Scale className="h-4 w-4" />}
                backHref="/quality"
                variant={isGlobalMode ? "emerald" : "purple"}
                actions={selectedProductId && (
                    <div className="flex gap-3">
                        {!isGlobalMode && (
                            <CopySpecsDialog
                                products={products || []}
                                currentProductId={selectedProductId}
                            />
                        )}
                        <SpecDialog
                            mode="create"
                            productId={isGlobalMode ? undefined : selectedProductId}
                            availableParameters={availableParameters}
                            sampleTypes={sampleTypes || []}
                            samplingPoints={samplingPoints || []}
                        />
                    </div>
                )}
            />

            {/* Selector Area - Minimal Shadcn Combobox */}
            <div className="max-w-lg">
                <ProductSelector
                    products={products || []}
                    selectedProductId={selectedProductId}
                />
            </div>

            {!selectedProductId ? (
                <div className="rounded-[2rem] border-2 border-dashed border-slate-800 bg-slate-900/20 p-24 flex flex-col items-center justify-center text-center shadow-inner">
                    <div className="p-6 rounded-3xl bg-slate-950/50 w-24 h-24 flex items-center justify-center mx-auto mb-8 border border-slate-800 shadow-xl">
                        <ClipboardList className="h-12 w-12 text-slate-800" />
                    </div>
                    <h3 className="text-2xl font-black text-white uppercase tracking-tight italic">Aguardando Seleção de SKU</h3>
                    <p className="text-slate-500 max-w-sm mt-4 text-[10px] font-black uppercase tracking-widest leading-relaxed">
                        Selecione um item para visualizar as especificações técnicas ou gerir as diretrizes globais do SGQ.
                    </p>
                </div>
            ) : (
                <>
                    {/* Stats Section - Standardized Height h-[120px] */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <KPISparkCard
                            variant="blue"
                            title="Volume de Parâmetros"
                            value={specifications.length.toString()}
                            description="Especificações Técnicas"
                            icon={<FileText className="h-4 w-4" />}
                            sparklineData={mockData1}
                        />

                        <KPISparkCard
                            variant="rose"
                            title="Limiares Críticos"
                            value={specifications.filter((s: any) => s.is_critical).length.toString()}
                            description="Vigilância Permanente"
                            icon={<ShieldAlert className="h-4 w-4" />}
                            sparklineData={mockData2}
                            trend={5}
                        />

                        <KPISparkCard
                            variant="purple"
                            title="Tipologias"
                            value={new Set(specifications.map((s: any) => s.parameter?.category)).size.toString()}
                            description="Escopo Analítico"
                            icon={<Activity className="h-4 w-4" />}
                            sparklineData={mockData3}
                        />
                    </div>

                    {/* Content Section */}
                    <section className="space-y-6">
                        <div className="flex items-center justify-between px-1">
                            <h2 className="text-[11px] font-black text-slate-500 uppercase italic tracking-[0.2em] flex items-center gap-2">
                                <Target className="h-3 w-3" />
                                Protocolos de Controlo
                            </h2>
                            <Badge variant="outline" className="border-slate-800 text-slate-400 font-black text-[9px] uppercase tracking-widest px-3 py-1 bg-slate-900/50">
                                COMPLIANCE NORMATIVO
                            </Badge>
                        </div>

                        {specifications.length === 0 ? (
                            <div className="rounded-[2rem] border border-slate-800 bg-card p-16 text-center space-y-4 shadow-xl border-dashed">
                                <Target className="h-12 w-12 mx-auto text-slate-800 opacity-50" />
                                <p className="text-slate-500 font-bold uppercase text-[10px] tracking-widest">Nenhuma especificação definida para este produto.</p>
                                <p className="text-[9px] text-slate-600 uppercase font-black tracking-[0.2em]">Adicione especificações ou copie de outro produto.</p>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                <ToggleGroup
                                    type="single"
                                    value={activeTab}
                                    onValueChange={(v) => v && setActiveTab(v)}
                                    className="gap-1 justify-start"
                                >
                                    <ToggleGroupItem
                                        value="finished"
                                        className="px-6 h-9 rounded-md text-[10px] font-black uppercase tracking-widest transition-all bg-transparent text-slate-500 border border-slate-800 data-[state=on]:bg-blue-600 data-[state=on]:text-white data-[state=on]:border-blue-600 hover:text-white hover:bg-slate-800"
                                    >
                                        SKU's Finais
                                    </ToggleGroupItem>
                                    <ToggleGroupItem
                                        value="intermediates"
                                        className="px-6 h-9 rounded-md text-[10px] font-black uppercase tracking-widest transition-all bg-transparent text-slate-500 border border-slate-800 data-[state=on]:bg-purple-600 data-[state=on]:text-white data-[state=on]:border-purple-600 hover:text-white hover:bg-slate-800"
                                    >
                                        Semiacabados (IP)
                                    </ToggleGroupItem>
                                    <ToggleGroupItem
                                        value="others"
                                        className="px-6 h-9 rounded-md text-[10px] font-black uppercase tracking-widest transition-all bg-transparent text-slate-500 border border-slate-800 data-[state=on]:bg-emerald-600 data-[state=on]:text-white data-[state=on]:border-emerald-600 hover:text-white hover:bg-slate-800"
                                    >
                                        Monitorização Lab
                                    </ToggleGroupItem>
                                </ToggleGroup>

                                {activeTab === "finished" && (
                                    <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                                        <LabTypeTabs
                                            specs={specifications.filter((s: any) =>
                                                !s.sample_type_id ||
                                                (s.sample_type?.code ? isFinishedProduct(s.sample_type.code) : false)
                                            )}
                                            productId={selectedProductId}
                                            sampleTypes={sampleTypes || []}
                                            samplingPoints={samplingPoints || []}
                                            getCategoryColor={getCategoryColor}
                                            getFrequencyLabel={getFrequencyLabel}
                                        />
                                    </div>
                                )}

                                {activeTab === "intermediates" && (
                                    <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                                        <LabTypeTabs
                                            specs={specifications.filter((s: any) =>
                                                s.sample_type_id &&
                                                (s.sample_type?.code ? isIntermediateProduct(s.sample_type.code) : false)
                                            )}
                                            productId={selectedProductId}
                                            sampleTypes={sampleTypes || []}
                                            samplingPoints={samplingPoints || []}
                                            getCategoryColor={getCategoryColor}
                                            getFrequencyLabel={getFrequencyLabel}
                                        />
                                    </div>
                                )}

                                {activeTab === "others" && (
                                    <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                                        {(() => {
                                            const otherSpecsGrouped = specifications.filter((s: any) =>
                                                s.sample_type_id &&
                                                (
                                                    !s.sample_type?.code ||
                                                    (!isFinishedProduct(s.sample_type.code) && !isIntermediateProduct(s.sample_type.code))
                                                )
                                            );
                                            if (otherSpecsGrouped.length === 0) {
                                                return (
                                                    <div className="p-16 text-center text-slate-600 font-black uppercase text-[10px] tracking-[0.3em] italic rounded-3xl border border-dashed border-slate-800 bg-slate-950/40 shadow-inner">
                                                        No environmental or auxiliary specifications found.
                                                    </div>
                                                );
                                            }

                                            const groups: Record<string, typeof otherSpecsGrouped> = {};
                                            otherSpecsGrouped.forEach((s: any) => {
                                                const typeName = sampleTypes?.find((t: any) => t.id === s.sample_type_id)?.name || "Other Phase";
                                                if (!groups[typeName]) groups[typeName] = [];
                                                groups[typeName].push(s);
                                            });

                                            return (
                                                <div className="space-y-12">
                                                    {Object.entries(groups).map(([phase, specs]) => (
                                                        <div key={phase} className="space-y-6">
                                                            <div className="flex items-center gap-4">
                                                                <div className="h-px flex-1 bg-slate-800/50" />
                                                                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 whitespace-nowrap px-6 border border-slate-800 py-2 rounded-full bg-slate-900/50 italic shadow-lg">
                                                                    Fase do Lote: <span className="text-white ml-1.5">{phase}</span>
                                                                </h3>
                                                                <div className="h-px flex-1 bg-slate-800/50" />
                                                            </div>
                                                            <LabTypeTabs
                                                                specs={specs}
                                                                productId={selectedProductId}
                                                                sampleTypes={sampleTypes || []}
                                                                samplingPoints={samplingPoints || []}
                                                                getCategoryColor={getCategoryColor}
                                                                getFrequencyLabel={getFrequencyLabel}
                                                            />
                                                        </div>
                                                    ))}
                                                </div>
                                            );
                                        })()}
                                    </div>
                                )}
                            </div>
                        )}
                    </section>
                </>
            )}
        </div>
    );
}

function LabTypeTabs({ specs, productId, sampleTypes, samplingPoints, getCategoryColor, getFrequencyLabel }: any) {
    const fqSpecs = specs.filter((s: any) => s.parameter?.category !== 'microbiological' && s.parameter?.category !== 'process');
    const microSpecs = specs.filter((s: any) => s.parameter?.category === 'microbiological');
    const processSpecs = specs.filter((s: any) => s.parameter?.category === 'process');

    if (specs.length === 0) {
        return (
            <div className="p-16 text-center text-slate-600 font-black uppercase text-[10px] tracking-[0.3em] italic rounded-3xl border border-dashed border-slate-800 bg-slate-950/40 shadow-inner">
                Nenhuma especificação disponível nesta categoria.
            </div>
        );
    }

    return (
        <Tabs defaultValue={fqSpecs.length > 0 ? "fq" : "micro"} className="w-full">
            <TabsList className="bg-transparent h-auto p-0 gap-8 border-b border-white/5 rounded-none flex justify-start mb-8">
                <TabsTrigger
                    value="fq"
                    className="flex items-center gap-2 pb-5 px-4 rounded-none bg-transparent data-[state=active]:bg-transparent border-b-2 border-transparent data-[state=active]:border-blue-500 text-slate-500 data-[state=active]:text-white transition-all group font-black uppercase tracking-[0.2em] text-[10px]"
                >
                    <Beaker className="h-3.5 w-3.5 group-data-[state=active]:text-blue-400 group-data-[state=active]:scale-110 transition-transform" />
                    Físico-Química ({fqSpecs.length})
                </TabsTrigger>
                <TabsTrigger
                    value="micro"
                    className="flex items-center gap-2 pb-5 px-4 rounded-none bg-transparent data-[state=active]:bg-transparent border-b-2 border-transparent data-[state=active]:border-emerald-500 text-slate-500 data-[state=active]:text-white transition-all group font-black uppercase tracking-[0.2em] text-[10px]"
                >
                    <Microscope className="h-3.5 w-3.5 group-data-[state=active]:text-emerald-400 group-data-[state=active]:scale-110 transition-transform" />
                    Microbiologia ({microSpecs.length})
                </TabsTrigger>
                <TabsTrigger
                    value="process"
                    className="flex items-center gap-2 pb-5 px-4 rounded-none bg-transparent data-[state=active]:bg-transparent border-b-2 border-transparent data-[state=active]:border-amber-500 text-slate-500 data-[state=active]:text-white transition-all group font-black uppercase tracking-[0.2em] text-[10px]"
                >
                    <Settings2 className="h-3.5 w-3.5 group-data-[state=active]:text-amber-400 group-data-[state=active]:scale-110 transition-transform" />
                    Eng. de Processo ({processSpecs.length})
                </TabsTrigger>
            </TabsList>

            <TabsContent value="fq" className="mt-0 focus-visible:outline-none">
                <SpecsTable
                    specs={fqSpecs}
                    productId={productId}
                    sampleTypes={sampleTypes}
                    samplingPoints={samplingPoints}
                    getCategoryColor={getCategoryColor}
                    getFrequencyLabel={getFrequencyLabel}
                />
            </TabsContent>

            <TabsContent value="micro" className="mt-0 focus-visible:outline-none">
                <SpecsTable
                    specs={microSpecs}
                    productId={productId}
                    sampleTypes={sampleTypes}
                    samplingPoints={samplingPoints}
                    getCategoryColor={getCategoryColor}
                    getFrequencyLabel={getFrequencyLabel}
                />
            </TabsContent>

            <TabsContent value="process" className="mt-0 focus-visible:outline-none">
                <SpecsTable
                    specs={processSpecs}
                    productId={productId}
                    sampleTypes={sampleTypes}
                    samplingPoints={samplingPoints}
                    getCategoryColor={getCategoryColor}
                    getFrequencyLabel={getFrequencyLabel}
                />
            </TabsContent>
        </Tabs>
    );
}

function SpecsTable({ specs, productId, sampleTypes, samplingPoints, getCategoryColor, getFrequencyLabel }: any) {
    if (specs.length === 0) {
        return <div className="p-12 text-center text-slate-600 font-bold uppercase text-[9px] tracking-widest italic bg-slate-950/20 rounded-2xl border-2 border-dashed border-slate-800">Dataset sem Registos</div>;
    }

    return (
        <Card className="rounded-2xl border border-slate-800 bg-card shadow-2xl overflow-hidden">
            <Table>
                <TableHeader className="bg-slate-900/50">
                    <TableRow className="border-b border-slate-800 hover:bg-transparent">
                        <TableHead className="py-4 px-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] italic">Parâmetro</TableHead>
                        <TableHead className="py-4 px-4 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] italic text-center">Min</TableHead>
                        <TableHead className="py-4 px-4 text-[10px] font-black text-white uppercase tracking-[0.2em] italic text-center">Target</TableHead>
                        <TableHead className="py-4 px-4 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] italic text-center">Max</TableHead>
                        <TableHead className="py-4 px-4 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] italic text-center">Crítico</TableHead>
                        <TableHead className="py-4 px-4 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] italic">Frequência</TableHead>
                        <TableHead className="py-4 px-6 text-right text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] italic">Ação</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {specs.map((spec: any) => (
                        <TableRow key={spec.id} className="group hover:bg-slate-900/40 transition-all border-b border-slate-800/30 last:border-0 border-x-0">
                            <TableCell className="py-3 px-6">
                                <div className="flex items-center gap-4">
                                    <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 group-hover:border-slate-700 transition-all shadow-inner">
                                        <Settings2 className={cn("h-3.5 w-3.5", getCategoryColor(spec.parameter?.category))} />
                                    </div>
                                    <div>
                                        <HoverCard>
                                            <HoverCardTrigger asChild>
                                                <div className="flex items-center gap-1.5 cursor-help">
                                                    <div className="text-sm font-black text-white italic tracking-tight border-b border-transparent group-hover:border-slate-700 transition-all">
                                                        {spec.parameter?.name}
                                                    </div>
                                                    <Info className="h-2.5 w-2.5 text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                </div>
                                            </HoverCardTrigger>
                                            <HoverCardContent className="w-80 bg-slate-950/90 backdrop-blur-xl border-slate-800 shadow-2xl rounded-2xl p-4">
                                                <div className="flex justify-between space-x-4">
                                                    <div className="p-2 rounded-xl bg-blue-500/10 h-max">
                                                        <FlaskConical className="h-5 w-5 text-blue-400" />
                                                    </div>
                                                    <div className="space-y-1 flex-1">
                                                        <h4 className="text-sm font-black uppercase tracking-widest italic text-white">{spec.parameter?.name}</h4>
                                                        <p className="text-[10px] text-slate-400 leading-relaxed font-bold uppercase tracking-tight">
                                                            Código Técnico: <span className="text-blue-400 font-mono italic">{spec.parameter?.code}</span>
                                                        </p>
                                                        <div className="flex items-center pt-2">
                                                            <Activity className="mr-2 h-3 w-3 opacity-70" />
                                                            <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">
                                                                Categoria Industrial: <span className="text-slate-300">{spec.parameter?.category}</span>
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </HoverCardContent>
                                        </HoverCard>
                                        <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-1 flex items-center gap-2">
                                            <span className="text-slate-600 font-mono italic">{spec.parameter?.code}</span>
                                            <span className="h-0.5 w-0.5 rounded-full bg-slate-800" />
                                            <span className="text-indigo-400/80 font-mono italic">{spec.parameter?.unit || "N/A"}</span>
                                        </div>
                                    </div>
                                </div>
                            </TableCell>
                            <TableCell className="py-3 px-4 font-mono text-xs text-slate-400 italic text-center">
                                {spec.min_value ?? "—"}
                            </TableCell>
                            <TableCell className="py-3 px-4 font-mono text-sm font-black text-white italic text-center">
                                {spec.target_value ?? "—"}
                            </TableCell>
                            <TableCell className="py-3 px-4 font-mono text-xs text-slate-400 italic text-center">
                                {spec.max_value ?? "—"}
                            </TableCell>
                            <TableCell className="py-3 px-4 text-center">
                                {spec.is_critical ? (
                                    <div className="inline-flex p-1.5 rounded-lg bg-rose-500/10 border border-rose-500/20 shadow-inner">
                                        <ShieldAlert className="h-3.5 w-3.5 text-rose-500" />
                                    </div>
                                ) : (
                                    <span className="text-slate-800 font-black">—</span>
                                )}
                            </TableCell>
                            <TableCell className="py-3 px-4">
                                <Badge variant="outline" className="text-[9px] font-black uppercase tracking-[0.1em] border-slate-800 text-slate-400 bg-slate-900/50 italic px-2 py-0.5 whitespace-nowrap">
                                    {getFrequencyLabel(spec.sampling_frequency)}
                                </Badge>
                            </TableCell>
                            <TableCell className="py-3 px-6 text-right">
                                <div className="flex justify-end opacity-0 group-hover:opacity-100 transform translate-x-4 group-hover:translate-x-0 transition-all">
                                    <SpecDialog
                                        mode="edit"
                                        productId={productId}
                                        specification={spec}
                                        availableParameters={[]}
                                        sampleTypes={sampleTypes}
                                        samplingPoints={samplingPoints}
                                    />
                                </div>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
            <div className="p-4 bg-slate-950/20 border-t border-slate-800">
                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-600 text-center italic">
                    SmartLab Quality Engine • High-Density Data View
                </p>
            </div>
        </Card>
    );
}

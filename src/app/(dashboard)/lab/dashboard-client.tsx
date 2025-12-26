"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { SampleCard } from "./components/sample-card";
import { SampleTable } from "./components/sample-table";
import { SampleList } from "./components/sample-list";
import { KPICards } from "./components/kpi-cards";
import { FilterControls } from "./components/filter-controls";
import { ResultEntryModal } from "./components/result-entry-modal";
import { CreateSampleDialog } from "./create-sample-dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { LayoutGrid, List, Plus, Search } from "lucide-react";
import { useQueryState } from "nuqs";
import { cn } from "@/lib/utils";

interface DashboardClientProps {
    samples: any[];
    stats: any;
    sampleTypes: any[];
    tanks: any[];
    samplingPoints: any[];
    plantId: string;
    initialLabType?: 'FQ' | 'MICRO' | 'all';
}

export function DashboardClient({
    samples,
    stats,
    sampleTypes,
    tanks,
    samplingPoints,
    plantId,
    initialLabType = 'all'
}: DashboardClientProps) {
    const [viewMode, setViewMode] = useState<"grid" | "list" | "table">("list");
    const [labType, setLabType] = useQueryState("labType", { defaultValue: initialLabType, shallow: false });
    const [status, setStatus] = useQueryState("status", { defaultValue: "all", shallow: false });

    const [selectedSampleId, setSelectedSampleId] = useState<string | null>(null);
    const [isResultModalOpen, setIsResultModalOpen] = useState(false);
    const router = useRouter();

    const handleEnterResults = (sampleId: string) => {
        setSelectedSampleId(sampleId);
        setIsResultModalOpen(true);
    };

    const handleResultSuccess = () => {
        router.refresh();
    };

    return (
        <div className="space-y-4">
            {/* Minimal Header */}
            <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4">
                <div className="flex items-baseline gap-3">
                    <h1 className="text-xl font-bold tracking-tight text-foreground/90 leading-none">
                        Amostras
                    </h1>
                    <div className="hidden sm:block h-3 w-px bg-border/40" />

                    {/* Lab Mode Toggle */}
                    <div className="flex bg-muted/30 p-0.5 rounded-lg border border-border/10">
                        <Button
                            variant="ghost"
                            size="sm"
                            className={cn(
                                "h-7 px-3 text-[10px] font-bold uppercase tracking-widest rounded-md transition-none",
                                labType === 'all' ? "bg-background shadow-sm text-foreground" : "text-muted-foreground/60 hover:text-foreground"
                            )}
                            onClick={() => setLabType('all')}
                        >
                            Geral
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            className={cn(
                                "h-7 px-3 text-[10px] font-bold uppercase tracking-widest rounded-md transition-none",
                                labType === 'FQ' ? "bg-background shadow-sm text-blue-600" : "text-muted-foreground/60 hover:text-foreground"
                            )}
                            onClick={() => setLabType('FQ')}
                        >
                            FQ
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            className={cn(
                                "h-7 px-3 text-[10px] font-bold uppercase tracking-widest rounded-md transition-none",
                                labType === 'MICRO' ? "bg-background shadow-sm text-purple-600" : "text-muted-foreground/60 hover:text-foreground"
                            )}
                            onClick={() => setLabType('MICRO')}
                        >
                            Micro
                        </Button>
                    </div>

                    <div className="hidden sm:block h-3 w-px bg-border/40" />
                    <CreateSampleDialog
                        sampleTypes={sampleTypes}
                        tanks={tanks}
                        samplingPoints={samplingPoints}
                        plantId={plantId}
                    />
                </div>

                <div className="flex items-center gap-1.5 self-end">
                    <Button
                        variant="ghost"
                        size="icon"
                        className={cn("h-7 w-7 rounded-md", viewMode === "grid" && "bg-muted/60 text-primary")}
                        onClick={() => setViewMode("grid")}
                        title="Grelha"
                    >
                        <LayoutGrid className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className={cn("h-7 w-7 rounded-md", viewMode === "list" && "bg-muted/60 text-primary")}
                        onClick={() => setViewMode("list")}
                        title="Lista"
                    >
                        <List className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className={cn("h-7 w-7 rounded-md", viewMode === "table" && "bg-muted/60 text-primary")}
                        onClick={() => setViewMode("table")}
                        title="Tabela"
                    >
                        <Search className="h-3.5 w-3.5" />
                    </Button>
                </div>
            </div>

            <KPICards stats={stats} />

            <div className="pt-2">
                <Tabs value={status} onValueChange={setStatus} className="w-full">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 py-1 border-b border-border/10">
                        <TabsList className="bg-transparent p-0 h-8 gap-6">
                            <TabsTrigger value="all" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none text-[11px] px-0 h-8 font-bold uppercase tracking-widest text-muted-foreground/50">Todas</TabsTrigger>
                            <TabsTrigger value="collected" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none text-[11px] px-0 h-8 font-bold uppercase tracking-widest text-muted-foreground/50">Colhidas</TabsTrigger>
                            <TabsTrigger value="in_analysis" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none text-[11px] px-0 h-8 font-bold uppercase tracking-widest text-muted-foreground/50">Em Análise</TabsTrigger>
                            <TabsTrigger value="reviewed" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none text-[11px] px-0 h-8 font-bold uppercase tracking-widest text-muted-foreground/50">Concluídas</TabsTrigger>
                        </TabsList>
                        <FilterControls variant="compact" />
                    </div>

                    <div className="mt-8 px-0">
                        {samples.length === 0 ? (
                            <div className="text-center py-20 bg-muted/5 rounded-2xl border border-dashed border-border/20">
                                <Search className="h-6 w-6 mx-auto mb-3 text-muted-foreground/20" />
                                <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground/40 text-center">Nenhuma amostra encontrada</p>
                                <Button variant="link" size="sm" onClick={() => {
                                    setStatus("all");
                                    router.push("/lab");
                                }} className="text-blue-600/60 text-[10px] font-bold uppercase tracking-wider mt-2">
                                    Limpar Filtros
                                </Button>
                            </div>
                        ) : viewMode === "grid" ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-6 gap-y-8">
                                {samples.map((sample) => (
                                    <SampleCard
                                        key={sample.id}
                                        sample={sample}
                                        onEnterResults={() => handleEnterResults(sample.id)}
                                    />
                                ))}
                            </div>
                        ) : viewMode === "list" ? (
                            <SampleList
                                samples={samples}
                                onEnterResults={handleEnterResults}
                            />
                        ) : (
                            <SampleTable
                                samples={samples}
                                onEnterResults={handleEnterResults}
                            />
                        )}
                    </div>
                </Tabs>
            </div>

            <ResultEntryModal
                open={isResultModalOpen}
                onOpenChange={setIsResultModalOpen}
                sampleId={selectedSampleId}
                onSuccess={handleResultSuccess}
            />
        </div>
    );
}

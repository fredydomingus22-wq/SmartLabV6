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
import { LayoutGrid, List, Plus, Search, Beaker } from "lucide-react";
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
    users: { id: string, full_name: string | null, role: string }[];
}

import { motion, AnimatePresence } from "framer-motion";

export function DashboardClient({
    samples,
    stats,
    sampleTypes,
    tanks,
    samplingPoints,
    plantId,
    initialLabType = 'all',
    users
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
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Premium Header */}
            <div className="glass p-8 rounded-[2.5rem] border-none shadow-2xl bg-gradient-to-br from-blue-500/10 via-slate-900/50 to-transparent relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 blur-[100px] -mr-32 -mt-32 rounded-full" />

                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 relative z-10">
                    <div className="space-y-4">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-2xl bg-blue-500/20 border border-blue-500/30">
                                <Beaker className="h-6 w-6 text-blue-400" />
                            </div>
                            <div>
                                <h1 className="text-4xl font-black tracking-tighter bg-gradient-to-r from-slate-100 to-slate-400 bg-clip-text text-transparent">
                                    Controlo de Amostras
                                </h1>
                                <p className="text-slate-400 font-medium">
                                    Gestão integrada de análises Físico-Químicas e Microbiológicas
                                </p>
                            </div>
                        </div>

                        {/* Quick Filter / Mode Toggle */}
                        <div className="flex max-w-fit bg-slate-950/50 p-1.5 rounded-2xl border border-slate-800 shadow-inner backdrop-blur-xl">
                            {[
                                { id: 'all', label: 'Global', color: 'text-slate-200' },
                                { id: 'FQ', label: 'Físico-Química', color: 'text-blue-400' },
                                { id: 'MICRO', label: 'Microbiologia', color: 'text-purple-400' }
                            ].map((mode) => (
                                <Button
                                    key={mode.id}
                                    variant="ghost"
                                    size="sm"
                                    className={cn(
                                        "h-9 px-6 text-xs font-bold uppercase tracking-widest rounded-xl transition-all relative overflow-hidden group",
                                        labType === mode.id ? "bg-slate-800 text-white shadow-lg ring-1 ring-slate-700" : "text-slate-500 hover:text-slate-300"
                                    )}
                                    onClick={() => setLabType(mode.id as any)}
                                >
                                    <span className={cn("relative z-10 font-black", labType === mode.id && mode.color)}>{mode.label}</span>
                                    {labType === mode.id && (
                                        <motion.div layoutId="activeTab" className="absolute inset-0 bg-gradient-to-r from-white/5 to-transparent" />
                                    )}
                                </Button>
                            ))}
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-4">
                        <CreateSampleDialog
                            sampleTypes={sampleTypes}
                            tanks={tanks}
                            samplingPoints={samplingPoints}
                            plantId={plantId}
                            users={users}
                        />

                        <div className="h-10 w-px bg-slate-800 hidden sm:block mx-2" />

                        <div className="flex bg-slate-950/50 p-1 rounded-xl border border-slate-800 shadow-inner">
                            <Button
                                variant="ghost"
                                size="icon"
                                className={cn("h-9 w-9 rounded-lg transition-all", viewMode === "grid" ? "bg-slate-800 text-blue-400" : "text-slate-500")}
                                onClick={() => setViewMode("grid")}
                            >
                                <LayoutGrid className="h-4 w-4" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                className={cn("h-9 w-9 rounded-lg transition-all", viewMode === "list" ? "bg-slate-800 text-blue-400" : "text-slate-500")}
                                onClick={() => setViewMode("list")}
                            >
                                <List className="h-4 w-4" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                className={cn("h-9 w-9 rounded-lg transition-all", viewMode === "table" ? "bg-slate-800 text-blue-400" : "text-slate-500")}
                                onClick={() => setViewMode("table")}
                            >
                                <Search className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            <KPICards stats={stats} />

            <div className="pt-4">
                <Tabs value={status} onValueChange={setStatus} className="w-full">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-800/50">
                        <TabsList className="bg-slate-950/50 p-1.5 rounded-2xl border border-slate-800 shadow-inner h-12">
                            {[
                                { id: 'all', label: 'Todas', color: 'bg-slate-800 text-slate-100' },
                                { id: 'collected', label: 'Colhidas', color: 'data-[state=active]:bg-blue-500/10 data-[state=active]:text-blue-400' },
                                { id: 'in_analysis', label: 'Análise', color: 'data-[state=active]:bg-amber-500/10 data-[state=active]:text-amber-400' },
                                { id: 'under_review', label: 'Em Revisão', color: 'data-[state=active]:bg-purple-500/10 data-[state=active]:text-purple-400' },
                                { id: 'approved', label: 'Aprovadas', color: 'data-[state=active]:bg-emerald-500/10 data-[state=active]:text-emerald-400' }
                            ].map((tab) => (
                                <TabsTrigger
                                    key={tab.id}
                                    value={tab.id}
                                    className={cn(
                                        "rounded-xl text-[11px] px-6 h-9 font-black uppercase tracking-widest transition-all data-[state=active]:shadow-lg border border-transparent data-[state=active]:border-white/5",
                                        tab.color
                                    )}
                                >
                                    {tab.label}
                                </TabsTrigger>
                            ))}
                        </TabsList>
                        <div className="flex items-center gap-3">
                            <FilterControls variant="compact" />
                        </div>
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

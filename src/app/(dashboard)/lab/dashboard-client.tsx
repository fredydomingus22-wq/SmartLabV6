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
    userRole: string; // Added to fix lint and support filtering
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
    userRole,
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
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 glass rounded-[2rem] border-white/5 bg-slate-900/40">
                <div className="flex items-center gap-1">
                    {[
                        { id: 'all', label: 'Global', roles: ['admin', 'qa_manager', 'quality', 'qc_supervisor', 'auditor'] },
                        { id: 'FQ', label: 'Físico-Química', roles: ['admin', 'qa_manager', 'quality', 'qc_supervisor', 'lab_analyst', 'auditor'] },
                        { id: 'MICRO', label: 'Microbiologia', roles: ['admin', 'qa_manager', 'quality', 'qc_supervisor', 'micro_analyst', 'auditor'] }
                    ]
                        .filter(m => !m.roles || m.roles.includes(userRole))
                        .map((mode) => (
                            <Button
                                key={mode.id}
                                variant="ghost"
                                onClick={() => setLabType(mode.id as any)}
                                className={cn(
                                    "px-6 h-9 text-[10px] font-black uppercase tracking-[0.2em] rounded-xl transition-all",
                                    labType === mode.id
                                        ? "bg-blue-500/10 text-blue-400 border border-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.1)]"
                                        : "text-slate-500 hover:text-slate-300 hover:bg-white/[0.03]"
                                )}
                            >
                                {mode.label}
                            </Button>
                        ))}
                </div>
                <div className="flex items-center gap-2">
                    <CreateSampleDialog
                        sampleTypes={sampleTypes}
                        tanks={tanks}
                        samplingPoints={samplingPoints}
                        plantId={plantId}
                        users={users}
                    />
                    <div className="flex bg-slate-950/40 p-1 rounded-xl border border-white/5 shadow-inner">
                        {[
                            { id: "list", icon: List, label: "Lista" },
                            { id: "grid", icon: LayoutGrid, label: "Grelha" },
                            { id: "table", icon: Search, label: "Tabela" }
                        ].map((mode) => (
                            <Button
                                key={mode.id}
                                variant="ghost"
                                size="icon"
                                className={cn(
                                    "h-9 w-9 rounded-lg transition-all",
                                    viewMode === mode.id
                                        ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20"
                                        : "text-slate-500 hover:text-slate-300 hover:bg-white/[0.03]"
                                )}
                                onClick={() => setViewMode(mode.id as any)}
                                title={mode.label}
                            >
                                <mode.icon className="h-4 w-4" />
                            </Button>
                        ))}
                    </div>
                </div>
            </div>

            <KPICards stats={stats} />

            <div className="pt-4">
                <Tabs value={status} onValueChange={setStatus} className="w-full">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-white/5">
                        <TabsList className="bg-slate-950/60 p-1.5 rounded-3xl border border-white/5 shadow-inner h-14">
                            {[
                                { id: 'all', label: 'Todas', color: 'data-[state=active]:bg-white/10 data-[state=active]:text-white' },
                                { id: 'collected', label: 'Colhidas', color: 'data-[state=active]:bg-blue-500/10 data-[state=active]:text-blue-400' },
                                { id: 'in_analysis', label: 'Análise', color: 'data-[state=active]:bg-amber-500/10 data-[state=active]:text-amber-400' },
                                { id: 'under_review', label: 'Em Revisão', color: 'data-[state=active]:bg-purple-500/10 data-[state=active]:text-purple-400' },
                                { id: 'approved', label: 'Aprovadas', color: 'data-[state=active]:bg-emerald-500/10 data-[state=active]:text-emerald-400' }
                            ].map((tab) => (
                                <TabsTrigger
                                    key={tab.id}
                                    value={tab.id}
                                    className={cn(
                                        "rounded-2xl text-[10px] px-8 h-full font-black uppercase tracking-widest transition-all data-[state=active]:shadow-lg border border-transparent data-[state=active]:border-white/5 italic",
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

                    <div className="mt-10 px-0">
                        {samples.length === 0 ? (
                            <div className="text-center py-24 bg-slate-950/20 rounded-3xl border-2 border-dashed border-white/5">
                                <Search className="h-8 w-8 mx-auto mb-4 text-slate-700" />
                                <p className="text-[11px] uppercase font-black tracking-[0.2em] text-slate-600">Nenhuma amostra encontrada</p>
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

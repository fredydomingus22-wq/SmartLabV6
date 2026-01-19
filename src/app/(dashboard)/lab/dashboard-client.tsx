"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";

import { SampleCard } from "./components/sample-card";
import { SampleTable } from "./components/sample-table";
import { SampleList } from "./components/sample-list";
import { KPICards, LabStats } from "./components/kpi-cards";
import { FilterControls } from "./components/filter-controls";
import { ResultEntryModal } from "./components/result-entry-modal";
import { CreateSampleDialog } from "./create-sample-dialog";

import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/layout/page-header";
import { Beaker, FlaskConical, Microscope, LayoutGrid, List, Search as SearchIcon, Table as TableIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface DashboardClientProps {
    samples: any[];
    stats: any;
    sampleTypes: any[];
    tanks: any[];
    samplingPoints: any[];
    plantId: string;
    userRole: string;
    initialLabType?: 'FQ' | 'MICRO' | 'all';
    users: any[];
}

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
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [viewMode, setViewMode] = useState<"grid" | "list" | "table">("list");

    // Manual URL state
    const labType = searchParams.get("labType") || initialLabType || "all";
    const status = searchParams.get("status") || "all";

    const setLabType = (val: string) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set("labType", val);
        router.push(`${pathname}?${params.toString()}`);
    };

    const setStatus = (val: string) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set("status", val);
        router.push(`${pathname}?${params.toString()}`);
    };

    const [selectedSampleId, setSelectedSampleId] = useState<string | null>(null);
    const [isResultModalOpen, setIsResultModalOpen] = useState(false);
    const [isPending, startTransition] = useTransition();

    const handleEnterResults = (sampleId: string) => {
        setSelectedSampleId(sampleId);
        setIsResultModalOpen(true);
    };

    const handleResultSuccess = () => {
        startTransition(() => {
            router.refresh();
        });
    };

    const headerTitle = userRole === 'lab_analyst' ? 'Laboratório FQ' : userRole === 'micro_analyst' ? 'Laboratório Micro' : 'Controlo de Amostras';
    const HeaderIcon = userRole === 'lab_analyst' ? FlaskConical : userRole === 'micro_analyst' ? Microscope : Beaker;
    const headerDesc = userRole === 'lab_analyst'
        ? 'Gestão de Análises Físico-Químicas e Controlo de Processo'
        : userRole === 'micro_analyst'
            ? 'Gestão de Análises Microbiológicas e Incubação'
            : 'Gestão Integrada de Análises Físico-Químicas e Microbiológicas';

    return (
        <div className="flex flex-col animate-in fade-in duration-500">
            <PageHeader
                variant="blue"
                icon={<HeaderIcon className="h-5 w-5" />}
                overline="Laboratory Operations"
                title={headerTitle}
                description={headerDesc}
                collapsible
                actions={
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1 p-1 bg-slate-930/40 border border-white/5 rounded-xl h-10 w-fit">
                            {[
                                { id: 'all', label: 'Global', roles: ['admin', 'qa_manager', 'quality', 'qc_supervisor', 'auditor'] },
                                { id: 'FQ', label: 'FQ', roles: ['admin', 'qa_manager', 'quality', 'qc_supervisor', 'lab_analyst', 'auditor'] },
                                { id: 'MICRO', label: 'Micro', roles: ['admin', 'qa_manager', 'quality', 'qc_supervisor', 'micro_analyst', 'auditor'] }
                            ]
                                .filter(m => !m.roles || m.roles.includes(userRole))
                                .map((mode) => (
                                    <Button
                                        key={mode.id}
                                        variant="ghost"
                                        onClick={() => setLabType(mode.id as any)}
                                        className={cn(
                                            "px-4 h-8 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all",
                                            labType === mode.id
                                                ? "bg-blue-500 text-white shadow-lg shadow-blue-500/20"
                                                : "text-slate-500 hover:text-slate-300 hover:bg-white/5"
                                        )}
                                    >
                                        {mode.label}
                                    </Button>
                                ))}
                        </div>
                        <CreateSampleDialog
                            sampleTypes={sampleTypes}
                            tanks={tanks}
                            samplingPoints={samplingPoints}
                            plantId={plantId}
                            users={users}
                        />
                    </div>
                }
            />

            <div className="px-6 space-y-8 mt-6">
                <KPICards stats={stats as LabStats} />

                <div className="pt-4">
                    <Tabs value={status || "all"} onValueChange={setStatus} className="w-full">
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
                            <div className="flex items-center gap-6">
                                <div className="flex items-center gap-1 p-1 bg-slate-950/40 border border-white/5 rounded-xl h-10">
                                    {[
                                        { id: "grid", icon: LayoutGrid },
                                        { id: "list", icon: List },
                                        { id: "table", icon: TableIcon }
                                    ].map((mode) => (
                                        <Button
                                            key={mode.id}
                                            variant="ghost"
                                            size="icon"
                                            className={cn(
                                                "h-8 w-8 rounded-lg",
                                                viewMode === mode.id ? "bg-white/10 text-white" : "text-slate-500"
                                            )}
                                            onClick={() => setViewMode(mode.id as any)}
                                        >
                                            <mode.icon className="h-4 w-4" />
                                        </Button>
                                    ))}
                                </div>
                                <FilterControls />
                            </div>
                        </div>

                        <div className="mt-10 px-0">
                            {samples.length === 0 ? (
                                <div className="text-center py-24 bg-slate-950/20 rounded-3xl border-2 border-dashed border-white/5">
                                    <SearchIcon className="h-8 w-8 mx-auto mb-4 text-slate-700" />
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
                                    {samples.map((sample: any) => (
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
        </div>
    );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { SampleCard } from "./components/sample-card";
import { KPICards } from "./components/kpi-cards";
import { FilterControls } from "./components/filter-controls";
import { ResultEntryModal } from "./components/result-entry-modal";
import { CreateSampleDialog } from "./create-sample-dialog";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { toast } from "sonner";

interface DashboardClientProps {
    samples: any[];
    stats: {
        total: number;
        pending: number;
        in_analysis: number;
        completed: number;
        tat: string;
        approval_rate: number;
        compliance_rate: number;
        approved_today: number;
    };
    sampleTypes: any[];
    tanks: any[];
    samplingPoints: any[];
    plantId: string;
}

export function DashboardClient({ samples, stats, sampleTypes, tanks, samplingPoints, plantId }: DashboardClientProps) {
    const router = useRouter();
    const [selectedSampleId, setSelectedSampleId] = useState<string | null>(null);
    const [isResultModalOpen, setIsResultModalOpen] = useState(false);

    const handleEnterResults = (sampleId: string) => {
        setSelectedSampleId(sampleId);
        setIsResultModalOpen(true);
    };

    const handleResultSuccess = () => {
        router.refresh();
        // toast.success("Dashboard atualizado"); // Modal already shows success toast
    };

    return (
        <div className="space-y-6">
            {/* Mobile Sticky Header */}
            <div className="md:hidden sticky -top-3 -mx-3 px-3 py-3 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b flex items-center justify-between mb-4 shadow-sm">
                <span className="font-bold text-lg">Gestão de Amostras</span>
                <CreateSampleDialog
                    sampleTypes={sampleTypes}
                    tanks={tanks}
                    samplingPoints={samplingPoints}
                    plantId={plantId}
                />
            </div>

            {/* Desktop Header / Stats */}
            <div className="hidden md:flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-foreground">Gestão de Amostras</h1>
                    <p className="text-muted-foreground">Monitorização e registo de análises em tempo real.</p>
                </div>
                <div className="flex items-center gap-2">
                    <CreateSampleDialog
                        sampleTypes={sampleTypes}
                        tanks={tanks}
                        samplingPoints={samplingPoints}
                        plantId={plantId}
                    />
                </div>
            </div>

            <KPICards stats={stats} />

            <div className="space-y-4">
                <FilterControls />

                {/* Results Grid */}
                {samples.length === 0 ? (
                    <div className="text-center py-20 bg-muted/30 rounded-lg border border-dashed border-border">
                        <p className="text-muted-foreground">Nenhuma amostra encontrada com os filtros selecionados.</p>
                        <Button variant="link" onClick={() => router.push("/lab")}>Limpar filtros</Button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {samples.map((sample) => (
                            <SampleCard
                                key={sample.id}
                                sample={sample}
                                onEnterResults={() => handleEnterResults(sample.id)}
                            />
                        ))}
                    </div>
                )}
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

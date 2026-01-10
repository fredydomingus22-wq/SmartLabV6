"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardFooter
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
    Beaker,
    ChevronRight,
    CheckCircle2,
    Clock,
    MoreHorizontal,
    Microscope,
    FlaskConical,
    ExternalLink,
    AlertTriangle
} from "lucide-react";
import { updateSampleStatusAction } from "@/app/actions/lab";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { ResultEntryModal } from "@/app/(dashboard)/lab/components/result-entry-modal";
import { ApproveSampleDialog } from "@/app/(dashboard)/lab/approve-sample-dialog";

interface KanbanSample {
    id: string;
    code: string;
    status: string;
    collected_at: string | null;
    totalAnalyses: number;
    completedAnalyses: number;
    progress: number;
    sample_type?: { id: string; name: string };
    batch?: { id: string; code: string; product: { id: string; name: string } };
}

interface KanbanBoardProps {
    initialSamples: KanbanSample[];
}

const COLUMNS = [
    { id: "collected", title: "Pending", icon: Clock, color: "text-blue-500" },
    { id: "in_analysis", title: "In Analysis", icon: Beaker, color: "text-amber-500" },
    { id: "reviewed", title: "Ready for Approval", icon: Microscope, color: "text-purple-500" },
    { id: "approved", title: "Released", icon: CheckCircle2, color: "text-green-500" },
];

export function KanbanBoard({ initialSamples }: KanbanBoardProps) {
    const [samples, setSamples] = useState(initialSamples);
    const [selectedSampleId, setSelectedSampleId] = useState<string | null>(null);
    const [isEntryOpen, setIsEntryOpen] = useState(false);
    const router = useRouter();

    const handleOpenEntry = (id: string) => {
        setSelectedSampleId(id);
        setIsEntryOpen(true);
    };

    const handleStatusUpdate = async (id: string, newStatus: string) => {
        if (newStatus === "open_entry") {
            handleOpenEntry(id);
            return;
        }

        const res = await updateSampleStatusAction({ id, status: newStatus });
        if (res.success) {
            setSamples(prev => prev.map(s => s.id === id ? { ...s, status: newStatus } : s));
            toast.success(`Moved to ${newStatus}`);
            router.refresh();
        } else {
            toast.error(res.message);
        }
    };

    const getColumnSamples = (status: string) => {
        return samples.filter(s => {
            if (status === "approved") {
                return s.status === "approved" || s.status === "rejected";
            }
            if (status === "collected") {
                return s.status === "collected" || s.status === "pending";
            }
            return s.status === status;
        });
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 min-h-[70vh]">
            {COLUMNS.map(column => (
                <div key={column.id} className="flex flex-col gap-4">
                    <div className="flex items-center justify-between px-2">
                        <div className="flex items-center gap-2">
                            <column.icon className={`h-5 w-5 ${column.color}`} />
                            <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">
                                {column.title}
                            </h3>
                        </div>
                        <Badge variant="secondary" className="font-mono">
                            {getColumnSamples(column.id).length}
                        </Badge>
                    </div>

                    <div className="flex-1 bg-slate-50/50 dark:bg-slate-900/20 rounded-xl p-3 border border-dashed border-slate-200 dark:border-slate-800 space-y-4 overflow-y-auto max-h-[75vh] custom-scrollbar">
                        {getColumnSamples(column.id).map(sample => (
                            <SampleCard
                                key={sample.id}
                                sample={sample}
                                onMove={handleStatusUpdate}
                            />
                        ))}
                        {getColumnSamples(column.id).length === 0 && (
                            <div className="flex flex-col items-center justify-center py-10 opacity-40 select-none">
                                <FlaskConical className="h-10 w-10 mb-2 stroke-1" />
                                <p className="text-xs">No samples</p>
                            </div>
                        )}
                    </div>
                </div>
            ))}

            <ResultEntryModal
                open={isEntryOpen}
                onOpenChange={setIsEntryOpen}
                sampleId={selectedSampleId}
                onSuccess={() => router.refresh()}
            />
        </div>
    );
}

function SampleCard({ sample, onMove }: { sample: KanbanSample, onMove: (id: string, status: string) => void }) {
    const isReadyForReview = sample.progress === 100 && sample.status === "in_analysis";
    const isRejected = sample.status === "rejected";
    const isApproved = sample.status === "approved";

    // Aging time logic
    const agingTime = useMemo(() => {
        if (!sample.collected_at) return null;
        return formatDistanceToNow(new Date(sample.collected_at), { addSuffix: true });
    }, [sample.collected_at]);

    // Priority logic: Tank or Intermediate Product samples are usually critical
    const isCritical = sample.sample_type?.name.toLowerCase().includes("tank") ||
        sample.sample_type?.name.toLowerCase().includes("intermediate");

    return (
        <Card className={`group shadow-sm hover:shadow-md transition-all border-none cursor-default overflow-hidden ${isCritical ? 'ring-1 ring-amber-500/30' : ''
            }`}>
            <CardHeader className="p-3 pb-2 bg-white dark:bg-slate-950 relative">
                <div className="flex justify-between items-start">
                    <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                            <p className="text-[10px] font-mono font-bold text-muted-foreground uppercase">
                                {sample.sample_type?.name}
                            </p>
                            {isCritical && (
                                <Badge variant="outline" className="h-4 text-[9px] px-1 py-0 border-amber-500 text-amber-600 bg-amber-50 uppercase">
                                    Critical
                                </Badge>
                            )}
                        </div>
                        <Link
                            href={`/lab/samples/${sample.id}`}
                            className="text-sm font-bold tracking-tight hover:text-blue-600 flex items-center gap-1 group/link"
                        >
                            {sample.code}
                            <ExternalLink className="h-3 w-3 opacity-0 group-hover/link:opacity-100 transition-opacity" />
                        </Link>
                    </div>
                    {isRejected && (
                        <Badge variant="destructive" className="text-[9px] uppercase">Rejected</Badge>
                    )}
                    {isApproved && (
                        <Badge variant="default" className="text-[9px] uppercase bg-green-500">Released</Badge>
                    )}
                </div>
                {agingTime && (
                    <div className="flex items-center gap-1 text-[10px] text-muted-foreground mt-1">
                        <Clock className="h-3 w-3" />
                        {agingTime}
                    </div>
                )}
            </CardHeader>
            <CardContent className="p-3 pt-2 space-y-3 bg-white dark:bg-slate-950">
                <div className="flex flex-col gap-1">
                    <div className="flex justify-between text-[10px] text-muted-foreground">
                        <span>Analysis</span>
                        <span className="font-mono">{sample.completedAnalyses}/{sample.totalAnalyses}</span>
                    </div>
                    <Progress value={sample.progress} className="h-1" color={sample.progress === 100 ? "bg-green-500" : ""} />
                </div>

                <div className="bg-slate-100/50 dark:bg-slate-800/50 rounded-lg p-2 space-y-1">
                    <p className="text-[11px] font-medium truncate">
                        {sample.batch?.product?.name || "No Product"}
                    </p>
                    <p className="text-[10px] text-muted-foreground font-mono">
                        Batch: {sample.batch?.code || "N/A"}
                    </p>
                </div>
            </CardContent>
            <CardFooter className="p-3 pt-2 flex justify-between gap-1 bg-slate-50/50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800">
                <div className="flex gap-1">
                    {/* Action Dialogs */}
                    {(sample.status === 'in_analysis' || sample.status === 'collected') && (
                        <Button
                            size="sm"
                            variant="outline"
                            className="h-8 text-[10px] px-2 font-bold bg-white dark:bg-slate-950"
                            onClick={() => onMove(sample.id, 'open_entry')}
                        >
                            <Beaker className="h-3 w-3 mr-1" /> Resultados
                        </Button>
                    )}

                    {sample.status === 'reviewed' && (
                        <>
                            <ApproveSampleDialog sample={{ id: sample.id, code: sample.code }} action="approve" />
                            <ApproveSampleDialog sample={{ id: sample.id, code: sample.code }} action="reject" />
                        </>
                    )}
                </div>

                <div className="flex items-center gap-1">
                    {sample.status === "collected" && (
                        <Button
                            size="sm"
                            variant="secondary"
                            className="h-8 text-[10px] px-2 font-semibold"
                            onClick={() => onMove(sample.id, "in_analysis")}
                        >
                            Process <ChevronRight className="ml-1 h-3 w-3" />
                        </Button>
                    )}

                    {isReadyForReview && (
                        <Button
                            size="sm"
                            variant="secondary"
                            className="h-8 text-[10px] px-2 bg-purple-100 text-purple-700 hover:bg-purple-200 border-none font-semibold"
                            onClick={() => onMove(sample.id, "reviewed")}
                        >
                            Finalize <ChevronRight className="ml-1 h-3 w-3" />
                        </Button>
                    )}
                </div>
            </CardFooter>
        </Card>
    );
}

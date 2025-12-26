"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import { ExternalLink } from "lucide-react";

interface SampleListProps {
    samples: any[];
    onEnterResults: (sampleId: string) => void;
}

const statusConfig: Record<string, { label: string; color: string }> = {
    pending: { label: "Pendente", color: "text-amber-500" },
    collected: { label: "Colhida", color: "text-blue-500" },
    in_analysis: { label: "Em Análise", color: "text-violet-500" },
    reviewed: { label: "Revista", color: "text-emerald-500" },
    approved: { label: "Aprovada", color: "text-green-500" },
    rejected: { label: "Rejeitada", color: "text-rose-500" },
};

export function SampleList({ samples, onEnterResults }: SampleListProps) {
    return (
        <div className="flex flex-col gap-1 px-1">
            {samples.map((sample) => {
                const status = statusConfig[sample.status] || { label: sample.status, color: "text-muted-foreground" };
                const date = sample.collected_at ? new Date(sample.collected_at) : new Date();
                const isActionRequired = sample.status === 'collected' || sample.status === 'in_analysis';

                return (
                    <div
                        key={sample.id}
                        className="group flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6 py-2 px-3 rounded-lg hover:bg-muted/30 transition-colors"
                    >
                        {/* ID Section */}
                        <div className="w-24 shrink-0 font-mono text-xs font-bold text-foreground/80 leading-none">
                            {sample.code}
                        </div>

                        {/* Info Section */}
                        <div className="flex-1 min-w-0 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-6">
                            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 min-w-0 flex-1">
                                <span className="text-[11px] font-bold text-foreground/70 truncate">
                                    {sample.type?.name}
                                </span>
                                {sample.batch?.product && (
                                    <span className="hidden sm:inline text-[9px] font-bold uppercase text-primary/40 truncate max-w-[150px]">
                                        {sample.batch.product.name}
                                    </span>
                                )}
                            </div>

                            <div className="flex items-center gap-4 text-[11px] whitespace-nowrap">
                                <span className="text-muted-foreground/60 w-28 truncate">
                                    {sample.batch?.code || sample.sampling_point?.name || "—"}
                                </span>
                                <span className="text-muted-foreground/40 w-24 text-right sm:text-left">
                                    {format(date, "dd/MM, HH:mm", { locale: pt })}
                                </span>
                            </div>
                        </div>

                        {/* Status & Actions */}
                        <div className="flex items-center justify-between sm:justify-end gap-6 sm:w-48 shrink-0">
                            <div className="flex items-center gap-1.5 min-w-[100px]">
                                <div className={cn("w-1 h-1 rounded-full", status.color.replace("text-", "bg-"))} />
                                <span className={cn("text-[10px] uppercase font-bold tracking-tight", status.color)}>
                                    {status.label}
                                </span>
                            </div>

                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button variant="ghost" size="icon" asChild className="h-7 w-7" title="Ver Detalhes">
                                    <a href={`/lab/samples/${sample.id}`}>
                                        <ExternalLink className="h-3.5 w-3.5 text-muted-foreground/50 hover:text-foreground" />
                                    </a>
                                </Button>
                                <Button
                                    onClick={() => onEnterResults(sample.id)}
                                    disabled={!isActionRequired}
                                    variant="link"
                                    size="sm"
                                    className={cn(
                                        "h-7 px-2 text-[10px] font-bold uppercase tracking-wider",
                                        isActionRequired ? "text-blue-600" : "text-muted-foreground/20"
                                    )}
                                >
                                    {sample.status === 'collected' ? 'Registar' : 'Resultados'}
                                </Button>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

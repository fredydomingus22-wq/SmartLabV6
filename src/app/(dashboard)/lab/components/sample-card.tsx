"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Beaker, Calendar, MapPin, TestTube2, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { pt } from "date-fns/locale";

export interface SampleCardProps {
    sample: {
        id: string;
        code: string;
        status: string;
        collected_at: string;
        type: {
            name: string;
            test_category?: string;
        };
        batch?: {
            code: string;
            product?: {
                name: string;
            };
        };
        sampling_point?: {
            name: string;
        };
    };
    onEnterResults: (sampleId: string) => void;
}

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
    pending: { label: "Pendente", color: "text-amber-600", bg: "bg-amber-50 border-amber-200" },
    collected: { label: "Colhida", color: "text-blue-600", bg: "bg-blue-50 border-blue-200" },
    in_analysis: { label: "Em Análise", color: "text-violet-600", bg: "bg-violet-50 border-violet-200" },
    reviewed: { label: "Revista", color: "text-emerald-600", bg: "bg-emerald-50 border-emerald-200" },
    approved: { label: "Aprovada", color: "text-green-600", bg: "bg-green-50 border-green-200" },
    rejected: { label: "Rejeitada", color: "text-rose-600", bg: "bg-rose-50 border-rose-200" },
};

export function SampleCard({ sample, onEnterResults }: SampleCardProps) {
    const status = statusConfig[sample.status] || { label: sample.status, color: "text-muted-foreground", bg: "bg-muted" };
    const date = sample.collected_at ? new Date(sample.collected_at) : new Date();
    const isActionRequired = sample.status === 'collected' || sample.status === 'in_analysis';

    return (
        <div className="group flex flex-col gap-4 p-4 rounded-xl transition-all duration-200 hover:bg-muted/30 border border-transparent hover:border-border/20">
            <div className="flex justify-between items-start">
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-bold text-foreground/90 tracking-tight">
                            {sample.code}
                        </span>
                        <div className="flex items-center gap-1.5 ml-1">
                            <div className={cn("w-1.5 h-1.5 rounded-full shadow-[0_0_5px_rgba(0,0,0,0.1)]",
                                status.color.replace("text-", "bg-"))} />
                            <span className={cn("text-[10px] uppercase font-bold tracking-wider", status.color)}>
                                {status.label}
                            </span>
                        </div>
                    </div>
                    <p className="text-[11px] font-bold text-muted-foreground/80 leading-tight truncate">
                        {sample.type?.name}
                    </p>
                </div>
            </div>

            <div className="space-y-2">
                <div className="flex justify-between items-center text-[11px] font-medium">
                    <span className="text-muted-foreground/60">{format(date, "dd MMM, HH:mm", { locale: pt })}</span>
                    <span className="font-bold text-foreground/70">{sample.batch?.code || sample.sampling_point?.name || "—"}</span>
                </div>

                {sample.batch?.product && (
                    <p className="text-[10px] font-bold uppercase tracking-tight text-primary/50 truncate border-t border-border/10 pt-2">
                        {sample.batch.product.name}
                    </p>
                )}
            </div>

            <div className="flex gap-2 pt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button variant="link" size="sm" asChild className="h-7 px-0 text-[10px] font-bold text-muted-foreground hover:text-foreground">
                    <a href={`/lab/samples/${sample.id}`}>Detalhes</a>
                </Button>
                <div className="ml-auto flex gap-2">
                    <Button
                        onClick={() => onEnterResults(sample.id)}
                        disabled={!isActionRequired}
                        size="sm"
                        variant={isActionRequired ? "default" : "ghost"}
                        className={cn(
                            "h-7 px-3 text-[10px] font-bold transition-all rounded-md",
                            isActionRequired
                                ? "bg-blue-600 hover:bg-blue-700 text-white shadow-none"
                                : "text-muted-foreground/40"
                        )}
                    >
                        {sample.status === 'collected' ? 'Registar' : 'Resultados'}
                    </Button>
                </div>
            </div>
        </div>
    );
}



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
    const status = statusConfig[sample.status] || { label: sample.status, color: "text-muted-foreground", bg: "bg-muted border-slate-200" };

    // Parse date safely
    const date = sample.collected_at ? new Date(sample.collected_at) : new Date();

    return (
        <Card className="group relative overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1 bg-card hover:bg-accent/10 border-border/60">
            <div className={cn("absolute top-0 left-0 w-1 h-full transition-colors duration-300", status.bg.replace("bg-", "bg-").replace(" border-", " "))} />

            <CardHeader className="p-3 pb-1 sm:p-4 sm:pb-2 space-y-2 pl-4 sm:pl-5">
                <div className="flex justify-between items-start">
                    <div className="flex gap-3 items-center">
                        <div className={cn("p-2.5 rounded-xl shadow-sm transition-colors", status.bg)}>
                            <TestTube2 className={cn("h-5 w-5", status.color)} />
                        </div>
                        <div>
                            <h3 className="font-bold text-base sm:text-lg leading-none tracking-tight text-card-foreground font-mono">
                                {sample.code}
                            </h3>
                            <p className="text-xs text-muted-foreground mt-1.5 font-medium flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-600" />
                                {sample.type?.name}
                            </p>
                        </div>
                    </div>
                    <Badge variant="outline" className={cn("capitalize px-2.5 py-0.5 text-xs font-bold tracking-wide shadow-sm", status.bg, status.color, "border bg-opacity-10 dark:bg-opacity-20")}>
                        {status.label}
                    </Badge>
                </div>
            </CardHeader>

            <CardContent className="p-3 pt-2 sm:p-4 sm:pt-3 space-y-3 sm:space-y-4 pl-4 sm:pl-5">
                <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="space-y-1.5">
                        <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold flex items-center gap-1.5">
                            <Calendar className="h-3 w-3" /> Recolha
                        </span>
                        <p className="font-medium text-foreground text-xs">
                            {format(date, "dd MMM, HH:mm", { locale: pt })}
                        </p>
                    </div>

                    <div className="space-y-1.5">
                        <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold flex items-center gap-1.5">
                            <MapPin className="h-3 w-3" /> Origem
                        </span>
                        <p className="font-medium text-foreground text-xs truncate" title={sample.batch?.code || sample.sampling_point?.name}>
                            {sample.batch?.code || sample.sampling_point?.name || "N/A"}
                        </p>
                    </div>
                </div>

                {sample.batch?.product && (
                    <div className="pt-3 border-t border-border">
                        <div className="flex items-center gap-2">
                            <Beaker className="h-3.5 w-3.5 text-muted-foreground" />
                            <p className="text-xs font-medium text-foreground/80 line-clamp-1" title={sample.batch.product.name}>
                                {sample.batch.product.name}
                            </p>
                        </div>
                    </div>
                )}
            </CardContent>

            <CardFooter className="p-3 pt-1 sm:p-4 sm:pt-1 flex justify-between gap-3 bg-muted/20">
                <Button variant="outline" size="sm" asChild className="h-8 text-xs font-medium bg-background hover:bg-muted text-foreground border-border">
                    <a href={`/lab/samples/${sample.id}`}>Detalhes</a>
                </Button>
                <Button
                    onClick={() => onEnterResults(sample.id)}
                    disabled={sample.status === 'approved' || sample.status === 'validated'}
                    size="sm"
                    className={cn(
                        "h-8 text-xs font-bold transition-all shadow-sm",
                        (sample.status === 'collected' || sample.status === 'in_analysis')
                            ? "bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-600 dark:hover:bg-blue-500"
                            : "bg-muted text-muted-foreground hover:bg-muted/80"
                    )}
                >
                    {status.label === 'Colhida' ? 'Registar' : 'Resultados'}
                </Button>
            </CardFooter>
        </Card >
    );
}

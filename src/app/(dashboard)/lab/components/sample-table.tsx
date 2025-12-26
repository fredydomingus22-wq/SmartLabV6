"use client";

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Calendar, MapPin, Beaker, ExternalLink, PlayCircle } from "lucide-react";
import { format } from "date-fns";
import { pt } from "date-fns/locale";

interface SampleTableProps {
    samples: any[];
    onEnterResults: (sampleId: string) => void;
}

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
    pending: { label: "Pendente", color: "text-amber-600", bg: "bg-amber-50" },
    collected: { label: "Colhida", color: "text-blue-600", bg: "bg-blue-50" },
    in_analysis: { label: "Em Análise", color: "text-violet-600", bg: "bg-violet-50" },
    reviewed: { label: "Revista", color: "text-emerald-600", bg: "bg-emerald-50" },
    approved: { label: "Aprovada", color: "text-green-600", bg: "bg-green-50" },
    rejected: { label: "Rejeitada", color: "text-rose-600", bg: "bg-rose-50" },
};

export function SampleTable({ samples, onEnterResults }: SampleTableProps) {
    return (
        <div className="bg-card/30 rounded-xl overflow-hidden">
            <Table>
                <TableHeader>
                    <TableRow className="hover:bg-transparent border-border/10">
                        <TableHead className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground/50">Amostra</TableHead>
                        <TableHead className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground/50">Tipo</TableHead>
                        <TableHead className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground/50">Origem</TableHead>
                        <TableHead className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground/50">Data</TableHead>
                        <TableHead className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground/50">Estado</TableHead>
                        <TableHead className="text-right text-[10px] uppercase font-bold tracking-widest text-muted-foreground/50">Ações</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {samples.map((sample) => {
                        const status = statusConfig[sample.status] || { label: sample.status, color: "text-muted-foreground", bg: "bg-muted" };
                        const date = sample.collected_at ? new Date(sample.collected_at) : new Date();
                        const isActionRequired = sample.status === 'collected' || sample.status === 'in_analysis';

                        return (
                            <TableRow key={sample.id} className="group hover:bg-muted/40 border-border/5 border-none transition-colors">
                                <TableCell className="py-2">
                                    <span className="font-mono text-xs font-bold text-foreground/80">
                                        {sample.code}
                                    </span>
                                </TableCell>
                                <TableCell className="py-2">
                                    <div className="flex flex-col">
                                        <span className="text-[11px] font-bold text-foreground/70">{sample.type?.name}</span>
                                        {sample.batch?.product && (
                                            <span className="text-[9px] font-bold uppercase text-primary/40 truncate max-w-[120px]">
                                                {sample.batch.product.name}
                                            </span>
                                        )}
                                    </div>
                                </TableCell>
                                <TableCell className="py-2">
                                    <span className="text-[11px] font-medium text-muted-foreground/70">
                                        {sample.batch?.code || sample.sampling_point?.name || "—"}
                                    </span>
                                </TableCell>
                                <TableCell className="py-2">
                                    <span className="text-[11px] text-muted-foreground/60">{format(date, "dd/MM/yy HH:mm")}</span>
                                </TableCell>
                                <TableCell className="py-2">
                                    <div className="flex items-center gap-1.5">
                                        <div className={cn("w-1 h-1 rounded-full", status.color.replace("text-", "bg-"))} />
                                        <span className={cn("text-[10px] font-bold uppercase tracking-tight", status.color)}>
                                            {status.label}
                                        </span>
                                    </div>
                                </TableCell>
                                <TableCell className="py-2 text-right">
                                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Button variant="ghost" size="icon" asChild className="h-7 w-7 hover:bg-muted" title="Ver Detalhes">
                                            <a href={`/lab/samples/${sample.id}`}>
                                                <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
                                            </a>
                                        </Button>
                                        <Button
                                            onClick={() => onEnterResults(sample.id)}
                                            disabled={!isActionRequired}
                                            variant={isActionRequired ? "default" : "ghost"}
                                            size="sm"
                                            className={cn(
                                                "h-6 px-2 text-[10px] font-bold",
                                                isActionRequired ? "bg-blue-600 text-white" : "text-muted-foreground/30"
                                            )}
                                        >
                                            {sample.status === 'collected' ? 'Registar' : 'Resultados'}
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        );
                    })}
                </TableBody>
            </Table>
        </div>
    );
}


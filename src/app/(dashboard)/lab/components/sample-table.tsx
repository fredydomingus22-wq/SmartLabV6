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
import { Calendar, MapPin, Beaker, ExternalLink, PlayCircle, MoreHorizontal } from "lucide-react";
import { format } from "date-fns";
import { pt } from "date-fns/locale";

interface SampleTableProps {
    samples: any[];
    onEnterResults: (sampleId: string) => void;
}

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
    draft: { label: "Rascunho", color: "text-slate-500", bg: "bg-slate-500/10" },
    pending: { label: "Pendente", color: "text-amber-500", bg: "bg-amber-500/10" },
    collected: { label: "Colhida", color: "text-blue-400", bg: "bg-blue-400/10" },
    in_analysis: { label: "Em Análise", color: "text-amber-400", bg: "bg-amber-400/10" },
    under_review: { label: "Em Revisão", color: "text-purple-400", bg: "bg-purple-400/10" },
    approved: { label: "Aprovada", color: "text-green-400", bg: "bg-green-400/10" },
    rejected: { label: "Rejeitada", color: "text-rose-400", bg: "bg-rose-400/10" },
    released: { label: "Libertada", color: "text-indigo-400", bg: "bg-indigo-400/10" },
};

const riskConfig: Record<string, { label: string; color: string; bg: string; icon: any }> = {
    blocked: { label: "Crítico", color: "text-rose-500", bg: "bg-rose-500/20", icon: AlertTriangle },
    warning: { label: "Atenção", color: "text-amber-500", bg: "bg-amber-500/20", icon: ShieldAlert },
    approved: { label: "Seguro", color: "text-emerald-500", bg: "bg-emerald-500/20", icon: ShieldCheck },
    info: { label: "Info", color: "text-blue-500", bg: "bg-blue-500/20", icon: Info },
};

import { ShieldCheck, ShieldAlert, AlertTriangle, Info } from "lucide-react";

export function SampleTable({ samples, onEnterResults }: SampleTableProps) {
    return (
        <div className="glass rounded-3xl overflow-hidden border border-slate-800/50 shadow-sm">
            <Table>
                <TableHeader>
                    <TableRow className="hover:bg-transparent border-slate-800/50 bg-slate-900/30">
                        <TableHead className="py-4 text-[10px] uppercase font-black tracking-widest text-slate-500">Amostra</TableHead>
                        <TableHead className="py-4 text-[10px] uppercase font-black tracking-widest text-slate-500">Tipo / Produto</TableHead>
                        <TableHead className="py-4 text-[10px] uppercase font-black tracking-widest text-slate-500">IA Risco</TableHead>
                        <TableHead className="py-4 text-[10px] uppercase font-black tracking-widest text-slate-500">Origem</TableHead>
                        <TableHead className="py-4 text-[10px] uppercase font-black tracking-widest text-slate-500">Data</TableHead>
                        <TableHead className="py-4 text-[10px] uppercase font-black tracking-widest text-slate-500">Estado</TableHead>
                        <TableHead className="py-4 pr-6 text-right text-[10px] uppercase font-black tracking-widest text-slate-500">Ações</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {samples.map((sample) => {
                        const status = statusConfig[sample.status] || { label: sample.status, color: "text-slate-500", bg: "bg-slate-500/10" };
                        const date = sample.collected_at ? new Date(sample.collected_at) : new Date();
                        const isActionRequired = sample.status === 'collected' || sample.status === 'in_analysis';

                        return (
                            <TableRow key={sample.id} className="group hover:bg-slate-900/40 border-slate-800/30 transition-all">
                                <TableCell className="py-4 pl-6">
                                    <div className="flex items-center gap-2">
                                        <div className="h-2 w-2 rounded-full bg-slate-700 group-hover:bg-blue-500 transition-colors" />
                                        <span className="font-mono text-xs font-bold text-slate-200 group-hover:text-blue-200 transition-colors">
                                            {sample.code}
                                        </span>
                                    </div>
                                </TableCell>
                                <TableCell className="py-4">
                                    <div className="flex flex-col gap-1">
                                        <span className="text-xs font-bold text-slate-300">{sample.type?.name}</span>
                                        {sample.batch?.product && (
                                            <span className="text-[9px] font-black uppercase text-slate-500 truncate max-w-[150px]">
                                                {sample.batch.product.name}
                                            </span>
                                        )}
                                    </div>
                                </TableCell>
                                <TableCell className="py-4 text-center">
                                    {sample.ai_risk_status ? (
                                        <div className={cn("inline-flex items-center gap-1.5 px-2 py-1 rounded-md border border-white/5 mx-auto", riskConfig[sample.ai_risk_status].bg)}>
                                            {(() => {
                                                const Icon = riskConfig[sample.ai_risk_status].icon;
                                                return <Icon className={cn("h-3 w-3", riskConfig[sample.ai_risk_status].color)} />;
                                            })()}
                                            <span className={cn("text-[9px] font-black uppercase tracking-tight", riskConfig[sample.ai_risk_status].color)}>
                                                {riskConfig[sample.ai_risk_status].label}
                                            </span>
                                        </div>
                                    ) : (
                                        <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">—</span>
                                    )}
                                </TableCell>
                                <TableCell className="py-4">
                                    <div className="flex items-center gap-2">
                                        <div className="p-1 rounded bg-slate-800/50">
                                            <MapPin className="h-3 w-3 text-slate-500" />
                                        </div>
                                        <span className="text-[11px] font-medium text-slate-400">
                                            {sample.batch?.code || sample.sampling_point?.name || "—"}
                                        </span>
                                    </div>
                                </TableCell>
                                <TableCell className="py-4">
                                    <span className="text-[11px] font-mono text-slate-500">{format(date, "dd/MM/yy HH:mm")}</span>
                                </TableCell>
                                <TableCell className="py-4">
                                    <div className={cn("inline-flex items-center gap-1.5 px-2 py-1 rounded-md border border-white/5", status.bg)}>
                                        <div className={cn("w-1.5 h-1.5 rounded-full", status.color.replace("text-", "bg-"))} />
                                        <span className={cn("text-[10px] font-black uppercase tracking-tight", status.color)}>
                                            {status.label}
                                        </span>
                                    </div>
                                </TableCell>
                                <TableCell className="py-4 pr-6 text-right">
                                    <div className="flex items-center justify-end gap-2 opacity-60 group-hover:opacity-100 transition-opacity">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            asChild
                                            className="h-8 w-8 hover:bg-slate-800 hover:text-blue-400 rounded-lg transition-colors"
                                        >
                                            <a href={`/lab/samples/${sample.id}`}>
                                                <ExternalLink className="h-4 w-4" />
                                            </a>
                                        </Button>
                                        <Button
                                            onClick={() => onEnterResults(sample.id)}
                                            disabled={!isActionRequired}
                                            size="sm"
                                            className={cn(
                                                "h-8 px-4 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all",
                                                isActionRequired
                                                    ? "bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40"
                                                    : "bg-slate-800 text-slate-600 cursor-not-allowed hover:bg-slate-800"
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

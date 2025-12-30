"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, BrainCircuit, Calendar, AlertCircle } from "lucide-react";
import Link from "next/link";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { GlassTable, GlassTableHeader, GlassTableRow, GlassTableHead, GlassTableCell } from "@/components/ui/glass-table";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface NC {
    id: string;
    nc_number: string;
    title: string;
    nc_type: string;
    severity: string;
    status: string;
    detected_date: string;
    due_date?: string;
    ai_insight?: {
        status: string;
        message: string;
        raw_response: any;
        confidence: number;
    } | null;
}

interface NCListClientProps {
    nonconformities: NC[];
}

export function NCListClient({ nonconformities }: NCListClientProps) {
    const severityStyles: Record<string, { color: string; label: string }> = {
        minor: { color: "text-slate-400 border-slate-800 bg-slate-800/20", label: "Menor" },
        major: { color: "text-orange-400 border-orange-500/20 bg-orange-500/10", label: "Maior" },
        critical: { color: "text-rose-400 border-rose-500/20 bg-rose-500/10 shadow-[0_0_15px_rgba(244,63,94,0.1)]", label: "Crítica" },
    };

    const statusStyles: Record<string, { color: string; label: string }> = {
        open: { color: "text-rose-400 bg-rose-400/10", label: "Aberta" },
        under_investigation: { color: "text-amber-400 bg-amber-400/10", label: "Investigação" },
        containment: { color: "text-blue-400 bg-blue-400/10", label: "Contenção" },
        corrective_action: { color: "text-indigo-400 bg-indigo-400/10", label: "Ação Corretiva" },
        verification: { color: "text-purple-400 bg-purple-400/10", label: "Verificação" },
        closed: { color: "text-emerald-400 bg-emerald-400/10", label: "Fechada" },
    };

    return (
        <GlassTable>
            <GlassTableHeader>
                <GlassTableRow>
                    <GlassTableHead>Código</GlassTableHead>
                    <GlassTableHead>Título</GlassTableHead>
                    <GlassTableHead>Tipo / Gravidade</GlassTableHead>
                    <GlassTableHead>Deteção</GlassTableHead>
                    <GlassTableHead>Estado</GlassTableHead>
                    <GlassTableHead className="text-right">Ação</GlassTableHead>
                </GlassTableRow>
            </GlassTableHeader>
            <tbody>
                {nonconformities.map((nc) => {
                    const sev = severityStyles[nc.severity] || severityStyles.minor;
                    const status = statusStyles[nc.status] || { color: "text-slate-400 bg-slate-400/10", label: nc.status };

                    return (
                        <GlassTableRow key={nc.id} className="group">
                            <GlassTableCell>
                                <Link href={`/quality/qms/${nc.id}`} className="block">
                                    <span className="font-mono font-black text-indigo-400 group-hover:text-indigo-300 transition-colors">
                                        {nc.nc_number}
                                    </span>
                                </Link>
                            </GlassTableCell>
                            <GlassTableCell>
                                <div className="max-w-[240px]">
                                    <p className="font-bold text-slate-200 line-clamp-1">{nc.title}</p>
                                    <p className="text-[10px] text-slate-500 uppercase tracking-widest font-black truncate">
                                        {nc.nc_type === 'internal' ? 'Interna' : nc.nc_type === 'supplier' ? 'Fornecedor' : nc.nc_type === 'customer' ? 'Cliente' : nc.nc_type}
                                    </p>
                                </div>
                            </GlassTableCell>
                            <GlassTableCell>
                                <div className="flex items-center gap-2">
                                    <Badge variant="outline" className={cn("px-2 py-0.5 rounded-lg font-black uppercase tracking-tighter text-[9px]", sev.color)}>
                                        {sev.label}
                                    </Badge>
                                </div>
                            </GlassTableCell>
                            <GlassTableCell>
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2 text-slate-400">
                                        <Calendar className="h-3 w-3 opacity-50" />
                                        <span className="text-xs font-bold">{nc.detected_date ? format(new Date(nc.detected_date), "dd/MM/yyyy") : "-"}</span>
                                    </div>
                                    {nc.due_date && (
                                        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-tight">
                                            <AlertCircle className={cn("h-3 w-3", new Date(nc.due_date) < new Date() && nc.status !== "closed" ? "text-rose-500" : "text-slate-500")} />
                                            <span className={new Date(nc.due_date) < new Date() && nc.status !== "closed" ? "text-rose-500" : "text-slate-500"}>
                                                Limite: {format(new Date(nc.due_date), "dd/MM")}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </GlassTableCell>
                            <GlassTableCell>
                                <div className="flex items-center gap-3">
                                    <Badge className={cn("px-3 py-1 rounded-xl font-black uppercase tracking-tighter text-[10px] border shadow-sm", status.color)}>
                                        {status.label}
                                    </Badge>

                                    {nc.ai_insight?.raw_response?.risk_level && (
                                        <TooltipProvider>
                                            <Tooltip delayDuration={300}>
                                                <TooltipTrigger asChild>
                                                    <div className="h-8 w-8 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center cursor-help hover:bg-indigo-500/20 transition-colors">
                                                        <BrainCircuit className="h-4 w-4 text-indigo-400" />
                                                    </div>
                                                </TooltipTrigger>
                                                <TooltipContent side="top" className="max-w-[280px] glass-dark border-white/5 p-4 shadow-2xl backdrop-blur-xl">
                                                    <div className="space-y-2">
                                                        <div className="flex items-center justify-between">
                                                            <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Risco AI</span>
                                                            <Badge variant="outline" className="text-[9px] font-black uppercase px-2 py-0 border-indigo-500/20 text-indigo-300">
                                                                {nc.ai_insight.raw_response.risk_level}
                                                            </Badge>
                                                        </div>
                                                        <p className="text-[11px] text-slate-300 font-medium leading-relaxed italic">
                                                            "{nc.ai_insight.message}"
                                                        </p>
                                                    </div>
                                                </TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                    )}
                                </div>
                            </GlassTableCell>
                            <GlassTableCell className="text-right">
                                <Link href={`/quality/qms/${nc.id}`}>
                                    <Button variant="ghost" size="sm" className="rounded-xl font-black text-[10px] uppercase tracking-widest text-slate-500 hover:bg-slate-500/10">
                                        Ver Detalhes →
                                    </Button>
                                </Link>
                            </GlassTableCell>
                        </GlassTableRow>
                    );
                })}
            </tbody>
        </GlassTable>
    );
}

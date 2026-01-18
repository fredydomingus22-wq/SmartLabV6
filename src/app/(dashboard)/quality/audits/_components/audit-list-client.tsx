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
import { Eye, ChevronRight } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { pt } from "date-fns/locale";

interface AuditListClientProps {
    audits: any[];
}

export function AuditListClient({ audits }: AuditListClientProps) {
    if (!audits.length) {
        return (
            <div className="flex flex-col items-center justify-center py-20 bg-slate-900/20 rounded-2xl border border-dashed border-slate-800">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 italic">Nenhuma auditoria encontrada na base de dados.</p>
            </div>
        );
    }

    return (
        <Table>
            <TableHeader>
                <TableRow className="border-b border-slate-800 bg-slate-900/50 hover:bg-slate-900/50">
                    <TableHead className="py-4 px-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] italic">Nº Auditoria</TableHead>
                    <TableHead className="py-4 px-4 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] italic">Título / Âmbito</TableHead>
                    <TableHead className="py-4 px-4 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] italic">Checklist</TableHead>
                    <TableHead className="py-4 px-4 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] italic">Data Planeada</TableHead>
                    <TableHead className="py-4 px-4 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] italic text-center">Auditor</TableHead>
                    <TableHead className="py-4 px-4 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] italic text-center">Estado</TableHead>
                    <TableHead className="py-4 px-6 text-right text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] italic">Ação</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {audits.map((audit) => (
                    <TableRow key={audit.id} className="group hover:bg-slate-900/40 transition-all border-b border-slate-800/30 last:border-0 border-x-0">
                        <TableCell className="py-3 px-6">
                            <span className="font-mono font-black text-emerald-400 bg-emerald-500/5 px-2 py-1 rounded-md border border-emerald-500/10 text-[11px]">
                                {audit.audit_number}
                            </span>
                        </TableCell>
                        <TableCell className="py-3 px-4">
                            <div className="max-w-[240px]">
                                <p className="font-black text-white italic tracking-tight text-sm line-clamp-1">{audit.title}</p>
                                {audit.scope && (
                                    <p className="text-[9px] text-slate-500 uppercase tracking-[0.1em] font-black mt-0.5 truncate">
                                        {audit.scope}
                                    </p>
                                )}
                            </div>
                        </TableCell>
                        <TableCell className="py-3 px-4">
                            <Badge variant="outline" className="px-2 py-0.5 rounded-lg font-black uppercase tracking-tighter text-[9px] border border-slate-800 text-slate-400 bg-slate-900/50">
                                {audit.checklist?.name}
                            </Badge>
                        </TableCell>
                        <TableCell className="py-3 px-4">
                            <div className="flex items-center gap-2 text-slate-400">
                                <span className="text-[10px] font-black uppercase tracking-widest font-mono italic">
                                    {audit.planned_date ? format(new Date(audit.planned_date), "dd/MM/yyyy") : "-"}
                                </span>
                            </div>
                        </TableCell>
                        <TableCell className="py-3 px-4 text-center">
                            <span className="text-[10px] font-black uppercase tracking-tight text-slate-400">
                                {audit.auditor?.full_name?.split(' ')[0] || "Pendente"}
                            </span>
                        </TableCell>
                        <TableCell className="py-3 px-4 text-center">
                            <Badge className={cn("px-3 py-1 rounded-xl font-black uppercase tracking-tighter text-[10px] border shadow-inner whitespace-nowrap", getStatusColor(audit.status))}>
                                {getStatusLabel(audit.status)}
                            </Badge>
                        </TableCell>
                        <TableCell className="py-3 px-6 text-right">
                            <Link href={`/quality/audits/${audit.id}`}>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="rounded-xl font-black text-[10px] uppercase tracking-widest text-slate-500 hover:text-white hover:bg-slate-800 transition-all opacity-0 group-hover:opacity-100 transform translate-x-4 group-hover:translate-x-0"
                                >
                                    Ver <ChevronRight className="h-3 w-3 ml-1" />
                                </Button>
                            </Link>
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
}

function getStatusColor(status: string) {
    switch (status) {
        case 'planned': return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
        case 'in_progress': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
        case 'reporting': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
        case 'completed': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
        case 'cancelled': return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
        default: return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
    }
}

function getStatusLabel(status: string) {
    switch (status) {
        case 'planned': return 'Planeada';
        case 'in_progress': return 'Em Curso';
        case 'reporting': return 'Relatório';
        case 'completed': return 'Concluída';
        case 'cancelled': return 'Cancelada';
        default: return status;
    }
}

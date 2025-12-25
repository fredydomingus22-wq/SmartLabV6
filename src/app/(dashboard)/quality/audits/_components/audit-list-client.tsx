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
import { format } from "date-fns";
import { pt } from "date-fns/locale";

interface AuditListClientProps {
    audits: any[];
}

export function AuditListClient({ audits }: AuditListClientProps) {
    if (!audits.length) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-slate-500">
                <p>Nenhuma auditoria encontrada para os filtros selecionados.</p>
            </div>
        );
    }

    return (
        <div className="rounded-md border border-slate-800/50">
            <Table>
                <TableHeader className="bg-slate-900/50">
                    <TableRow className="hover:bg-transparent">
                        <TableHead className="w-[120px]">Nº Auditoria</TableHead>
                        <TableHead>Título / Âmbito</TableHead>
                        <TableHead>Checklist</TableHead>
                        <TableHead>Data Planeada</TableHead>
                        <TableHead>Auditor</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {audits.map((audit) => (
                        <TableRow key={audit.id} className="hover:bg-slate-900/30 transition-colors">
                            <TableCell className="font-mono text-xs">{audit.audit_number}</TableCell>
                            <TableCell>
                                <div className="font-medium text-slate-200">{audit.title}</div>
                                {audit.scope && (
                                    <div className="text-xs text-slate-500 truncate max-w-[200px]">
                                        {audit.scope}
                                    </div>
                                )}
                            </TableCell>
                            <TableCell>
                                <Badge variant="secondary" className="font-normal">
                                    {audit.checklist?.name}
                                </Badge>
                            </TableCell>
                            <TableCell className="text-slate-300">
                                {audit.planned_date ? format(new Date(audit.planned_date), "dd MMM yyyy", { locale: pt }) : "N/D"}
                            </TableCell>
                            <TableCell className="text-slate-300">
                                {audit.auditor?.full_name || "Pendente"}
                            </TableCell>
                            <TableCell>
                                <Badge className={getStatusColor(audit.status)}>
                                    {getStatusLabel(audit.status)}
                                </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                                <Link href={`/quality/audits/${audit.id}`}>
                                    <Button variant="ghost" size="sm" className="hover:bg-emerald-500/10 hover:text-emerald-400">
                                        <Eye className="h-4 w-4 mr-2" />
                                        Ver
                                    </Button>
                                </Link>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
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

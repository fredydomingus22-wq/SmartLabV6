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
import { Eye, ExternalLink, ArrowRight } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { CAPAStatusUpdate } from "../[id]/capa-status-update";

interface CAPA {
    id: string;
    action_number: string;
    action_type: string;
    description: string;
    status: string;
    priority: string;
    planned_date?: string;
    completed_date?: string;
    nonconformity_id?: string | null;
    nonconformity?: { nc_number: string; title: string } | null;
    responsible_user?: { full_name: string } | null;
}

interface CAPAListClientProps {
    capas: CAPA[];
}

export function CAPAListClient({ capas }: CAPAListClientProps) {
    const statusLabels: Record<string, string> = {
        planned: "Planeada",
        in_progress: "Em Execução",
        completed: "Concluída",
        verified: "Verificada",
        closed: "Fechada",
    };

    const statusStyles: Record<string, string> = {
        planned: "text-slate-400 border-slate-800 bg-slate-800/20",
        in_progress: "text-amber-400 border-amber-500/20 bg-amber-500/10",
        completed: "text-indigo-400 border-indigo-500/20 bg-indigo-500/10",
        verified: "text-purple-400 border-purple-500/20 bg-purple-500/10",
        closed: "text-emerald-400 border-emerald-500/20 bg-emerald-500/10",
    };

    return (
        <Table>
            <TableHeader>
                <TableRow className="border-b border-slate-800 bg-slate-900/50 hover:bg-slate-900/50">
                    <TableHead className="py-4 px-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] italic">Ref. Ação</TableHead>
                    <TableHead className="py-4 px-4 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] italic">Descrição / Tipo</TableHead>
                    <TableHead className="py-4 px-4 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] italic">Responsável</TableHead>
                    <TableHead className="py-4 px-4 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] italic text-center">Prazo Limite</TableHead>
                    <TableHead className="py-4 px-4 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] italic text-center">Estado</TableHead>
                    <TableHead className="py-4 px-6 text-right text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] italic">Ações</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {capas.map((row) => {
                    const unwrap = (val: any) => Array.isArray(val) ? val[0] : val;
                    const resp = unwrap(row.responsible_user);
                    const isOverdue = row.planned_date && new Date(row.planned_date) < new Date() &&
                        !["completed", "verified", "closed"].includes(row.status);

                    return (
                        <TableRow key={row.id} className="group hover:bg-slate-900/40 transition-all border-b border-slate-800/30 last:border-0 border-x-0">
                            <TableCell className="py-3 px-6">
                                <span className="font-mono font-black text-primary bg-primary/5 px-2 py-1 rounded-md border border-primary/10 text-[11px]">
                                    {row.action_number}
                                </span>
                            </TableCell>
                            <TableCell className="py-3 px-4">
                                <div className="max-w-[300px]">
                                    <p className="font-black text-white italic tracking-tight text-sm line-clamp-1">{row.description}</p>
                                    <p className="text-[9px] text-slate-500 uppercase tracking-[0.1em] font-black mt-0.5">
                                        {row.action_type === 'corrective' ? 'Corretiva (Ação de Bloqueio)' : 'Preventiva (Melhoria)'}
                                    </p>
                                </div>
                            </TableCell>
                            <TableCell className="py-3 px-4">
                                <span className="text-[10px] font-black uppercase tracking-tight text-slate-400">
                                    {resp?.full_name || "Não Atribuído"}
                                </span>
                            </TableCell>
                            <TableCell className="py-3 px-4 text-center">
                                {row.planned_date ? (
                                    <span className={cn(
                                        "font-mono text-[10px] font-black uppercase tracking-widest italic",
                                        isOverdue ? "text-rose-500" : "text-slate-500"
                                    )}>
                                        {row.planned_date.split("T")[0]}
                                    </span>
                                ) : (
                                    <span className="text-slate-800 font-black">—</span>
                                )}
                            </TableCell>
                            <TableCell className="py-3 px-4 text-center">
                                <Badge className={cn("px-3 py-1 rounded-xl font-black uppercase tracking-tighter text-[10px] border shadow-inner whitespace-nowrap", statusStyles[row.status])}>
                                    {statusLabels[row.status] || row.status}
                                </Badge>
                            </TableCell>
                            <TableCell className="py-3 px-6 text-right">
                                <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transform translate-x-4 group-hover:translate-x-0 transition-all">
                                    <Link href={`/quality/qms/capa/${row.id}`}>
                                        <Button variant="ghost" size="sm" className="rounded-xl font-black text-[10px] uppercase tracking-widest text-slate-500 hover:text-white hover:bg-slate-800">
                                            Ver <ArrowRight className="h-3 w-3 ml-2" />
                                        </Button>
                                    </Link>
                                    <CAPAStatusUpdate capaId={row.id} currentStatus={row.status} />
                                    {row.nonconformity_id && (
                                        <Link href={`/quality/qms/${row.nonconformity_id}`}>
                                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-slate-600 hover:text-blue-400">
                                                <ExternalLink className="h-4 w-4" />
                                            </Button>
                                        </Link>
                                    )}
                                </div>
                            </TableCell>
                        </TableRow>
                    );
                })}
            </TableBody>
        </Table>
    );
}


"use client";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    FileText,
    Users,
    Clock,
    BarChart3,
    CheckCircle2,
    AlertCircle,
    Info,
    ChevronRight,
    Target,
    Trophy,
    ShieldAlert
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Create8DStandaloneDialog } from "./create-8d-standalone-dialog";

interface EightDViewProps {
    reports: any[];
    users: any[];
}

export function EightDView({ reports, users }: EightDViewProps) {
    const unwrap = (val: any) => Array.isArray(val) ? val[0] : val;

    const statusColors: Record<string, string> = {
        open: "bg-rose-500/10 text-rose-400 border-rose-500/20",
        in_progress: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
        completed: "bg-amber-500/10 text-amber-400 border-amber-500/20",
        closed: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    };

    const disciplines = [
        { d: "D1", label: "Equipa Técnica", icon: Users },
        { d: "D2", label: "Definição do Problema", icon: Info },
        { d: "D3", label: "Plano de Contenção", icon: AlertCircle },
        { d: "D4", label: "Análise de Causa-Raiz", icon: BarChart3 },
        { d: "D5", label: "Ações Corretivas", icon: Target },
        { d: "D6", label: "Implementação e Validação", icon: CheckCircle2 },
        { d: "D7", label: "Ações Preventivas", icon: ShieldAlert },
        { d: "D8", label: "Reconhecimento e Fecho", icon: Trophy },
    ];

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Methodology Guide */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
                {disciplines.map((item) => (
                    <div key={item.d} className="bg-card border border-border p-3 rounded-xl flex flex-col items-center justify-center text-center group hover:bg-muted/50 transition-colors shadow-sm">
                        <span className="text-[10px] font-bold text-primary mb-1">{item.d}</span>
                        <item.icon className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors mb-2" />
                        <span className="text-[9px] font-bold uppercase tracking-tighter leading-none text-muted-foreground group-hover:text-foreground">{item.label}</span>
                    </div>
                ))}
            </div>

            {/* Reports List */}
            <Card className="rounded-2xl border border-slate-800 bg-card shadow-2xl overflow-hidden">
                <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
                    <div>
                        <h3 className="text-sm font-black uppercase tracking-widest italic text-white">Registo de Relatórios 8D</h3>
                        <p className="text-[10px] font-black uppercase tracking-tight text-slate-500 mt-1">
                            Controlo de Melhoria Contínua • {(reports || []).length} processos submetidos
                        </p>
                    </div>
                    <Create8DStandaloneDialog users={users || []} />
                </div>

                <div className="p-0">
                    {(!reports || reports.length === 0) ? (
                        <div className="p-20 text-center space-y-4">
                            <div className="h-16 w-16 bg-slate-950 border border-slate-800 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
                                <FileText className="h-8 w-8 text-slate-700" />
                            </div>
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-600 italic">Nenhum relatório 8D disponível na workstation.</p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow className="border-b border-slate-800/50 hover:bg-transparent">
                                    <TableHead className="py-4 px-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] italic">Ref. Industrial</TableHead>
                                    <TableHead className="py-4 px-4 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] italic">Título / Não Conformidade</TableHead>
                                    <TableHead className="py-4 px-4 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] italic text-center">Progresso D-Steps</TableHead>
                                    <TableHead className="py-4 px-4 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] italic text-center">Estado</TableHead>
                                    <TableHead className="py-4 px-6 text-right text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] italic">Operação</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {reports.map((report: any) => {
                                    const nc = unwrap(report.nonconformity);
                                    return (
                                        <TableRow key={report.id} className="group hover:bg-slate-900/40 transition-all border-b border-slate-800/30 last:border-0 border-x-0">
                                            <TableCell className="py-3 px-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 rounded-lg bg-slate-950 border border-slate-800 group-hover:border-indigo-500/30 transition-all shadow-inner">
                                                        <FileText className="h-3.5 w-3.5 text-indigo-400" />
                                                    </div>
                                                    <span className="font-mono text-[11px] font-black text-white italic bg-slate-950 px-2 py-1 rounded border border-slate-800">
                                                        {report.report_number}
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-3 px-4">
                                                <div className="max-w-[350px]">
                                                    <p className="text-sm font-black text-white italic tracking-tight group-hover:text-indigo-400 transition-colors line-clamp-1">
                                                        {nc ? `${nc.nc_number}: ${nc.title}` : "Incidente Isolado / Direto"}
                                                    </p>
                                                    <div className="flex items-center gap-3 mt-1">
                                                        <span className="text-[9px] text-slate-600 font-black uppercase tracking-widest flex items-center gap-1">
                                                            <Users className="h-2.5 w-2.5" />
                                                            Equipa: {report.team_members?.length || 0}
                                                        </span>
                                                        <span className="text-[9px] text-slate-600 font-black uppercase tracking-widest flex items-center gap-1 text-nowrap">
                                                            <Clock className="h-2.5 w-2.5" />
                                                            Aberto: {report.opened_date}
                                                        </span>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-3 px-4">
                                                <div className="flex flex-col items-center gap-2 min-w-[120px]">
                                                    <div className="flex items-center justify-between w-full px-1">
                                                        <span className="text-[9px] font-black text-indigo-400 uppercase tracking-tighter italic">D{report.current_step} de D8</span>
                                                        <span className="text-[9px] font-black text-slate-500">{Math.round((report.current_step / 8) * 100)}%</span>
                                                    </div>
                                                    <div className="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-800 p-[1px]">
                                                        <div
                                                            className="h-full bg-indigo-500 rounded-full transition-all shadow-[0_0_8px_rgba(99,102,241,0.5)]"
                                                            style={{ width: `${(report.current_step / 8) * 100}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-3 px-4 text-center">
                                                <Badge className={cn("px-3 py-1 rounded-xl font-black uppercase tracking-tighter text-[9px] border shadow-inner whitespace-nowrap italic", statusColors[report.status])}>
                                                    {report.status === 'open' ? 'Aberto' :
                                                        report.status === 'in_progress' ? 'Em Progresso' :
                                                            report.status === 'completed' ? 'Análise Finalizada' :
                                                                report.status === 'closed' ? 'Relatório Encerrado' : report.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="py-3 px-6 text-right">
                                                <Link href={`/quality/qms/8d/${report.id}`}>
                                                    <Button variant="ghost" size="sm" className="rounded-xl font-black text-[10px] uppercase tracking-[0.2em] text-slate-500 hover:text-white hover:bg-slate-800 opacity-0 group-hover:opacity-100 transform translate-x-4 group-hover:translate-x-0 transition-all">
                                                        Consultar <ChevronRight className="h-3 ml-2" />
                                                    </Button>
                                                </Link>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    )}
                </div>
                <div className="p-4 bg-slate-950/20 border-t border-slate-800">
                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-600 text-center italic">
                        SmartLab Improvement Engine • Ford 8D Standard Compliance
                    </p>
                </div>
            </Card>
        </div>
    );
}

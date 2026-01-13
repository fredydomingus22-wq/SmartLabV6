import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { getOrganizationUsers } from "@/lib/queries/qms";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    ArrowLeft,
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
import { PageHeader } from "@/components/layout/page-header";
import Link from "next/link";
import { Create8DStandaloneDialog } from "./create-8d-standalone-dialog";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function EightDPage() {
    const supabase = await createClient();

    const { data: reports } = await supabase
        .from("eight_d_reports")
        .select(`
            *,
            nonconformity:nonconformities(nc_number, title)
        `)
        .order("created_at", { ascending: false });

    const { data: users } = await getOrganizationUsers();

    const unwrap = (val: any) => Array.isArray(val) ? val[0] : val;

    const statusColors: Record<string, string> = {
        open: "bg-rose-500/10 text-rose-400 border-rose-500/20",
        in_progress: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
        completed: "bg-amber-500/10 text-amber-400 border-amber-500/20",
        closed: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    };

    const disciplines = [
        { d: "D1", label: "Equipa", icon: Users },
        { d: "D2", label: "Problema", icon: Info },
        { d: "D3", label: "Contenção", icon: AlertCircle },
        { d: "D4", label: "Causa Raiz", icon: BarChart3 },
        { d: "D5", label: "Ações Corr.", icon: Target },
        { d: "D6", label: "Implementação", icon: CheckCircle2 },
        { d: "D7", label: "Prevenção", icon: ShieldAlert },
        { d: "D8", label: "Reconhecimento", icon: Trophy },
    ];

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            <PageHeader
                variant="purple"
                icon={<FileText className="h-4 w-4" />}
                overline="Quality Management System"
                title="Resolução de Problemas 8D"
                description="Metodologia estruturada para análise e eliminação de causas raiz através das 8 disciplinas."
                backHref="/quality/qms"
                actions={<Create8DStandaloneDialog users={users || []} />}
            />

            {/* Methodology Guide */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
                {disciplines.map((item) => (
                    <div key={item.d} className="bg-card border border-slate-800 p-3 rounded-2xl flex flex-col items-center justify-center text-center group hover:bg-purple-500/5 transition-colors shadow-sm">
                        <span className="text-[10px] font-bold text-purple-400 mb-1">{item.d}</span>
                        <item.icon className="h-4 w-4 text-slate-500 group-hover:text-purple-400 transition-colors mb-2" />
                        <span className="text-[9px] font-bold uppercase tracking-tighter leading-none text-slate-400 group-hover:text-white">{item.label}</span>
                    </div>
                ))}
            </div>

            {/* Reports List */}
            <div className="bg-card border border-slate-800 shadow-xl rounded-2xl overflow-hidden">
                <div className="p-6 border-b border-slate-800 flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-bold">Histórico de Relatórios 8D</h3>
                        <p className="text-sm text-slate-500">
                            {(reports || []).length} processos registados
                        </p>
                    </div>
                </div>

                <div className="p-0">
                    {(!reports || reports.length === 0) ? (
                        <div className="p-16 text-center text-muted-foreground">
                            <FileText className="h-12 w-12 mx-auto mb-4 opacity-10" />
                            <p className="italic">Nenhum relatório 8D disponível.</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-800">
                            {reports.map((report: any) => {
                                const nc = unwrap(report.nonconformity);
                                return (
                                    <Link
                                        href={`/quality/qms/8d/${report.id}`}
                                        key={report.id}
                                        className="flex flex-col md:flex-row md:items-center justify-between p-5 hover:bg-muted/30 transition-all group"
                                    >
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className="font-mono text-xs font-bold text-purple-400">{report.report_number}</span>
                                                <Badge className={cn("text-[9px] uppercase font-bold tracking-widest border-none px-2 py-0.5 rounded-full", statusColors[report.status])}>
                                                    {report.status === 'open' ? 'Aberto' :
                                                        report.status === 'in_progress' ? 'Em Progresso' :
                                                            report.status === 'completed' ? 'Concluído' :
                                                                report.status === 'closed' ? 'Fechado' : report.status}
                                                </Badge>
                                                <Badge variant="outline" className="text-[9px] font-bold border-purple-500/20 text-purple-300">
                                                    PASSO D{report.current_step}
                                                </Badge>
                                            </div>
                                            {nc && (
                                                <h4 className="text-sm font-semibold group-hover:text-primary transition-colors">
                                                    {nc.nc_number}: {nc.title}
                                                </h4>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-6 mt-4 md:mt-0">
                                            <div className="flex flex-col items-end gap-1">
                                                <div className="flex items-center gap-4 text-[10px] text-muted-foreground uppercase font-bold">
                                                    <span className="flex items-center gap-1">
                                                        <Users className="h-3 w-3" />
                                                        {report.team_members?.length || 0} Equipa
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <Clock className="h-3 w-3" />
                                                        {report.opened_date}
                                                    </span>
                                                </div>
                                                <div className="h-1 w-24 bg-muted rounded-full overflow-hidden mt-1">
                                                    <div className="h-full bg-purple-500 transition-all" style={{ width: `${(report.current_step / 8) * 100}%` }} />
                                                </div>
                                            </div>
                                            <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}


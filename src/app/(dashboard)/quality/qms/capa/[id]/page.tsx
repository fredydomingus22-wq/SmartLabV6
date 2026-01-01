import { getCAPAById } from "@/lib/queries/qms";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
    ArrowLeft,
    Target,
    User,
    Calendar,
    FileText,
    History,
    ShieldAlert,
    Activity,
    ExternalLink,
    GraduationCap,
    Paperclip,
    Clock
} from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cn } from "@/lib/utils";
import { CAPAStatusUpdate } from "../../[id]/capa-status-update";
import { CAPARouting } from "./capa-routing";

export const dynamic = "force-dynamic";

interface PageProps {
    params: Promise<{ id: string }>;
}

export default async function CAPADetailPage({ params }: PageProps) {
    const { id } = await params;
    const { capa, error } = await getCAPAById(id);

    if (!capa || error) {
        notFound();
    }

    const statusLabels: Record<string, string> = {
        planned: "Planeada",
        in_progress: "Em Progresso",
        completed: "Concluída",
        verified: "Verificada",
        closed: "Fechada",
    };

    const statusColors: Record<string, string> = {
        planned: "bg-slate-500/10 text-slate-400 border-slate-500/20",
        in_progress: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
        completed: "bg-amber-500/10 text-amber-400 border-amber-500/20",
        verified: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
        closed: "bg-slate-800 text-slate-400 border-slate-700",
    };

    return (
        <div className="flex flex-col h-full space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Action Header */}
            <div className="glass p-6 rounded-3xl border-none shadow-xl bg-gradient-to-br from-emerald-500/5 to-transparent">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                        <Link href="/quality/qms?tab=capa">
                            <Button variant="ghost" size="icon" className="rounded-xl hover:bg-white/5">
                                <ArrowLeft className="h-5 w-5" />
                            </Button>
                        </Link>
                        <div className="space-y-1">
                            <div className="flex items-center gap-3 flex-wrap">
                                <span className="font-mono text-2xl font-bold text-emerald-400 tracking-tighter">{capa.action_number}</span>
                                <Badge variant="outline" className="px-3 py-1 uppercase text-[10px] font-bold tracking-widest border-emerald-500/20 text-emerald-400 rounded-full">
                                    {capa.action_type === 'corrective' ? 'Ação Corretiva' : 'Ação Preventiva'}
                                </Badge>
                                <Badge className={cn("px-3 py-1 uppercase text-[10px] font-bold tracking-widest border-none rounded-full", statusColors[capa.status])}>
                                    {statusLabels[capa.status]}
                                </Badge>
                            </div>
                            <h1 className="text-xl font-semibold text-foreground/90">{capa.description}</h1>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        <CAPAStatusUpdate capaId={capa.id} currentStatus={capa.status} />
                    </div>
                </div>
            </div>

            {/* Visual Routing Tracker */}
            <div className="glass p-4 rounded-2xl bg-slate-900/50">
                <CAPARouting currentStatus={capa.status} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-full">
                {/* Main Content (Left) */}
                <div className="lg:col-span-3 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <InfoCard
                            title="Não Conformidade"
                            value={capa.nonconformity?.nc_number || "Ação Standalone"}
                            icon={ShieldAlert}
                            description={capa.nonconformity?.title}
                            link={capa.nonconformity ? `/quality/qms/${capa.nonconformity.id}` : undefined}
                        />
                        <InfoCard
                            title="Responsável"
                            value={capa.responsible_user?.full_name || "Não atribuído"}
                            icon={User}
                        />
                        <InfoCard
                            title="Prazo Limite"
                            value={capa.planned_date || "Não Definido"}
                            icon={Calendar}
                            isOverdue={capa.planned_date && new Date(capa.planned_date) < new Date() && capa.status !== "closed"}
                        />
                    </div>

                    {/* RCA & Plan */}
                    <Card className="glass border-none shadow-xl bg-muted/20">
                        <CardHeader className="flex flex-row items-center gap-2 pb-2">
                            <Target className="h-5 w-5 text-emerald-400" />
                            <CardTitle className="text-lg">Análise de Causa Raiz & Plano</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-2">
                                <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Causa Raiz</h4>
                                <div className="p-4 rounded-2xl bg-muted/40 border border-border/50">
                                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{capa.root_cause || "Pendente de análise..."}</p>
                                </div>
                            </div>

                            {capa.training_required && (
                                <div className="flex items-center justify-between p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20">
                                    <div className="flex items-center gap-3">
                                        <GraduationCap className="h-6 w-6 text-amber-400" />
                                        <div>
                                            <p className="text-sm font-bold text-amber-200">Formação Obrigatória</p>
                                            <p className="text-xs text-amber-400/80">Esta ação requer formação de pessoal antes do encerramento.</p>
                                        </div>
                                    </div>
                                    {capa.training_module ? (
                                        <Link href={`/quality/training/modules/${capa.training_module_id}`}>
                                            <Button size="sm" className="bg-amber-600 hover:bg-amber-500 h-8">
                                                Ver Módulo
                                            </Button>
                                        </Link>
                                    ) : (
                                        <Button variant="outline" size="sm" className="border-amber-500/50 text-amber-400 h-8">
                                            Configurar Formação
                                        </Button>
                                    )}
                                </div>
                            )}

                            <div className="space-y-4">
                                <div className="flex items-center justify-between border-b border-border/50 pb-2">
                                    <h4 className="text-sm font-bold flex items-center gap-2">
                                        <Paperclip className="h-4 w-4 text-slate-400" />
                                        Evidências e Anexos
                                    </h4>
                                    <Button variant="ghost" size="sm" className="text-[10px] h-7 uppercase font-bold tracking-widest">
                                        Adicionar Anexo
                                    </Button>
                                </div>
                                {capa.attachments?.length === 0 ? (
                                    <p className="text-xs text-muted-foreground italic text-center py-4">Nenhum anexo disponível.</p>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {capa.attachments?.map((att: any) => (
                                            <div key={att.id} className="p-3 rounded-xl glass border-slate-800 flex items-center justify-between group">
                                                <div className="flex items-center gap-3">
                                                    <FileText className="h-4 w-4 text-indigo-400" />
                                                    <div className="max-w-[150px]">
                                                        <p className="text-xs font-bold truncate">{att.file_name}</p>
                                                        <p className="text-[9px] text-muted-foreground">{(att.file_size_bytes / 1024).toFixed(1)} KB</p>
                                                    </div>
                                                </div>
                                                <a href={att.file_url} target="_blank" rel="noopener noreferrer">
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <ExternalLink className="h-3 w-3" />
                                                    </Button>
                                                </a>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Sidebar - History (The MasterControl "History" Sidebar) */}
                <div className="lg:col-span-1 border-l border-slate-800 pl-6 h-full min-h-[500px]">
                    <div className="sticky top-6 space-y-6">
                        <div className="flex items-center gap-2 mb-4">
                            <History className="h-5 w-5 text-indigo-400" />
                            <h3 className="text-lg font-bold tracking-tight">Timeline & Auditoria</h3>
                        </div>

                        <div className="relative space-y-8 before:absolute before:inset-0 before:ml-5 before:-translate-x-px before:h-full before:w-0.5 before:bg-gradient-to-b before:from-indigo-500/50 before:via-slate-800 before:to-transparent">
                            {capa.history.length === 0 ? (
                                <p className="text-xs text-muted-foreground italic pl-10">Nenhum histórico registado.</p>
                            ) : (
                                capa.history.map((log: any, idx: number) => (
                                    <div key={log.id} className="relative flex items-start group">
                                        <div className="absolute left-0 flex items-center justify-center w-10 h-10 rounded-full border border-slate-800 bg-slate-900 group-hover:border-indigo-500/50 transition-colors z-10">
                                            <div className="w-2 h-2 rounded-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]" />
                                        </div>
                                        <div className="pl-12 pt-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-xs font-bold text-foreground/90">{log.actor?.full_name || "Sistema"}</span>
                                                <time className="text-[10px] text-muted-foreground flex items-center gap-1">
                                                    <Clock className="h-3 w-3" />
                                                    {new Date(log.changed_at).toLocaleString('pt-PT', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                                </time>
                                            </div>
                                            <div className="p-3 rounded-2xl glass border-slate-800 text-[11px] leading-relaxed group-hover:bg-indigo-500/5 transition-colors">
                                                <p className="font-semibold text-indigo-300 capitalize mb-1">{log.action}</p>
                                                {log.notes && <p className="text-muted-foreground">{log.notes}</p>}
                                                {log.new_values?.status && (
                                                    <div className="mt-2 flex items-center gap-2">
                                                        <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-500 line-through">{log.old_values?.status || 'N/A'}</span>
                                                        <ArrowLeft className="h-2 w-2 rotate-180 text-emerald-400" />
                                                        <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400">{log.new_values.status}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function InfoCard({ title, value, icon: Icon, description, isOverdue, link }: any) {
    const content = (
        <Card className={cn(
            "glass border-none shadow-md overflow-hidden bg-background/40 transition-all duration-300",
            link ? "hover:bg-white/5 hover:translate-y-[-2px] cursor-pointer" : ""
        )}>
            <CardHeader className="p-4 pb-1">
                <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                    <Icon className="h-3 w-3" />
                    {title}
                </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-1 flex items-center justify-between">
                <div className="w-full">
                    <p className={cn("text-lg font-bold truncate", isOverdue ? "text-rose-500" : "text-foreground/80")}>
                        {value}
                    </p>
                    {isOverdue && <p className="text-[9px] font-bold text-rose-500 animate-pulse">PRAZO ULTRAPASSADO</p>}
                    {description && <p className="text-[10px] text-muted-foreground mt-1 truncate">{description}</p>}
                </div>
                {link && <ExternalLink className="h-4 w-4 text-muted-foreground/30" />}
            </CardContent>
        </Card>
    );

    if (link) return <Link href={link}>{content}</Link>;
    return content;
}

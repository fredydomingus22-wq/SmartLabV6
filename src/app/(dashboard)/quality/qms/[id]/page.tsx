import { getNonconformityById } from "@/lib/queries/qms";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    ArrowLeft,
    AlertTriangle,
    User,
    Calendar,
    Plus,
    CheckCircle,
    Clock,
    FileText,
    History,
    ShieldAlert,
    Target,
    Activity,
    Info
} from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { NCStatusUpdate } from "./nc-status-update";
import { CreateCAPADialog } from "./create-capa-dialog";
import { EditNCDialog } from "./edit-nc-dialog";
import { Create8DDialog } from "./create-8d-dialog";
import { NCAttachments } from "./nc-attachments";
import { CloseNCDialog } from "./close-nc-dialog";
import { CAPAStatusUpdate } from "./capa-status-update";
import { VerifyEffectivenessDialog } from "./verify-effectiveness-dialog";
import { NCInsights } from "../nc-insights";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

interface PageProps {
    params: Promise<{ id: string }>;
}

export default async function NCDetailPage({ params }: PageProps) {
    const { id } = await params;
    const { nc, capas, eightD, error } = await getNonconformityById(id);

    if (!nc || error) {
        notFound();
    }

    const unwrap = (val: any) => Array.isArray(val) ? val[0] : val;
    const detectedBy = unwrap(nc.detected_by_user);
    const responsible = unwrap(nc.responsible_user);

    const severityLabels: Record<string, string> = {
        minor: "Menor",
        major: "Maior",
        critical: "Crítica",
    };

    const severityColors: Record<string, string> = {
        minor: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
        major: "bg-orange-500/10 text-orange-400 border-orange-500/20",
        critical: "bg-rose-500/10 text-rose-400 border-rose-500/20 animate-pulse",
    };

    const statusLabels: Record<string, string> = {
        open: "Aberta",
        under_investigation: "Em Investigação",
        containment: "Contenção",
        corrective_action: "Ação Corretiva",
        verification: "Verificação",
        closed: "Fechada",
    };

    const statusColors: Record<string, string> = {
        open: "bg-slate-500/10 text-slate-400 border-border/50",
        under_investigation: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
        containment: "bg-amber-500/10 text-amber-400 border-amber-500/20",
        corrective_action: "bg-purple-500/10 text-purple-400 border-purple-500/20",
        verification: "bg-orange-500/10 text-orange-400 border-orange-500/20",
        closed: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    };

    const capaStatusColors: Record<string, string> = {
        planned: "bg-slate-500/10 text-slate-400",
        in_progress: "bg-indigo-500/10 text-indigo-400",
        completed: "bg-amber-500/10 text-amber-400",
        verified: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
        closed: "bg-slate-800 text-slate-400",
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header Section */}
            <div className="glass p-6 rounded-3xl border-none shadow-xl bg-gradient-to-br from-indigo-500/5 to-transparent">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                        <Link href="/quality/qms">
                            <Button variant="ghost" size="icon" className="rounded-xl hover:bg-white/5">
                                <ArrowLeft className="h-5 w-5" />
                            </Button>
                        </Link>
                        <div className="space-y-1">
                            <div className="flex items-center gap-3 flex-wrap">
                                <span className="font-mono text-2xl font-bold text-indigo-400 tracking-tighter">{nc.nc_number}</span>
                                <Badge className={cn("px-3 py-1 uppercase text-[10px] font-bold tracking-widest border-none rounded-full", severityColors[nc.severity])}>
                                    {severityLabels[nc.severity]}
                                </Badge>
                                <Badge className={cn("px-3 py-1 uppercase text-[10px] font-bold tracking-widest border-none rounded-full", statusColors[nc.status])}>
                                    {statusLabels[nc.status]}
                                </Badge>
                            </div>
                            <h1 className="text-xl font-semibold text-foreground/90">{nc.title}</h1>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        <EditNCDialog nc={nc} />
                        {!eightD && <Create8DDialog ncId={nc.id} />}
                        {nc.status !== "closed" && (
                            <CloseNCDialog ncId={nc.id} ncNumber={nc.nc_number} />
                        )}
                        <NCStatusUpdate ncId={nc.id} currentStatus={nc.status} />
                    </div>
                </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
                {/* Lateral Side - Info */}
                <div className="space-y-6 lg:col-span-1">
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
                        <InfoCard
                            title="Classificação"
                            value={nc.nc_type === 'internal' ? 'Interna' : nc.nc_type === 'supplier' ? 'Fornecedor' : nc.nc_type === 'customer' ? 'Cliente' : nc.nc_type}
                            icon={ShieldAlert}
                            description={nc.category || "Geral"}
                        />
                        <InfoCard
                            title="Detetada Por"
                            value={detectedBy?.full_name || "Sistema"}
                            icon={User}
                            description={nc.detected_date}
                        />
                        <InfoCard
                            title="Responsável"
                            value={responsible?.full_name || "Aguardando Atribuição"}
                            icon={Activity}
                        />
                        <InfoCard
                            title="Data Limite"
                            value={nc.due_date || "Não Definida"}
                            icon={Calendar}
                            isOverdue={nc.due_date && new Date(nc.due_date) < new Date() && nc.status !== "closed"}
                        />
                    </div>

                    {/* Attachments Section */}
                    <NCAttachments ncId={nc.id} organizationId={nc.organization_id} />
                </div>

                {/* Main Section - Description & CAPA */}
                <div className="space-y-6 lg:col-span-2">
                    {/* AI Insights - Automated RCA */}
                    <NCInsights ncId={nc.id} />

                    {/* Description Card */}
                    <Card className="glass border-none shadow-xl bg-muted/20">
                        <CardHeader className="flex flex-row items-center gap-2 pb-2">
                            <FileText className="h-5 w-5 text-indigo-400" />
                            <CardTitle className="text-lg">Investigação e Detalhes</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="p-4 rounded-2xl bg-muted/40 border border-border/50">
                                <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">Problema Reportado</h4>
                                <p className="text-sm leading-relaxed whitespace-pre-wrap">{nc.description}</p>
                            </div>

                            {nc.source_reference && (
                                <div className="flex items-center gap-2 p-3 rounded-xl bg-indigo-500/5 border border-indigo-500/10">
                                    <History className="h-4 w-4 text-indigo-400" />
                                    <span className="text-xs text-muted-foreground">Origem Rastreável:</span>
                                    <span className="text-xs font-mono font-bold text-indigo-300">{nc.source_reference}</span>
                                </div>
                            )}

                            {nc.notes && (
                                <div className="space-y-2">
                                    <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Notas Adicionais</h4>
                                    <p className="text-sm p-4 rounded-xl bg-muted/20 italic">{nc.notes}</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* CAPA Section */}
                    <Card className="glass border-none shadow-xl">
                        <CardHeader className="flex flex-row items-center justify-between bg-gradient-to-r from-muted/50 to-transparent border-b border-border/50">
                            <div className="flex items-center gap-3">
                                <Target className="h-5 w-5 text-emerald-400" />
                                <div>
                                    <CardTitle className="text-lg uppercase tracking-tight">Plano de Ações CAPA</CardTitle>
                                    <CardDescription>{capas.length} ações corretivas/preventivas</CardDescription>
                                </div>
                            </div>
                            <CreateCAPADialog ncId={nc.id} />
                        </CardHeader>
                        <CardContent className="p-0">
                            {capas.length === 0 ? (
                                <div className="p-12 text-center">
                                    <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-10 text-emerald-500" />
                                    <p className="text-muted-foreground italic text-sm">Nenhuma ação CAPA definida para esta ocorrência.</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-border/30">
                                    {capas.map((capa: any) => {
                                        const capaResponsible = unwrap(capa.responsible_user);
                                        return (
                                            <div key={capa.id} className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-muted/30 transition-colors">
                                                <div className="space-y-2 flex-1">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <span className="font-mono text-[11px] font-bold text-emerald-400">{capa.action_number}</span>
                                                        <Badge variant="outline" className="text-[9px] uppercase font-bold tracking-tighter border-emerald-500/20 text-emerald-300">
                                                            {capa.action_type === 'corrective' ? 'Corretiva' : 'Preventiva'}
                                                        </Badge>
                                                        <Badge className={cn("text-[9px] uppercase font-bold border-none", capaStatusColors[capa.status])}>
                                                            {capa.status === 'planned' ? 'Planeada' :
                                                                capa.status === 'in_progress' ? 'Em Progresso' :
                                                                    capa.status === 'completed' ? 'Concluída' :
                                                                        capa.status === 'verified' ? 'Verificada' :
                                                                            capa.status === 'closed' ? 'Fechada' : capa.status}
                                                        </Badge>
                                                    </div>
                                                    <p className="text-sm font-medium leading-snug">{capa.description}</p>
                                                    <div className="flex items-center gap-4 text-[10px] text-muted-foreground">
                                                        <div className="flex items-center gap-1">
                                                            <User className="h-3 w-3" />
                                                            {capaResponsible?.full_name || "Não atribuído"}
                                                        </div>
                                                        <div className="flex items-center gap-1">
                                                            <Calendar className="h-3 w-3" />
                                                            {capa.planned_date || "S/ Data"}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex flex-col items-end gap-2">
                                                    <CAPAStatusUpdate capaId={capa.id} currentStatus={capa.status} />

                                                    {/* Effectiveness Review Hook */}
                                                    {['completed', 'verification'].includes(capa.status) && (
                                                        <VerifyEffectivenessDialog
                                                            capaId={capa.id}
                                                            capaDescription={capa.description}
                                                        />
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}

function InfoCard({ title, value, icon: Icon, description, isOverdue }: any) {
    return (
        <Card className="glass border-none shadow-md overflow-hidden bg-background/40">
            <CardHeader className="p-4 pb-1">
                <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                    <Icon className="h-3 w-3" />
                    {title}
                </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-1">
                <p className={cn("text-lg font-bold truncate", isOverdue ? "text-rose-500" : "text-foreground/80")}>
                    {value}
                </p>
                {isOverdue && <p className="text-[9px] font-bold text-rose-500 animate-pulse">PRAZO ULTRAPASSADO</p>}
                {description && <p className="text-[10px] text-muted-foreground mt-1">{description}</p>}
            </CardContent>
        </Card>
    );
}

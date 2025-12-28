import { createClient } from "@/lib/supabase/server";
import { getOrganizationUsers } from "@/lib/queries/qms";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    ArrowLeft,
    CheckCircle,
    Circle,
    Users,
    FileText,
    History,
    ChevronRight,
    Trophy,
    Target,
    Activity,
    AlertCircle,
    Info
} from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { EightDStepForm } from "./8d-step-form";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

interface PageProps {
    params: Promise<{ id: string }>;
}

const steps = [
    { num: 1, title: "Formação da Equipa", description: "Formar uma equipa multidisciplinar", icon: Users },
    { num: 2, title: "Descrição do Problema", description: "Definir o problema usando 5W2H", icon: Info },
    { num: 3, title: "Ações de Contenção", description: "Implementar contenção temporária", icon: AlertCircle },
    { num: 4, title: "Análise de Causa Raiz", description: "Identificar a causa raiz (5-Why, etc.)", icon: BarChart3Placeholder },
    { num: 5, title: "Ações Corretivas", description: "Definir ações corretivas permanentes", icon: TargetPlaceholder },
    { num: 6, title: "Implementação", description: "Implementar e verificar ações", icon: Activity },
    { num: 7, title: "Prevenção", description: "Medidas preventivas sistémicas", icon: ShieldPlaceholder },
    { num: 8, title: "Reconhecimento", description: "Felicitar a equipa", icon: TrophyPlaceholder },
];

function BarChart3Placeholder(props: any) { return <Activity {...props} /> }
function TargetPlaceholder(props: any) { return <FileText {...props} /> }
function ShieldPlaceholder(props: any) { return <FileText {...props} /> }
function TrophyPlaceholder(props: any) { return <Trophy {...props} /> }

export default async function EightDDetailPage({ params }: PageProps) {
    const { id } = await params;
    const supabase = await createClient();

    const { data: report, error } = await supabase
        .from("eight_d_reports")
        .select(`
            *,
            nonconformity:nonconformities(id, nc_number, title)
        `)
        .eq("id", id)
        .single();

    const { data: users } = await getOrganizationUsers();

    if (error || !report) {
        notFound();
    }

    const unwrap = (val: any) => Array.isArray(val) ? val[0] : val;
    const nc = unwrap(report.nonconformity);

    const statusColors: Record<string, string> = {
        open: "bg-rose-500/10 text-rose-400 border-rose-500/20",
        in_progress: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
        completed: "bg-amber-500/10 text-amber-400 border-amber-500/20",
        closed: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header Section */}
            <div className="glass p-6 rounded-3xl border-none shadow-xl bg-gradient-to-br from-purple-500/5 to-transparent">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                        <Link href="/quality/qms/8d">
                            <Button variant="ghost" size="icon" className="rounded-xl hover:bg-white/5">
                                <ArrowLeft className="h-5 w-5" />
                            </Button>
                        </Link>
                        <div className="space-y-1">
                            <div className="flex items-center gap-3 flex-wrap">
                                <span className="font-mono text-2xl font-bold text-purple-400 tracking-tighter">{report.report_number}</span>
                                <Badge className={cn("px-3 py-1 uppercase text-[10px] font-bold tracking-widest border-none rounded-full", statusColors[report.status])}>
                                    {report.status === "open" ? "Aberto" :
                                        report.status === "in_progress" ? "Em Progresso" :
                                            report.status === "completed" ? "Concluído" :
                                                report.status === "closed" ? "Fechado" : report.status}
                                </Badge>
                                <Badge variant="outline" className="text-[10px] uppercase font-bold tracking-widest border-purple-500/20 text-purple-300 rounded-full">
                                    PASSO D{report.current_step}
                                </Badge>
                            </div>
                            {nc && (
                                <p className="text-sm text-muted-foreground flex items-center gap-2">
                                    Vinculado a:
                                    <Link href={`/quality/qms/${nc.id}`} className="text-purple-400 hover:text-purple-300 font-bold transition-colors">
                                        {nc.nc_number}
                                    </Link>
                                    • {nc.title}
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-4">
                {/* Lateral Side - Status Grid */}
                <div className="lg:col-span-1 space-y-4">
                    <Card className="glass border-none shadow-lg bg-background/40">
                        <CardHeader className="p-4 pb-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex flex-row items-center gap-2">
                            <Users className="h-3 w-3" />
                            Equipa Atribuída
                        </CardHeader>
                        <CardContent className="p-4 pt-1">
                            <p className="text-sm font-bold truncate text-foreground/80">{report.champion || "Líder a definir"}</p>
                            <p className="text-[10px] text-muted-foreground mt-1">
                                {report.team_members?.length || 0} membros ativos
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="glass border-none shadow-lg bg-background/40">
                        <CardHeader className="p-4 pb-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex flex-row items-center gap-2">
                            <History className="h-3 w-3" />
                            Abertura
                        </CardHeader>
                        <CardContent className="p-4 pt-1">
                            <p className="text-sm font-bold text-foreground/80">{new Date(report.opened_date).toLocaleDateString("pt-PT")}</p>
                        </CardContent>
                    </Card>

                    <Card className="glass border-none shadow-lg bg-background/40 overflow-hidden">
                        <CardHeader className="p-4 pb-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                            Progresso Global
                        </CardHeader>
                        <CardContent className="p-4 pt-1">
                            <div className="flex justify-between items-end mb-2">
                                <p className="text-2xl font-bold text-purple-400">{report.current_step}/8</p>
                                <p className="text-[10px] font-bold text-muted-foreground">Disciplinas</p>
                            </div>
                            <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                                <div
                                    className="bg-purple-500 h-full transition-all duration-1000"
                                    style={{ width: `${(report.current_step / 8) * 100}%` }}
                                />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Main Section - Steps Feed */}
                <div className="lg:col-span-3">
                    <div className="space-y-6">
                        {steps.map((step) => {
                            const isCompleted = step.num < report.current_step;
                            const isCurrent = step.num === report.current_step;
                            const isLocked = step.num > report.current_step;

                            return (
                                <Card key={step.num} className={cn(
                                    "glass border-none transition-all duration-500 overflow-hidden",
                                    isCurrent ? "shadow-2xl ring-1 ring-purple-500/30 scale-[1.01]" :
                                        isCompleted ? "opacity-90 shadow-sm grayscale-[0.2]" : "opacity-40"
                                )}>
                                    <div className={cn(
                                        "flex flex-col md:flex-row md:items-start gap-4 p-5",
                                        isCurrent ? "bg-gradient-to-r from-purple-500/5 to-transparent" :
                                            isCompleted ? "bg-muted/10 font-medium" : ""
                                    )}>
                                        <div className={cn(
                                            "flex items-center justify-center w-10 h-10 rounded-2xl flex-shrink-0 transition-transform",
                                            isCompleted ? "bg-emerald-500/20 text-emerald-400" :
                                                isCurrent ? "bg-purple-500 text-white scale-110 shadow-lg" :
                                                    "bg-muted text-muted-foreground"
                                        )}>
                                            {isCompleted ? <CheckCircle className="h-5 w-5" /> : <step.icon className="h-5 w-5" />}
                                        </div>

                                        <div className="flex-1 space-y-4">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <h3 className={cn("font-bold text-lg tracking-tight", isCurrent ? "text-foreground" : "text-muted-foreground")}>
                                                        D{step.num}: {step.title}
                                                    </h3>
                                                    <p className="text-xs text-muted-foreground">{step.description}</p>
                                                </div>
                                                {isCompleted && (
                                                    <Badge variant="outline" className="text-emerald-400 bg-emerald-500/5 text-[10px] uppercase font-bold tracking-widest border-emerald-500/20">
                                                        Concluído
                                                    </Badge>
                                                )}
                                            </div>

                                            {/* Step Content visualization */}
                                            {(isCompleted || isCurrent) && (
                                                <div className="space-y-4">
                                                    {/* Condensed Summary for Completed Steps */}
                                                    {isCompleted && (
                                                        <div className="text-sm p-4 rounded-2xl bg-muted/30 border border-border/40 italic text-muted-foreground">
                                                            {step.num === 1 && report.team_members && `Equipa: ${report.team_members.join(", ")}`}
                                                            {step.num === 2 && report.problem_description}
                                                            {step.num === 3 && report.containment_actions}
                                                            {step.num === 4 && report.root_cause_analysis}
                                                            {step.num === 5 && report.corrective_actions}
                                                            {step.num === 6 && report.implementation_verification}
                                                            {step.num === 7 && report.preventive_actions}
                                                            {step.num === 8 && report.lessons_learned}
                                                            {!report[`step_${step.num}_data`] && !report[Object.keys(report).find(k => k.includes(step.title.toLowerCase().replace(' ', '_'))) || ''] && "Informação documentada no processo."}
                                                        </div>
                                                    )}

                                                    {/* Interactive Form for Current Step */}
                                                    {isCurrent && report.status !== "completed" && (
                                                        <div className="pt-2 animate-in slide-in-from-top-2 duration-700">
                                                            <EightDStepForm
                                                                reportId={report.id}
                                                                step={step.num}
                                                                currentData={report}
                                                                users={users || []}
                                                            />
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </Card>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}

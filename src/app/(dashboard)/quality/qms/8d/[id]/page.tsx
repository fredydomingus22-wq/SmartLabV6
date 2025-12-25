import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, CheckCircle, Circle, Users, FileText } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { EightDStepForm } from "./8d-step-form";

export const dynamic = "force-dynamic";

interface PageProps {
    params: Promise<{ id: string }>;
}

const steps = [
    { num: 1, title: "Formação da Equipa", description: "Formar uma equipa multidisciplinar" },
    { num: 2, title: "Descrição do Problema", description: "Definir o problema usando 5W2H" },
    { num: 3, title: "Ações de Contenção", description: "Implementar contenção temporária" },
    { num: 4, title: "Análise de Causa Raiz", description: "Identificar a causa raiz (5-Why, Fishbone, etc.)" },
    { num: 5, title: "Ações Corretivas", description: "Definir ações corretivas permanentes" },
    { num: 6, title: "Implementação", description: "Implementar e verificar ações corretivas" },
    { num: 7, title: "Prevenção de Recorrência", description: "Implementar medidas preventivas sistémicas" },
    { num: 8, title: "Reconhecimento da Equipa", description: "Felicitar a equipa e documentar lições" },
];


export default async function EightDDetailPage({ params }: PageProps) {
    const { id } = await params;
    const supabase = await createClient();

    const { data: report, error } = await supabase
        .from("eight_d_reports")
        .select(`
            *,
            nonconformity:nonconformities(nc_number, title)
        `)
        .eq("id", id)
        .single();

    if (error || !report) {
        notFound();
    }

    const unwrap = (val: any) => Array.isArray(val) ? val[0] : val;
    const nc = unwrap(report.nonconformity);

    const statusColors: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
        open: "secondary",
        in_progress: "secondary",
        completed: "default",
        closed: "default",
    };

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link href="/quality/qms/8d">
                    <Button variant="ghost" size="icon" className="glass">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                </Link>
                <div className="flex-1">
                    <div className="flex items-center gap-3">
                        <h1 className="text-3xl font-bold tracking-tight font-mono">{report.report_number}</h1>
                        <Badge variant={statusColors[report.status] || "outline"}>
                            {report.status === "open" ? "Aberto" :
                                report.status === "in_progress" ? "Em Progresso" :
                                    report.status === "completed" ? "Concluído" :
                                        report.status === "closed" ? "Fechado" : report.status}
                        </Badge>
                        <Badge variant="outline" className="glass">Passo D{report.current_step}</Badge>
                    </div>
                    {nc && (
                        <p className="text-slate-400">
                            NC: <Link href={`/quality/qms/${nc.id}`} className="text-primary hover:underline">
                                {nc.nc_number}
                            </Link> - {nc.title}
                        </p>
                    )}
                </div>
            </div>


            {/* Info Cards */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card className="glass border-slate-800">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium flex items-center gap-2 text-slate-400">
                            <Users className="h-4 w-4" />
                            Equipa
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="font-medium">{report.champion || "Sem líder"}</p>
                        <p className="text-sm text-slate-500">
                            {report.team_members?.length || 0} membro(s) da equipa
                        </p>
                    </CardContent>
                </Card>


                <Card className="glass border-slate-800">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-slate-400">Aberto em</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-xl font-bold">{new Date(report.opened_date).toLocaleDateString()}</p>
                    </CardContent>
                </Card>


                <Card className="glass border-slate-800">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-slate-400">Progresso</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-xl font-bold">{report.current_step}/8 Passos</p>
                        <div className="w-full bg-slate-800 rounded-full h-2 mt-2">
                            <div
                                className="bg-primary h-2 rounded-full transition-all"
                                style={{ width: `${(report.current_step / 8) * 100}%` }}
                            />
                        </div>
                    </CardContent>
                </Card>

            </div>

            {/* Steps Progress */}
            <Card className="glass border-slate-800">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        Disciplinas 8D
                    </CardTitle>
                    <CardDescription className="text-slate-400">Progresso através das 8 disciplinas</CardDescription>
                </CardHeader>
                <CardContent>

                    <div className="space-y-4">
                        {steps.map((step) => {
                            const isCompleted = step.num < report.current_step;
                            const isCurrent = step.num === report.current_step;

                            return (
                                <div
                                    key={step.num}
                                    className={`flex items-start gap-4 p-4 rounded-lg border ${isCurrent ? "border-primary bg-primary/5" :
                                        isCompleted ? "bg-muted/50" : ""
                                        }`}
                                >
                                    <div className={`flex items-center justify-center w-8 h-8 rounded-full ${isCompleted ? "bg-green-500 text-white" :
                                        isCurrent ? "bg-primary text-primary-foreground" :
                                            "bg-muted text-muted-foreground"
                                        }`}>
                                        {isCompleted ? (
                                            <CheckCircle className="h-5 w-5" />
                                        ) : (
                                            <span className="font-bold">{step.num}</span>
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-medium">D{step.num}: {step.title}</p>
                                        <p className="text-sm text-muted-foreground">{step.description}</p>

                                        {/* Show step data if completed or current */}
                                        {(isCompleted || isCurrent) && (
                                            <div className="mt-2 text-sm">
                                                {step.num === 1 && report.team_members?.length > 0 && (
                                                    <p className="text-muted-foreground">
                                                        Equipa: {report.team_members.join(", ")}
                                                    </p>
                                                )}
                                                {step.num === 2 && report.problem_description && (
                                                    <p className="text-muted-foreground line-clamp-2">
                                                        {report.problem_description}
                                                    </p>
                                                )}
                                                {step.num === 3 && report.containment_actions && (
                                                    <p className="text-muted-foreground line-clamp-2">
                                                        {report.containment_actions}
                                                    </p>
                                                )}
                                                {step.num === 4 && report.root_cause_analysis && (
                                                    <p className="text-muted-foreground line-clamp-2">
                                                        {report.root_cause_analysis}
                                                    </p>
                                                )}
                                            </div>
                                        )}

                                        {/* Show form for current step */}
                                        {isCurrent && report.status !== "completed" && (
                                            <EightDStepForm
                                                reportId={report.id}
                                                step={step.num}
                                                currentData={report}
                                            />
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

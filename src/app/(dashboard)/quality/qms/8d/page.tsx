import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, FileText, Users, Clock } from "lucide-react";
import Link from "next/link";
import { Create8DStandaloneDialog } from "./create-8d-standalone-dialog";

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

    const unwrap = (val: any) => Array.isArray(val) ? val[0] : val;

    const statusColors: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
        open: "destructive",
        in_progress: "secondary",
        completed: "default",
        closed: "default",
    };

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/quality/qms">
                        <Button variant="ghost" size="icon">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                            <FileText className="h-8 w-8 text-purple-500" />
                            Resolução de Problemas 8D
                        </h1>
                        <p className="text-muted-foreground">
                            Metodologia das Oito Disciplinas para análise de causa raiz
                        </p>
                    </div>
                </div>
                <Create8DStandaloneDialog />
            </div>

            {/* Info Card */}
            <Card className="glass border-purple-500/20">
                <CardHeader>
                    <CardTitle>Metodologia 8D</CardTitle>
                    <CardDescription>
                        Uma abordagem estruturada de resolução de problemas para identificar, corrigir e eliminar problemas recorrentes
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div className="p-2 bg-muted/50 rounded">
                            <span className="font-bold">D1</span> - Formação da Equipa
                        </div>
                        <div className="p-2 bg-muted/50 rounded">
                            <span className="font-bold">D2</span> - Descrição do Problema
                        </div>
                        <div className="p-2 bg-muted/50 rounded">
                            <span className="font-bold">D3</span> - Ações de Contenção
                        </div>
                        <div className="p-2 bg-muted/50 rounded">
                            <span className="font-bold">D4</span> - Análise de Causa Raiz
                        </div>
                        <div className="p-2 bg-muted/50 rounded">
                            <span className="font-bold">D5</span> - Ações Corretivas
                        </div>
                        <div className="p-2 bg-muted/50 rounded">
                            <span className="font-bold">D6</span> - Implementação
                        </div>
                        <div className="p-2 bg-muted/50 rounded">
                            <span className="font-bold">D7</span> - Prevenir Recorrência
                        </div>
                        <div className="p-2 bg-muted/50 rounded">
                            <span className="font-bold">D8</span> - Reconhecimento
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* 8D Reports List */}
            <Card className="glass">
                <CardHeader>
                    <CardTitle>Relatórios 8D</CardTitle>
                    <CardDescription>
                        {(reports || []).length} relatório(s) registado(s)
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {(!reports || reports.length === 0) ? (
                        <div className="text-center py-12 text-muted-foreground">
                            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p>Nenhum relatório 8D criado ainda.</p>
                            <p className="text-sm mt-2">
                                Relatórios 8D podem ser iniciados a partir da página de detalhe de uma Não Conformidade.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {reports.map((report: any) => {
                                const nc = unwrap(report.nonconformity);
                                return (
                                    <Link
                                        href={`/quality/qms/8d/${report.id}`}
                                        key={report.id}
                                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                                    >
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="font-mono font-bold">{report.report_number}</span>
                                                <Badge variant={statusColors[report.status] || "outline"}>
                                                    {report.status === 'open' ? 'Aberto' :
                                                        report.status === 'in_progress' ? 'Em Progresso' :
                                                            report.status === 'completed' ? 'Concluído' :
                                                                report.status === 'closed' ? 'Fechado' : report.status}
                                                </Badge>
                                                <Badge variant="outline">
                                                    Passo D{report.current_step}
                                                </Badge>
                                            </div>
                                            {nc && (
                                                <p className="text-sm text-muted-foreground mt-1">
                                                    NC: {nc.nc_number} - {nc.title}
                                                </p>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                            <div className="flex items-center gap-1">
                                                <Users className="h-4 w-4" />
                                                {report.team_members?.length || 0} membros
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <Clock className="h-4 w-4" />
                                                {report.opened_date}
                                            </div>
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                    )}
                </CardContent>
            </Card>

        </div>
    );
}

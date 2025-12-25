import { getNonconformityById } from "@/lib/queries/qms";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, AlertTriangle, User, Calendar, Plus, CheckCircle, Clock, FileText } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { NCStatusUpdate } from "./nc-status-update";
import { CreateCAPADialog } from "./create-capa-dialog";
import { EditNCDialog } from "./edit-nc-dialog";
import { Create8DDialog } from "./create-8d-dialog";
import { NCAttachments } from "./nc-attachments";
import { CloseNCDialog } from "./close-nc-dialog";
import { CAPAStatusUpdate } from "./capa-status-update";

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
        minor: "bg-blue-500/10 text-blue-400 border-blue-500/20",
        major: "bg-orange-500/10 text-orange-400 border-orange-500/20",
        critical: "bg-red-500/10 text-red-400 border-red-500/20 animate-pulse",
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
        open: "bg-slate-500/10 text-slate-400 border-slate-500/20",
        under_investigation: "bg-blue-500/10 text-blue-400 border-blue-500/20",
        containment: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
        corrective_action: "bg-purple-500/10 text-purple-400 border-purple-500/20",
        verification: "bg-orange-500/10 text-orange-400 border-orange-500/20",
        closed: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    };

    const capaStatusColors: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
        planned: "secondary",
        in_progress: "default",
        completed: "outline",
        verified: "default",
        closed: "secondary",
    };

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link href="/quality/qms">
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                </Link>
                <div className="flex-1">
                    <div className="flex items-center gap-3">
                        <h1 className="text-3xl font-bold tracking-tight font-mono">{nc.nc_number}</h1>
                        <Badge className={severityColors[nc.severity]}>{severityLabels[nc.severity]}</Badge>
                        <Badge className={statusColors[nc.status]}>{statusLabels[nc.status]}</Badge>
                    </div>
                    <p className="text-muted-foreground">{nc.title}</p>
                </div>
                <div className="flex items-center gap-2">
                    <EditNCDialog nc={nc} />
                    {!eightD && <Create8DDialog ncId={nc.id} />}
                    {nc.status !== "closed" && (
                        <CloseNCDialog ncId={nc.id} ncNumber={nc.nc_number} />
                    )}
                    <NCStatusUpdate ncId={nc.id} currentStatus={nc.status} />
                </div>
            </div>

            {/* Info Cards */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card className="glass">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4" />
                            Tipo
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-xl font-bold capitalize">{nc.nc_type === 'internal' ? 'Interna' : nc.nc_type === 'supplier' ? 'Fornecedor' : nc.nc_type === 'customer' ? 'Cliente' : nc.nc_type}</p>
                        <p className="text-xs text-muted-foreground">{nc.category || "Sem categoria"}</p>
                    </CardContent>
                </Card>

                <Card className="glass">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <User className="h-4 w-4" />
                            Detetada Por
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-lg font-medium">{detectedBy?.full_name || "Desconhecido"}</p>
                        <p className="text-xs text-muted-foreground">{nc.detected_date}</p>
                    </CardContent>
                </Card>

                <Card className="glass">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <User className="h-4 w-4" />
                            Responsável
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-lg font-medium">{responsible?.full_name || "Não atribuído"}</p>
                    </CardContent>
                </Card>

                <Card className="glass">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            Data Limite
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {nc.due_date ? (
                            <>
                                <p className="text-xl font-bold">{nc.due_date}</p>
                                {new Date(nc.due_date) < new Date() && nc.status !== "closed" && (
                                    <p className="text-xs text-red-500 font-semibold">ATRASADA</p>
                                )}
                            </>
                        ) : (
                            <p className="text-muted-foreground">Não definida</p>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Description */}
            <Card className="glass">
                <CardHeader>
                    <CardTitle>Descrição</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="whitespace-pre-wrap">{nc.description}</p>
                    {nc.source_reference && (
                        <div className="mt-4 pt-4 border-t">
                            <p className="text-sm text-muted-foreground">
                                Origem: <span className="font-medium">{nc.source_reference}</span>
                            </p>
                        </div>
                    )}
                    {nc.notes && (
                        <div className="mt-4 pt-4 border-t">
                            <p className="text-sm text-muted-foreground">Notas:</p>
                            <p className="text-sm">{nc.notes}</p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Attachments */}
            <NCAttachments ncId={nc.id} organizationId={nc.organization_id} />

            {/* CAPA Actions */}
            <Card className="glass">
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            <CheckCircle className="h-5 w-5" />
                            Ações Corretivas e Preventivas
                        </CardTitle>
                        <CardDescription>{capas.length} ação(ões)</CardDescription>
                    </div>
                    <CreateCAPADialog ncId={nc.id} />
                </CardHeader>
                <CardContent>
                    {capas.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p>Nenhuma ação CAPA registada ainda.</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {capas.map((capa: any) => {
                                const capaResponsible = unwrap(capa.responsible_user);
                                return (
                                    <div
                                        key={capa.id}
                                        className="flex items-center justify-between p-4 border rounded-lg"
                                    >
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <span className="font-mono font-semibold">{capa.action_number}</span>
                                                <Badge variant="outline" className="capitalize">
                                                    {capa.action_type === 'corrective' ? 'Corretiva' : 'Preventiva'}
                                                </Badge>
                                                <Badge variant={capaStatusColors[capa.status] || "outline"}>
                                                    {capa.status === 'planned' ? 'Planeada' :
                                                        capa.status === 'in_progress' ? 'Em Progresso' :
                                                            capa.status === 'completed' ? 'Concluída' :
                                                                capa.status === 'verified' ? 'Verificada' :
                                                                    capa.status === 'closed' ? 'Fechada' : capa.status}
                                                </Badge>
                                            </div>
                                            <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
                                                {capa.description}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="text-right text-sm text-muted-foreground mr-2">
                                                <p>{capaResponsible?.full_name || "Não atribuído"}</p>
                                                <p>{capa.planned_date || "-"}</p>
                                            </div>
                                            <CAPAStatusUpdate capaId={capa.id} currentStatus={capa.status} />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </CardContent>
            </Card>

        </div>
    );
}

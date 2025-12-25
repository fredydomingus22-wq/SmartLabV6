import { getDocumentById, getApprovers } from "@/lib/queries/dms";
import { getSafeUser } from "@/lib/auth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, History, CheckCircle2, Clock, AlertCircle, Upload, Send } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UploadVersionDialog } from "../_components/upload-version-dialog";
import { SubmitReviewDialog } from "../_components/submit-review-dialog";
import { ApprovalWorkflow } from "../_components/approval-workflow";
import { publishDocumentVersionAction } from "@/app/actions/dms";
import { PublishButton } from "../_components/publish-button";

interface DocumentVersion {
    id: string;
    version_number: number;
    status: string;
    created_at: string;
    change_description: string | null;
}

export default async function DocumentDetailsPage({ params }: { params: { id: string } }) {
    const user = await getSafeUser();
    const { document, versions, error } = await getDocumentById(params.id) as { document: any, versions: DocumentVersion[], error: any };
    const { data: approvers } = await getApprovers();

    if (!document) return <div className="p-10">Documento não encontrado.</div>;

    const currentVersion = versions.find((v: DocumentVersion) => v.id === document.current_version_id) || versions[0];

    return (
        <div className="p-6 space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                <div className="flex gap-4 items-start">
                    <div className="p-4 rounded-2xl bg-emerald-500/10 text-emerald-400">
                        <FileText className="h-8 w-8" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-3xl font-bold text-slate-100">{document.title}</h1>
                            <Badge variant="outline" className="border-slate-800 text-slate-400 uppercase tracking-wider">
                                {document.category?.code}
                            </Badge>
                        </div>
                        <p className="text-slate-500 flex items-center gap-2 mt-1">
                            {document.doc_number} • Criado em {format(new Date(document.created_at), "dd/MM/yyyy", { locale: ptBR })}
                        </p>
                    </div>
                </div>

                <div className="flex gap-2">
                    <UploadVersionDialog
                        documentId={document.id}
                        lastVersion={versions[0]?.version_number?.toString()}
                    />
                    {currentVersion?.status === 'approved' && (
                        <PublishButton versionId={currentVersion.id} />
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <Tabs defaultValue="current" className="w-full">
                        <TabsList className="bg-slate-900/50 border-slate-800">
                            <TabsTrigger value="current">Versão Atual</TabsTrigger>
                            <TabsTrigger value="history">Histórico de Revisões</TabsTrigger>
                        </TabsList>

                        <TabsContent value="current" className="mt-4">
                            {currentVersion ? (
                                <Card className="glass border-slate-800/50">
                                    <CardHeader className="flex flex-row items-center justify-between">
                                        <div>
                                            <CardTitle className="text-lg text-slate-100">Versão {currentVersion.version_number}</CardTitle>
                                            <p className="text-sm text-slate-500 mt-1">
                                                Estado: <span className="text-slate-300 font-medium capitalize">{currentVersion.status}</span>
                                            </p>
                                        </div>
                                        {currentVersion.status === 'draft' && (
                                            <SubmitReviewDialog versionId={currentVersion.id} approvers={approvers} />
                                        )}
                                    </CardHeader>
                                    <CardContent className="space-y-6">
                                        <div className="bg-slate-950/50 rounded-lg p-4 border border-slate-800">
                                            <h4 className="text-sm font-medium text-slate-400 mb-2 uppercase tracking-tight">Alterações nesta versão:</h4>
                                            <p className="text-slate-300 text-sm whitespace-pre-wrap">
                                                {currentVersion.change_description || "Sem descrição de alterações."}
                                            </p>
                                        </div>

                                        <div className="flex items-center justify-between p-4 rounded-xl bg-slate-900 border border-slate-800 group hover:border-emerald-500/30 transition-all">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
                                                    <FileText className="h-5 w-5" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-slate-200">Ficheiro do Documento</p>
                                                    <p className="text-xs text-slate-500">Documento PDF / Word</p>
                                                </div>
                                            </div>
                                            <Button variant="ghost" size="sm" className="text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10">
                                                Visualizar
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            ) : (
                                <div className="p-12 text-center glass rounded-2xl border border-dashed border-slate-800">
                                    <Upload className="h-12 w-12 text-slate-600 mx-auto mb-4" />
                                    <p className="text-slate-400">Nenhuma versão carregada ainda.</p>
                                    <UploadVersionDialog documentId={document.id} variant="link" />
                                </div>
                            )}
                        </TabsContent>

                        <TabsContent value="history">
                            <Card className="glass border-slate-800/50">
                                <CardContent className="p-0">
                                    <div className="divide-y divide-slate-800/50">
                                        {versions.map((v: DocumentVersion) => (
                                            <div key={v.id} className="p-4 flex items-center justify-between hover:bg-slate-900/40 transition-colors">
                                                <div className="flex items-center gap-4">
                                                    <div className={cn(
                                                        "p-2 rounded-lg",
                                                        v.status === 'published' ? "bg-emerald-500/10 text-emerald-400" : "bg-slate-800 text-slate-400"
                                                    )}>
                                                        <History className="h-4 w-4" />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-medium text-slate-100">Versão {v.version_number}</p>
                                                        <p className="text-xs text-slate-500">
                                                            {format(new Date(v.created_at), "dd MMM yyyy", { locale: ptBR })}
                                                        </p>
                                                    </div>
                                                </div>
                                                <Badge className={getStatusColor(v.status)}>
                                                    {getStatusLabel(v.status)}
                                                </Badge>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </div>

                <div className="space-y-6">
                    <Card className="glass border-slate-800/50">
                        <CardHeader>
                            <CardTitle className="text-base flex items-center gap-2">
                                <ShieldCheck className="h-4 w-4 text-emerald-400" />
                                Workflow de Aprovação
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ApprovalWorkflow version={currentVersion} currentUserId={user.id} />
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}

import { cn } from "@/lib/utils";
import { ShieldCheck } from "lucide-react";

function getStatusColor(status?: string) {
    switch (status) {
        case 'published': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
        case 'approved': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
        case 'review': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
        case 'draft': return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
        case 'superseded': return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
        default: return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
    }
}

function getStatusLabel(status?: string) {
    switch (status) {
        case 'published': return 'Publicado';
        case 'approved': return 'Aprovado';
        case 'review': return 'Em Revisão';
        case 'draft': return 'Rascunho';
        case 'superseded': return 'Obsoleto';
        default: return 'Pendente';
    }
}

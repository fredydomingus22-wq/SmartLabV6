import { getDocumentById, getApprovers, getReadingLogs } from "@/lib/queries/dms";
import { getSafeUser } from "@/lib/auth.server";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, History, CheckCircle2, Clock, AlertCircle, Upload, Send, User, BookOpen, ShieldCheck } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UploadVersionDialog } from "../_components/upload-version-dialog";
import { SubmitReviewDialog } from "../_components/submit-review-dialog";
import { ApprovalWorkflow } from "../_components/approval-workflow";
import { ReadingAcknowledgment } from "../_components/reading-acknowledgment";
import { PublishButton } from "../_components/publish-button";
import { cn } from "@/lib/utils";

interface DocumentVersion {
    id: string;
    version_number: number;
    status: string;
    created_at: string;
    change_description: string | null;
}

export default async function DocumentDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const user = await getSafeUser();
    const { document, versions, error } = await getDocumentById(id) as { document: any, versions: DocumentVersion[], error: any };
    const { data: approvers } = await getApprovers();

    if (!document) return <div className="p-10">Documento não encontrado.</div>;

    const currentVersion = versions.find((v: DocumentVersion) => v.id === document.current_version_id) || versions[0];
    const { data: readingLogs } = await getReadingLogs(currentVersion?.id || "");
    const hasRead = readingLogs?.some((log: any) => log.user_id === user.id);

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

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <div className="lg:col-span-3 space-y-6">
                    {currentVersion?.status === 'published' && (
                        <ReadingAcknowledgment versionId={currentVersion.id} hasRead={!!hasRead} />
                    )}

                    <Tabs defaultValue="current" className="w-full">
                        <TabsList className="bg-slate-900/50 border-slate-800">
                            <TabsTrigger value="current">Versão Atual</TabsTrigger>
                            <TabsTrigger value="logs">Registo de Leitura</TabsTrigger>
                            <TabsTrigger value="history">Histórico de Revisões</TabsTrigger>
                            <TabsTrigger value="reviews">Revisões Periódicas</TabsTrigger>
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
                                            <h4 className="text-sm font-medium text-slate-400 mb-2 uppercase tracking-tight text-[10px] font-bold">Resumo das Alterações:</h4>
                                            <p className="text-slate-300 text-sm whitespace-pre-wrap leading-relaxed">
                                                {currentVersion.change_description || "Sem descrição de alterações."}
                                            </p>
                                        </div>

                                        {/* Industrial Document Preview Placeholder */}
                                        <div className="relative aspect-[16/10] bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden group">
                                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/40 backdrop-blur-sm z-10">
                                                <div className="p-4 rounded-full bg-slate-800/50 mb-3">
                                                    <FileText className="h-10 w-10 text-slate-500" />
                                                </div>
                                                <p className="text-slate-400 font-medium tracking-tight">Visualizador de Documento Seguro</p>
                                                <p className="text-[10px] text-slate-600 uppercase mt-1 tracking-widest font-bold">Apenas para Visualização Interna</p>
                                                <Button variant="outline" className="mt-6 border-slate-700 bg-slate-900/50 hover:bg-emerald-500/10 hover:text-emerald-400 hover:border-emerald-500/30 transition-all">
                                                    Abrir em Tela Cheia
                                                </Button>
                                            </div>

                                            {/* Industrial Watermark Overlay */}
                                            {currentVersion.status === 'published' && (
                                                <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-[0.03] rotate-[-35deg] select-none z-20">
                                                    <span className="text-[120px] font-black tracking-[30px] text-emerald-500">CONTROLADO</span>
                                                </div>
                                            )}
                                            {currentVersion.status === 'superseded' && (
                                                <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-[0.05] rotate-[-35deg] select-none z-20">
                                                    <span className="text-[120px] font-black tracking-[30px] text-rose-500">OBSOLETO</span>
                                                </div>
                                            )}
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

                        <TabsContent value="logs">
                            <Card className="glass border-slate-800/50">
                                <CardHeader>
                                    <CardTitle className="text-sm font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
                                        <BookOpen className="h-4 w-4" />
                                        Logs de Treinamento e Leitura
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-0">
                                    <div className="divide-y divide-slate-800/50">
                                        {readingLogs?.length === 0 ? (
                                            <div className="p-8 text-center text-slate-500 text-sm italic">
                                                Nenhum registo de leitura encontrado para esta versão.
                                            </div>
                                        ) : (
                                            readingLogs?.map((log: any) => (
                                                <div key={log.id} className="p-4 flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <div className="p-2 rounded-full bg-emerald-500/10 text-emerald-400">
                                                            <User className="h-4 w-4" />
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-medium text-slate-200">{log.user?.full_name}</p>
                                                            <p className="text-[10px] text-slate-500 font-mono">ID: {log.user_id.slice(0, 8)}...</p>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-xs text-slate-300">{format(new Date(log.read_at), "dd/MM/yyyy HH:mm")}</p>
                                                        <div className="flex items-center gap-1 justify-end mt-1">
                                                            <ShieldCheck className="h-3 w-3 text-emerald-500" />
                                                            <span className="text-[9px] text-emerald-500 font-bold uppercase">Assinado Digitalmente</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
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

                        <TabsContent value="reviews">
                            <Card className="glass border-slate-800/50">
                                <CardHeader>
                                    <CardTitle className="text-sm font-bold uppercase tracking-widest text-slate-400">Estado de Revisão Periódica</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {document.periodic_reviews?.length === 0 ? (
                                        <div className="p-8 text-center text-slate-500 text-sm">
                                            Próxima revisão pendente de agendamento automático.
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            {document.periodic_reviews.map((rev: any) => (
                                                <div key={rev.id} className="p-4 bg-slate-950/50 border border-slate-800 rounded-xl flex justify-between items-center text-sm">
                                                    <div>
                                                        <p className="text-slate-200 font-medium">Agendada para: {format(new Date(rev.scheduled_date), "dd/MM/yyyy")}</p>
                                                        <p className="text-xs text-slate-500 mt-1">Estado: {rev.result}</p>
                                                    </div>
                                                    {rev.performed_at ? (
                                                        <Badge className="bg-emerald-500/10 text-emerald-400">Concluída</Badge>
                                                    ) : (
                                                        <Badge variant="outline" className="border-amber-500/30 text-amber-500">Pendente</Badge>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
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


import { getDocumentById, getReadingLogs } from "@/lib/queries/dms";
import { getSafeUser } from "@/lib/auth.server";
import { ApproveDocumentDialog } from "../_components/approve-document-dialog";
import { NewRevisionDialog } from "../_components/new-revision-dialog";
import { PublishDocumentButton } from "../_components/publish-document-button";
import { ApprovalWorkflow } from "../_components/approval-workflow";
import { SubmitReviewDialog } from "../_components/submit-review-dialog";
import { ReadingAcknowledgment } from "../_components/reading-acknowledgment";
import { DocumentPreviewDialog } from "../_components/document-preview-dialog";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GlassTable, GlassTableHeader, GlassTableRow, GlassTableHead, GlassTableCell } from "@/components/ui/glass-table";
import {
    FileText,
    ArrowLeft,
    ShieldCheck,
    Clock,
    History,
    Users,
    FileSignature,
    Eye,
    Download,
    GraduationCap,
    CheckCircle2
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

interface PageProps {
    params: Promise<{ id: string }>;
}

export default async function DocumentDetailPage({ params }: PageProps) {
    const { id } = await params;
    const user = await getSafeUser();
    const { document, versions, error } = await getDocumentById(id);

    if (error || !document) {
        notFound();
    }

    // Determine current processing version (could be current_version or the latest draft)
    const currentVersion = document.current_version || versions[0];
    const latestVersion = versions[0]; // Assuming sorted by date DESC in query
    const displayVersion = latestVersion || currentVersion;

    // Correctly fetch reading logs for the display version
    const readingLogs = displayVersion ? await getReadingLogs(displayVersion.id) : { data: [] };
    const logs = readingLogs.data || [];

    // Check for pending approval for CURRENT user
    const pendingApproval = displayVersion?.approvals?.find(
        (a: any) => a.approver_id === user.id && a.status === 'pending'
    );

    // Helper to get status colors
    const getStatusColor = (status: string) => {
        switch (status) {
            case 'published': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
            case 'review': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
            case 'draft': return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
            case 'superseded': return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
            case 'approved': return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20';
            default: return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* 1. Industrial Header (Glassmorphism 2.0) */}
            <div className="glass p-8 rounded-3xl border-none shadow-2xl bg-gradient-to-br from-indigo-500/5 via-transparent to-purple-500/5 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-32 bg-indigo-500/10 blur-[120px] rounded-full pointer-events-none" />

                <div className="flex flex-col md:flex-row justify-between gap-6 relative z-10">
                    <div className="flex gap-5">
                        <Link href="/quality/documents">
                            <Button variant="ghost" size="icon" className="rounded-xl hover:bg-white/5 text-slate-400 hover:text-white">
                                <ArrowLeft className="h-6 w-6" />
                            </Button>
                        </Link>
                        <div className="space-y-2">
                            <div className="flex items-center gap-3">
                                <Badge variant="outline" className="px-3 py-1 bg-white/5 border-white/10 text-xs font-mono tracking-widest text-slate-400 uppercase">
                                    {document.category?.code || "DOC"}
                                </Badge>
                                <span className="text-sm font-mono text-indigo-500 uppercase tracking-[0.3em] font-black">
                                    {document.doc_number}
                                </span>
                                <div className="h-4 w-px bg-white/10 mx-1" />
                                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20">
                                    <ShieldCheck className="h-3 w-3 text-emerald-400" />
                                    <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">21 CFR Part 11 Compliant</span>
                                </div>
                            </div>
                            <h1 className="text-3xl md:text-5xl font-black tracking-tighter text-white drop-shadow-2xl">
                                {document.title}
                            </h1>
                            <div className="flex items-center gap-6 text-[11px] text-slate-500 font-bold uppercase tracking-wider">
                                <span className="flex items-center gap-2">
                                    <Clock className="h-3.5 w-3.5 text-indigo-400" />
                                    Last Modified: {new Date(document.updated_at).toLocaleDateString()}
                                </span>
                                <span className="flex items-center gap-2">
                                    <Users className="h-3.5 w-3.5 text-emerald-400" />
                                    Owner: {displayVersion?.created_by || 'Quality Assurance'}
                                </span>
                                <span className="flex items-center gap-2 text-slate-400">
                                    <Eye className="h-3.5 w-3.5" />
                                    Internal Control
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col items-end gap-3 justify-center">
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Active State:</span>
                            <Badge className={cn("px-4 py-1.5 text-[10px] font-black uppercase tracking-widest border border-white/5 shadow-2xl", getStatusColor(displayVersion?.status))}>
                                {displayVersion?.status || 'Draft'}
                            </Badge>
                        </div>
                        <div className="flex gap-2">
                            {/* Approval Action */}
                            {pendingApproval && (
                                <ApproveDocumentDialog
                                    approvalId={pendingApproval.id}
                                    documentTitle={document.title}
                                    versionNumber={displayVersion.version_number}
                                />
                            )}

                            {/* Publish Action - Only if approved */}
                            {displayVersion?.status === 'approved' && (
                                <PublishDocumentButton versionId={displayVersion.id} />
                            )}

                            <DocumentPreviewDialog
                                filePath={displayVersion?.file_path || null}
                                fileName={displayVersion?.file_name || "document"}
                                fileType={displayVersion?.file_type || null}
                                documentTitle={document.title}
                                versionNumber={displayVersion?.version_number || "0"}
                                versionId={displayVersion?.id}
                            />

                            {/* New Revision Action */}
                            <NewRevisionDialog
                                documentId={document.id}
                                currentVersion={displayVersion?.version_number || "0"}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* 2. Metadata Mesh (High Density Control Panel) */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <InfoCard
                    title="Control Version"
                    value={`v${displayVersion?.version_number || "0.0"}`}
                    subtitle="Document Revision"
                    icon={<FileSignature className="h-3.5 w-3.5 text-indigo-400" />}
                />
                <InfoCard
                    title="Effective Date"
                    value={displayVersion?.effective_date ? new Date(displayVersion.effective_date).toLocaleDateString() : "Pending"}
                    subtitle="Release Strategy"
                    icon={<Clock className="h-3.5 w-3.5 text-emerald-400" />}
                />
                <InfoCard
                    title="Next Review"
                    value={displayVersion?.expiry_date ? new Date(displayVersion.expiry_date).toLocaleDateString() : "N/D"}
                    subtitle="Periodic Maintenance"
                    icon={<History className="h-3.5 w-3.5 text-amber-400" />}
                />
                <InfoCard
                    title="Retention"
                    value="5 Years"
                    subtitle="Archival Policy"
                    icon={<ShieldCheck className="h-3.5 w-3.5 text-slate-400" />}
                />
                <div className="glass-dark p-1 rounded-2xl flex flex-col justify-center gap-1 border-emerald-500/20 bg-emerald-500/5">
                    <Button variant="ghost" className="h-full w-full rounded-xl gap-2 text-[10px] font-black uppercase tracking-widest text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10">
                        <Download className="h-4 w-4" /> Secure Export
                    </Button>
                </div>
            </div>

            {/* 3. Main Content Tabs */}
            <Tabs defaultValue="info" className="w-full">
                <div className="flex items-center justify-between mb-4">
                    <TabsList className="glass border-white/5 p-1 bg-black/20">
                        <TabsTrigger value="info" className="gap-2 data-[state=active]:bg-indigo-500/20 data-[state=active]:text-indigo-300">
                            <FileText className="h-4 w-4" /> Informação
                        </TabsTrigger>
                        <TabsTrigger value="approvals" className="gap-2 data-[state=active]:bg-indigo-500/20 data-[state=active]:text-indigo-300">
                            <ShieldCheck className="h-4 w-4" /> Assinaturas
                        </TabsTrigger>
                        <TabsTrigger value="training" className="gap-2 data-[state=active]:bg-indigo-500/20 data-[state=active]:text-indigo-300">
                            <GraduationCap className="h-4 w-4" /> Formação
                        </TabsTrigger>
                        <TabsTrigger value="history" className="gap-2 data-[state=active]:bg-indigo-500/20 data-[state=active]:text-indigo-300">
                            <History className="h-4 w-4" /> Histórico
                        </TabsTrigger>
                    </TabsList>
                </div>

                <TabsContent value="info" className="animate-in fade-in slide-in-from-left-4 duration-500">
                    <Card className="glass border-none shadow-xl">
                        <CardHeader>
                            <CardTitle className="text-lg font-bold flex items-center gap-2">
                                <FileText className="h-5 w-5 text-indigo-400" />
                                Detalhes e Ficheiro
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="p-6 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-between group hover:border-indigo-500/30 transition-all">
                                <div className="flex items-center gap-4">
                                    <div className="h-12 w-12 rounded-xl bg-indigo-500/10 flex items-center justify-center">
                                        <FileText className="h-6 w-6 text-indigo-400" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-white group-hover:text-indigo-300 transition-colors">
                                            {displayVersion?.file_path ? displayVersion.file_path.split('/').pop() : "Sem ficheiro"}
                                        </p>
                                        <p className="text-xs text-slate-500">PDF Document • {displayVersion?.file_size ? (displayVersion.file_size / 1024).toFixed(2) + ' KB' : '0 KB'}</p>
                                    </div>
                                </div>
                                <Button variant="ghost" size="icon" className="text-slate-400 hover:text-indigo-400">
                                    <Download className="h-5 w-5" />
                                </Button>
                            </div>

                            <div className="space-y-2">
                                <h4 className="text-xs font-bold uppercase tracking-widest text-slate-500">Descrição da Alteração</h4>
                                <p className="text-sm text-slate-300 leading-relaxed p-4 rounded-xl bg-black/20">
                                    {displayVersion?.change_description || "Nenhuma descrição fornecida."}
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="approvals" className="animate-in fade-in slide-in-from-left-4 duration-500">
                    <Card className="glass border-none shadow-xl">
                        <CardHeader>
                            <CardTitle className="text-lg font-bold flex items-center gap-2">
                                <ShieldCheck className="h-5 w-5 text-emerald-400" />
                                Assinaturas Digitais & Aprovações
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <GlassTable>
                                <GlassTableHeader>
                                    <GlassTableRow>
                                        <GlassTableHead>Aprovador</GlassTableHead>
                                        <GlassTableHead>Função</GlassTableHead>
                                        <GlassTableHead>Status</GlassTableHead>
                                        <GlassTableHead>Data</GlassTableHead>
                                        <GlassTableHead>Comentários</GlassTableHead>
                                    </GlassTableRow>
                                </GlassTableHeader>
                                <tbody>
                                    {displayVersion?.approvals?.length > 0 ? (
                                        displayVersion.approvals.map((approval: any) => (
                                            <GlassTableRow key={approval.id}>
                                                <GlassTableCell className="font-medium text-white">
                                                    {approval.approver?.full_name || "Desconhecido"}
                                                </GlassTableCell>
                                                <GlassTableCell>
                                                    <Badge variant="outline" className="bg-slate-500/10 text-slate-400 border-none uppercase text-[10px]">
                                                        {approval.role}
                                                    </Badge>
                                                </GlassTableCell>
                                                <GlassTableCell>
                                                    <Badge className={cn("uppercase text-[10px]",
                                                        approval.status === 'approved' ? 'bg-emerald-500/10 text-emerald-400' :
                                                            approval.status === 'rejected' ? 'bg-rose-500/10 text-rose-400' :
                                                                'bg-slate-500/10 text-slate-400'
                                                    )}>
                                                        {approval.status}
                                                    </Badge>
                                                </GlassTableCell>
                                                <GlassTableCell>
                                                    {approval.signed_at ? new Date(approval.signed_at).toLocaleString() : "-"}
                                                </GlassTableCell>
                                                <GlassTableCell className="text-xs text-slate-400 italic">
                                                    {approval.comments || "-"}
                                                </GlassTableCell>
                                            </GlassTableRow>
                                        ))
                                    ) : (
                                        <GlassTableRow>
                                            <GlassTableCell colSpan={5} className="text-center py-8 text-slate-500">
                                                Nenhuma aprovação requerida ou registada para esta versão.
                                            </GlassTableCell>
                                        </GlassTableRow>
                                    )}
                                </tbody>
                            </GlassTable>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="training" className="animate-in fade-in slide-in-from-left-4 duration-500">
                    <Card className="glass border-none shadow-xl">
                        <CardHeader>
                            <CardTitle className="text-lg font-bold flex items-center gap-2">
                                <GraduationCap className="h-5 w-5 text-purple-400" />
                                Logs de Leitura & Requisitos de Formação
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <GlassTable>
                                <GlassTableHeader>
                                    <GlassTableRow>
                                        <GlassTableHead>Colaborador</GlassTableHead>
                                        <GlassTableHead>Versão Lida</GlassTableHead>
                                        <GlassTableHead>Data de Leitura</GlassTableHead>
                                        <GlassTableHead>Status</GlassTableHead>
                                    </GlassTableRow>
                                </GlassTableHeader>
                                <tbody>
                                    {logs.length > 0 ? (
                                        logs.map((log: any) => (
                                            <GlassTableRow key={log.id}>
                                                <GlassTableCell className="font-medium text-white">{log.user?.full_name}</GlassTableCell>
                                                <GlassTableCell className="font-mono text-xs text-slate-400">v{log.version_number}</GlassTableCell>
                                                <GlassTableCell>{new Date(log.read_at).toLocaleString()}</GlassTableCell>
                                                <GlassTableCell>
                                                    <Badge className="bg-emerald-500/10 text-emerald-400 border-none flex items-center gap-1 w-fit">
                                                        <CheckCircle2 className="h-3 w-3" /> Concluído
                                                    </Badge>
                                                </GlassTableCell>
                                            </GlassTableRow>
                                        ))
                                    ) : (
                                        <GlassTableRow>
                                            <GlassTableCell colSpan={4} className="text-center py-8 text-slate-500">
                                                Nenhum registo de leitura encontrado.
                                            </GlassTableCell>
                                        </GlassTableRow>
                                    )}
                                </tbody>
                            </GlassTable>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="history" className="animate-in fade-in slide-in-from-left-4 duration-500">
                    <Card className="glass border-none shadow-xl">
                        <CardHeader>
                            <CardTitle className="text-lg font-bold flex items-center gap-2">
                                <History className="h-5 w-5 text-indigo-400" />
                                Histórico de Versões
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <GlassTable>
                                <GlassTableHeader>
                                    <GlassTableRow>
                                        <GlassTableHead>Versão</GlassTableHead>
                                        <GlassTableHead>Data Criação</GlassTableHead>
                                        <GlassTableHead>Dono</GlassTableHead>
                                        <GlassTableHead>Status</GlassTableHead>
                                        <GlassTableHead>Mudanças</GlassTableHead>
                                    </GlassTableRow>
                                </GlassTableHeader>
                                <tbody>
                                    {versions.map((v: any) => (
                                        <GlassTableRow key={v.id}>
                                            <GlassTableCell className="font-mono text-indigo-400 font-bold">
                                                {v.version_number}
                                            </GlassTableCell>
                                            <GlassTableCell>{new Date(v.created_at).toLocaleDateString()}</GlassTableCell>
                                            <GlassTableCell>Sistema</GlassTableCell> {/* TODO: Join author name */}
                                            <GlassTableCell>
                                                <Badge className={cn("uppercase text-[10px]", getStatusColor(v.status))}>
                                                    {v.status}
                                                </Badge>
                                            </GlassTableCell>
                                            <GlassTableCell className="max-w-xs truncate text-xs text-slate-400">
                                                {v.change_description}
                                            </GlassTableCell>
                                        </GlassTableRow>
                                    ))}
                                </tbody>
                            </GlassTable>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}

function InfoCard({ title, value, subtitle, icon }: { title: string, value: string, subtitle?: string, icon?: React.ReactNode }) {
    return (
        <Card className="glass border-none shadow-lg bg-white/5 hover:bg-white/10 transition-colors group">
            <CardContent className="p-4 py-3 flex items-start justify-between">
                <div className="space-y-1">
                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500 mb-1">{title}</p>
                    <p className="text-xl font-black text-white truncate drop-shadow-md tracking-tight leading-tight">{value}</p>
                    {subtitle && <p className="text-[9px] font-bold text-slate-600 uppercase tracking-widest">{subtitle}</p>}
                </div>
                {icon && <div className="p-2 rounded-lg bg-black/40 border border-white/5 opacity-40 group-hover:opacity-100 transition-opacity">{icon}</div>}
            </CardContent>
        </Card>
    );
}


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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Archive } from "lucide-react";

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
            {/* 1. Industrial Header */}
            <div className="bg-slate-900/50 p-8 rounded-3xl border border-slate-800 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-32 bg-blue-500/5 blur-[120px] rounded-full pointer-events-none" />

                <div className="flex flex-col md:flex-row justify-between gap-6 relative z-10">
                    <div className="flex gap-5">
                        <Link href="/quality/documents">
                            <Button variant="ghost" size="icon" className="rounded-xl hover:bg-slate-800 text-slate-500 hover:text-white transition-all">
                                <ArrowLeft className="h-6 w-6" />
                            </Button>
                        </Link>
                        <div className="space-y-3">
                            <div className="flex items-center gap-3">
                                <Badge variant="outline" className="px-3 py-1 bg-slate-950 border-slate-800 text-[10px] font-black tracking-widest text-slate-500 uppercase">
                                    {document.category?.code || "DOC"}
                                </Badge>
                                <span className="text-[11px] font-black text-blue-500 uppercase tracking-[0.25em] italic">
                                    {document.doc_number}
                                </span>
                                <div className="h-4 w-px bg-slate-800 mx-1" />
                                <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                                    <ShieldCheck className="h-3 w-3 text-emerald-400" />
                                    <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">Compliance Part 11 Active</span>
                                </div>
                            </div>
                            <h1 className="text-3xl md:text-5xl font-black tracking-tighter text-white italic drop-shadow-sm">
                                {document.title}
                            </h1>
                            <div className="flex flex-wrap items-center gap-6 text-[10px] text-slate-500 font-black uppercase tracking-widest italic">
                                <span className="flex items-center gap-2">
                                    <Clock className="h-3.5 w-3.5 text-blue-500" />
                                    Modified: {new Date(document.updated_at).toLocaleDateString()}
                                </span>
                                <span className="flex items-center gap-2">
                                    <Users className="h-3.5 w-3.5 text-blue-500" />
                                    Owner: {displayVersion?.created_by || 'Quality Assurance'}
                                </span>
                                <span className="flex items-center gap-2 text-slate-600">
                                    <Eye className="h-3.5 w-3.5" />
                                    Internal Control Hub
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col items-end gap-3 justify-center">
                        <div className="flex items-center gap-3 mb-1">
                            <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest italic font-bold">Node State:</span>
                            <Badge className={cn("px-4 py-1.5 text-[10px] font-black uppercase tracking-widest border shadow-inner", getStatusColor(displayVersion?.status))}>
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
                    title="Controlo de Versão"
                    value={`v${displayVersion?.version_number || "0.0"}`}
                    subtitle="Document Revision"
                    icon={<FileSignature className="h-3.5 w-3.5 text-blue-500" />}
                />
                <InfoCard
                    title="Data de Eficácia"
                    value={displayVersion?.effective_date ? new Date(displayVersion.effective_date).toLocaleDateString() : "Pending"}
                    subtitle="Release Strategy"
                    icon={<Clock className="h-3.5 w-3.5 text-emerald-500" />}
                />
                <InfoCard
                    title="Próxima Revisão"
                    value={displayVersion?.expiry_date ? new Date(displayVersion.expiry_date).toLocaleDateString() : "N/D"}
                    subtitle="Periodic Maintenance"
                    icon={<History className="h-3.5 w-3.5 text-amber-500" />}
                />
                <InfoCard
                    title="Retenção ISO"
                    value="5 Anos"
                    subtitle="Archival Policy"
                    icon={<ShieldCheck className="h-3.5 w-3.5 text-slate-500" />}
                />
                <Card className="bg-slate-950/20 border-emerald-500/20 p-1 flex items-center justify-center">
                    <Button variant="ghost" className="h-full w-full rounded-2xl gap-3 text-[10px] font-black uppercase tracking-widest text-emerald-500 hover:text-white hover:bg-emerald-500/20 transition-all">
                        <Download className="h-4 w-4" /> Secure Export
                    </Button>
                </Card>
            </div>

            {/* 3. Main Content Tabs */}
            <Tabs defaultValue="info" className="w-full">
                <div className="flex items-center justify-between mb-6">
                    <TabsList className="bg-slate-900/50 border border-slate-800 p-1.5 rounded-2xl">
                        <TabsTrigger value="info" className="gap-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white font-black uppercase text-[10px] py-2 px-6 rounded-xl transition-all">
                            <FileText className="h-4 w-4" /> Detalhes
                        </TabsTrigger>
                        <TabsTrigger value="approvals" className="gap-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white font-black uppercase text-[10px] py-2 px-6 rounded-xl transition-all">
                            <ShieldCheck className="h-4 w-4" /> Assinaturas
                        </TabsTrigger>
                        <TabsTrigger value="training" className="gap-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white font-black uppercase text-[10px] py-2 px-6 rounded-xl transition-all">
                            <GraduationCap className="h-4 w-4" /> Formação
                        </TabsTrigger>
                        <TabsTrigger value="history" className="gap-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white font-black uppercase text-[10px] py-2 px-6 rounded-xl transition-all">
                            <History className="h-4 w-4" /> Audit Log
                        </TabsTrigger>
                    </TabsList>
                </div>

                <TabsContent value="info" className="animate-in fade-in slide-in-from-left-4 duration-500">
                    <Card className="bg-card border-slate-800 shadow-2xl rounded-2xl overflow-hidden">
                        <CardHeader className="bg-slate-900/20 border-b border-slate-800 py-6">
                            <CardTitle className="text-sm font-black flex items-center gap-3 uppercase tracking-widest text-white italic">
                                <FileText className="h-5 w-5 text-blue-500" />
                                Detalhes e Master File
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-8 p-8">
                            <div className="p-6 rounded-2xl bg-slate-950/50 border border-slate-800 flex items-center justify-between group hover:border-blue-500/30 transition-all shadow-inner">
                                <div className="flex items-center gap-5">
                                    <div className="h-14 w-14 rounded-2xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20 shadow-lg">
                                        <FileText className="h-7 w-7 text-blue-500" />
                                    </div>
                                    <div className="space-y-1">
                                        <p className="font-black text-white group-hover:text-blue-400 transition-colors italic tracking-tight">
                                            {displayVersion?.file_path ? displayVersion.file_path.split('/').pop() : "Sem contentor ativo"}
                                        </p>
                                        <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest italic">PDF Repository Blob • {displayVersion?.file_size ? (displayVersion.file_size / 1024).toFixed(2) + ' KB' : 'Empty Store'}</p>
                                    </div>
                                </div>
                                <Button variant="ghost" size="icon" className="h-12 w-12 text-slate-500 hover:text-blue-500 hover:bg-blue-500/10 rounded-xl transition-all">
                                    <Download className="h-6 w-6" />
                                </Button>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="h-1.5 w-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 italic">Descrição da Alteração Regulatória</h4>
                                </div>
                                <div className="p-6 rounded-2xl bg-slate-950/50 border border-slate-800 shadow-inner">
                                    <p className="text-sm text-slate-300 leading-relaxed font-medium italic">
                                        {displayVersion?.change_description || "Nenhum histórico de alteração indexado para esta versão."}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="approvals" className="animate-in fade-in slide-in-from-left-4 duration-500">
                    <Card className="bg-card border-slate-800 shadow-2xl rounded-2xl overflow-hidden">
                        <CardHeader className="bg-slate-900/20 border-b border-slate-800 py-6">
                            <CardTitle className="text-sm font-black flex items-center gap-3 uppercase tracking-widest text-white italic">
                                <ShieldCheck className="h-5 w-5 text-emerald-500" />
                                Assinaturas Digitais & Cadeia de Custódia
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="border-b border-slate-800 bg-slate-900/50 hover:bg-transparent">
                                            <TableHead className="py-4 px-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] italic">Aprovador</TableHead>
                                            <TableHead className="py-4 px-4 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] italic">Função</TableHead>
                                            <TableHead className="py-4 px-4 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] italic text-center">Status</TableHead>
                                            <TableHead className="py-4 px-4 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] italic">Sinal de Data</TableHead>
                                            <TableHead className="py-4 px-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] italic">Comentários Legais</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {displayVersion?.approvals?.length > 0 ? (
                                            displayVersion.approvals.map((approval: any) => (
                                                <TableRow key={approval.id} className="group hover:bg-slate-900/40 transition-all border-b border-slate-800/30 last:border-0 font-bold italic">
                                                    <TableCell className="py-4 px-6 text-sm text-white italic tracking-tight">
                                                        {approval.approver?.full_name || "Desconhecido"}
                                                    </TableCell>
                                                    <TableCell className="py-4 px-4">
                                                        <Badge variant="outline" className="bg-slate-950/50 text-slate-500 border-slate-800 uppercase text-[9px] font-black px-2.5 py-1">
                                                            {approval.role}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="py-4 px-4 text-center">
                                                        <div className={cn("inline-flex items-center gap-2 px-3 py-1 rounded-lg border text-[9px] font-black uppercase tracking-widest shadow-inner",
                                                            approval.status === 'approved' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                                                                approval.status === 'rejected' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' :
                                                                    'bg-slate-950 text-slate-600 border-slate-800'
                                                        )}>
                                                            {approval.status}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="py-4 px-4 text-[10px] text-slate-400 font-mono italic">
                                                        {approval.signed_at ? new Date(approval.signed_at).toLocaleString() : "Pendente"}
                                                    </TableCell>
                                                    <TableCell className="py-4 px-6 text-[11px] text-slate-500 italic max-w-xs truncate">
                                                        {approval.comments || "— —"}
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        ) : (
                                            <TableRow>
                                                <TableCell colSpan={5} className="py-20 text-center">
                                                    <div className="flex flex-col items-center gap-4">
                                                        <Archive className="h-10 w-10 text-slate-800" />
                                                        <p className="text-slate-600 font-black uppercase tracking-[0.2em] text-[10px] italic">
                                                            Node de aprovação inativo para este contentor.
                                                        </p>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="training" className="animate-in fade-in slide-in-from-left-4 duration-500">
                    <Card className="bg-card border-slate-800 shadow-2xl rounded-2xl overflow-hidden">
                        <CardHeader className="bg-slate-900/20 border-b border-slate-800 py-6">
                            <CardTitle className="text-sm font-black flex items-center gap-3 uppercase tracking-widest text-white italic">
                                <GraduationCap className="h-5 w-5 text-blue-500" />
                                Logs de Leitura & Matriz de Conhecimento
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="border-b border-slate-800 bg-slate-900/50 hover:bg-transparent">
                                            <TableHead className="py-4 px-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] italic">Colaborador</TableHead>
                                            <TableHead className="py-4 px-4 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] italic text-center">Revision Node</TableHead>
                                            <TableHead className="py-4 px-4 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] italic">Data de Leitura</TableHead>
                                            <TableHead className="py-4 px-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] italic text-right">Status Compliance</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {logs.length > 0 ? (
                                            logs.map((log: any) => (
                                                <TableRow key={log.id} className="group hover:bg-slate-900/40 transition-all border-b border-slate-800/30 font-bold italic">
                                                    <TableCell className="py-4 px-6 text-white italic tracking-tight">{log.user?.full_name}</TableCell>
                                                    <TableCell className="py-4 px-4 text-center">
                                                        <Badge variant="outline" className="font-mono text-[9px] bg-slate-950/50 text-blue-400 border-slate-800 px-2 py-0.5">
                                                            v{log.version_number}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="py-4 px-4 text-[10px] text-slate-400 italic">
                                                        {new Date(log.read_at).toLocaleString()}
                                                    </TableCell>
                                                    <TableCell className="py-4 px-6 text-right">
                                                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px] font-black uppercase tracking-widest shadow-inner">
                                                            <CheckCircle2 className="h-3 w-3" /> Efetivado
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        ) : (
                                            <TableRow>
                                                <TableCell colSpan={4} className="py-20 text-center">
                                                    <div className="flex flex-col items-center gap-4">
                                                        <Clock className="h-10 w-10 text-slate-800" />
                                                        <p className="text-slate-600 font-black uppercase tracking-[0.2em] text-[10px] italic">
                                                            Nenhum sinal de leitura registado para este nó.
                                                        </p>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="history" className="animate-in fade-in slide-in-from-left-4 duration-500">
                    <Card className="bg-card border-slate-800 shadow-2xl rounded-2xl overflow-hidden">
                        <CardHeader className="bg-slate-900/20 border-b border-slate-800 py-6">
                            <CardTitle className="text-sm font-black flex items-center gap-3 uppercase tracking-widest text-white italic">
                                <History className="h-5 w-5 text-blue-500" />
                                Histórico Temporal & Audit Trail (Full Stack)
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="border-b border-slate-800 bg-slate-900/50 hover:bg-transparent">
                                            <TableHead className="py-4 px-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] italic">Revision</TableHead>
                                            <TableHead className="py-4 px-4 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] italic text-center">Timestamp</TableHead>
                                            <TableHead className="py-4 px-4 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] italic">Originador</TableHead>
                                            <TableHead className="py-4 px-4 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] italic">State</TableHead>
                                            <TableHead className="py-4 px-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] italic text-right">Delta Info</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {versions.map((v: any) => (
                                            <TableRow key={v.id} className="group hover:bg-slate-900/40 transition-all border-b border-slate-800/30 last:border-0 font-bold italic">
                                                <TableCell className="py-4 px-6 text-blue-500 font-black tracking-[0.2em]">
                                                    v{v.version_number}
                                                </TableCell>
                                                <TableCell className="py-4 px-4 text-center text-[10px] text-slate-400 font-mono italic">
                                                    {new Date(v.created_at).toLocaleDateString()}
                                                </TableCell>
                                                <TableCell className="py-4 px-4 text-[10px] text-slate-500 font-black uppercase tracking-widest italic">
                                                    SmartLab Engine
                                                </TableCell>
                                                <TableCell className="py-4 px-4">
                                                    <Badge variant="outline" className={cn("px-2.5 py-1 text-[9px] font-black uppercase tracking-widest border shadow-inner", getStatusColor(v.status))}>
                                                        {v.status}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="py-4 px-6 text-right max-w-xs truncate text-[10px] text-slate-600 font-bold italic">
                                                    {v.change_description || "Initial Indexing"}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}

function InfoCard({ title, value, subtitle, icon }: { title: string, value: string, subtitle?: string, icon?: React.ReactNode }) {
    return (
        <Card className="bg-card border-slate-800 shadow-xl relative overflow-hidden group hover:border-blue-500/40 transition-all">
            <CardContent className="p-4 py-3 flex items-start justify-between relative z-10">
                <div className="space-y-1">
                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-600 mb-1">{title}</p>
                    <p className="text-xl font-black text-white italic tracking-tighter drop-shadow-sm leading-none">{value}</p>
                    {subtitle && <p className="text-[9px] font-black text-slate-700 uppercase tracking-widest italic">{subtitle}</p>}
                </div>
                {icon && <div className="p-2.5 rounded-xl bg-slate-950/50 border border-slate-800 opacity-60 group-hover:opacity-100 group-hover:scale-110 transition-all shadow-inner">{icon}</div>}
            </CardContent>
        </Card>
    );
}

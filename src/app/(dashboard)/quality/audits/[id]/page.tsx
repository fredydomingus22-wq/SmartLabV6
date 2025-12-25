import { getAuditById, getAuditFindings } from "@/lib/queries/audits";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    ChevronLeft,
    ClipboardCheck,
    Calendar,
    User,
    FileText,
    AlertCircle,
    PlayCircle,
    CheckCircle2
} from "lucide-react";
import Link from "next/link";
import { ChecklistExecution } from "./_components/checklist-execution";
import { AuditStatusToggle } from "./_components/audit-status-toggle";
import { AuditFindingsList } from "./_components/audit-findings-list";
import { format } from "date-fns";
import { pt } from "date-fns/locale";

interface PageProps {
    params: Promise<{ id: string }>;
}

export default async function AuditIdPage({ params }: PageProps) {
    const { id } = await params;
    const { audit } = await getAuditById(id);
    const { data: findings } = await getAuditFindings(id);

    if (!audit) notFound();

    return (
        <div className="p-6 space-y-8">
            {/* Breadcrumbs / Actions */}
            <div className="flex items-center justify-between">
                <Link href="/quality/audits">
                    <Button variant="ghost" size="sm" className="text-slate-400 hover:text-slate-100">
                        <ChevronLeft className="h-4 w-4 mr-1" />
                        Voltar para Auditorias
                    </Button>
                </Link>
                <AuditStatusToggle auditId={audit.id} currentStatus={audit.status} />
            </div>

            {/* Header Info */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <Badge variant="outline" className="font-mono text-[10px] uppercase tracking-wider text-emerald-400 border-emerald-500/30">
                                {audit.audit_number}
                            </Badge>
                            <Badge className={getStatusColor(audit.status)}>
                                {getStatusLabel(audit.status)}
                            </Badge>
                        </div>
                        <h1 className="text-3xl font-bold tracking-tight text-slate-100">
                            {audit.title}
                        </h1>
                        <p className="text-slate-400 mt-2">
                            {audit.scope || "Sem âmbito definido"}
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="glass p-4 rounded-xl border-slate-800/50 flex items-start gap-3">
                            <Calendar className="h-5 w-5 text-emerald-400 mt-0.5" />
                            <div>
                                <p className="text-[10px] uppercase tracking-wider text-slate-500 font-medium">Data Planeada</p>
                                <p className="text-sm font-semibold text-slate-200">
                                    {audit.planned_date ? format(new Date(audit.planned_date), "dd MMMM yyyy", { locale: pt }) : "Não agendada"}
                                </p>
                            </div>
                        </div>
                        <div className="glass p-4 rounded-xl border-slate-800/50 flex items-start gap-3">
                            <User className="h-5 w-5 text-emerald-400 mt-0.5" />
                            <div>
                                <p className="text-[10px] uppercase tracking-wider text-slate-500 font-medium">Auditor</p>
                                <p className="text-sm font-semibold text-slate-200">
                                    {audit.auditor?.full_name || "Não definido"}
                                </p>
                            </div>
                        </div>
                        <div className="glass p-4 rounded-xl border-slate-800/50 flex items-start gap-3">
                            <FileText className="h-5 w-5 text-emerald-400 mt-0.5" />
                            <div>
                                <p className="text-[10px] uppercase tracking-wider text-slate-500 font-medium">Checklist</p>
                                <p className="text-sm font-semibold text-slate-200">
                                    {audit.checklist?.name}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Summary Card */}
                <div className="glass p-6 rounded-2xl border-slate-800/50 space-y-4">
                    <h3 className="font-semibold text-slate-200 flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 text-emerald-400" />
                        Resumo de Constatações
                    </h3>
                    <div className="space-y-3">
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-slate-400">Total de Questões</span>
                            <span className="font-mono text-slate-200">{getTotalQuestions(audit.checklist)}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-slate-400">Respostas Registadas</span>
                            <span className="font-mono text-emerald-400">{audit.responses?.length || 0}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-slate-400">Não Conformidades</span>
                            <span className="font-mono text-rose-400">{findings.filter((f: any) => f.classification.includes('nc')).length}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-slate-400">Observações / OFIs</span>
                            <span className="font-mono text-amber-400">{findings.filter((f: any) => ['observation', 'ofi'].includes(f.classification)).length}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content Sections */}
            <Tabs defaultValue="checklist" className="space-y-6">
                <TabsList className="bg-slate-900/50 border-slate-800">
                    <TabsTrigger value="checklist" className="flex items-center gap-2">
                        <ClipboardCheck className="h-4 w-4" />
                        Checklist
                    </TabsTrigger>
                    <TabsTrigger value="findings" className="flex items-center gap-2">
                        <AlertCircle className="h-4 w-4" />
                        Constatações ({findings.length})
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="checklist" className="space-y-6">
                    {/* Checklist Execution Section */}
                    {(audit.status === 'in_progress' || audit.status === 'reporting' || audit.status === 'completed') ? (
                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <PlayCircle className="h-6 w-6 text-emerald-400" />
                                <h2 className="text-xl font-bold text-slate-100">Execução do Checklist</h2>
                            </div>
                            <ChecklistExecution
                                auditId={audit.id}
                                checklist={audit.checklist}
                                responses={audit.responses || []}
                                readOnly={audit.status === 'completed'}
                            />
                        </div>
                    ) : (
                        <div className="glass p-12 rounded-3xl border-slate-800/50 flex flex-col items-center justify-center text-center space-y-4">
                            <div className="p-4 rounded-full bg-emerald-500/10 text-emerald-400">
                                <ClipboardCheck className="h-12 w-12" />
                            </div>
                            <div className="max-w-md">
                                <h3 className="text-xl font-bold text-slate-100 italic">Audit Preparation</h3>
                                <p className="text-slate-400 mt-2">
                                    A auditoria está agendada mas ainda não foi iniciada. Reveja o âmbito e os documentos de referência antes de começar.
                                </p>
                            </div>
                            <AuditStatusToggle auditId={audit.id} currentStatus={audit.status} isLarge />
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="findings" className="space-y-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <AlertCircle className="h-6 w-6 text-rose-400" />
                            <h2 className="text-xl font-bold text-slate-100">Constatações da Auditoria</h2>
                        </div>
                    </div>
                    <AuditFindingsList findings={findings} auditId={audit.id} />
                </TabsContent>
            </Tabs>
        </div>
    );
}


function getStatusColor(status: string) {
    switch (status) {
        case 'planned': return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
        case 'in_progress': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
        case 'reporting': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
        case 'completed': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
        case 'cancelled': return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
        default: return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
    }
}

function getStatusLabel(status: string) {
    switch (status) {
        case 'planned': return 'Planeada';
        case 'in_progress': return 'Em Curso';
        case 'reporting': return 'Relatório';
        case 'completed': return 'Concluída';
        case 'cancelled': return 'Cancelada';
        default: return status;
    }
}

function getTotalQuestions(checklist: any) {
    if (!checklist?.sections) return 0;
    return checklist.sections.reduce((acc: number, section: any) => acc + (section.questions?.length || 0), 0);
}

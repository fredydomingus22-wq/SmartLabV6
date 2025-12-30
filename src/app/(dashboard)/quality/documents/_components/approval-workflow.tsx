"use client";

import { Badge } from "@/components/ui/badge";
import { GlassTable, GlassTableHeader, GlassTableRow, GlassTableHead, GlassTableCell } from "@/components/ui/glass-table";
import { CheckCircle2, Clock, XCircle, User } from "lucide-react";
import { cn } from "@/lib/utils";

interface ApprovalWorkflowProps {
    approvals: any[];
}

export function ApprovalWorkflow({ approvals }: ApprovalWorkflowProps) {
    if (!approvals || approvals.length === 0) {
        return (
            <div className="text-center py-10 glass rounded-3xl border-dashed border-slate-800">
                <p className="text-slate-500">Nenhum fluxo de aprovação definido para esta versão.</p>
            </div>
        );
    }

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'approved': return <CheckCircle2 className="h-4 w-4 text-emerald-400" />;
            case 'rejected': return <XCircle className="h-4 w-4 text-rose-400" />;
            case 'pending': return <Clock className="h-4 w-4 text-amber-400" />;
            default: return null;
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'approved': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
            case 'rejected': return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
            case 'pending': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
            default: return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
        }
    };

    return (
        <div className="space-y-4">
            <h3 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
                <User className="h-5 w-5 text-indigo-400" />
                Workflow de Aprovação
            </h3>

            <GlassTable>
                <GlassTableHeader>
                    <GlassTableRow>
                        <GlassTableHead>Aprovador</GlassTableHead>
                        <GlassTableHead>Função</GlassTableHead>
                        <GlassTableHead>Estado</GlassTableHead>
                        <GlassTableHead>Data de Assinatura</GlassTableHead>
                        <GlassTableHead>Comentários</GlassTableHead>
                    </GlassTableRow>
                </GlassTableHeader>
                <tbody>
                    {approvals.map((approval) => (
                        <GlassTableRow key={approval.id}>
                            <GlassTableCell className="font-medium text-slate-200">
                                {approval.approver?.full_name || "Aprovador Externo"}
                            </GlassTableCell>
                            <GlassTableCell>
                                <Badge variant="outline" className="capitalize bg-white/5 border-white/10">
                                    {approval.role}
                                </Badge>
                            </GlassTableCell>
                            <GlassTableCell>
                                <div className="flex items-center gap-2">
                                    {getStatusIcon(approval.status)}
                                    <span className={cn("text-xs font-semibold",
                                        approval.status === 'approved' ? 'text-emerald-400' :
                                            approval.status === 'rejected' ? 'text-rose-400' : 'text-amber-400'
                                    )}>
                                        {approval.status.toUpperCase()}
                                    </span>
                                </div>
                            </GlassTableCell>
                            <GlassTableCell className="text-slate-400">
                                {approval.signed_at ? new Date(approval.signed_at).toLocaleString() : '---'}
                            </GlassTableCell>
                            <GlassTableCell className="text-slate-400 italic text-xs max-w-xs truncate">
                                {approval.comments || 'Sem comentários'}
                            </GlassTableCell>
                        </GlassTableRow>
                    ))}
                </tbody>
            </GlassTable>
        </div>
    );
}

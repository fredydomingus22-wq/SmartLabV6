"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle2, XCircle, Clock } from "lucide-react";
import { processApprovalAction } from "@/app/actions/dms";
import { useState } from "react";
import { ActionForm } from "@/components/smart/action-form";

interface ApprovalWorkflowProps {
    version: any;
    currentUserId: string;
}

export function ApprovalWorkflow({ version, currentUserId }: ApprovalWorkflowProps) {
    const approvals = version?.approvals || [];
    const myApproval = approvals.find((a: any) => a.approver_id === currentUserId && a.status === 'pending');

    return (
        <div className="space-y-4">
            {approvals.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-8 text-center bg-slate-900/40 rounded-xl border border-dashed border-slate-800">
                    <Clock className="h-8 w-8 text-slate-600 mb-2" />
                    <p className="text-sm text-slate-500">Nenhum workflow de aprovação iniciado para esta versão.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {approvals.map((approval: any) => (
                        <div key={approval.id} className="p-3 rounded-xl border border-slate-800 bg-slate-950/50 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                {approval.status === 'approved' ? (
                                    <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                                ) : approval.status === 'rejected' ? (
                                    <XCircle className="h-5 w-5 text-rose-500" />
                                ) : (
                                    <Clock className="h-5 w-5 text-amber-500" />
                                )}
                                <div>
                                    <p className="text-sm font-medium text-slate-200">{approval.approver?.full_name}</p>
                                    <p className="text-[10px] text-slate-500 uppercase tracking-wider">{approval.role}</p>
                                </div>
                            </div>
                            <Badge className={cn(
                                "capitalize",
                                approval.status === 'approved' ? "bg-emerald-500/10 text-emerald-400" :
                                    approval.status === 'rejected' ? "bg-rose-500/10 text-rose-400" :
                                        "bg-amber-500/10 text-amber-400"
                            )}>
                                {approval.status}
                            </Badge>
                        </div>
                    ))}
                </div>
            )}

            {myApproval && (
                <div className="mt-8 pt-6 border-t border-slate-800 space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
                    <h4 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                        Sua Decisão é Necessária
                    </h4>

                    <ActionForm
                        action={(fd) => processApprovalAction(myApproval.id, fd.get('decision') as any, fd.get('comments') as string)}
                        submitText="Confirmar Decisão"
                    >
                        <div className="space-y-4">
                            <input type="hidden" name="decision" id="decision_input" value="approved" />

                            <div className="grid grid-cols-2 gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
                                    onClick={() => {
                                        const input = document.getElementById('decision_input') as HTMLInputElement;
                                        input.value = 'approved';
                                        toast.info("Selecionado: Aprovar");
                                    }}
                                >
                                    Aprovar
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="border-rose-500/30 text-rose-400 hover:bg-rose-500/10"
                                    onClick={() => {
                                        const input = document.getElementById('decision_input') as HTMLInputElement;
                                        input.value = 'rejected';
                                        toast.info("Selecionado: Rejeitar");
                                    }}
                                >
                                    Rejeitar
                                </Button>
                            </div>

                            <Textarea
                                name="comments"
                                placeholder="Comentários ou observações (opcional)..."
                                className="glass min-h-[80px]"
                            />
                        </div>
                    </ActionForm>
                </div>
            )}
        </div>
    );
}

import { cn } from "@/lib/utils";
import { toast } from "sonner";

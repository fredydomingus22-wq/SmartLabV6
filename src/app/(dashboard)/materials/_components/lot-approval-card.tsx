"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { ShieldCheck, CheckCircle2, XCircle, AlertTriangle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { approveRawMaterialLotAction, approvePackagingLotAction, ApprovalStatus } from "@/app/actions/lot-approvals";

interface LotApprovalCardProps {
    lotId: string;
    type: "raw" | "packaging";
    currentStatus: string;
    qcNotes?: string | null;
}

export function LotApprovalCard({ lotId, type, currentStatus, qcNotes }: LotApprovalCardProps) {
    const [status, setStatus] = useState(currentStatus);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [actionType, setActionType] = useState<ApprovalStatus | null>(null);
    const [comments, setComments] = useState("");
    const [loading, setLoading] = useState(false);

    const isReleased = status === "approved" || status === "active";
    const isRejected = status === "rejected";

    const approvedStatus = type === "raw" ? "approved" : "active";

    const handleAction = (newStatus: ApprovalStatus | "active") => {
        setActionType(newStatus as ApprovalStatus);
        setComments(""); // Reset comments or pre-fill if needed
        setDialogOpen(true);
    };

    const submitAction = async () => {
        if (!actionType) return;
        setLoading(true);
        try {
            const action = type === "raw" ? approveRawMaterialLotAction : approvePackagingLotAction;
            const res = await action(lotId, actionType, comments);

            if (res.success) {
                toast.success(res.message);
                setStatus(actionType);
                setDialogOpen(false);
            } else {
                toast.error(res.message);
            }
        } catch (error) {
            toast.error("Erro ao processar ação.");
        } finally {
            setLoading(false);
        }
    };

    const getStatusBadge = (s: string) => {
        switch (s) {
            case "approved": return <Badge variant="default" className="bg-emerald-500 hover:bg-emerald-600">Aprovado</Badge>;
            case "active": return <Badge variant="default" className="bg-emerald-500 hover:bg-emerald-600">Ativo / Libertado</Badge>;
            case "rejected": return <Badge variant="destructive">Rejeitado</Badge>;
            case "quarantine": return <Badge variant="outline" className="text-amber-500 border-amber-500">Quarentena</Badge>;
            default: return <Badge variant="secondary">{s}</Badge>;
        }
    };

    return (
        <Card className="bg-slate-950/40 border-slate-800 shadow-xl overflow-hidden">
            <CardHeader className="bg-slate-900/20 border-b border-slate-800/50">
                <div className="flex justify-between items-center">
                    <CardTitle className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <ShieldCheck className="h-4 w-4 text-blue-500" />
                        Aprovação de Qualidade (QC)
                    </CardTitle>
                    {getStatusBadge(status)}
                </div>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
                {qcNotes && (
                    <div className="text-sm text-slate-300 bg-slate-900/50 p-4 rounded-xl border border-slate-800 flex flex-col gap-2">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Notas de Controlo de Qualidade</span>
                        <p className="italic text-slate-400 leading-relaxed">"{qcNotes}"</p>
                    </div>
                )}

                {!qcNotes && status !== approvedStatus && status !== "rejected" && (
                    <p className="text-sm text-slate-500 italic text-center py-2">
                        Aguardando decisão de controlo de qualidade.
                    </p>
                )}

                <div className="flex flex-col gap-3 pt-2">
                    <div className="flex gap-3">
                        {status !== approvedStatus && (
                            <Button
                                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                                onClick={() => handleAction(approvedStatus)}
                            >
                                <CheckCircle2 className="h-4 w-4 mr-2" />
                                Aprovar
                            </Button>
                        )}

                        {status !== "rejected" && (
                            <Button
                                variant="destructive"
                                className="flex-1 font-bold"
                                onClick={() => handleAction("rejected")}
                            >
                                <XCircle className="h-4 w-4 mr-2" />
                                Rejeitar
                            </Button>
                        )}
                    </div>

                    {status !== "quarantine" && (
                        <Button
                            variant="outline"
                            className="w-full border-amber-500/50 text-amber-500 hover:bg-amber-500/10"
                            onClick={() => handleAction("quarantine")}
                        >
                            <AlertTriangle className="h-4 w-4 mr-2" />
                            Retornar à Quarentena
                        </Button>
                    )}
                </div>
            </CardContent>

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="sm:max-w-[425px] glass">
                    <DialogHeader>
                        <DialogTitle>Confirmar Ação</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <p className="text-sm text-slate-300">
                            Está prestes a marcar este lote como <strong className="uppercase">{actionType === 'approved' ? 'Aprovado' : actionType === 'rejected' ? 'Rejeitado' : 'Quarentena'}</strong>.
                        </p>
                        <div className="grid gap-2">
                            <label htmlFor="comments" className="text-sm font-medium text-slate-400">
                                Notas / Justificação
                            </label>
                            <Textarea
                                id="comments"
                                value={comments}
                                onChange={(e) => setComments(e.target.value)}
                                placeholder="Insira observações sobre esta decisão..."
                                className="bg-slate-950/50 border-slate-700"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setDialogOpen(false)} disabled={loading}>Cancelar</Button>
                        <Button
                            onClick={submitAction}
                            disabled={loading}
                            className={actionType === 'approved' ? "bg-emerald-600 hover:bg-emerald-700" : actionType === 'rejected' ? "bg-rose-600 hover:bg-rose-700" : "bg-amber-600 hover:bg-amber-700"}
                        >
                            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                            Confirmar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </Card>
    );
}

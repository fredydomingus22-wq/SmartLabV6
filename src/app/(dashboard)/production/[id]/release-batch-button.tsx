"use client";

import { Button } from "@/components/ui/button";
import { CheckCheck, Loader2, XCircle, PlayCircle, AlertOctagon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { releaseBatchAction, finalizeBatchAction } from "@/app/actions/production";
import { useRouter } from "next/navigation";
import { IndustrialConfirmDialog } from "@/components/shared/industrial-confirm-dialog";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

interface ReleaseBatchButtonProps {
    batchId: string;
    status: string;
    userRole: string;
}

export function ReleaseBatchButton({ batchId, status, userRole }: ReleaseBatchButtonProps) {
    const [loading, setLoading] = useState(false);
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [blockers, setBlockers] = useState<string[] | null>(null); // State for blocking errors
    const [confirmConfig, setConfirmConfig] = useState<{
        title: string;
        description: string;
        variant: "warning" | "destructive" | "success";
        action: "finalize" | "release" | "reject";
    } | null>(null);

    const router = useRouter();

    const isManager = ["admin", "system_owner", "manager", "qa_manager"].includes(userRole);

    const openConfirm = (action: "finalize" | "release" | "reject") => {
        const configs = {
            finalize: {
                title: "Finalizar Produção",
                description: "Deseja marcar este lote como finalizado? Esta ação selará os dados de produção.",
                variant: "warning" as const,
                action: "finalize" as const
            },
            release: {
                title: "Liberar Lote",
                description: "Tem a certeza que deseja LIBERAR este lote para o mercado? Todos os dados serão selados.",
                variant: "success" as const,
                action: "release" as const
            },
            reject: {
                title: "Rejeitar Lote",
                description: "Tem a certeza que deseja REJEITAR este lote? Esta ação é irreversível.",
                variant: "destructive" as const,
                action: "reject" as const
            }
        };
        setConfirmConfig(configs[action]);
        setConfirmOpen(true);
    };

    const handleConfirmAction = async (reason: string, password?: string) => {
        if (!confirmConfig) return;
        setLoading(true);

        try {
            if (confirmConfig.action === "finalize") {
                const result = await finalizeBatchAction(batchId);
                if (result.success) {
                    toast.success(result.message);
                    router.refresh();
                } else {
                    toast.error(result.message);
                }
            } else {
                const action = confirmConfig.action as "release" | "reject";
                const formData = new FormData();
                formData.append("batch_id", batchId);
                formData.append("action", action);
                formData.append("reason", reason); // Audit trail justification
                if (password) formData.append("password", password); // 21 CFR Signature

                const result = await releaseBatchAction(formData);

                if (result.success) {
                    toast.success(result.message);
                    router.refresh();
                } else {
                    // Check for Blockers (Structured Errors from Gatekeeper)
                    if (result.errors && Array.isArray(result.errors) && result.errors.length > 0) {
                        setBlockers(result.errors); // Trigger Blockers Dialog
                        toast.error("Bloqueio de Qualidade detetado.");
                    } else {
                        toast.error(result.message);
                    }
                }
            }
        } catch (error) {
            console.error("Batch state transition error:", error);
            toast.error("Ocorreu um erro ao processar a transição de estado.");
        } finally {
            setLoading(false);
            setConfirmOpen(false);
        }
    };

    return (
        <>
            {/* Logic for Buttons */}
            {status === "in_progress" || status === "open" ? (
                <Button
                    onClick={() => openConfirm("finalize")}
                    disabled={loading}
                    variant="outline"
                    className="border-amber-200 text-amber-700 hover:bg-amber-50 rounded-xl"
                >
                    {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PlayCircle className="mr-2 h-4 w-4" />}
                    Finalizar Produção
                </Button>
            ) : status === "completed" && isManager ? (
                <div className="flex items-center gap-2">
                    <Button
                        onClick={() => openConfirm("reject")}
                        disabled={loading}
                        variant="ghost"
                        className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-xl font-bold"
                    >
                        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <XCircle className="mr-2 h-4 w-4" />}
                        Rejeitar
                    </Button>
                    <Button
                        onClick={() => openConfirm("release")}
                        disabled={loading}
                        variant="default"
                        className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold px-6 shadow-lg shadow-emerald-500/20"
                    >
                        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCheck className="mr-2 h-4 w-4" />}
                        Liberar Lote
                    </Button>
                </div>
            ) : status === "completed" && !isManager ? (
                <div className="text-[10px] font-bold text-muted-foreground uppercase bg-muted/30 px-3 py-2 rounded-lg border border-white/5">
                    Aguardando Revisão Manager
                </div>
            ) : null}

            {/* Confirm Dialog */}
            {confirmConfig && (
                <IndustrialConfirmDialog
                    isOpen={confirmOpen}
                    onClose={() => setConfirmOpen(false)}
                    onConfirm={handleConfirmAction}
                    title={confirmConfig.title}
                    description={confirmConfig.description}
                    variant={confirmConfig.variant}
                    requireReason={true}
                    requireSignature={confirmConfig.action !== "finalize"} // Only finalize needs no signature for now (or change as per req)
                />
            )}

            {/* BLOCKERS DIALOG (New) */}
            <Dialog open={!!blockers} onOpenChange={(o) => !o && setBlockers(null)}>
                <DialogContent className="sm:max-w-[500px] border-rose-500/30 bg-black/95 shadow-2xl shadow-rose-900/20">
                    <DialogHeader>
                        <div className="flex items-center gap-3 text-rose-500 mb-2">
                            <div className="p-2 bg-rose-500/10 rounded-xl border border-rose-500/20">
                                <AlertOctagon className="h-6 w-6" />
                            </div>
                            <DialogTitle className="text-xl font-black tracking-tight">Bloqueio de Qualidade</DialogTitle>
                        </div>
                        <DialogDescription className="text-slate-400">
                            O sistema impediu a libertação deste lote devido aos seguintes critérios críticos não satisfeitos:
                        </DialogDescription>
                    </DialogHeader>

                    <div className="py-4">
                        <ul className="space-y-3">
                            {blockers?.map((error, idx) => (
                                <li key={idx} className="flex items-start gap-3 p-3 bg-rose-950/20 border border-rose-500/20 rounded-lg text-sm text-rose-200">
                                    <XCircle className="h-4 w-4 text-rose-500 mt-0.5 shrink-0" />
                                    <span>{error}</span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <DialogFooter>
                        <Button
                            variant="secondary"
                            onClick={() => setBlockers(null)}
                            className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold"
                        >
                            Entendido, vou corrigir.
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}

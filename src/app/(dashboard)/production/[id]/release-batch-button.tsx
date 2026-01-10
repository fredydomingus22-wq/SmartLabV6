"use client";

import { Button } from "@/components/ui/button";
import { CheckCheck, Loader2, XCircle, PlayCircle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { releaseBatchAction, finalizeBatchAction } from "@/app/actions/production";
import { useRouter } from "next/navigation";

interface ReleaseBatchButtonProps {
    batchId: string;
    status: string;
    userRole: string;
}

import { IndustrialConfirmDialog } from "@/components/shared/industrial-confirm-dialog";

export function ReleaseBatchButton({ batchId, status, userRole }: ReleaseBatchButtonProps) {
    const [loading, setLoading] = useState(false);
    const [confirmOpen, setConfirmOpen] = useState(false);
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
                    toast.error(result.message);
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

    // 1. If status is in_progress (or legacy 'open'), show "Finalizar Produção"
    if (status === "in_progress" || status === "open") {
        return (
            <>
                <Button
                    onClick={() => openConfirm("finalize")}
                    disabled={loading}
                    variant="outline"
                    className="border-amber-200 text-amber-700 hover:bg-amber-50 rounded-xl"
                >
                    {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PlayCircle className="mr-2 h-4 w-4" />}
                    Finalizar Produção
                </Button>
                {confirmConfig && (
                    <IndustrialConfirmDialog
                        isOpen={confirmOpen}
                        onClose={() => setConfirmOpen(false)}
                        onConfirm={handleConfirmAction}
                        title={confirmConfig.title}
                        description={confirmConfig.description}
                        variant={confirmConfig.variant}
                        requireReason={true}
                        requireSignature={false}
                    />
                )}
            </>
        );
    }

    // 2. If status is completed, show "Liberar/Rejeitar" to Managers
    if (status === "completed") {
        if (!isManager) {
            return (
                <div className="text-[10px] font-bold text-muted-foreground uppercase bg-muted/30 px-3 py-2 rounded-lg border border-white/5">
                    Aguardando Revisão Manager
                </div>
            );
        }

        return (
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
                {confirmConfig && (
                    <IndustrialConfirmDialog
                        isOpen={confirmOpen}
                        onClose={() => setConfirmOpen(false)}
                        onConfirm={handleConfirmAction}
                        title={confirmConfig.title}
                        description={confirmConfig.description}
                        variant={confirmConfig.variant}
                        requireReason={true}
                        requireSignature={true}
                    />
                )}
            </div>
        );
    }

    return null;
}

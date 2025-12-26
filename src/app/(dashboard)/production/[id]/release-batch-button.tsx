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

export function ReleaseBatchButton({ batchId, status, userRole }: ReleaseBatchButtonProps) {
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const isManager = ["admin", "system_owner", "manager", "qa_manager"].includes(userRole);

    // Flow: planned -> in_progress -> completed -> released/rejected

    const handleFinalize = async () => {
        if (!confirm("Confirmar finalização da produção deste lote?")) return;
        setLoading(true);
        const result = await finalizeBatchAction(batchId);
        if (result.success) {
            toast.success(result.message);
            router.refresh();
        } else {
            toast.error(result.message);
        }
        setLoading(false);
    };

    const handleRelease = async (action: "release" | "reject") => {
        const msg = action === "release"
            ? "Tem a certeza que deseja LIBERAR este lote? Todos os dados serão selados."
            : "Tem a certeza que deseja REJEITAR este lote?";

        if (!confirm(msg)) return;

        setLoading(true);
        const formData = new FormData();
        formData.append("batch_id", batchId);
        formData.append("action", action);

        const result = await releaseBatchAction(formData);

        if (result.success) {
            toast.success(result.message);
            router.refresh();
        } else {
            toast.error(result.message);
        }
        setLoading(false);
    };

    // 1. If status is in_progress (or legacy 'open'), show "Finalizar Produção"
    if (status === "in_progress" || status === "open") {
        return (
            <Button
                onClick={handleFinalize}
                disabled={loading}
                variant="outline"
                className="border-amber-200 text-amber-700 hover:bg-amber-50"
            >
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PlayCircle className="mr-2 h-4 w-4" />}
                Finalizar Produção
            </Button>
        );
    }

    // 2. If status is completed, show "Liberar/Rejeitar" to Managers
    if (status === "completed") {
        if (!isManager) {
            return (
                <div className="text-[10px] font-bold text-muted-foreground uppercase bg-muted/30 px-3 py-2 rounded-lg">
                    Aguardando Revisão Manager
                </div>
            );
        }

        return (
            <div className="flex items-center gap-2">
                <Button
                    onClick={() => handleRelease("reject")}
                    disabled={loading}
                    variant="ghost"
                    className="text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                >
                    {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <XCircle className="mr-2 h-4 w-4" />}
                    Rejeitar
                </Button>
                <Button
                    onClick={() => handleRelease("release")}
                    disabled={loading}
                    variant="default"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                    {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCheck className="mr-2 h-4 w-4" />}
                    Liberar Lote
                </Button>
            </div>
        );
    }

    return null;
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle } from "lucide-react";
import { technicalReviewAction } from "@/app/actions/lab_modules/approvals";
import { IndustrialConfirmDialog } from "@/components/shared/industrial-confirm-dialog";

interface ApproveSampleDialogProps {
    sample: {
        id: string;
        code: string;
    };
    action: "approve" | "reject";
}

export function ApproveSampleDialog({ sample, action }: ApproveSampleDialogProps) {
    const [confirmOpen, setConfirmOpen] = useState(false);
    const router = useRouter();

    const handleConfirm = async (reason: string, password?: string) => {
        const result = await technicalReviewAction({
            sampleId: sample.id,
            decision: action === "approve" ? "approved" : "rejected",
            reason,
            password
        });

        if (result.success) {
            toast.success(action === "approve" ? "Aprovado com sucesso" : "Amostra rejeitada");
            router.refresh();
        } else {
            const errorMsg = result.message || "Erro desconhecido";
            toast.error(errorMsg);
            throw new Error(errorMsg);
        }
    };

    return (
        <>
            <Button
                size="sm"
                variant={action === "approve" ? "default" : "outline"}
                className={`h-8 text-[10px] px-2 font-bold ${action === "approve"
                        ? "bg-green-600 hover:bg-green-700 text-white"
                        : "text-rose-600 border-rose-200 hover:bg-rose-50 hover:text-rose-700 dark:border-rose-900/30"
                    }`}
                onClick={() => setConfirmOpen(true)}
            >
                {action === "approve" ? (
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                ) : (
                    <XCircle className="h-3 w-3 mr-1" />
                )}
                {action === "approve" ? "Aprovar" : "Rejeitar"}
            </Button>

            <IndustrialConfirmDialog
                isOpen={confirmOpen}
                onClose={() => setConfirmOpen(false)}
                onConfirm={handleConfirm}
                title={action === "approve" ? "Revisão Técnica: Aprovar" : "Revisão Técnica: Rejeitar"}
                description={
                    action === "approve"
                        ? `Confirmar conformidade técnica para a amostra ${sample.code}. Esta ação permitirá a libertação final por QA.`
                        : `Rejeitar amostra ${sample.code} por motivos técnicos. A amostra voltará para processamento.`
                }
                confirmLabel={action === "approve" ? "Aprovar e Assinar" : "Rejeitar e Assinar"}
                variant={action === "approve" ? "success" : "destructive"}
                requireReason={true}
                requireSignature={true}
            />
        </>
    );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ClipboardCheck, XCircle } from "lucide-react";
import { technicalReviewAction } from "@/app/actions/lab_modules/approvals";
import { IndustrialConfirmDialog } from "@/components/shared/industrial-confirm-dialog";

interface ValidateDialogProps {
    sampleId: string;
    sampleCode: string;
}

export function ValidateDialog({ sampleId, sampleCode }: ValidateDialogProps) {
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [status, setStatus] = useState<'approved' | 'rejected'>('approved');
    const router = useRouter();

    const handleOpen = (newStatus: 'approved' | 'rejected') => {
        setStatus(newStatus);
        setConfirmOpen(true);
    };

    const handleConfirm = async (reason: string, password?: string) => {
        const result = await technicalReviewAction({
            sampleId,
            decision: status,
            reason,
            password
        });

        if (result.success) {
            toast.success(status === 'approved' ? "Revisão Técnica concluída" : "Amostra rejeitada na revisão");
            router.refresh();
        } else {
            toast.error(result.message);
            throw new Error(result.message);
        }
    };

    return (
        <>
            <div className="flex gap-2">
                <Button
                    onClick={() => handleOpen('approved')}
                    className="bg-purple-600 hover:bg-purple-700 text-white shadow-lg shadow-purple-500/20 rounded-xl"
                >
                    <ClipboardCheck className="h-4 w-4 mr-2" />
                    Aprovação Técnica
                </Button>
                <Button
                    variant="destructive"
                    onClick={() => handleOpen('rejected')}
                    className="bg-rose-600 hover:bg-rose-700 text-white shadow-lg shadow-rose-500/20 rounded-xl"
                >
                    <XCircle className="h-4 w-4 mr-2" />
                    Rejeitar
                </Button>
            </div>

            <IndustrialConfirmDialog
                isOpen={confirmOpen}
                onClose={() => setConfirmOpen(false)}
                onConfirm={handleConfirm}
                title={status === 'approved' ? "Revisão Técnica: Aprovar" : "Revisão Técnica: Rejeitar"}
                description={
                    status === 'approved'
                        ? `Confirmar conformidade técnica para a amostra ${sampleCode}. Esta ação permitirá a libertação final por QA.`
                        : `Rejeitar amostra ${sampleCode} por motivos técnicos. A amostra voltará para re-análise.`
                }
                confirmLabel={status === 'approved' ? "Aprovar e Assinar" : "Rejeitar e Assinar"}
                variant={status === 'approved' ? "success" : "destructive"}
                requireReason={true}
                requireSignature={true}
            />
        </>
    );
}

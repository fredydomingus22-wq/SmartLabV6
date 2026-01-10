"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Truck, XCircle } from "lucide-react";
import { finalReleaseAction } from "@/app/actions/lab_modules/approvals";
import { IndustrialConfirmDialog } from "@/components/shared/industrial-confirm-dialog";

interface ReleaseDialogProps {
    sampleId: string;
    sampleCode: string;
}

export function ReleaseDialog({ sampleId, sampleCode }: ReleaseDialogProps) {
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [decision, setDecision] = useState<'released' | 'rejected'>('released');
    const router = useRouter();

    const handleOpen = (newDecision: 'released' | 'rejected') => {
        setDecision(newDecision);
        setConfirmOpen(true);
    };

    const handleConfirm = async (reason: string, password?: string) => {
        const result = await finalReleaseAction({
            sampleId,
            decision,
            notes: reason,
            password
        });

        if (result.success) {
            toast.success(decision === 'released' ? "Amostra libertada com sucesso" : "Amostra rejeitada na fase final");
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
                    onClick={() => handleOpen('released')}
                    className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20 rounded-xl"
                >
                    <Truck className="h-4 w-4 mr-2" />
                    Libertação Final
                </Button>
                <Button
                    variant="destructive"
                    onClick={() => handleOpen('rejected')}
                    className="bg-rose-600 hover:bg-rose-700 text-white shadow-lg shadow-rose-500/20 rounded-xl"
                >
                    <XCircle className="h-4 w-4 mr-2" />
                    Bloquear Lote
                </Button>
            </div>

            <IndustrialConfirmDialog
                isOpen={confirmOpen}
                onClose={() => setConfirmOpen(false)}
                onConfirm={handleConfirm}
                title={decision === 'released' ? "Libertação de Qualidade" : "Bloqueio de Qualidade"}
                description={
                    decision === 'released'
                        ? `Está prestes a libertar a amostra ${sampleCode} para o mercado/produção. Esta é a fase final do fluxo ISO 9001.`
                        : `Está prestes a bloquear definitivamente a amostra ${sampleCode}.`
                }
                confirmLabel={decision === 'released' ? "Libertar e Assinar" : "Bloquear e Assinar"}
                variant={decision === 'released' ? "success" : "destructive"}
                requireReason={true}
                requireSignature={true}
            />
        </>
    );
}

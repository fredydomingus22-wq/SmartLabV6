"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, CheckCircle, Clock, ShieldCheck, PlayCircle } from "lucide-react";
import { updateCAPAStatusAction } from "@/app/actions/qms";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { SignatureDialog } from "@/components/smart/signature-dialog";

interface CAPAStatusUpdateProps {
    capaId: string;
    currentStatus: string;
}

export function CAPAStatusUpdate({ capaId, currentStatus }: CAPAStatusUpdateProps) {
    const [isPending, startTransition] = useTransition();
    const [showSignature, setShowSignature] = useState(false);
    const [pendingStatus, setPendingStatus] = useState<string | null>(null);
    const router = useRouter();

    const handleStatusChange = (newStatus: string) => {
        if (newStatus === "verified") {
            setPendingStatus(newStatus);
            setShowSignature(true);
        } else {
            submitStatus(newStatus);
        }
    };

    const submitStatus = (status: string, password?: string) => {
        const formData = new FormData();
        formData.append("id", capaId);
        formData.append("status", status);
        if (password) formData.append("password", password);

        startTransition(async () => {
            const result = await updateCAPAStatusAction(formData);
            if (result.success) {
                toast.success(result.message);
                setShowSignature(false);
                router.refresh();
            } else {
                toast.error(result.message);
            }
        });
    };

    const handleConfirmSignature = async (password: string) => {
        if (pendingStatus) {
            submitStatus(pendingStatus, password);
        }
    };

    if (currentStatus === "closed" || currentStatus === "verified") {
        return null; // No more actions once verified or closed
    }

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" disabled={isPending}>
                        <MoreHorizontal className="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="glass">
                    {currentStatus === "planned" && (
                        <DropdownMenuItem onClick={() => handleStatusChange("in_progress")}>
                            <PlayCircle className="h-4 w-4 mr-2 text-blue-400" />
                            Iniciar Execução
                        </DropdownMenuItem>
                    )}
                    {currentStatus === "in_progress" && (
                        <DropdownMenuItem onClick={() => handleStatusChange("completed")}>
                            <CheckCircle className="h-4 w-4 mr-2 text-emerald-400" />
                            Marcar como Concluída
                        </DropdownMenuItem>
                    )}
                    {currentStatus === "completed" && (
                        <DropdownMenuItem onClick={() => handleStatusChange("verified")}>
                            <ShieldCheck className="h-4 w-4 mr-2 text-amber-400" />
                            Verificar Eficácia (Assinar)
                        </DropdownMenuItem>
                    )}
                </DropdownMenuContent>
            </DropdownMenu>

            <SignatureDialog
                open={showSignature}
                onOpenChange={setShowSignature}
                onConfirm={handleConfirmSignature}
                loading={isPending}
                title="Verificar Ação CAPA"
                description="A sua assinatura eletrónica confirma que a ação foi implementada e a sua eficácia foi verificada."
            />
        </>
    );
}

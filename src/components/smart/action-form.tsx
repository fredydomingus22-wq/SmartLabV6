"use client";

import { useActionState, useState, useRef } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { ReactNode } from "react";

import { IndustrialConfirmDialog } from "@/components/shared/industrial-confirm-dialog";

// Generic Result Type for Actions
interface ActionResult {
    success: boolean;
    message?: string;
    error?: string;
    data?: any;
}

interface ActionFormProps {
    action: (formData: FormData) => Promise<ActionResult>;
    children: ReactNode;
    submitText?: string;
    onSuccess?: (data: any) => void;
    className?: string;
    showFooter?: boolean;
    // Industrial Guards
    confirmTitle?: string;
    confirmDescription?: string;
    requireReason?: boolean;
    requireSignature?: boolean;
}

export function ActionForm({
    action,
    children,
    submitText = "Save",
    onSuccess,
    className,
    showFooter = true,
    confirmTitle,
    confirmDescription,
    requireReason = false,
    requireSignature = false,
}: ActionFormProps) {
    const [confirmOpen, setConfirmOpen] = useState(false);
    const formRef = useRef<HTMLFormElement>(null);

    const [state, formAction, isPending] = useActionState(async (_prev: any, formData: FormData) => {
        const result = await action(formData);
        if (result.success) {
            toast.success(result.message || "Operation successful");
            onSuccess?.(result.data);
        } else {
            toast.error(result.message || result.error || "Something went wrong");
        }
        return result;
    }, null);

    const handleSubmit = (e: React.FormEvent) => {
        if (confirmTitle || confirmDescription) {
            e.preventDefault();
            setConfirmOpen(true);
        }
    };

    const handleConfirmedAction = async (reason: string, password?: string) => {
        if (!formRef.current) return;

        const formData = new FormData(formRef.current);
        if (reason) formData.append("reason", reason);
        if (password) formData.append("password", password);

        // We call formAction (from useActionState) directly with the augmented FormData
        formAction(formData);
        setConfirmOpen(false);
    };

    return (
        <>
            <form
                ref={formRef}
                action={formAction}
                onSubmit={handleSubmit}
                className={className}
            >
                <div className="space-y-4">
                    {children}
                </div>

                {showFooter && (
                    <div className="mt-6 flex justify-end">
                        <Button type="submit" disabled={isPending}>
                            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {submitText}
                        </Button>
                    </div>
                )}
            </form>

            {(confirmTitle || confirmDescription) && (
                <IndustrialConfirmDialog
                    isOpen={confirmOpen}
                    onClose={() => setConfirmOpen(false)}
                    onConfirm={handleConfirmedAction}
                    title={confirmTitle || "Confirmar Ação"}
                    description={confirmDescription || "Esta ação será registada no histórico de auditoria."}
                    requireReason={requireReason}
                    requireSignature={requireSignature}
                    variant="warning"
                />
            )}
        </>
    );
}


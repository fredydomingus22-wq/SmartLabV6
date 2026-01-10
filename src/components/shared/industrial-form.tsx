"use client";

import { ReactNode } from "react";
import { useForm, UseFormReturn, FieldValues, DefaultValues, Path } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { IndustrialConfirmDialog } from "@/components/shared/industrial-confirm-dialog";
import { useState } from "react";

interface IndustrialFormProps<T extends FieldValues> {
    schema: z.ZodSchema<T>;
    defaultValues: DefaultValues<T>;
    onSubmit: (data: T, formData: FormData) => Promise<{ success: boolean; message?: string; data?: any }>;
    children: (form: UseFormReturn<T>) => ReactNode;
    submitText?: string;
    className?: string;
    // Industrial Guards
    confirmTitle?: string;
    confirmDescription?: string;
    requireReason?: boolean;
    requireSignature?: boolean;
}

/**
 * IndustrialForm: Wrapper that integrates react-hook-form, Zod, and global toast handling.
 * Provides consistent form behavior across all modules with optional industrial confirmation guards.
 */
export function IndustrialForm<T extends FieldValues>({
    schema,
    defaultValues,
    onSubmit,
    children,
    submitText = "Guardar",
    className,
    confirmTitle,
    confirmDescription,
    requireReason = false,
    requireSignature = false,
}: IndustrialFormProps<T>) {
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [pendingData, setPendingData] = useState<T | null>(null);

    const form = useForm<T>({
        resolver: zodResolver(schema as any),
        defaultValues,
    });

    const handleSubmit = async (data: T) => {
        if (confirmTitle || requireSignature || requireReason) {
            setPendingData(data);
            setIsConfirmOpen(true);
        } else {
            await executeSubmit(data);
        }
    };

    const executeSubmit = async (data: T, reason?: string, password?: string) => {
        const formData = new FormData();

        // Serialize form data
        Object.entries(data).forEach(([key, value]) => {
            if (value !== null && value !== undefined) {
                formData.append(key, String(value));
            }
        });

        // Add industrial audit fields
        if (reason) formData.append("reason", reason);
        if (password) formData.append("password", password);

        try {
            const result = await onSubmit(data, formData);

            if (result.success) {
                toast.success(result.message || "Operação concluída com sucesso");
                form.reset();
            } else {
                toast.error(result.message || "Erro ao processar operação");
            }
        } catch (error: any) {
            toast.error(error.message || "Erro inesperado");
        }
    };

    const handleConfirm = async (reason: string, password?: string) => {
        if (pendingData) {
            await executeSubmit(pendingData, reason, password);
            setPendingData(null);
            setIsConfirmOpen(false);
        }
    };

    return (
        <>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(handleSubmit)} className={className}>
                    {children(form)}

                    <div className="mt-6 flex justify-end">
                        <Button type="submit" disabled={form.formState.isSubmitting}>
                            {form.formState.isSubmitting && (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            )}
                            {submitText}
                        </Button>
                    </div>
                </form>
            </Form>

            {(confirmTitle || requireSignature || requireReason) && (
                <IndustrialConfirmDialog
                    isOpen={isConfirmOpen}
                    onClose={() => {
                        setIsConfirmOpen(false);
                        setPendingData(null);
                    }}
                    onConfirm={handleConfirm}
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

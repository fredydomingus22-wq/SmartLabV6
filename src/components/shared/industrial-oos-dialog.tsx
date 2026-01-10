"use client";

import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { AlertOctagon, AlertTriangle, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface IndustrialOOSDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (reason: string) => Promise<void>;
    measuredValue: string | number;
    specMin?: number | null;
    specMax?: number | null;
    unit?: string;
    productName?: string;
    testName?: string;
}

export function IndustrialOOSDialog({
    isOpen,
    onClose,
    onConfirm,
    measuredValue,
    specMin,
    specMax,
    unit = "",
    productName,
    testName
}: IndustrialOOSDialogProps) {
    const [reason, setReason] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleConfirm = async () => {
        if (!reason.trim() || reason.length < 10) {
            toast.error("Por favor, forneça uma justificação detalhada (mín. 10 caracteres).");
            return;
        }

        setIsSubmitting(true);
        try {
            await onConfirm(reason);
            // Don't close here, let parent handle it or close after success
        } catch (error) {
            console.error("OOS Confirm Error:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !isSubmitting && !open && onClose()}>
            <DialogContent className="sm:max-w-[500px] border-l-4 border-l-red-500">
                <DialogHeader>
                    <div className="flex items-center gap-2 text-red-600 mb-2">
                        <AlertOctagon className="h-6 w-6" />
                        <span className="font-bold text-lg tracking-tight">Resultado Fora de Especificação (OOS)</span>
                    </div>
                    <DialogTitle className="sr-only">Confirmar Resultado OOS</DialogTitle>
                    <DialogDescription className="text-slate-600 dark:text-slate-300">
                        O resultado inserido viola os limites de especificação estabelecidos.
                        Esta ocorrência será registada como um <strong>Desvio de Qualidade</strong>.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-6 py-4">
                    {/* Deviation Visualization */}
                    <div className="bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/50 rounded-lg p-4 space-y-3">
                        {(productName || testName) && (
                            <div className="flex justify-between text-xs text-slate-500 mb-2 border-b border-red-100 dark:border-red-900/50 pb-2">
                                <span>{productName}</span>
                                <span className="font-medium">{testName}</span>
                            </div>
                        )}

                        <div className="flex items-center justify-between">
                            <div className="text-center">
                                <span className="block text-xs uppercase tracking-wider text-slate-500">Mínimo</span>
                                <span className="font-mono text-sm font-semibold text-slate-700 dark:text-slate-300">
                                    {specMin !== undefined && specMin !== null ? specMin : "-"} {unit}
                                </span>
                            </div>

                            <div className="flex flex-col items-center px-4">
                                <span className="text-xs text-red-500 font-bold bg-red-100 dark:bg-red-900/50 px-2 py-0.5 rounded-full mb-1">
                                    Medido
                                </span>
                                <span className="text-3xl font-bold text-red-600 tracking-tighter">
                                    {measuredValue} <span className="text-sm font-normal text-red-400">{unit}</span>
                                </span>
                            </div>

                            <div className="text-center">
                                <span className="block text-xs uppercase tracking-wider text-slate-500">Máximo</span>
                                <span className="font-mono text-sm font-semibold text-slate-700 dark:text-slate-300">
                                    {specMax !== undefined && specMax !== null ? specMax : "-"} {unit}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Justification Field */}
                    <div className="grid gap-2">
                        <Label htmlFor="oos-reason" className="flex items-center gap-2">
                            Justificação Obrigatória
                            <span className="text-xs font-normal text-red-500">* Requer Auditoria</span>
                        </Label>
                        <Textarea
                            id="oos-reason"
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            placeholder="Descreva a causa provável, ações imediatas tomadas ou se é um erro de leitura..."
                            className="min-h-[100px] border-red-200 dark:border-red-900 focus-visible:ring-red-500"
                        />
                    </div>
                </div>

                <DialogFooter className="gap-2 sm:gap-0">
                    <Button
                        variant="ghost"
                        onClick={onClose}
                        disabled={isSubmitting}
                        className="hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                        Corrigir Valor
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={handleConfirm}
                        disabled={isSubmitting || !reason.trim()}
                        className="bg-red-600 hover:bg-red-700 shadow-lg shadow-red-500/20"
                    >
                        {isSubmitting ? "Registando..." : "Confirmar OOS"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

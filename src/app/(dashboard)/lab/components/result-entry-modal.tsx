"use client";

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { Loader2, AlertCircle } from "lucide-react";
import { getIndustrialExecutionContextAction } from "@/app/actions/lab_modules/execution";
import { IndustrialExecutionWizard } from "../samples/[id]/_components/IndustrialExecutionWizard";

interface ResultEntryModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    sampleId: string | null;
    onSuccess: () => void;
}

export function ResultEntryModal({ open, onOpenChange, sampleId, onSuccess }: ResultEntryModalProps) {
    const [loading, setLoading] = useState(false);
    const [context, setContext] = useState<{
        sample: any;
        analyses: any[];
        specs: Record<string, any>;
    } | null>(null);

    const fetchContext = useCallback(async (id: string) => {
        setLoading(true);
        try {
            const res = await getIndustrialExecutionContextAction(id);
            if (res.success && res.data) {
                setContext(res.data);
            } else {
                toast.error(res.message || "Erro ao carregar contexto da amostra.");
                onOpenChange(false);
            }
        } catch (error) {
            console.error(error);
            toast.error("Erro de comunicação.");
            onOpenChange(false);
        } finally {
            setLoading(false);
        }
    }, [onOpenChange]);

    useEffect(() => {
        if (open && sampleId) {
            fetchContext(sampleId);
        } else {
            setContext(null); // Reset on close
        }
    }, [open, sampleId, fetchContext]);

    // Internal handler to close wrapper when wizard finishes
    const handleWizardOpenChange = (isOpen: boolean) => {
        if (!isOpen) {
            onOpenChange(false);
            onSuccess();
        }
    };

    if (!open) return null;

    // Loading State
    if (loading || !context) {
        return (
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="max-w-md bg-slate-950 border-slate-800 flex flex-col items-center justify-center py-12 gap-4">
                    <DialogTitle className="sr-only">A carregar...</DialogTitle>
                    <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                    <p className="text-slate-400 font-medium animate-pulse">A carregar ambiente de execução...</p>
                </DialogContent>
            </Dialog>
        );
    }

    // Render Wizard directly
    // note: IndustrialExecutionWizard handles its own Dialog structure, but expects to be mounted.
    // However, IndustrialExecutionWizard renders a <Dialog> internally.
    // If we render <Dialog><IndustrialExecutionWizard /></Dialog> we might get nested dialogs issue if the wizard also has <Dialog>.
    // Let's check IndustrialExecutionWizard. Yes, it renders <Dialog open={open} ...>.
    // So we should just render the Wizard component and pass the props.

    return (
        <IndustrialExecutionWizard
            open={open}
            onOpenChange={handleWizardOpenChange} // Intercept close to trigger onSuccess
            analyses={context.analyses}
            specs={context.specs}
            sample={context.sample}
        />
    );
}

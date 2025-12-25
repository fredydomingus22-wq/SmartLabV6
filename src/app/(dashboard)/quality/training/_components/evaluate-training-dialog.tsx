"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle2, ClipboardCheck } from "lucide-react";
import { ActionForm } from "@/components/smart/action-form";
import { evaluateTrainingAction } from "@/app/actions/training";

interface EvaluateTrainingDialogProps {
    recordId: string;
    trainingTitle: string;
}

export function EvaluateTrainingDialog({ recordId, trainingTitle }: EvaluateTrainingDialogProps) {
    const [open, setOpen] = useState(false);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="h-7 text-xs text-amber-400 hover:bg-amber-500/10">
                    <ClipboardCheck className="h-3 w-3 mr-1" />
                    Avaliar Eficácia
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md glass">
                <DialogHeader>
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
                            <CheckCircle2 className="h-5 w-5" />
                        </div>
                        <div>
                            <DialogTitle>Avaliar Eficácia</DialogTitle>
                            <DialogDescription>
                                Avalie se a formação "{trainingTitle}" atingiu os objetivos pretendidos.
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <ActionForm
                    action={evaluateTrainingAction}
                    onSuccess={() => setOpen(false)}
                    submitText="Registar Avaliação"
                >
                    <input type="hidden" name="record_id" value={recordId} />

                    <div className="space-y-4">
                        <div className="grid gap-2">
                            <Label htmlFor="effectiveness_result">Resultado da Avaliação *</Label>
                            <Textarea
                                id="effectiveness_result"
                                name="effectiveness_result"
                                placeholder="ex: O formando demonstrou domínio das ferramentas no posto de trabalho..."
                                rows={4}
                                required
                                className="glass"
                            />
                        </div>
                        <p className="text-[10px] text-slate-500 italic">
                            Nota: A avaliação será registada com a data de hoje e assinada pelo utilizador atual.
                        </p>
                    </div>
                </ActionForm>
            </DialogContent>
        </Dialog>
    );
}

"use strict";
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { verifyCAPAEffectivenessAction } from "@/app/actions/qms_modules/capa";
import { Loader2, ShieldCheck, XCircle, CheckCircle2 } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";

interface VerifyEffectivenessDialogProps {
    capaId: string;
    capaDescription: string;
}

export function VerifyEffectivenessDialog({ capaId, capaDescription }: VerifyEffectivenessDialogProps) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [notes, setNotes] = useState("");
    const [isEffective, setIsEffective] = useState<"true" | "false">("true");

    async function handleSubmit() {
        if (!notes || notes.length < 10) {
            toast.error("Erro de validação: A justificação deve ter pelo menos 10 caracteres.");
            return;
        }

        setLoading(true);
        const formData = new FormData();
        formData.append("id", capaId);
        formData.append("is_effective", isEffective);
        formData.append("notes", notes);

        const result = await verifyCAPAEffectivenessAction(formData);

        if (result.success) {
            toast.success(result.message);
            setOpen(false);
            setNotes("");
        } else {
            toast.error(result.message);
        }
        setLoading(false);
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="h-7 text-[10px] uppercase font-bold tracking-widest gap-2 bg-emerald-500/5 text-emerald-600 border-emerald-500/20 hover:bg-emerald-500/10">
                    <ShieldCheck className="h-3 w-3" />
                    Verificar Eficácia
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] glass-dark border-white/10">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-xl">
                        <ShieldCheck className="h-5 w-5 text-emerald-400" />
                        Verificação de Eficácia
                    </DialogTitle>
                    <DialogDescription>
                        Avalie se a ação implementada eliminou a causa raiz e preveniu a recorrência.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    <div className="p-4 rounded-xl bg-white/5 border border-white/5 text-sm italic text-slate-400">
                        "{capaDescription}"
                    </div>

                    <div className="space-y-3">
                        <Label className="uppercase text-[10px] font-black tracking-widest text-slate-500">Resultado da Verificação</Label>
                        <RadioGroup defaultValue="true" onValueChange={(v) => setIsEffective(v as "true" | "false")} className="grid grid-cols-2 gap-4">
                            <div>
                                <RadioGroupItem value="true" id="effective" className="peer sr-only" />
                                <Label
                                    htmlFor="effective"
                                    className="flex flex-col items-center justify-between rounded-xl border-2 border-muted bg-transparent p-4 hover:bg-emerald-500/5 hover:text-emerald-500 peer-data-[state=checked]:border-emerald-500 peer-data-[state=checked]:text-emerald-500 cursor-pointer transition-all"
                                >
                                    <CheckCircle2 className="mb-2 h-6 w-6" />
                                    <span className="text-xs font-bold uppercase tracking-wide">Eficaz</span>
                                </Label>
                            </div>
                            <div>
                                <RadioGroupItem value="false" id="ineffective" className="peer sr-only" />
                                <Label
                                    htmlFor="ineffective"
                                    className="flex flex-col items-center justify-between rounded-xl border-2 border-muted bg-transparent p-4 hover:bg-rose-500/5 hover:text-rose-500 peer-data-[state=checked]:border-rose-500 peer-data-[state=checked]:text-rose-500 cursor-pointer transition-all"
                                >
                                    <XCircle className="mb-2 h-6 w-6" />
                                    <span className="text-xs font-bold uppercase tracking-wide">Ineficaz</span>
                                </Label>
                            </div>
                        </RadioGroup>
                    </div>

                    <div className="space-y-2">
                        <Label className="uppercase text-[10px] font-black tracking-widest text-slate-500">Evidências / Justificação</Label>
                        <Textarea
                            placeholder="Descreva as evidências observadas ou o motivo da falha..."
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            className="bg-black/20 border-white/10 min-h-[100px]"
                        />
                    </div>
                </div>

                <DialogFooter className="gap-2 sm:gap-0">
                    <Button variant="ghost" onClick={() => setOpen(false)} disabled={loading} className="text-slate-400 hover:text-slate-200">
                        Cancelar
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={loading}
                        className={cn("text-white font-bold uppercase tracking-widest text-xs", isEffective === "true" ? "bg-emerald-600 hover:bg-emerald-500" : "bg-rose-600 hover:bg-rose-500")}
                    >
                        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirmar Verificação"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ActionForm } from "@/components/smart/action-form";
import { acknowledgeDocumentReadingAction } from "@/app/actions/dms";
import { CheckCircle2, BookOpen, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

interface ReadingAcknowledgmentProps {
    versionId: string;
    hasRead: boolean;
}

export function ReadingAcknowledgment({ versionId, hasRead }: ReadingAcknowledgmentProps) {
    if (hasRead) {
        return (
            <div className="flex items-center gap-3 p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-2xl">
                <div className="p-2 rounded-full bg-emerald-500/10 text-emerald-400">
                    <CheckCircle2 className="h-5 w-5" />
                </div>
                <div>
                    <p className="text-sm font-bold text-emerald-400 uppercase tracking-tight">Leitura Confirmada</p>
                    <p className="text-xs text-slate-500">A sua assinatura eletrónica foi registada para esta versão.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-5 bg-amber-500/5 border border-amber-500/20 rounded-2xl space-y-4">
            <div className="flex gap-3">
                <div className="p-2 h-fit rounded-full bg-amber-500/10 text-amber-400">
                    <BookOpen className="h-5 w-5" />
                </div>
                <div>
                    <h4 className="text-sm font-bold text-amber-400 uppercase tracking-tight">Confirmação de Leitura Pendente</h4>
                    <p className="text-xs text-slate-500 leading-relaxed">
                        Como utilizador qualificado, deve ler este documento e confirmar a sua compreensão para manter a conformidade regulamentar.
                    </p>
                </div>
            </div>

            <ActionForm
                action={acknowledgeDocumentReadingAction}
                submitText="Assinar e Confirmar Leitura"
                onSuccess={() => toast.success("Assinatura registada com sucesso")}
            >
                <div className="space-y-3">
                    <input type="hidden" name="versionId" value={versionId} />
                    <div className="space-y-2">
                        <Label htmlFor="password" className="flex items-center gap-2 text-[10px] font-bold text-emerald-500 uppercase tracking-widest px-2 py-0.5 bg-emerald-500/10 rounded-md w-fit">
                            <ShieldCheck className="h-3 w-3" />
                            Assinatura Eletrónica
                        </Label>
                        <Input
                            type="password"
                            name="password"
                            placeholder="Introduza a sua password para assinar..."
                            className="glass text-center"
                            required
                        />
                    </div>
                </div>
            </ActionForm>
        </div>
    );
}

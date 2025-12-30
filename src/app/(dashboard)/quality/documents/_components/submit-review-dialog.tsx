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
import { Send, Users } from "lucide-react";
import { ActionForm } from "@/components/smart/action-form";
import { submitForReviewAction } from "@/app/actions/dms";
import { SearchableSelect } from "@/components/smart/searchable-select";

interface SubmitReviewDialogProps {
    versionId: string;
    approvers: any[];
}

export function SubmitReviewDialog({ versionId, approvers }: SubmitReviewDialogProps) {
    const [open, setOpen] = useState(false);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="border-amber-500/50 text-amber-500 hover:bg-amber-500/10">
                    <Send className="h-4 w-4 mr-2" />
                    Enviar para Revisão
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md glass border-slate-800">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5 text-amber-400" />
                        Iniciar Fluxo de Aprovação
                    </DialogTitle>
                    <DialogDescription>
                        Selecione os responsáveis que devem revisar e assinar esta versão.
                    </DialogDescription>
                </DialogHeader>

                <ActionForm
                    action={(formData) => {
                        const approverIds = formData.getAll("approver_ids") as string[];
                        return submitForReviewAction(versionId, approverIds);
                    }}
                    onSuccess={() => setOpen(false)}
                    submitText="Enviar para Revisão"
                >
                    <div className="space-y-4 py-4">
                        <div className="grid gap-2">
                            <Label>Responsáveis pela Aprovação *</Label>
                            <SearchableSelect
                                name="approver_ids"
                                options={approvers.map(u => ({ value: u.id, label: u.full_name || u.email }))}
                                placeholder="Selecione um aprovador..."
                            />
                            <p className="text-[10px] text-slate-500">
                                Estes utilizadores serão notificados para realizar a assinatura digital.
                            </p>
                        </div>
                    </div>
                </ActionForm>
            </DialogContent>
        </Dialog>
    );
}

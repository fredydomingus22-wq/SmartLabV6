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
import { Send, CheckCircle2 } from "lucide-react";
import { ActionForm } from "@/components/smart/action-form";
import { submitForReviewAction } from "@/app/actions/dms";
import { SearchableSelect } from "@/components/smart/searchable-select";
import { toast } from "sonner";

interface SubmitReviewDialogProps {
    versionId: string;
    approvers: any[];
}

export function SubmitReviewDialog({ versionId, approvers }: SubmitReviewDialogProps) {
    const [open, setOpen] = useState(false);
    const [selectedApprover, setSelectedApprover] = useState<string>("");

    const handleSubmit = async (formData: FormData) => {
        if (!selectedApprover) {
            return { success: false, error: "Deve selecionar um aprovador" };
        }

        const result = await submitForReviewAction(versionId, [selectedApprover]);
        if (result.success) {
            setOpen(false);
        }
        return {
            success: result.success,
            message: result.success ? "Submetido com sucesso!" : undefined,
            error: result.error
        };
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button size="sm" className="bg-amber-600 hover:bg-amber-500 text-white">
                    <Send className="mr-2 h-4 w-4" />
                    Submeter para Revisão
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md glass border-slate-800">
                <DialogHeader>
                    <DialogTitle>Enviar para Aprovação</DialogTitle>
                    <DialogDescription>
                        Selecione o responsável que irá rever e aprovar este documento.
                    </DialogDescription>
                </DialogHeader>

                <ActionForm
                    action={handleSubmit}
                    submitText="Enviar Agora"
                >
                    <div className="space-y-4 py-4">
                        <div className="grid gap-2">
                            <Label>Responsável pela Aprovação</Label>
                            <SearchableSelect
                                name="approver_id"
                                options={approvers.map(a => ({ value: a.id, label: a.full_name }))}
                                onValueChange={(val) => setSelectedApprover(val)}
                                placeholder="Pesquisar utilizador..."
                            />
                        </div>

                        <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800">
                            <p className="text-xs text-slate-400 leading-relaxed italic">
                                Ao submeter, o documento ficará bloqueado para edição até que o processo de revisão seja concluído.
                            </p>
                        </div>
                    </div>
                </ActionForm>
            </DialogContent>
        </Dialog>
    );
}

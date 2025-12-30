"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FileSignature, Loader2, UploadCloud } from "lucide-react";
import { createDocumentVersionAction } from "@/app/actions/dms";
import { toast } from "sonner";
import { FileUpload } from "@/components/smart/file-upload";
import { ActionForm } from "@/components/smart/action-form";

interface NewRevisionDialogProps {
    documentId: string;
    currentVersion: string;
}

export function NewRevisionDialog({ documentId, currentVersion }: NewRevisionDialogProps) {
    const [open, setOpen] = useState(false);

    // Sugerir próxima versão (ex: 1.0 -> 1.1 ou 2.0)
    const nextVersion = currentVersion ? (parseFloat(currentVersion) + 0.1).toFixed(1) : "1.0";

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/20">
                    <FileSignature className="mr-2 h-4 w-4" />
                    Nova Revisão
                </Button>
            </DialogTrigger>
            <DialogContent className="glass border-slate-800 bg-slate-950/80 backdrop-blur-xl sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="text-xl flex items-center gap-2">
                        <UploadCloud className="h-5 w-5 text-indigo-400" />
                        Carregar Nova Versão
                    </DialogTitle>
                    <DialogDescription className="text-slate-400">
                        Crie uma nova versão para este documento. A versão atual é <strong>{currentVersion}</strong>.
                    </DialogDescription>
                </DialogHeader>

                <ActionForm
                    action={createDocumentVersionAction}
                    onSuccess={() => setOpen(false)}
                    submitText="Criar Versão"
                >
                    <input type="hidden" name="document_id" value={documentId} />

                    <div className="space-y-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="version_number">Número da Versão *</Label>
                            <Input
                                id="version_number"
                                name="version_number"
                                defaultValue={nextVersion}
                                className="bg-black/20 border-white/10"
                                placeholder="ex: 1.1"
                                required
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="change_description">Descrição da Alteração *</Label>
                            <Textarea
                                id="change_description"
                                name="change_description"
                                className="bg-black/20 border-white/10 min-h-[100px]"
                                placeholder="Descreva o que mudou nesta versão..."
                                required
                            />
                        </div>

                        <FileUpload
                            name="file_path"
                            label="Documento (PDF/Word) *"
                            bucket="coa-documents"
                            folder="dms"
                        />
                    </div>
                </ActionForm>
            </DialogContent>
        </Dialog>
    );
}

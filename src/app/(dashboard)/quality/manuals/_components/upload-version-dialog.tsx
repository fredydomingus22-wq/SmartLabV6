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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Upload, Plus } from "lucide-react";
import { ActionForm } from "@/components/smart/action-form";
import { createDocumentVersionAction } from "@/app/actions/dms";
import { FileUpload } from "@/components/smart/file-upload";

interface UploadVersionDialogProps {
    documentId: string;
    lastVersion?: string;
    variant?: "default" | "link";
}

export function UploadVersionDialog({ documentId, lastVersion, variant = "default" }: UploadVersionDialogProps) {
    const [open, setOpen] = useState(false);

    // Sugerir próxima versão (ex: 1.0 -> 1.1 ou 2.0)
    const nextVersion = lastVersion ? (parseFloat(lastVersion) + 0.1).toFixed(1) : "1.0";

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {variant === "default" ? (
                    <Button variant="outline" className="border-slate-800 text-slate-300">
                        <Upload className="h-4 w-4 mr-2" />
                        Nova Versão
                    </Button>
                ) : (
                    <Button variant="link" className="text-emerald-400 p-0 h-auto">
                        Carregar primeira versão
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="max-w-md glass border-slate-800">
                <DialogHeader>
                    <DialogTitle>Carregar Nova Versão</DialogTitle>
                    <DialogDescription>
                        Adicione um novo ficheiro e descreva as alterações realizadas.
                    </DialogDescription>
                </DialogHeader>

                <ActionForm
                    action={createDocumentVersionAction}
                    onSuccess={() => setOpen(false)}
                    submitText="Guardar Versão"
                >
                    <input type="hidden" name="document_id" value={documentId} />

                    <div className="space-y-4">
                        <div className="grid gap-2">
                            <Label htmlFor="version_number">Número da Versão *</Label>
                            <Input
                                id="version_number"
                                name="version_number"
                                defaultValue={nextVersion}
                                required
                                className="glass"
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="change_description">Descrição das Alterações *</Label>
                            <Textarea
                                id="change_description"
                                name="change_description"
                                placeholder="O que mudou nesta versão?"
                                required
                                className="glass"
                            />
                        </div>

                        <FileUpload
                            name="file_path"
                            label="Documento (PDF/Word) *"
                            bucket="coa-documents" // Using existing bucket for now
                            folder="dms"
                        />
                    </div>
                </ActionForm>
            </DialogContent>
        </Dialog>
    );
}

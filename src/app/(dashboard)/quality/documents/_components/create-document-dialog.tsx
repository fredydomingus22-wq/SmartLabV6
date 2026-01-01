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
import { SearchableSelect } from "@/components/smart/searchable-select";
import { Plus } from "lucide-react";
import { ActionForm } from "@/components/smart/action-form";
import { createDocumentAction } from "@/app/actions/dms";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { FileUpload } from "@/components/smart/file-upload";

interface CreateDocumentDialogProps {
    categories: any[];
    plants: any[];
}

export function CreateDocumentDialog({ categories, plants }: CreateDocumentDialogProps) {
    const [open, setOpen] = useState(false);
    const [uploadInitial, setUploadInitial] = useState(false);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="glass-primary">
                    <Plus className="h-4 w-4 mr-2" />
                    Novo Documento
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-xl glass border-slate-800 max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Novo Contentor de Documento</DialogTitle>
                    <DialogDescription>
                        Crie o identificador mestre para o documento.
                    </DialogDescription>
                </DialogHeader>

                <ActionForm
                    action={createDocumentAction}
                    onSuccess={() => setOpen(false)}
                    submitText="Criar Documento"
                >
                    <div className="space-y-6">
                        <div className="space-y-4">
                            <div className="grid gap-2">
                                <Label htmlFor="title">Título do Documento *</Label>
                                <Input
                                    id="title"
                                    name="title"
                                    placeholder="ex: Procedimento de Higiene de Tanques"
                                    required
                                    className="glass"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="doc_number">Código Interno *</Label>
                                    <Input
                                        id="doc_number"
                                        name="doc_number"
                                        placeholder="ex: SOP-QA-001"
                                        required
                                        className="glass"
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="category_id">Categoria *</Label>
                                    <SearchableSelect
                                        name="category_id"
                                        options={categories.map(c => ({ value: c.id, label: `${c.code} - ${c.name}` }))}
                                        placeholder="Selecionar categoria..."
                                    />
                                </div>
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="plant_id">Unidade / Planta *</Label>
                                <SearchableSelect
                                    name="plant_id"
                                    options={plants.map(p => ({ value: p.id, label: p.name }))}
                                    placeholder="Selecionar unidade..."
                                />
                            </div>
                        </div>

                        <div className="border-t border-slate-800 pt-4 space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label className="text-base text-amber-200">Requer Formação?</Label>
                                    <p className="text-xs text-slate-400">
                                        Bloqueia a publicação até que a formação seja concluída.
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Switch
                                        name="requires_training_toggle"
                                        defaultChecked={false}
                                        onCheckedChange={(checked) => {
                                            const input = document.getElementById("requires_training_input") as HTMLInputElement;
                                            if (input) input.value = checked ? "true" : "false";
                                        }}
                                    />
                                    <input type="hidden" id="requires_training_input" name="requires_training" defaultValue="false" />
                                </div>
                            </div>

                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label className="text-base">Carregar versão inicial?</Label>
                                    <p className="text-xs text-slate-400">
                                        Adicionar logo a primeira versão (v1.0) do documento.
                                    </p>
                                </div>
                                <Switch
                                    checked={uploadInitial}
                                    onCheckedChange={setUploadInitial}
                                />
                            </div>

                            {uploadInitial && (
                                <div className="space-y-4 pl-4 border-l-2 border-slate-800 animate-in slide-in-from-left-2 fade-in">
                                    <div className="grid gap-2">
                                        <Label htmlFor="initial_version_number">Versão Inicial</Label>
                                        <Input
                                            id="initial_version_number"
                                            name="initial_version_number"
                                            defaultValue="1.0"
                                            className="glass w-24"
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="initial_version_description">Descrição</Label>
                                        <Textarea
                                            id="initial_version_description"
                                            name="initial_version_description"
                                            defaultValue="Versão Inicial"
                                            className="glass resize-none h-20"
                                        />
                                    </div>
                                    <FileUpload
                                        name="initial_version_file_path"
                                        label="Ficheiro (PDF/Word)"
                                        bucket="coa-documents"
                                        folder="dms"
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                </ActionForm>
            </DialogContent>
        </Dialog >
    );
}

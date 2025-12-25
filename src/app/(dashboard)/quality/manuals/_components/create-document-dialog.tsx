"use client";

import { useState, useEffect } from "react";
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

interface CreateDocumentDialogProps {
    categories: any[];
    plants: any[];
}

export function CreateDocumentDialog({ categories, plants }: CreateDocumentDialogProps) {
    const [open, setOpen] = useState(false);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="glass-primary">
                    <Plus className="h-4 w-4 mr-2" />
                    Novo Documento
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md glass border-slate-800">
                <DialogHeader>
                    <DialogTitle>Novo Contentor de Documento</DialogTitle>
                    <DialogDescription>
                        Crie o identificador mestre para o documento. As versões serão adicionadas posteriormente.
                    </DialogDescription>
                </DialogHeader>

                <ActionForm
                    action={createDocumentAction}
                    onSuccess={() => setOpen(false)}
                    submitText="Criar Documento"
                >
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

                        <div className="grid gap-2">
                            <Label htmlFor="plant_id">Unidade / Planta *</Label>
                            <SearchableSelect
                                name="plant_id"
                                options={plants.map(p => ({ value: p.id, label: p.name }))}
                                placeholder="Selecionar unidade..."
                            />
                        </div>
                    </div>
                </ActionForm>
            </DialogContent>
        </Dialog>
    );
}

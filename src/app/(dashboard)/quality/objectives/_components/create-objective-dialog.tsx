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
import { SearchableSelect } from "@/components/smart/searchable-select";
import { Plus, Target } from "lucide-react";
import { ActionForm } from "@/components/smart/action-form";
import { createObjectiveAction } from "@/app/actions/objectives";

interface CreateObjectiveDialogProps {
    users: { id: string; full_name: string }[];
}

export function CreateObjectiveDialog({ users }: CreateObjectiveDialogProps) {
    const [open, setOpen] = useState(false);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="glass-primary">
                    <Plus className="h-4 w-4 mr-2" />
                    Novo Objetivo
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto glass">
                <DialogHeader>
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
                            <Target className="h-5 w-5" />
                        </div>
                        <div>
                            <DialogTitle>Definir Objetivo de Qualidade</DialogTitle>
                            <DialogDescription>
                                Estabeleça um objetivo mensurável e alinhado com a política da qualidade.
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <ActionForm
                    action={createObjectiveAction}
                    onSuccess={() => setOpen(false)}
                    submitText="Criar Objetivo"
                >
                    <div className="space-y-4">
                        <div className="grid gap-2">
                            <Label htmlFor="title">Título do Objetivo *</Label>
                            <Input
                                id="title"
                                name="title"
                                placeholder="ex: Reduzir não conformidades em 15%"
                                required
                                className="glass"
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="description">Descrição</Label>
                            <Textarea
                                id="description"
                                name="description"
                                placeholder="Detalhes sobre como este objetivo será alcançado..."
                                rows={2}
                                className="glass"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="category">Categoria *</Label>
                                <SearchableSelect
                                    name="category"
                                    defaultValue="process"
                                    options={[
                                        { value: "process", label: "Processo" },
                                        { value: "customer", label: "Cliente" },
                                        { value: "product", label: "Produto" },
                                        { value: "compliance", label: "Conformidade" },
                                        { value: "financial", label: "Financeiro" },
                                        { value: "people", label: "Pessoas" },
                                    ]}
                                    placeholder="Selecionar..."
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="owner_id">Responsável</Label>
                                <SearchableSelect
                                    name="owner_id"
                                    options={users.map(u => ({ value: u.id, label: u.full_name }))}
                                    placeholder="Selecionar..."
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="target_value">Meta *</Label>
                                <Input
                                    id="target_value"
                                    name="target_value"
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    placeholder="ex: 95"
                                    required
                                    className="glass"
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="current_value">Valor Atual</Label>
                                <Input
                                    id="current_value"
                                    name="current_value"
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    defaultValue="0"
                                    className="glass"
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="unit">Unidade *</Label>
                                <SearchableSelect
                                    name="unit"
                                    defaultValue="%"
                                    options={[
                                        { value: "%", label: "Percentagem (%)" },
                                        { value: "count", label: "Contagem" },
                                        { value: "days", label: "Dias" },
                                        { value: "hours", label: "Horas" },
                                        { value: "score", label: "Pontuação" },
                                    ]}
                                    placeholder="Selecionar..."
                                />
                            </div>
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="target_date">Data Alvo</Label>
                            <Input
                                id="target_date"
                                name="target_date"
                                type="date"
                                className="glass text-white [color-scheme:dark]"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="resources_required">Recursos Necessários</Label>
                                <Textarea
                                    id="resources_required"
                                    name="resources_required"
                                    placeholder="ex: Verba para formação, Software X..."
                                    rows={2}
                                    className="glass"
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="evaluation_method">Método de Avaliação</Label>
                                <Textarea
                                    id="evaluation_method"
                                    name="evaluation_method"
                                    placeholder="ex: Auditoria interna trimestral..."
                                    rows={2}
                                    className="glass"
                                />
                            </div>
                        </div>
                    </div>
                </ActionForm>

            </DialogContent>
        </Dialog>
    );
}

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
import { Plus } from "lucide-react";
import { ActionForm } from "@/components/smart/action-form";
import { createNCAction } from "@/app/actions/qms";

export function CreateNCDialog({ users }: { users: { id: string, full_name: string | null, role: string }[] }) {
    const [open, setOpen] = useState(false);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="glass-primary">
                    <Plus className="h-4 w-4 mr-2" />
                    Nova Não Conformidade
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto glass">
                <DialogHeader>
                    <DialogTitle className="text-xl font-black italic uppercase tracking-tight">Registar Não Conformidade</DialogTitle>
                    <DialogDescription className="text-xs text-slate-500 italic">
                        Identificação e abertura formal de uma ocorrência no SGQ.
                    </DialogDescription>
                </DialogHeader>

                <ActionForm
                    action={createNCAction}
                    onSuccess={() => setOpen(false)}
                    submitText="Criar NC"
                >
                    <div className="space-y-4">
                        {/* Plant ID is now obtained automatically from user profile */}

                        <div className="grid gap-2">
                            <Label htmlFor="title" className="text-[10px] font-black uppercase tracking-widest text-slate-400 italic">Designação / Título *</Label>
                            <Input
                                id="title"
                                name="title"
                                placeholder="Identificação sucinta da ocorrência"
                                required
                                className="glass"
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="description" className="text-[10px] font-black uppercase tracking-widest text-slate-400 italic">Descrição Técnica *</Label>
                            <Textarea
                                id="description"
                                name="description"
                                placeholder="Evidências e detalhes da ocorrência (O Quê, Onde, Como)..."
                                rows={3}
                                required
                                className="glass"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="nc_type">Tipo</Label>
                                <SearchableSelect
                                    name="nc_type"
                                    defaultValue="internal"
                                    options={[
                                        { value: "internal", label: "Interna" },
                                        { value: "supplier", label: "Fornecedor" },
                                        { value: "customer", label: "Reclamação de Cliente" },
                                        { value: "audit", label: "Resultado de Auditoria" },
                                    ]}
                                    placeholder="Selecionar tipo..."
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="severity">Gravidade</Label>
                                <SearchableSelect
                                    name="severity"
                                    defaultValue="minor"
                                    options={[
                                        { value: "minor", label: "Menor" },
                                        { value: "major", label: "Maior" },
                                        { value: "critical", label: "Crítica" },
                                    ]}
                                    placeholder="Selecionar gravidade..."
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="category">Categoria</Label>
                                <SearchableSelect
                                    name="category"
                                    options={[
                                        { value: "product", label: "Produto" },
                                        { value: "process", label: "Processo" },
                                        { value: "documentation", label: "Documentação" },
                                        { value: "equipment", label: "Equipamento" },
                                        { value: "packaging", label: "Embalagem" },
                                        { value: "hygiene", label: "Higiene" },
                                        { value: "other", label: "Outra" },
                                    ]}
                                    placeholder="Selecionar categoria"
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="source_reference">Referência de Origem</Label>
                                <Input
                                    id="source_reference"
                                    name="source_reference"
                                    placeholder="ex: Lote PB-2025-101"
                                    className="glass"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="detected_date">Data de Deteção</Label>
                                <Input
                                    id="detected_date"
                                    name="detected_date"
                                    type="date"
                                    defaultValue={new Date().toISOString().split("T")[0]}
                                    className="glass text-white [color-scheme:dark]"
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="due_date">Data Limite</Label>
                                <Input
                                    id="due_date"
                                    name="due_date"
                                    type="date"
                                    className="glass text-white [color-scheme:dark]"
                                />
                            </div>
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="responsible_id" className="text-[10px] font-black uppercase tracking-widest text-slate-400 italic">Responsável pela Resolução</Label>
                            <SearchableSelect
                                name="responsible_id"
                                options={users.map(u => ({
                                    value: u.id,
                                    label: `${u.full_name || 'Sem Nome'} (${u.role})`
                                }))}
                                placeholder="Atribuir a colaborador..."
                            />
                            <p className="text-[10px] text-slate-600 italic">
                                A atribuição gera uma tarefa automática na workstation do colaborador.
                            </p>
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="notes">Notas</Label>
                            <Textarea
                                id="notes"
                                name="notes"
                                placeholder="Notas adicionais..."
                                rows={2}
                                className="glass"
                            />
                        </div>
                    </div>
                </ActionForm>
            </DialogContent>
        </Dialog>
    );
}


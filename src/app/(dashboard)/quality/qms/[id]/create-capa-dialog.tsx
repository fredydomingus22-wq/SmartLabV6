"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
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
import { createCAPAAction } from "@/app/actions/qms";

interface CreateCAPADialogProps {
    ncId?: string;
    users: { id: string; full_name: string; role: string }[];
}

export function CreateCAPADialog({ ncId, users }: CreateCAPADialogProps) {
    const [open, setOpen] = useState(false);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button size="sm" className="glass-primary">
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar CAPA
                </Button>
            </DialogTrigger>

            <DialogContent className="max-w-lg glass">
                <DialogHeader>
                    <DialogTitle>Criar Ação CAPA</DialogTitle>
                    <DialogDescription>
                        Adicionar uma ação corretiva ou preventiva
                    </DialogDescription>
                </DialogHeader>


                <ActionForm
                    action={createCAPAAction}
                    onSuccess={() => setOpen(false)}
                    submitText="Criar Ação"
                >
                    <div className="space-y-4 pt-4">
                        {/* Hidden fields */}
                        <input type="hidden" name="plant_id" value="00000000-0000-0000-0000-000000000000" />
                        {ncId && <input type="hidden" name="nonconformity_id" value={ncId} />}

                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="action_type">Tipo de Ação</Label>
                                <SearchableSelect
                                    name="action_type"
                                    defaultValue="corrective"
                                    options={[
                                        { value: "containment", label: "Contenção" },
                                        { value: "corrective", label: "Corretiva" },
                                        { value: "preventive", label: "Preventiva" },
                                    ]}
                                    placeholder="Selecione o tipo"
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="priority">Prioridade</Label>
                                <SearchableSelect
                                    name="priority"
                                    defaultValue="medium"
                                    options={[
                                        { value: "low", label: "Baixa" },
                                        { value: "medium", label: "Média" },
                                        { value: "high", label: "Alta" },
                                        { value: "critical", label: "Crítica" },
                                    ]}
                                    placeholder="Prioridade"
                                />
                            </div>
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="responsible_id">Responsável pela Ação</Label>
                            <SearchableSelect
                                name="responsible_id"
                                options={users.map(u => ({ value: u.id, label: `${u.full_name} (${u.role})` }))}
                                placeholder="Selecione um responsável"
                            />
                        </div>


                        <div className="grid gap-2">
                            <Label htmlFor="description">Descrição *</Label>
                            <Textarea
                                id="description"
                                name="description"
                                placeholder="Descreva a ação a ser tomada..."
                                rows={3}
                                required
                                className="glass"
                            />
                        </div>


                        <div className="grid gap-2">
                            <Label htmlFor="root_cause">Causa Raiz (se conhecida)</Label>
                            <Textarea
                                id="root_cause"
                                name="root_cause"
                                placeholder="Qual é a causa raiz deste problema?"
                                rows={2}
                                className="glass"
                            />
                        </div>


                        <div className="grid grid-cols-2 gap-4 pb-2">
                            <div className="grid gap-2">
                                <Label htmlFor="planned_date">Prazo de Conclusão</Label>
                                <Input
                                    id="planned_date"
                                    name="planned_date"
                                    type="date"
                                    className="glass text-white [color-scheme:dark]"
                                />
                            </div>

                            <div className="flex items-center justify-between p-3 rounded-xl bg-amber-500/5 border border-amber-500/10">
                                <div className="space-y-0.5">
                                    <Label className="text-xs text-amber-200">Requer Formação?</Label>
                                    <p className="text-[10px] text-slate-400">Bloqueia a conclusão até que a formação seja registada.</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Switch
                                        onCheckedChange={(checked) => {
                                            const input = document.getElementById("training_required_input") as HTMLInputElement;
                                            if (input) input.value = checked ? "true" : "false";
                                        }}
                                    />
                                    <input type="hidden" id="training_required_input" name="training_required" defaultValue="false" />
                                </div>
                            </div>
                        </div>

                    </div>
                </ActionForm>
            </DialogContent>
        </Dialog>
    );
}

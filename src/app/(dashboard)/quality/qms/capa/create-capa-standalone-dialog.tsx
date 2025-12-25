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
import { createCAPAAction } from "@/app/actions/qms";

export function CreateCAPADialog() {
    const [open, setOpen] = useState(false);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="glass-primary">
                    <Plus className="h-4 w-4 mr-2" />
                    Nova CAPA
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg glass">
                <DialogHeader>
                    <DialogTitle>Criar Ação CAPA</DialogTitle>
                    <DialogDescription>
                        Criar uma nova Ação Corretiva ou Preventiva
                    </DialogDescription>
                </DialogHeader>

                <ActionForm
                    action={createCAPAAction}
                    onSuccess={() => setOpen(false)}
                    submitText="Criar CAPA"
                >
                    <div className="space-y-4 pt-4">
                        <div className="grid gap-2">
                            <Label htmlFor="action_type">Tipo de Ação *</Label>
                            <SearchableSelect
                                name="action_type"
                                defaultValue="corrective"
                                options={[
                                    { value: "containment", label: "Contenção" },
                                    { value: "corrective", label: "Corretiva" },
                                    { value: "preventive", label: "Preventiva" },
                                ]}
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
                            <Label htmlFor="root_cause">Causa Raiz</Label>
                            <Textarea
                                id="root_cause"
                                name="root_cause"
                                placeholder="Causa raiz identificada..."
                                rows={2}
                                className="glass"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
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
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="planned_date">Data Limite</Label>
                                <Input
                                    id="planned_date"
                                    name="planned_date"
                                    type="date"
                                    className="glass text-white [color-scheme:dark]"
                                />
                            </div>
                        </div>
                    </div>
                </ActionForm>
            </DialogContent>
        </Dialog>
    );
}




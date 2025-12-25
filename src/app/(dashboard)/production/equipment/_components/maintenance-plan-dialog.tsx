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
import { Plus, Loader2 } from "lucide-react";
import { ActionForm } from "@/components/smart/action-form";
import { SearchableSelect } from "@/components/smart/searchable-select";
import { createMaintenancePlanAction } from "@/app/actions/metrology";

interface MaintenancePlanDialogProps {
    equipmentId: string;
}

export function MaintenancePlanDialog({ equipmentId }: MaintenancePlanDialogProps) {
    const [open, setOpen] = useState(false);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button size="sm" variant="outline" className="border-slate-800">
                    <Plus className="h-4 w-4 mr-2" />
                    Novo Plano
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md glass border-slate-800">
                <DialogHeader>
                    <DialogTitle>Criar Plano de Manutenção</DialogTitle>
                    <DialogDescription>
                        Defina uma tarefa recorrente para este equipamento.
                    </DialogDescription>
                </DialogHeader>

                <ActionForm
                    action={createMaintenancePlanAction}
                    onSuccess={() => setOpen(false)}
                    submitText="Criar Plano"
                >
                    <input type="hidden" name="equipment_id" value={equipmentId} />

                    <div className="space-y-4">
                        <div className="grid gap-2">
                            <Label htmlFor="title">Título do Plano *</Label>
                            <Input
                                id="title"
                                name="title"
                                placeholder="ex: Limpeza Mensal de Sensores"
                                required
                                className="glass"
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="description">Descrição das Tarefas</Label>
                            <Textarea
                                id="description"
                                name="description"
                                placeholder="Descreva os passos técnicos..."
                                className="glass"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="frequency_value">Intervallo (Frequência) *</Label>
                                <Input
                                    id="frequency_value"
                                    name="frequency_value"
                                    type="number"
                                    placeholder="ex: 30"
                                    required
                                    className="glass"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="frequency_unit">Unidade *</Label>
                                <SearchableSelect
                                    name="frequency_unit"
                                    options={[
                                        { value: "days", label: "Dias" },
                                        { value: "weeks", label: "Semanas" },
                                        { value: "months", label: "Meses" },
                                        { value: "years", label: "Anos" },
                                    ]}
                                    placeholder="Unidade..."
                                />
                            </div>
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="last_performed_at">Última Execução (Opcional)</Label>
                            <Input
                                id="last_performed_at"
                                name="last_performed_at"
                                type="date"
                                className="glass"
                            />
                        </div>
                    </div>
                </ActionForm>
            </DialogContent>
        </Dialog>
    );
}

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
import { Plus, Clock } from "lucide-react";
import { ActionForm } from "@/components/smart/action-form";
import { createShiftAction } from "@/app/actions/training";
import { SearchableSelect } from "@/components/smart/searchable-select";

interface CreateShiftDialogProps {
    plants: any[];
}

export function CreateShiftDialog({ plants }: CreateShiftDialogProps) {
    const [open, setOpen] = useState(false);
    const plantOptions = plants.map(p => ({ label: p.name, value: p.id }));

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button size="sm" variant="outline" className="border-slate-800 h-8">
                    <Plus className="h-4 w-4 mr-1" />
                    Novo Turno
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md glass border-slate-800">
                <DialogHeader>
                    <DialogTitle>Configurar Novo Turno</DialogTitle>
                    <DialogDescription>
                        Defina o horário operacional para controlo de presença.
                    </DialogDescription>
                </DialogHeader>

                <ActionForm
                    action={createShiftAction}
                    onSuccess={() => setOpen(false)}
                    submitText="Guardar Turno"
                >
                    <div className="space-y-4">
                        <div className="grid gap-2">
                            <Label htmlFor="name">Nome do Turno *</Label>
                            <Input id="name" name="name" placeholder="Ex: Turno A (Manhã)" required className="glass" />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="start_time">Hora de Início *</Label>
                                <Input id="start_time" name="start_time" type="time" required className="glass" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="end_time">Hora de Fim *</Label>
                                <Input id="end_time" name="end_time" type="time" required className="glass" />
                            </div>
                        </div>

                        <div className="grid gap-2">
                            <Label>Planta / Unidade *</Label>
                            <SearchableSelect
                                name="plant_id"
                                options={plantOptions}
                                placeholder="Selecionar Planta..."
                                required
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="description">Notas Adicionais</Label>
                            <Input id="description" name="description" placeholder="Ex: 8h de trabalho + 1h almoço" className="glass" />
                        </div>
                    </div>
                </ActionForm>
            </DialogContent>
        </Dialog>
    );
}

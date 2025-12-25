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
import { Plus } from "lucide-react";
import { ActionForm } from "@/components/smart/action-form";
import { createTeamAction } from "@/app/actions/training";
import { SearchableSelect } from "@/components/smart/searchable-select";
import { Textarea } from "@/components/ui/textarea";

interface CreateTeamDialogProps {
    users: any[];
    plants: any[];
}

export function CreateTeamDialog({ users, plants }: CreateTeamDialogProps) {
    const [open, setOpen] = useState(false);

    const userOptions = users.map(u => ({ label: u.full_name, value: u.id }));
    const plantOptions = plants.map(p => ({ label: p.name, value: p.id }));

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button size="sm" variant="outline" className="border-slate-800 h-8">
                    <Plus className="h-4 w-4 mr-1" />
                    Nova Equipa
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md glass border-slate-800">
                <DialogHeader>
                    <DialogTitle>Criar Nova Equipa</DialogTitle>
                    <DialogDescription>
                        Agrupe colaboradores em equipas operacionais ou turnos.
                    </DialogDescription>
                </DialogHeader>

                <ActionForm
                    action={createTeamAction}
                    onSuccess={() => setOpen(false)}
                    submitText="Criar Equipa"
                >
                    <div className="space-y-4">
                        <div className="grid gap-2">
                            <Label htmlFor="name">Nome da Equipa *</Label>
                            <Input id="name" name="name" placeholder="Ex: Laboratório Manhã" required className="glass" />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="description">Descrição / Notas</Label>
                            <Textarea id="description" name="description" className="glass h-20" />
                        </div>

                        <div className="grid gap-2">
                            <Label>Supervisor Responsável</Label>
                            <SearchableSelect
                                name="supervisor_id"
                                options={userOptions}
                                placeholder="Selecionar Supervisor..."
                            />
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
                    </div>
                </ActionForm>
            </DialogContent>
        </Dialog>
    );
}

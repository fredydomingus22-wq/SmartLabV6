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
import { UserPlus, Plus } from "lucide-react";
import { ActionForm } from "@/components/smart/action-form";
import { createEmployeeAction } from "@/app/actions/training";
import { SearchableSelect } from "@/components/smart/searchable-select";

interface CreateEmployeeDialogProps {
    teams: any[];
    users: any[];
    plants: any[];
}

export function CreateEmployeeDialog({ teams, users, plants }: CreateEmployeeDialogProps) {
    const [open, setOpen] = useState(false);

    const teamOptions = teams.map(t => ({ label: t.name, value: t.id }));
    const userOptions = users.map(u => ({ label: u.full_name, value: u.id }));
    const plantOptions = plants.map(p => ({ label: p.name, value: p.id }));

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="bg-emerald-600 hover:bg-emerald-500 text-white">
                    <UserPlus className="mr-2 h-4 w-4" />
                    Registar Funcionário
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md glass border-slate-800">
                <DialogHeader>
                    <DialogTitle>Registar Novo Funcionário</DialogTitle>
                    <DialogDescription>
                        Introduza os dados base do colaborador para o sistema de competências.
                    </DialogDescription>
                </DialogHeader>

                <ActionForm
                    action={createEmployeeAction}
                    onSuccess={() => setOpen(false)}
                    submitText="Guardar Funcionário"
                >
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="employee_id">ID Interno *</Label>
                                <Input id="employee_id" name="employee_id" placeholder="EX: 4500" required className="glass" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="full_name">Nome Completo *</Label>
                                <Input id="full_name" name="full_name" required className="glass" />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="position">Cargo / Função</Label>
                                <Input id="position" name="position" placeholder="Analista Lab" className="glass" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="department">Departamento</Label>
                                <Input id="department" name="department" placeholder="Laboratório" className="glass" />
                            </div>
                        </div>

                        <div className="grid gap-2">
                            <Label>Equipa</Label>
                            <SearchableSelect
                                name="team_id"
                                options={teamOptions}
                                placeholder="Selecionar Equipa..."
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label>Utilizador Associado (Opcional)</Label>
                            <SearchableSelect
                                name="user_id"
                                options={userOptions}
                                placeholder="Vincular a conta de utilizador..."
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

                        <div className="grid gap-2">
                            <Label htmlFor="hiring_date">Data de Admissão</Label>
                            <Input id="hiring_date" name="hiring_date" type="date" className="glass" />
                        </div>
                    </div>
                </ActionForm>
            </DialogContent>
        </Dialog>
    );
}

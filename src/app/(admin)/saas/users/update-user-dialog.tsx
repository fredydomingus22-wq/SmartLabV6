"use client";

import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { ActionForm } from "@/components/smart/action-form";
import { updateGlobalUserAction } from "@/app/actions/admin/users";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import { User, Edit, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";

interface UpdateUserDialogProps {
    user: {
        id: string;
        full_name: string;
        role: string;
        organization_id: string;
        plant_id?: string;
    };
    organizations?: any[];
    plants?: any[];
    trigger?: React.ReactNode;
}

export function UpdateUserDialog({ user, organizations = [], plants = [], trigger }: UpdateUserDialogProps) {
    const [open, setOpen] = useState(false);
    const [selectedOrg, setSelectedOrg] = useState<string>(user.organization_id);

    // Filter plants based on selected org (or initial org if not changed)
    const activeOrg = organizations.find(o => o.id === selectedOrg);
    const availablePlants = activeOrg?.plants || plants || [];

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-blue-400">
                        <Edit className="h-4 w-4" />
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[450px] bg-slate-950 border-slate-800 text-slate-100">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <User className="h-5 w-5 text-blue-400" />
                        Editar Utilizador Global
                    </DialogTitle>
                </DialogHeader>

                <ActionForm
                    action={updateGlobalUserAction}
                    submitText="Guardar Alterações"
                    onSuccess={() => setOpen(false)}
                >
                    <input type="hidden" name="user_id" value={user.id} />

                    <div className="space-y-4 py-4">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="edit-full_name">Nome Completo</Label>
                                <Input id="edit-full_name" name="full_name" defaultValue={user.full_name} required className="bg-slate-900 border-slate-800" />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="edit-organization_id">Organização</Label>
                                <Select
                                    name="organization_id"
                                    defaultValue={user.organization_id}
                                    onValueChange={setSelectedOrg}
                                >
                                    <SelectTrigger className="bg-slate-900 border-slate-800">
                                        <SelectValue placeholder="Selecionar Empresa..." />
                                    </SelectTrigger>
                                    <SelectContent className="bg-slate-900 border-slate-800 text-slate-100">
                                        {organizations.map((o: any) => (
                                            <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="edit-plant_id">Unidade (Contexto)</Label>
                                <Select name="plant_id" defaultValue={user.plant_id || "no_plant"}>
                                    <SelectTrigger className="bg-slate-900 border-slate-800">
                                        <SelectValue placeholder="Planta..." />
                                    </SelectTrigger>
                                    <SelectContent className="bg-slate-900 border-slate-800 text-slate-100">
                                        <SelectItem value="no_plant">Nenhuma (Global na Org)</SelectItem>
                                        {availablePlants.map((p: any) => (
                                            <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="edit-role">Função (Role)</Label>
                                <Select name="role" defaultValue={user.role}>
                                    <SelectTrigger className="bg-slate-900 border-slate-800">
                                        <SelectValue placeholder="Cargo..." />
                                    </SelectTrigger>
                                    <SelectContent className="bg-slate-900 border-slate-800 text-slate-100">
                                        <SelectItem value="system_owner">Owner Global</SelectItem>
                                        <SelectItem value="admin">Administrador (Org)</SelectItem>
                                        <SelectItem value="qa_manager">Gestor Qualidade</SelectItem>
                                        <SelectItem value="lab_analyst">Analista Lab (FQ)</SelectItem>
                                        <SelectItem value="micro_analyst">Analista Micro</SelectItem>
                                        <SelectItem value="analyst">Analista Geral</SelectItem>
                                        <SelectItem value="operator">Operador</SelectItem>
                                        <SelectItem value="auditor">Auditor</SelectItem>
                                        <SelectItem value="quality">Equipa Qualidade</SelectItem>
                                        <SelectItem value="haccp">Equipa HACCP</SelectItem>
                                        <SelectItem value="warehouse">Armazém / Logística</SelectItem>
                                        <SelectItem value="lab_tech">Lab Tech (Legacy)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>
                </ActionForm>
            </DialogContent>
        </Dialog>
    );
}

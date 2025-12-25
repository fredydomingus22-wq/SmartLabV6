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
import { createGlobalUserAction } from "@/app/actions/admin/users";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import { UserPlus, AtSign, Shield, Building2 } from "lucide-react";

export function CreateGlobalUserDialog({
    children,
    tenants: organizations
}: {
    children: React.ReactNode,
    tenants: any[]
}) {
    const [open, setOpen] = useState(false);
    const [selectedOrg, setSelectedOrg] = useState<string>("");

    // Filter plants for the selected organization
    const activeOrg = organizations.find(o => o.id === selectedOrg);
    const plants = activeOrg?.plants || [];

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {children}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[450px] bg-slate-950 border-slate-800 text-slate-100">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <UserPlus className="h-5 w-5 text-blue-400" />
                        Criar Utilizador Global
                    </DialogTitle>
                </DialogHeader>

                <ActionForm
                    action={createGlobalUserAction}
                    submitText="Criar Utilizador"
                    onSuccess={() => setOpen(false)}
                >
                    <div className="space-y-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2 col-span-2">
                                <Label htmlFor="full_name">Nome Completo</Label>
                                <Input id="full_name" name="full_name" required className="bg-slate-900 border-slate-800" />
                            </div>

                            <div className="space-y-2 col-span-2">
                                <Label htmlFor="email">Email</Label>
                                <div className="relative">
                                    <AtSign className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                                    <Input id="email" name="email" type="email" required className="pl-9 bg-slate-900 border-slate-800" />
                                </div>
                            </div>

                            <div className="space-y-2 col-span-2">
                                <Label htmlFor="password">Password Inicial</Label>
                                <Input id="password" name="password" type="password" required className="bg-slate-900 border-slate-800" />
                            </div>

                            <div className="space-y-2 col-span-2">
                                <Label htmlFor="organization_id">Organização</Label>
                                <Select
                                    name="organization_id"
                                    required
                                    onValueChange={setSelectedOrg}
                                >
                                    <SelectTrigger className="bg-slate-900 border-slate-800">
                                        <SelectValue placeholder="Selecionar Empresa..." />
                                    </SelectTrigger>
                                    <SelectContent className="bg-slate-900 border-slate-800 text-slate-100">
                                        {organizations.map(o => (
                                            <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="plant_id">Unidade (Opcional)</Label>
                                <Select name="plant_id">
                                    <SelectTrigger className="bg-slate-900 border-slate-800">
                                        <SelectValue placeholder="Planta..." />
                                    </SelectTrigger>
                                    <SelectContent className="bg-slate-900 border-slate-800 text-slate-100">
                                        <SelectItem value="">Nenhuma (Global na Org)</SelectItem>
                                        {plants.map((p: any) => (
                                            <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="role">Função (Role)</Label>
                                <Select name="role" defaultValue="lab_tech">
                                    <SelectTrigger className="bg-slate-900 border-slate-800">
                                        <SelectValue placeholder="Cargo..." />
                                    </SelectTrigger>
                                    <SelectContent className="bg-slate-900 border-slate-800 text-slate-100">
                                        <SelectItem value="system_owner">Owner Global</SelectItem>
                                        <SelectItem value="admin">Administrador (Org)</SelectItem>
                                        <SelectItem value="qa_manager">Gestor Qualidade</SelectItem>
                                        <SelectItem value="lab_tech">Lab Tech</SelectItem>
                                        <SelectItem value="operator">Operador</SelectItem>
                                        <SelectItem value="auditor">Auditor</SelectItem>
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

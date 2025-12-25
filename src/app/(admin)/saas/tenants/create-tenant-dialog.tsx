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
import { createTenantAction } from "@/app/actions/admin/tenants";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import { Building2, Globe } from "lucide-react";

export function CreateTenantDialog({ children }: { children: React.ReactNode }) {
    const [open, setOpen] = useState(false);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {children}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] bg-slate-900 border-slate-800 text-slate-100">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Building2 className="h-5 w-5 text-blue-400" />
                        Nova Organização
                    </DialogTitle>
                </DialogHeader>

                <ActionForm
                    action={createTenantAction}
                    submitText="Criar Tenant"
                    onSuccess={() => setOpen(false)}
                >
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Nome da Empresa</Label>
                            <Input
                                id="name"
                                name="name"
                                placeholder="Ex: Indústria ABC Lda"
                                className="bg-slate-900/50 border-slate-800"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="slug">Identificador Único (Slug)</Label>
                            <div className="relative">
                                <Globe className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                                <Input
                                    id="slug"
                                    name="slug"
                                    placeholder="industria-abc"
                                    className="pl-9 bg-slate-900/50 border-slate-800"
                                    required
                                />
                            </div>
                            <p className="text-[10px] text-slate-500">Usado para subdomínios e identificação interna.</p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="plan">Plano Inicial</Label>
                            <Select name="plan" defaultValue="trial">
                                <SelectTrigger className="bg-slate-900/50 border-slate-800">
                                    <SelectValue placeholder="Selecionar plano" />
                                </SelectTrigger>
                                <SelectContent className="bg-slate-900 border-slate-800 text-slate-100">
                                    <SelectItem value="trial">Trial (Grátis)</SelectItem>
                                    <SelectItem value="starter">Starter</SelectItem>
                                    <SelectItem value="pro">Pro</SelectItem>
                                    <SelectItem value="enterprise">Enterprise</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </ActionForm>
            </DialogContent>
        </Dialog>
    );
}

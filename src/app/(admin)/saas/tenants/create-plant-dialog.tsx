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
import { createPlantAction } from "@/app/actions/admin/tenants";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import { Factory, MapPin, Globe, Clock, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CreatePlantDialogProps {
    organizationId: string;
}

export function CreatePlantDialog({ organizationId }: CreatePlantDialogProps) {
    const [open, setOpen] = useState(false);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button size="sm" className="h-9 bg-indigo-600 hover:bg-indigo-700 gap-2">
                    <Plus className="h-4 w-4" /> Adicionar Unidade
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] bg-slate-950 border-slate-800 text-slate-100">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Factory className="h-5 w-5 text-indigo-400" />
                        Nova Unidade Operativa
                    </DialogTitle>
                </DialogHeader>

                <ActionForm
                    action={createPlantAction}
                    submitText="Criar Unidade"
                    onSuccess={() => setOpen(false)}
                >
                    <input type="hidden" name="organization_id" value={organizationId} />

                    <div className="space-y-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2 col-span-2">
                                <Label htmlFor="name">Nome da Unidade</Label>
                                <Input id="name" name="name" placeholder="Ex: Fábrica Norte" required className="bg-slate-900 border-slate-800" />
                            </div>

                            <div className="space-y-2 col-span-1">
                                <Label htmlFor="code">Código Identificador</Label>
                                <Input id="code" name="code" placeholder="Ex: PT-LIS-01" required className="bg-slate-900 border-slate-800 font-mono" />
                            </div>

                            <div className="space-y-2 col-span-1">
                                <Label htmlFor="timezone">Fuso Horário</Label>
                                <Select name="timezone" defaultValue="Europe/Lisbon">
                                    <SelectTrigger className="bg-slate-900 border-slate-800">
                                        <SelectValue placeholder="Timezone..." />
                                    </SelectTrigger>
                                    <SelectContent className="bg-slate-900 border-slate-800 text-slate-100">
                                        <SelectItem value="Europe/Lisbon">Lisboa (WET)</SelectItem>
                                        <SelectItem value="Europe/London">Londres (GMT)</SelectItem>
                                        <SelectItem value="Europe/Madrid">Madrid (CET)</SelectItem>
                                        <SelectItem value="America/Sao_Paulo">São Paulo (BRT)</SelectItem>
                                        <SelectItem value="UTC">UTC Universal</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="col-span-2 border-t border-slate-800 pt-4 mt-2">
                                <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                                    <MapPin className="h-3 w-3" /> Localização
                                </h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="city">Cidade</Label>
                                        <Input id="city" name="city" placeholder="Ex: Lisboa" className="bg-slate-900 border-slate-800" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="country">País</Label>
                                        <Select name="country" defaultValue="PT">
                                            <SelectTrigger className="bg-slate-900 border-slate-800">
                                                <SelectValue placeholder="País..." />
                                            </SelectTrigger>
                                            <SelectContent className="bg-slate-900 border-slate-800 text-slate-100">
                                                <SelectItem value="PT">Portugal</SelectItem>
                                                <SelectItem value="ES">Espanha</SelectItem>
                                                <SelectItem value="BR">Brasil</SelectItem>
                                                <SelectItem value="AO">Angola</SelectItem>
                                                <SelectItem value="MZ">Moçambique</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2 col-span-2">
                                        <Label htmlFor="address_line1">Morada / Rua</Label>
                                        <Input id="address_line1" name="address_line1" placeholder="Rua da Indústria, 42" className="bg-slate-900 border-slate-800" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </ActionForm>
            </DialogContent>
        </Dialog>
    );
}

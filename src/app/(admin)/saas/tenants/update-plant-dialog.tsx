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
import { updatePlantAction } from "@/app/actions/admin/tenants";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import { Factory, MapPin, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";

interface UpdatePlantDialogProps {
    plant: {
        id: string;
        name: string;
        code: string;
        organization_id: string;
        timezone?: string;
        address?: any;
    };
    trigger?: React.ReactNode;
}

export function UpdatePlantDialog({ plant, trigger }: UpdatePlantDialogProps) {
    const [open, setOpen] = useState(false);

    // Parse address if it's a string, otherwise use as object
    const address = typeof plant.address === 'string'
        ? JSON.parse(plant.address)
        : (plant.address || {});

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-indigo-400">
                        <Edit className="h-4 w-4" />
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] bg-slate-950 border-slate-800 text-slate-100">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Factory className="h-5 w-5 text-indigo-400" />
                        Editar Unidade Operativa
                    </DialogTitle>
                </DialogHeader>

                <ActionForm
                    action={updatePlantAction}
                    submitText="Guardar Alterações"
                    onSuccess={() => setOpen(false)}
                >
                    <input type="hidden" name="plant_id" value={plant.id} />
                    <input type="hidden" name="organization_id" value={plant.organization_id} />

                    <div className="space-y-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2 col-span-2">
                                <Label htmlFor="edit-name">Nome da Unidade</Label>
                                <Input id="edit-name" name="name" defaultValue={plant.name} required className="bg-slate-900 border-slate-800" />
                            </div>

                            <div className="space-y-2 col-span-1">
                                <Label htmlFor="edit-code">Código Identificador</Label>
                                <Input id="edit-code" name="code" defaultValue={plant.code} required className="bg-slate-900 border-slate-800 font-mono" />
                            </div>

                            <div className="space-y-2 col-span-1">
                                <Label htmlFor="edit-timezone">Fuso Horário</Label>
                                <Select name="timezone" defaultValue={plant.timezone || 'UTC'}>
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
                                        <Label htmlFor="edit-city">Cidade</Label>
                                        <Input id="edit-city" name="city" defaultValue={address.city} className="bg-slate-900 border-slate-800" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="edit-country">País</Label>
                                        <Select name="country" defaultValue={address.country || 'PT'}>
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
                                        <Label htmlFor="edit-address_line1">Morada / Rua</Label>
                                        <Input id="edit-address_line1" name="address_line1" defaultValue={address.line1} className="bg-slate-900 border-slate-800" />
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

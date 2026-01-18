"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { ActionForm } from "@/components/smart/action-form";
import { createPackagingLot } from "@/actions/packaging";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SearchableSelect } from "@/components/smart/searchable-select";
import { ScrollArea } from "@/components/ui/scroll-area";

interface PackagingLotDialogProps {
    materials: any[];
}

export function PackagingLotDialog({ materials }: PackagingLotDialogProps) {
    const [open, setOpen] = useState(false);

    const materialOptions = materials.map(m => ({
        label: `${m.name} (${m.code || 'S/C'})`,
        value: m.id
    }));

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="bg-slate-900/50 border-slate-800 hover:bg-blue-600 hover:text-white rounded-xl shadow-lg font-black uppercase text-[10px] tracking-widest transition-all">
                    <Plus className="mr-2 h-3.5 w-3.5 stroke-[1.5px]" />
                    Registar Lote
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] border-slate-800 bg-slate-950 shadow-2xl p-0 overflow-hidden max-h-[95vh] flex flex-col text-slate-100">
                <DialogHeader className="p-6 pb-2 border-b border-white/5 bg-white/5">
                    <DialogTitle className="text-sm font-black uppercase tracking-widest italic text-white">Registo de Lote de Embalagem</DialogTitle>
                </DialogHeader>

                <ScrollArea className="flex-1">
                    <div className="p-6">
                        <ActionForm
                            action={createPackagingLot}
                            onSuccess={() => setOpen(false)}
                            submitText="Registar Lote"
                            className="p-0"
                        >
                            <div className="grid gap-6">
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Material de Embalagem *</Label>
                                    <SearchableSelect
                                        name="packaging_material_id"
                                        placeholder="Selecione o material..."
                                        options={materialOptions}
                                        className="h-11 rounded-xl bg-slate-900/50 border-slate-800 focus:ring-blue-500/20"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="lot_code" className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Código de Lote *</Label>
                                        <Input id="lot_code" name="lot_code" required placeholder="Lote do fornecedor" className="bg-slate-900/50 border-slate-800 focus:border-blue-500/50 transition-all rounded-xl h-11" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="quantity" className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Quantidade Recebida *</Label>
                                        <Input id="quantity" name="quantity" type="number" min="0" className="bg-slate-900/50 border-slate-800 focus:border-blue-500/50 transition-all rounded-xl h-11" required />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="received_at" className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Data de Receção</Label>
                                        <Input id="received_at" name="received_at" type="date" defaultValue={new Date().toISOString().split('T')[0]} className="bg-slate-900/50 border-slate-800 focus:border-blue-500/50 transition-all rounded-xl h-11 [color-scheme:dark]" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="expiry_date" className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Data de Validade</Label>
                                        <Input id="expiry_date" name="expiry_date" type="date" className="bg-slate-900/50 border-slate-800 focus:border-blue-500/50 transition-all rounded-xl h-11 [color-scheme:dark]" />
                                    </div>
                                </div>
                            </div>
                        </ActionForm>
                    </div>
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
}

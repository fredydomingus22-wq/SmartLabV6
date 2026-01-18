"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { ActionForm } from "@/components/smart/action-form";
import { createReagentAction } from "@/app/actions/inventory";
import { SearchableSelect } from "@/components/smart/searchable-select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ReagentDialogProps {
    plantId: string;
}

export function ReagentDialog({ plantId }: ReagentDialogProps) {
    const [open, setOpen] = useState(false);
    const [reagentType, setReagentType] = useState("reagent");
    const [unit, setUnit] = useState("units");

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="bg-slate-900/50 border-slate-800 hover:bg-blue-600 hover:text-white rounded-xl shadow-lg font-black uppercase text-[10px] tracking-widest transition-all">
                    <Plus className="mr-2 h-3.5 w-3.5 stroke-[1.5px]" />
                    Novo Reagente
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] border-slate-800 bg-slate-950 shadow-2xl p-0 overflow-hidden text-slate-100">
                <DialogHeader className="p-6 pb-2 border-b border-white/5 bg-white/5">
                    <DialogTitle className="text-sm font-black uppercase tracking-widest italic text-white">Registo de Reagente / Consumível</DialogTitle>
                </DialogHeader>

                <div className="p-6">
                    <ActionForm
                        action={createReagentAction}
                        onSuccess={() => setOpen(false)}
                        submitText="Configurar Entidade"
                        className="p-0"
                    >
                        <input type="hidden" name="plant_id" value={plantId} />
                        <input type="hidden" name="reagent_type" value={reagentType} />
                        <input type="hidden" name="unit" value={unit} />

                        <div className="grid gap-5">
                            <div className="space-y-2">
                                <Label htmlFor="name" className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Nome da Entidade *</Label>
                                <Input id="name" name="name" placeholder="ex: Ácido Sulfúrico" className="bg-slate-900/50 border-slate-800 focus:border-blue-500/50 transition-all rounded-xl h-11" required />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Tipo de Stock</Label>
                                    <SearchableSelect
                                        value={reagentType}
                                        onValueChange={setReagentType}
                                        placeholder="Selecione..."
                                        options={[
                                            { value: "reagent", label: "Reagente" },
                                            { value: "standard", label: "Padrão" },
                                            { value: "medium", label: "Meio de Cultura" },
                                            { value: "consumable", label: "Consumível" },
                                        ]}
                                        className="h-11 rounded-xl bg-slate-900/50 border-slate-800 focus:ring-blue-500/20"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Unidade de Medida</Label>
                                    <SearchableSelect
                                        value={unit}
                                        onValueChange={setUnit}
                                        placeholder="Selecione..."
                                        options={[
                                            { value: "L", label: "Litros (L)" },
                                            { value: "ml", label: "Mililitros (ml)" },
                                            { value: "kg", label: "Quilogramas (kg)" },
                                            { value: "g", label: "Gramas (g)" },
                                            { value: "units", label: "Unidades" },
                                            { value: "kit", label: "Kit" },
                                        ]}
                                        className="h-11 rounded-xl bg-slate-900/50 border-slate-800 focus:ring-blue-500/20"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="cas_number" className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Nº CAS</Label>
                                    <Input id="cas_number" name="cas_number" placeholder="7664-93-9" className="bg-slate-900/50 border-slate-800 focus:border-blue-500/50 transition-all rounded-xl h-11" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="min_stock_level" className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Stock Mínimo</Label>
                                    <Input id="min_stock_level" name="min_stock_level" type="number" defaultValue="0" className="bg-slate-900/50 border-slate-800 focus:border-blue-500/50 transition-all rounded-xl h-11" required />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="supplier" className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Fornecedor Preferencial</Label>
                                <Input id="supplier" name="supplier" placeholder="ex: Sigma-Aldrich" className="bg-slate-900/50 border-slate-800 focus:border-blue-500/50 transition-all rounded-xl h-11" />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="storage_location" className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Localização de Armazenamento</Label>
                                <Input id="storage_location" name="storage_location" placeholder="ex: Armário A / Prateleira 2" className="bg-slate-900/50 border-slate-800 focus:border-blue-500/50 transition-all rounded-xl h-11" />
                            </div>
                        </div>
                    </ActionForm>
                </div>
            </DialogContent>
        </Dialog>
    );
}

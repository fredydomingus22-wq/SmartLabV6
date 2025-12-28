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
                <Button variant="outline" className="border-purple-500/50 text-purple-400 hover:bg-purple-500/10">
                    <Plus className="mr-2 h-4 w-4" />
                    Novo Reagente
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] glass border-slate-800 bg-slate-900/95 text-slate-100">
                <DialogHeader>
                    <DialogTitle>Definir Novo Reagente/Consumível</DialogTitle>
                </DialogHeader>

                <ActionForm
                    action={createReagentAction}
                    onSuccess={() => setOpen(false)}
                    submitText="Criar Reagente"
                >
                    <div className="grid gap-4 py-4">
                        <input type="hidden" name="plant_id" value={plantId} />
                        <input type="hidden" name="reagent_type" value={reagentType} />
                        <input type="hidden" name="unit" value={unit} />

                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="name" className="text-right text-slate-400">Nome</Label>
                            <Input id="name" name="name" placeholder="Ácido Sulfúrico" className="col-span-3 bg-slate-800/50 border-slate-700 text-slate-100" required />
                        </div>

                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right text-slate-400">Tipo</Label>
                            <div className="col-span-3">
                                <SearchableSelect
                                    value={reagentType}
                                    onValueChange={setReagentType}
                                    placeholder="Selecione o tipo..."
                                    options={[
                                        { value: "reagent", label: "Reagente" },
                                        { value: "standard", label: "Padrão" },
                                        { value: "medium", label: "Meio de Cultura" },
                                        { value: "consumable", label: "Consumível" },
                                    ]}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="cas_number" className="text-right text-slate-400">Nº CAS</Label>
                            <Input id="cas_number" name="cas_number" placeholder="7664-93-9" className="col-span-3 bg-slate-800/50 border-slate-700 text-slate-100" />
                        </div>

                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="supplier" className="text-right text-slate-400">Fornecedor</Label>
                            <Input id="supplier" name="supplier" placeholder="Sigma-Aldrich" className="col-span-3 bg-slate-800/50 border-slate-700 text-slate-100" />
                        </div>

                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="min_stock_level" className="text-right text-slate-400">Stock Mín.</Label>
                            <Input id="min_stock_level" name="min_stock_level" type="number" defaultValue="0" className="col-span-3 bg-slate-800/50 border-slate-700 text-slate-100" required />
                        </div>

                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right text-slate-400">Unidade</Label>
                            <div className="col-span-3">
                                <SearchableSelect
                                    value={unit}
                                    onValueChange={setUnit}
                                    placeholder="Selecione a unidade..."
                                    options={[
                                        { value: "L", label: "Litros (L)" },
                                        { value: "ml", label: "Mililitros (ml)" },
                                        { value: "kg", label: "Quilogramas (kg)" },
                                        { value: "g", label: "Gramas (g)" },
                                        { value: "units", label: "Unidades" },
                                        { value: "kit", label: "Kit" },
                                    ]}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="storage_location" className="text-right text-slate-400">Localização</Label>
                            <Input id="storage_location" name="storage_location" placeholder="Armário A" className="col-span-3 bg-slate-800/50 border-slate-700 text-slate-100" />
                        </div>

                    </div>
                </ActionForm>
            </DialogContent>
        </Dialog>
    );
}

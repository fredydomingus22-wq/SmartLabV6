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
                <Button variant="outline">
                    <Plus className="mr-2 h-4 w-4" />
                    New Reagent
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] glass">
                <DialogHeader>
                    <DialogTitle>Define New Reagent</DialogTitle>
                </DialogHeader>

                <ActionForm
                    action={createReagentAction}
                    onSuccess={() => setOpen(false)}
                    submitText="Create Reagent"
                >
                    <div className="grid gap-4 py-4">
                        <input type="hidden" name="plant_id" value={plantId} />
                        <input type="hidden" name="reagent_type" value={reagentType} />
                        <input type="hidden" name="unit" value={unit} />

                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="name" className="text-right">Name</Label>
                            <Input id="name" name="name" placeholder="Sulfuric Acid" className="col-span-3" required />
                        </div>

                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right">Type</Label>
                            <div className="col-span-3">
                                <SearchableSelect
                                    value={reagentType}
                                    onValueChange={setReagentType}
                                    placeholder="Select type..."
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
                            <Label htmlFor="cas_number" className="text-right">CAS No.</Label>
                            <Input id="cas_number" name="cas_number" placeholder="7664-93-9" className="col-span-3" />
                        </div>

                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="supplier" className="text-right">Supplier</Label>
                            <Input id="supplier" name="supplier" placeholder="Sigma-Aldrich" className="col-span-3" />
                        </div>

                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="min_stock_level" className="text-right">Min Stock</Label>
                            <Input id="min_stock_level" name="min_stock_level" type="number" defaultValue="0" className="col-span-3" required />
                        </div>

                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right">Unit</Label>
                            <div className="col-span-3">
                                <SearchableSelect
                                    value={unit}
                                    onValueChange={setUnit}
                                    placeholder="Select unit..."
                                    options={[
                                        { value: "L", label: "Liters (L)" },
                                        { value: "ml", label: "Milliliters (ml)" },
                                        { value: "kg", label: "Kilograms (kg)" },
                                        { value: "g", label: "Grams (g)" },
                                        { value: "units", label: "Units" },
                                        { value: "kit", label: "Kit" },
                                    ]}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="storage_location" className="text-right">Location</Label>
                            <Input id="storage_location" name="storage_location" placeholder="Cabinet A" className="col-span-3" />
                        </div>

                    </div>
                </ActionForm>
            </DialogContent>
        </Dialog>
    );
}

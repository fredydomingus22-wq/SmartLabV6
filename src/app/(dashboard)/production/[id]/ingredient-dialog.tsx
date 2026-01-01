"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SearchableSelect } from "@/components/smart/searchable-select";
import { Plus, Loader2 } from "lucide-react";
import { linkIngredientAction } from "@/app/actions/production";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

interface RawMaterialLot {
    id: string;
    lot_code: string;
    quantity_remaining: number;
    unit: string;
    raw_material: { name: string; code: string } | { name: string; code: string }[];
}

interface IngredientDialogProps {
    intermediateId: string;
    intermediateName: string;
    availableLots: RawMaterialLot[];
}

export function IngredientDialog({ intermediateId, intermediateName, availableLots }: IngredientDialogProps) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [selectedLot, setSelectedLot] = useState<string>("");
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!selectedLot) {
            toast.error("Please select a raw material lot");
            return;
        }
        setLoading(true);

        const formData = new FormData(e.currentTarget);
        formData.set("intermediate_product_id", intermediateId);
        formData.set("raw_material_lot_id", selectedLot);

        // Get lot code for backward compatibility
        const lot = availableLots.find(l => l.id === selectedLot);
        if (lot) {
            formData.set("raw_material_lot_code", lot.lot_code);
        }

        const result = await linkIngredientAction(formData);

        if (result.success) {
            toast.success(result.message);
            setOpen(false);
            setSelectedLot("");
            router.refresh();
        } else {
            toast.error(result.message);
        }
        setLoading(false);
    };

    const unwrap = (val: any) => Array.isArray(val) ? val[0] : val;
    const selectedLotData = availableLots.find(l => l.id === selectedLot);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button size="sm" variant="outline">
                    <Plus className="mr-1 h-3 w-3" />
                    Add Ingredient
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] glass">
                <DialogHeader>
                    <DialogTitle>Add Ingredient to {intermediateName}</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label>Raw Material Lot</Label>
                        <SearchableSelect
                            options={lots.map(lot => {
                                const material = unwrap(lot.raw_material);
                                return {
                                    value: lot.id,
                                    label: `${lot.lot_code} - ${material?.name || "Unknown"} (${lot.quantity_remaining} ${lot.unit})`
                                };
                            })}
                            placeholder="Select a lot..."
                            value={selectedLot}
                            onValueChange={setSelectedLot}
                            disabled={loading || lots.length === 0}
                            emptyMessage={lots.length === 0 ? "No approved lots available" : "No lot found"}
                        />
                        {selectedLotData && (
                            <p className="text-xs text-muted-foreground mt-1">
                                Available: {selectedLotData.quantity_remaining} {selectedLotData.unit}
                            </p>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="quantity">Quantity Used</Label>
                            <Input
                                id="quantity"
                                name="quantity"
                                type="number"
                                step="0.001"
                                placeholder="e.g., 50"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="unit">Unit</Label>
                            <Input
                                id="unit"
                                name="unit"
                                placeholder="kg"
                                defaultValue={selectedLotData?.unit || "kg"}
                                required
                            />
                        </div>
                    </div>

                    <div className="flex justify-end pt-4">
                        <Button type="submit" disabled={loading || !selectedLot}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Add Ingredient
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}


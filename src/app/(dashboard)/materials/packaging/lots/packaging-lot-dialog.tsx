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
                <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Registar Lote
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] glass">
                <DialogHeader>
                    <DialogTitle>Registar Lote de Embalagem</DialogTitle>
                </DialogHeader>

                <ActionForm
                    action={createPackagingLot}
                    onSuccess={() => setOpen(false)}
                    submitText="Registar Lote"
                >
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label>Material de Embalagem *</Label>
                            <SearchableSelect
                                name="packaging_material_id"
                                placeholder="Selecione o material..."
                                options={materialOptions}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="lot_code">Código de Lote *</Label>
                                <Input id="lot_code" name="lot_code" required placeholder="Lote do fornecedor" />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="quantity">Quantidade Recebida *</Label>
                                <Input id="quantity" name="quantity" type="number" min="0" required />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="received_at">Data Receção</Label>
                                <Input id="received_at" name="received_at" type="date" defaultValue={new Date().toISOString().split('T')[0]} />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="expiry_date">Validade</Label>
                                <Input id="expiry_date" name="expiry_date" type="date" />
                            </div>
                        </div>
                    </div>
                </ActionForm>
            </DialogContent>
        </Dialog>
    );
}

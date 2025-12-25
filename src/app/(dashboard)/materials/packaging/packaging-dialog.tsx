"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { ActionForm } from "@/components/smart/action-form";
import { createPackagingMaterial } from "@/actions/packaging";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function PackagingDialog() {
    const [open, setOpen] = useState(false);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Novo Material
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] glass">
                <DialogHeader>
                    <DialogTitle>Criar Material de Embalagem</DialogTitle>
                </DialogHeader>

                <ActionForm
                    action={createPackagingMaterial}
                    onSuccess={() => setOpen(false)}
                    submitText="Criar Material"
                >
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="code">Código *</Label>
                                <Input id="code" name="code" required placeholder="Ex: EMB-001" />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="name">Nome *</Label>
                                <Input id="name" name="name" required placeholder="Ex: Garrafa 500ml" />
                            </div>
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="min_stock_level">Stock Mínimo</Label>
                            <Input
                                id="min_stock_level"
                                name="min_stock_level"
                                type="number"
                                min="0"
                                defaultValue="0"
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="description">Descrição</Label>
                            <Textarea id="description" name="description" placeholder="Detalhes do material..." rows={3} />
                        </div>
                    </div>
                </ActionForm>
            </DialogContent>
        </Dialog>
    );
}

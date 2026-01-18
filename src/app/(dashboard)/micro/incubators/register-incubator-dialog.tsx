"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Plus, ThermometerSun } from "lucide-react";
import { ActionForm } from "@/components/smart/action-form";
import { createIncubatorAction } from "@/app/actions/micro";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface RegisterIncubatorDialogProps {
    plantId: string;
}

export function RegisterIncubatorDialog({ plantId }: RegisterIncubatorDialogProps) {
    const [open, setOpen] = useState(false);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="font-bold">
                    <Plus className="mr-2 h-4 w-4" />
                    Adicionar Incubadora
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-3">
                        <ThermometerSun className="h-5 w-5 text-primary" />
                        Nova Incubadora
                    </DialogTitle>
                </DialogHeader>

                <ActionForm
                    action={createIncubatorAction}
                    onSuccess={() => setOpen(false)}
                    submitText="Adicionar Equipamento"
                    className="space-y-6 pt-4"
                >
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="name" className="text-right text-xs uppercase font-bold tracking-wide text-muted-foreground">Nome</Label>
                            <Input
                                id="name"
                                name="name"
                                placeholder="Ex: Incubadora 01"
                                className="col-span-3"
                                required
                            />
                        </div>

                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="temperature" className="text-right text-xs uppercase font-bold tracking-wide text-muted-foreground">Temp (°C)</Label>
                            <Input
                                id="temperature"
                                name="temperature"
                                type="number"
                                step="0.1"
                                className="col-span-3"
                                required
                            />
                        </div>

                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="capacity" className="text-right text-xs uppercase font-bold tracking-wide text-muted-foreground">Capacidade</Label>
                            <Input
                                id="capacity"
                                name="capacity"
                                type="number"
                                className="col-span-3"
                                required
                            />
                        </div>

                        <input type="hidden" name="plant_id" value={plantId} />
                    </div>
                </ActionForm>
            </DialogContent>
        </Dialog>
    );
}

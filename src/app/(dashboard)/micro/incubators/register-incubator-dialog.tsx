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
                <Button className="glass-primary rounded-xl font-bold transition-all hover:scale-105 active:scale-95">
                    <Plus className="mr-2 h-4 w-4" />
                    Adicionar Incubadora
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] glass border-slate-800 bg-slate-950/90 shadow-2xl backdrop-blur-xl">
                <DialogHeader className="border-b border-slate-800 pb-4">
                    <DialogTitle className="flex items-center gap-3 text-xl font-black tracking-tight text-white">
                        <div className="p-2 rounded-lg bg-orange-500/20 border border-orange-500/30">
                            <ThermometerSun className="h-5 w-5 text-orange-400" />
                        </div>
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
                            <Label htmlFor="name" className="text-right text-xs uppercase font-bold tracking-wide text-slate-400">Nome</Label>
                            <Input
                                id="name"
                                name="name"
                                placeholder="Ex: Incubadora 01"
                                className="col-span-3 bg-slate-900/50 border-slate-700 text-white placeholder:text-slate-600 focus:border-orange-500/50"
                                required
                            />
                        </div>

                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="temperature" className="text-right text-xs uppercase font-bold tracking-wide text-slate-400">Temp (°C)</Label>
                            <Input
                                id="temperature"
                                name="temperature"
                                type="number"
                                step="0.1"
                                className="col-span-3 bg-slate-900/50 border-slate-700 text-white placeholder:text-slate-600 focus:border-orange-500/50"
                                required
                            />
                        </div>

                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="capacity" className="text-right text-xs uppercase font-bold tracking-wide text-slate-400">Capacidade</Label>
                            <Input
                                id="capacity"
                                name="capacity"
                                type="number"
                                className="col-span-3 bg-slate-900/50 border-slate-700 text-white placeholder:text-slate-600 focus:border-orange-500/50"
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

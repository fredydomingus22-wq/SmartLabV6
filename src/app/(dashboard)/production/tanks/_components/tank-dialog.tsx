"use client";

import { useState, useTransition } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { createTankAction, updateTankAction } from "@/app/actions/tanks";
import { toast } from "sonner";
import { Loader2, Plus, PenLine } from "lucide-react";
import { cn } from "@/lib/utils";

interface Tank {
    id: string;
    name: string;
    code: string;
    capacity: number | null;
    capacity_unit: string | null;
    status: string;
    description: string | null;
}

interface TankDialogProps {
    tank?: Tank;
    trigger?: React.ReactNode;
}

export function TankDialog({ tank, trigger }: TankDialogProps) {
    const [open, setOpen] = useState(false);
    const [isPending, startTransition] = useTransition();

    const isEditing = !!tank;

    async function handleSubmit(formData: FormData) {
        startTransition(async () => {
            if (isEditing && tank) {
                formData.append("id", tank.id);
                const result = await updateTankAction(formData);
                if (result.success) {
                    toast.success(result.message);
                    setOpen(false);
                } else {
                    toast.error(result.message);
                }
            } else {
                const result = await createTankAction(formData);
                if (result.success) {
                    toast.success(result.message);
                    setOpen(false);
                } else {
                    toast.error(result.message);
                }
            }
        });
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button className="bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-900/20">
                        <Plus className="h-4 w-4 mr-2" />
                        Novo Tanque
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="bg-slate-950 border-slate-800 text-slate-100 sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-xl">
                        {isEditing ? <PenLine className="h-5 w-5 text-blue-400" /> : <Plus className="h-5 w-5 text-blue-400" />}
                        {isEditing ? `Editar Tanque: ${tank.name}` : "Registrar Novo Tanque"}
                    </DialogTitle>
                    <DialogDescription className="text-slate-400">
                        {isEditing ? "Atualize as informações do tanque de armazenamento." : "Configure um novo tanque ou silo para armazenamento."}
                    </DialogDescription>
                </DialogHeader>

                <form action={handleSubmit} className="space-y-4 pt-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="code" className="text-xs font-mono uppercase text-slate-500">Código ID</Label>
                            <Input
                                id="code"
                                name="code"
                                placeholder="TQ-001"
                                defaultValue={tank?.code}
                                required
                                className="bg-slate-900/50 border-slate-800"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="status" className="text-xs font-mono uppercase text-slate-500">Status Operacional</Label>
                            <Select name="status" defaultValue={tank?.status || "active"}>
                                <SelectTrigger className="bg-slate-900/50 border-slate-800">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-slate-900 border-slate-800">
                                    <SelectItem value="active">Ativo / Operacional</SelectItem>
                                    <SelectItem value="maintenance">Em Manutenção</SelectItem>
                                    <SelectItem value="cleaning">Em Limpeza (CIP)</SelectItem>
                                    <SelectItem value="decommissioned">Desativado</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="name" className="text-xs font-mono uppercase text-slate-500">Nome Descritivo</Label>
                        <Input
                            id="name"
                            name="name"
                            placeholder="Tanque de Mistura Principal"
                            defaultValue={tank?.name}
                            required
                            className="bg-slate-900/50 border-slate-800"
                        />
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        <div className="col-span-2 space-y-2">
                            <Label htmlFor="capacity" className="text-xs font-mono uppercase text-slate-500">Capacidade Total</Label>
                            <Input
                                id="capacity"
                                name="capacity"
                                type="number"
                                step="any"
                                placeholder="0.00"
                                defaultValue={tank?.capacity || ""}
                                className="bg-slate-900/50 border-slate-800"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="capacity_unit" className="text-xs font-mono uppercase text-slate-500">Unidade</Label>
                            <Select name="capacity_unit" defaultValue={tank?.capacity_unit || "L"}>
                                <SelectTrigger className="bg-slate-900/50 border-slate-800">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-slate-900 border-slate-800">
                                    <SelectItem value="L">Litros (L)</SelectItem>
                                    <SelectItem value="m3">Metros Cúbicos (m³)</SelectItem>
                                    <SelectItem value="kg">Quilogramas (kg)</SelectItem>
                                    <SelectItem value="gal">Galões (gal)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description" className="text-xs font-mono uppercase text-slate-500">Observações (Opcional)</Label>
                        <Textarea
                            id="description"
                            name="description"
                            placeholder="Detalhes adicionais sobre o equipamento..."
                            defaultValue={tank?.description || ""}
                            className="bg-slate-900/50 border-slate-800 min-h-[80px]"
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-slate-800/50">
                        <Button type="button" variant="ghost" onClick={() => setOpen(false)} disabled={isPending} className="hover:bg-slate-800">
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={isPending} className="bg-blue-600 hover:bg-blue-500">
                            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {isEditing ? "Salvar Alterações" : "Criar Tanque"}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}

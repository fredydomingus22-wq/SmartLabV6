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
                <Button variant="outline" className="bg-slate-900/50 border-slate-800 hover:bg-blue-600 hover:text-white rounded-xl shadow-lg font-black uppercase text-[10px] tracking-widest transition-all">
                    <Plus className="mr-2 h-3.5 w-3.5 stroke-[1.5px]" />
                    Novo Material
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] border-slate-800 bg-slate-950 shadow-2xl p-0 overflow-hidden">
                <DialogHeader className="p-6 pb-2 border-b border-white/5 bg-white/5">
                    <DialogTitle className="text-sm font-black uppercase tracking-widest italic text-white">Registo de Material de Embalagem</DialogTitle>
                </DialogHeader>

                <div className="p-6">
                    <ActionForm
                        action={createPackagingMaterial}
                        onSuccess={() => setOpen(false)}
                        submitText="Registar Material"
                        className="p-0"
                    >
                        <div className="grid gap-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="code" className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Código *</Label>
                                    <Input id="code" name="code" required placeholder="Ex: EMB-001" className="bg-slate-900/50 border-slate-800 focus:border-blue-500/50 transition-all rounded-xl h-11" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="name" className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Nome *</Label>
                                    <Input id="name" name="name" required placeholder="Ex: Garrafa 500ml" className="bg-slate-900/50 border-slate-800 focus:border-blue-500/50 transition-all rounded-xl h-11" />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="min_stock_level" className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Stock Mínimo</Label>
                                <Input
                                    id="min_stock_level"
                                    name="min_stock_level"
                                    type="number"
                                    min="0"
                                    defaultValue="0"
                                    className="bg-slate-900/50 border-slate-800 focus:border-blue-500/50 transition-all rounded-xl h-11"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="description" className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Descrição Técnica</Label>
                                <Textarea id="description" name="description" placeholder="Especificações técnicas e detalhes do material..." rows={4} className="bg-slate-900/50 border-slate-800 focus:border-blue-500/50 transition-all rounded-xl resize-none" />
                            </div>
                        </div>
                    </ActionForm>
                </div>
            </DialogContent>
        </Dialog>
    );
}

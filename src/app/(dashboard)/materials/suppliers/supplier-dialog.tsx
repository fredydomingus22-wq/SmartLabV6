"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { ActionForm } from "@/components/smart/action-form";
import { createSupplierAction } from "@/app/actions/raw-materials";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import { ScrollArea } from "@/components/ui/scroll-area";

interface SupplierDialogProps {
    plantId: string;
}

export function SupplierDialog({ plantId }: SupplierDialogProps) {
    const [open, setOpen] = useState(false);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white font-semibold rounded-xl shadow-lg shadow-amber-900/20 border border-transparent hover:border-amber-400/30 transition-all duration-300">
                    <Plus className="mr-2 h-4 w-4" />
                    Adicionar Fornecedor
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] glass max-h-[90vh] flex flex-col p-0">
                <DialogHeader className="p-6 pb-2">
                    <DialogTitle>Adicionar Novo Fornecedor</DialogTitle>
                </DialogHeader>

                <ScrollArea className="flex-1 p-6 pt-2">
                    <ActionForm
                        action={createSupplierAction}
                        onSuccess={() => setOpen(false)}
                        submitText="Criar Fornecedor"
                    >
                        <div className="grid gap-4 py-4">
                            <input type="hidden" name="plant_id" value={plantId} />

                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="code">Código do Fornecedor *</Label>
                                    <Input id="code" name="code" required placeholder="ex: FOR-001" className="bg-slate-900/50 border-slate-700/50 focus:border-amber-500/50 focus:ring-amber-500/20 transition-all" />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="name">Nome da Empresa *</Label>
                                    <Input id="name" name="name" required placeholder="ex: Empresa Lda" className="bg-slate-900/50 border-slate-700/50 focus:border-amber-500/50 focus:ring-amber-500/20 transition-all" />
                                </div>
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="contact_name">Pessoa de Contacto</Label>
                                <Input id="contact_name" name="contact_name" placeholder="ex: João Silva" className="bg-slate-900/50 border-slate-700/50 focus:border-amber-500/50 focus:ring-amber-500/20 transition-all" />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="contact_email">Email</Label>
                                    <Input id="contact_email" name="contact_email" type="email" placeholder="joao@empresa.com" className="bg-slate-900/50 border-slate-700/50 focus:border-amber-500/50 focus:ring-amber-500/20 transition-all" />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="contact_phone">Telefone</Label>
                                    <Input id="contact_phone" name="contact_phone" placeholder="+351 xxx xxx xxx" className="bg-slate-900/50 border-slate-700/50 focus:border-amber-500/50 focus:ring-amber-500/20 transition-all" />
                                </div>
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="address">Morada</Label>
                                <Textarea id="address" name="address" placeholder="Morada completa..." rows={2} className="bg-slate-900/50 border-slate-700/50 focus:border-amber-500/50 focus:ring-amber-500/20 transition-all" />
                            </div>
                        </div>
                    </ActionForm>
                </ScrollArea>
            </DialogContent>

        </Dialog>
    );
}

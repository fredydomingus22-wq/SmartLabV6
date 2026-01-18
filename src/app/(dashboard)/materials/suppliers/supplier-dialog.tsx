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
                <Button variant="outline" className="bg-slate-900/50 border-slate-800 hover:bg-blue-600 hover:text-white rounded-xl shadow-lg font-black uppercase text-[10px] tracking-widest transition-all">
                    <Plus className="mr-2 h-3.5 w-3.5 stroke-[1.5px]" />
                    Adicionar Fornecedor
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] border-slate-800 bg-slate-950 shadow-2xl p-0 overflow-hidden max-h-[95vh] flex flex-col">
                <DialogHeader className="p-6 pb-2 border-b border-white/5 bg-white/5">
                    <DialogTitle className="text-sm font-black uppercase tracking-widest italic text-white">Novo Parceiro Logístico</DialogTitle>
                </DialogHeader>

                <ScrollArea className="flex-1">
                    <div className="p-6">
                        <ActionForm
                            action={createSupplierAction}
                            onSuccess={() => setOpen(false)}
                            submitText="Homologar Fornecedor"
                            className="p-0"
                        >
                            <div className="grid gap-6">
                                <input type="hidden" name="plant_id" value={plantId} />

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="code" className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Código de Fornecedor *</Label>
                                        <Input id="code" name="code" required placeholder="ex: FOR-001" className="bg-slate-900/50 border-slate-800 focus:border-blue-500/50 transition-all rounded-xl h-11" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="name" className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Entidade / Empresa *</Label>
                                        <Input id="name" name="name" required placeholder="ex: Empresa Lda" className="bg-slate-900/50 border-slate-800 focus:border-blue-500/50 transition-all rounded-xl h-11" />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="contact_name" className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Ponto de Contacto</Label>
                                    <Input id="contact_name" name="contact_name" placeholder="ex: João Silva" className="bg-slate-900/50 border-slate-800 focus:border-blue-500/50 transition-all rounded-xl h-11" />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="contact_email" className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Endereço de Email</Label>
                                        <Input id="contact_email" name="contact_email" type="email" placeholder="comercial@parceiro.pt" className="bg-slate-900/50 border-slate-800 focus:border-blue-500/50 transition-all rounded-xl h-11" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="contact_phone" className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Contacto Telefónico</Label>
                                        <Input id="contact_phone" name="contact_phone" placeholder="+351 xxx xxx xxx" className="bg-slate-900/50 border-slate-800 focus:border-blue-500/50 transition-all rounded-xl h-11" />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="address" className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Morada Fiscal / Operacional</Label>
                                    <Textarea id="address" name="address" placeholder="Morada completa..." rows={3} className="bg-slate-900/50 border-slate-800 focus:border-blue-500/50 transition-all rounded-xl resize-none" />
                                </div>
                            </div>
                        </ActionForm>
                    </div>
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
}

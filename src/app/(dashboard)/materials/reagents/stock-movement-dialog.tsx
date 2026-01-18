"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SearchableSelect } from "@/components/smart/searchable-select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { receiveStockAction, consumeStockAction } from "@/app/actions/inventory";
import { toast } from "sonner";
import { ArrowLeftRight, ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { ReagentCombobox } from "./reagent-combobox";
import { ScrollArea } from "@/components/ui/scroll-area";

interface StockMovementDialogProps {
    reagents: { id: string; name: string; unit: string }[];
}

export function StockMovementDialog({ reagents }: StockMovementDialogProps) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    async function handleReceive(formData: FormData) {
        setLoading(true);
        const res = await receiveStockAction(formData);
        setLoading(false);
        if (res.success) {
            toast.success(res.message);
            setOpen(false);
        } else {
            toast.error(res.message);
        }
    }

    async function handleConsume(formData: FormData) {
        setLoading(true);
        const res = await consumeStockAction(formData);
        setLoading(false);
        if (res.success) {
            toast.success(res.message);
            setOpen(false);
        } else {
            toast.error(res.message);
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="bg-slate-900/50 border-slate-800 hover:bg-emerald-600 hover:text-white rounded-xl shadow-lg font-black uppercase text-[10px] tracking-widest transition-all">
                    <ArrowLeftRight className="mr-2 h-3.5 w-3.5 stroke-[1.5px]" />
                    Registar Movimento
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] border-slate-800 bg-slate-950 shadow-2xl p-0 overflow-hidden max-h-[95vh] flex flex-col text-slate-100">
                <DialogHeader className="p-6 pb-2 border-b border-white/5 bg-white/5">
                    <DialogTitle className="text-sm font-black uppercase tracking-widest italic text-white">Movimentação de Stock</DialogTitle>
                    <DialogDescription className="text-[11px] text-slate-500 italic">
                        Controlo de entradas e saídas de reagentes do inventário laboratorial.
                    </DialogDescription>
                </DialogHeader>

                <Tabs defaultValue="receive" className="w-full">
                    <div className="px-6 pt-4">
                        <TabsList className="grid w-full grid-cols-2 bg-slate-900/50 border border-slate-800 p-1 rounded-xl h-11">
                            <TabsTrigger value="receive" className="rounded-lg data-[state=active]:bg-emerald-600 data-[state=active]:text-white font-black uppercase text-[10px] tracking-widest transition-all">
                                <ArrowDownLeft className="mr-2 h-3.5 w-3.5 stroke-[1.5px]" />
                                Entrada (IN)
                            </TabsTrigger>
                            <TabsTrigger value="consume" className="rounded-lg data-[state=active]:bg-rose-600 data-[state=active]:text-white font-black uppercase text-[10px] tracking-widest transition-all">
                                <ArrowUpRight className="mr-2 h-3.5 w-3.5 stroke-[1.5px]" />
                                Consumo (OUT)
                            </TabsTrigger>
                        </TabsList>
                    </div>

                    <ScrollArea className="max-h-[60vh]">
                        <div className="p-6">
                            {/* RECEIVE TAB */}
                            <TabsContent value="receive" className="mt-0 focus-visible:ring-0">
                                <form action={handleReceive} className="space-y-5">
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Entidade Reagente</Label>
                                        <ReagentCombobox reagents={reagents} name="reagent_id" required />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="quantity-in" className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Quantidade</Label>
                                            <Input id="quantity-in" name="quantity" type="number" step="0.01" min="0" className="bg-slate-900/50 border-slate-800 focus:border-emerald-500/50 transition-all rounded-xl h-11" required />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="batch" className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Nº de Lote</Label>
                                            <Input id="batch" name="batch_number" placeholder="Lote do fornecedor" className="bg-slate-900/50 border-slate-800 focus:border-emerald-500/50 transition-all rounded-xl h-11" />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="expiry" className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Data de Validade</Label>
                                            <Input id="expiry" name="expiry_date" type="date" className="bg-slate-900/50 border-slate-800 focus:border-emerald-500/50 transition-all rounded-xl h-11 [color-scheme:dark]" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="supplier" className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Fornecedor</Label>
                                            <Input id="supplier" name="external_supplier" placeholder="Identificação da origem" className="bg-slate-900/50 border-slate-800 focus:border-emerald-500/50 transition-all rounded-xl h-11" />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="notes-in" className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Observações Operacionais</Label>
                                        <Textarea id="notes-in" name="notes" placeholder="Detalhes adicionais da receção..." className="bg-slate-900/50 border-slate-800 focus:border-emerald-500/50 transition-all rounded-xl resize-none" rows={3} />
                                    </div>
                                    <Button type="submit" disabled={loading} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black uppercase text-[10px] tracking-widest h-11 rounded-xl shadow-lg shadow-emerald-900/20 transition-all">
                                        {loading ? "A PROCESSAR..." : "CONFIRMAR RECEÇÃO"}
                                    </Button>
                                </form>
                            </TabsContent>

                            {/* CONSUME TAB */}
                            <TabsContent value="consume" className="mt-0 focus-visible:ring-0">
                                <form action={handleConsume} className="space-y-5">
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Entidade Reagente</Label>
                                        <ReagentCombobox reagents={reagents} name="reagent_id" required />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="quantity-out" className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Quantidade a Consumir</Label>
                                        <Input id="quantity-out" name="quantity" type="number" step="0.01" min="0" className="bg-slate-900/50 border-slate-800 focus:border-rose-500/50 transition-all rounded-xl h-11" required />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Centro de Custo / Destino</Label>
                                            <SearchableSelect
                                                name="destination"
                                                options={[
                                                    { value: "Microbiology Lab", label: "Lab. Microbiologia" },
                                                    { value: "Physico-Chemical Lab", label: "Lab. Físico-Químico" },
                                                    { value: "Production Line 01", label: "Linha de Produção 01" },
                                                    { value: "Waste Disposal", label: "Eliminação de Resíduos" },
                                                    { value: "Other", label: "Outro" },
                                                ]}
                                                placeholder="Selecione Unidade..."
                                                className="h-11 rounded-xl bg-slate-900/50 border-slate-800 focus:ring-rose-500/20"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="purpose" className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Finalidade Técnica</Label>
                                            <Input id="purpose" name="purpose" placeholder="Ex: Análise de Controlo" className="bg-slate-900/50 border-slate-800 focus:border-rose-500/50 transition-all rounded-xl h-11" />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="requester" className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Requisitante Responsável</Label>
                                        <Input id="requester" name="requested_by" placeholder="Identificação do técnico" className="bg-slate-900/50 border-slate-800 focus:border-rose-500/50 transition-all rounded-xl h-11" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="notes-out" className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Notas de Saída</Label>
                                        <Textarea id="notes-out" name="notes" placeholder="Motivo ou detalhes do consumo..." className="bg-slate-900/50 border-slate-800 focus:border-rose-500/50 transition-all rounded-xl resize-none" rows={3} />
                                    </div>
                                    <Button type="submit" variant="destructive" disabled={loading} className="w-full bg-rose-600 hover:bg-rose-500 text-white font-black uppercase text-[10px] tracking-widest h-11 rounded-xl shadow-lg shadow-rose-900/20 transition-all">
                                        {loading ? "A PROCESSAR..." : "CONFIRMAR CONSUMO"}
                                    </Button>
                                </form>
                            </TabsContent>
                        </div>
                    </ScrollArea>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
}

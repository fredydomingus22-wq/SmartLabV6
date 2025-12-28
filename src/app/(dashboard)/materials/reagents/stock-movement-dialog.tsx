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
                <Button className="bg-purple-600 hover:bg-purple-700 text-white">
                    <ArrowLeftRight className="mr-2 h-4 w-4" />
                    Registar Movimento
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] glass border-slate-800 bg-slate-900/95 text-slate-100">
                <DialogHeader>
                    <DialogTitle>Movimentação de Stock</DialogTitle>
                    <DialogDescription className="text-slate-400">
                        Registar entrada ou saída de reagentes do inventário.
                    </DialogDescription>
                </DialogHeader>

                <Tabs defaultValue="receive" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 bg-slate-800">
                        <TabsTrigger value="receive" className="data-[state=active]:bg-slate-700">
                            <ArrowDownLeft className="mr-2 h-4 w-4 text-emerald-400" />
                            Entrada (IN)
                        </TabsTrigger>
                        <TabsTrigger value="consume" className="data-[state=active]:bg-slate-700">
                            <ArrowUpRight className="mr-2 h-4 w-4 text-red-400" />
                            Consumo (OUT)
                        </TabsTrigger>
                    </TabsList>

                    {/* RECEIVE TAB */}
                    <TabsContent value="receive">
                        <form action={handleReceive} className="space-y-4 py-4">
                            <div className="grid gap-2">
                                <Label className="text-slate-400">Reagente</Label>
                                <ReagentCombobox reagents={reagents} name="reagent_id" required />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="quantity-in" className="text-slate-400">Quantidade</Label>
                                    <Input id="quantity-in" name="quantity" type="number" step="0.01" min="0" className="bg-slate-800/50 border-slate-700" required />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="batch" className="text-slate-400">Nº de Lote</Label>
                                    <Input id="batch" name="batch_number" placeholder="Opcional" className="bg-slate-800/50 border-slate-700" />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="expiry" className="text-slate-400">Data de Validade</Label>
                                    <Input id="expiry" name="expiry_date" type="date" className="bg-slate-800/50 border-slate-700 [color-scheme:dark]" />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="supplier" className="text-slate-400">Fornecedor</Label>
                                    <Input id="supplier" name="external_supplier" placeholder="Ex: Sigma-Aldrich" className="bg-slate-800/50 border-slate-700" />
                                </div>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="notes-in" className="text-slate-400">Notas/Observações</Label>
                                <Textarea id="notes-in" name="notes" placeholder="Detalhes da entrega..." className="bg-slate-800/50 border-slate-700" />
                            </div>
                            <DialogFooter>
                                <Button type="submit" disabled={loading} className="w-full bg-emerald-600 hover:bg-emerald-700">
                                    {loading ? "A registar..." : "Confirmar Receção"}
                                </Button>
                            </DialogFooter>
                        </form>
                    </TabsContent>

                    {/* CONSUME TAB */}
                    <TabsContent value="consume">
                        <form action={handleConsume} className="space-y-4 py-4">
                            <div className="grid gap-2">
                                <Label className="text-slate-400">Reagente</Label>
                                <ReagentCombobox reagents={reagents} name="reagent_id" required />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="quantity-out" className="text-slate-400">Quantidade</Label>
                                <Input id="quantity-out" name="quantity" type="number" step="0.01" min="0" className="bg-slate-800/50 border-slate-700" required />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label className="text-slate-400">Destino</Label>
                                    <SearchableSelect
                                        name="destination"
                                        options={[
                                            { value: "Microbiology Lab", label: "Lab. Microbiologia" },
                                            { value: "Physico-Chemical Lab", label: "Lab. Físico-Químico" },
                                            { value: "Production Line 01", label: "Linha de Produção 01" },
                                            { value: "Waste Disposal", label: "Eliminação de Resíduos" },
                                            { value: "Other", label: "Outro" },
                                        ]}
                                        placeholder="Selecione Lab/Depto"
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="purpose" className="text-slate-400">Finalidade</Label>
                                    <Input id="purpose" name="purpose" placeholder="Ex: Análise Diária" className="bg-slate-800/50 border-slate-700" />
                                </div>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="requester" className="text-slate-400">Solicitado por</Label>
                                <Input id="requester" name="requested_by" placeholder="Nome do solicitante..." className="bg-slate-800/50 border-slate-700" />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="notes-out" className="text-slate-400">Notas/Observações</Label>
                                <Textarea id="notes-out" name="notes" placeholder="Detalhes adicionais..." className="bg-slate-800/50 border-slate-700" />
                            </div>
                            <DialogFooter>
                                <Button type="submit" variant="destructive" disabled={loading} className="w-full">
                                    {loading ? "A registar..." : "Confirmar Consumo"}
                                </Button>
                            </DialogFooter>
                        </form>
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
}

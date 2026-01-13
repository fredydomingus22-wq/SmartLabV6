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
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Copy, Loader2, Package, Search } from "lucide-react";
import { copySpecsFromProductAction } from "@/app/actions/specifications";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Product {
    id: string;
    name: string;
    sku: string;
}

interface CopySpecsDialogProps {
    products: Product[];
    currentProductId: string;
}

export function CopySpecsDialog({ products, currentProductId }: CopySpecsDialogProps) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [sourceProductId, setSourceProductId] = useState<string>("");

    const availableProducts = products.filter(p => p.id !== currentProductId);

    async function handleCopy() {
        if (!sourceProductId) {
            toast.error("Por favor, selecione um produto de origem");
            return;
        }

        setLoading(true);

        const formData = new FormData();
        formData.set("source_product_id", sourceProductId);
        formData.set("target_product_id", currentProductId);

        const result = await copySpecsFromProductAction(formData);
        setLoading(false);

        if (result.success) {
            toast.success(result.message);
            setOpen(false);
            setSourceProductId("");
        } else {
            toast.error(result.message);
        }
    }

    if (availableProducts.length === 0) {
        return null;
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="rounded-2xl border-white/5 bg-slate-900/50 hover:bg-slate-800 text-slate-400 hover:text-white font-black uppercase tracking-widest text-[10px] italic h-11 px-6 transition-all">
                    <Copy className="h-3.5 w-3.5 mr-2" />
                    Copiar Diretrizes
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[450px] bg-slate-950 border-white/5 rounded-[2.5rem] shadow-2xl p-0 overflow-hidden">
                <div className="bg-gradient-to-br from-indigo-500/10 via-transparent to-transparent p-8 border-b border-white/5">
                    <DialogHeader>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
                                <Copy className="h-5 w-5 text-indigo-400" />
                            </div>
                            <div>
                                <DialogTitle className="text-xl font-black text-white italic uppercase tracking-tight">
                                    Clonar Especificações
                                </DialogTitle>
                                <DialogDescription className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5 whitespace-nowrap">
                                    Transferência em massa de diretrizes técnicas
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>
                </div>

                <div className="p-8 space-y-6">
                    <div className="p-5 rounded-2xl bg-slate-900/30 border border-white/5 space-y-4">
                        <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Produto de Origem</Label>
                        <Select
                            value={sourceProductId}
                            onValueChange={setSourceProductId}
                        >
                            <SelectTrigger className="h-12 bg-slate-950 border-white/5 rounded-2xl text-[11px] font-bold uppercase tracking-tight focus:ring-indigo-500/50">
                                <SelectValue placeholder="Selecione o produto alvo..." />
                            </SelectTrigger>
                            <SelectContent className="bg-slate-950 border-white/5 rounded-2xl shadow-2xl">
                                {availableProducts.map((product) => (
                                    <SelectItem
                                        key={product.id}
                                        value={product.id}
                                        className="text-[10px] font-black uppercase tracking-widest py-3 focus:bg-indigo-500/10"
                                    >
                                        <div className="flex flex-col">
                                            <span>{product.name}</span>
                                            <span className="text-slate-500 font-mono text-[8px] opacity-60">SKU: {product.sku}</span>
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex items-start gap-4 p-4 rounded-2xl bg-amber-500/5 border border-amber-500/10">
                        <Package className="h-5 w-5 text-amber-500/50 mt-1 shrink-0" />
                        <p className="text-[9px] font-black text-amber-500/80 uppercase tracking-widest leading-relaxed italic">
                            Atenção: Apenas serão copiados parâmetros inexistentes no destino. Especificações existentes não serão sobrescritas ou alteradas.
                        </p>
                    </div>
                </div>

                <DialogFooter className="p-8 pt-0 flex flex-col md:flex-row gap-4">
                    <Button
                        variant="ghost"
                        type="button"
                        onClick={() => setOpen(false)}
                        className="rounded-xl font-black uppercase text-[10px] tracking-widest text-slate-500 hover:text-white"
                    >
                        Cancelar
                    </Button>
                    <Button
                        onClick={handleCopy}
                        disabled={loading || !sourceProductId}
                        className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase text-[10px] tracking-widest px-8 shadow-xl shadow-indigo-500/20 transition-all ml-auto"
                    >
                        {loading && <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />}
                        Executar Transfência
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

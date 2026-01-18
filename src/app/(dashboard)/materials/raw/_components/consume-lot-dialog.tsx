"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
    FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Minus, Loader2 } from "lucide-react";
import { consumeLotAction } from "@/app/actions/raw-materials";
import { toast } from "sonner";

const formSchema = z.object({
    lot_id: z.string().uuid(),
    quantity: z.coerce.number().positive("Quantidade deve ser positiva"),
});

type FormValues = z.infer<typeof formSchema>;

interface ConsumeLotDialogProps {
    lotId: string;
    lotCode: string;
    maxQuantity: number;
    unit: string;
}

export function ConsumeLotDialog({ lotId, lotCode, maxQuantity, unit }: ConsumeLotDialogProps) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema) as any,
        defaultValues: {
            lot_id: lotId,
            quantity: 0,
        },
    });

    async function onSubmit(values: FormValues) {
        if (values.quantity > maxQuantity) {
            toast.error("Quantidade superior ao stock disponível");
            return;
        }

        setLoading(true);
        try {
            const formData = new FormData();
            formData.append("lot_id", values.lot_id);
            formData.append("quantity", values.quantity.toString());

            const res = await consumeLotAction(formData);
            if (res.success) {
                toast.success(res.message);
                setOpen(false);
                form.reset();
            } else {
                toast.error(res.message);
            }
        } catch (error: any) {
            toast.error("Erro ao registar consumo");
        } finally {
            setLoading(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="bg-slate-900/50 border-slate-800 hover:bg-rose-600 hover:text-white rounded-xl shadow-lg font-black uppercase text-[9px] tracking-widest transition-all h-8">
                    <Minus className="h-3 w-3 mr-1.5 stroke-[2px]" />
                    Consumir
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[400px] border-slate-800 bg-slate-950 shadow-2xl p-0 overflow-hidden text-slate-100">
                <DialogHeader className="p-6 pb-2 border-b border-white/5 bg-white/5">
                    <DialogTitle className="text-sm font-black uppercase tracking-widest italic text-white">Consumo de Lote</DialogTitle>
                    <DialogDescription className="text-[11px] text-slate-500 italic">
                        Reduzir stock do lote <span className="text-rose-400 font-mono font-bold">{lotCode}</span>.
                    </DialogDescription>
                </DialogHeader>

                <div className="p-6">
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                            <FormField
                                control={form.control}
                                name="quantity"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Quantidade a Consumir</FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <Input
                                                    type="number"
                                                    step="0.01"
                                                    {...field}
                                                    className="bg-slate-900/50 border-slate-800 focus:border-rose-500/50 transition-all rounded-xl h-11 pr-12 text-lg font-mono"
                                                />
                                                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-black uppercase text-slate-500">
                                                    {unit}
                                                </div>
                                            </div>
                                        </FormControl>
                                        <FormDescription className="text-[10px] text-slate-500 italic ml-1">
                                            Stock disponível: <span className="text-slate-300 font-bold">{maxQuantity} {unit}</span>
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <DialogFooter>
                                <Button type="submit" disabled={loading} className="w-full bg-rose-600 hover:bg-rose-500 text-white font-black uppercase text-[10px] tracking-widest h-11 rounded-xl shadow-lg shadow-rose-900/20 transition-all">
                                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "CONFIRMAR CONSUMO"}
                                </Button>
                            </DialogFooter>
                        </form>
                    </Form>
                </div>
            </DialogContent>
        </Dialog>
    );
}

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
                <Button variant="outline" size="sm" className="h-7 text-[10px] border-slate-700 hover:bg-slate-800">
                    <Minus className="h-3 w-3 mr-1" />
                    Consumir
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[400px] bg-slate-950 border-slate-800 text-slate-200">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Minus className="h-5 w-5 text-amber-400" />
                        Registar Consumo
                    </DialogTitle>
                    <DialogDescription>
                        Reduzir stock do lote <span className="font-mono text-white">{lotCode}</span>.
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                        <FormField
                            control={form.control}
                            name="quantity"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Quantidade a Consumir</FormLabel>
                                    <FormControl>
                                        <div className="relative">
                                            <Input
                                                type="number"
                                                step="0.01"
                                                {...field}
                                                className="bg-slate-900 border-slate-800 pr-12"
                                            />
                                            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500 font-mono">
                                                {unit}
                                            </div>
                                        </div>
                                    </FormControl>
                                    <FormDescription className="text-[10px]">
                                        Disponível: {maxQuantity} {unit}
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <DialogFooter>
                            <Button type="button" variant="ghost" onClick={() => setOpen(false)} disabled={loading}>
                                Cancelar
                            </Button>
                            <Button type="submit" disabled={loading} className="bg-amber-600 hover:bg-amber-700 text-white">
                                {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                                Confirmar Consumo
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}

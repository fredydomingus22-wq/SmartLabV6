"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { SamplingPointSchema, SamplingPointFormValues } from "@/schemas/compliance";
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
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, Edit2, Loader2, MapPin } from "lucide-react";
import { createSamplingPoint, updateSamplingPoint } from "@/app/actions/environmental";
import { toast } from "sonner";

interface PointDialogProps {
    mode: "create" | "edit";
    zoneId?: string;
    point?: any;
}

export function PointDialog({ mode, zoneId, point }: PointDialogProps) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    const form = useForm<SamplingPointFormValues>({
        resolver: zodResolver(SamplingPointSchema),
        defaultValues: {
            zone_id: zoneId || point?.zone_id || "",
            name: point?.name || "",
            description: point?.description || "",
            frequency: point?.frequency || "Mensal",
        },
    });

    async function onSubmit(values: SamplingPointFormValues) {
        setLoading(true);
        try {
            if (mode === "create") {
                await createSamplingPoint(values);
                toast.success("Ponto de amostragem criado!");
            } else {
                await updateSamplingPoint(point.id, values);
                toast.success("Ponto de amostragem atualizado!");
            }
            setOpen(false);
            form.reset();
        } catch (error: any) {
            toast.error(error.message || "Erro ao guardar ponto.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {mode === "create" ? (
                    <Button variant="outline" size="sm" className="h-8 gap-2">
                        <Plus className="h-3.5 w-3.5" />
                        Adicionar Ponto
                    </Button>
                ) : (
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Edit2 className="h-3.5 w-3.5" />
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{mode === "create" ? "Novo Ponto de Amostragem" : "Editar Ponto"}</DialogTitle>
                    <DialogDescription>
                        Especifique o local e a frequência de monitorização.
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Nome do Ponto</FormLabel>
                                    <FormControl>
                                        <Input placeholder="ex: Ralo A-1" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Descrição/Localização</FormLabel>
                                    <FormControl>
                                        <Input placeholder="ex: Canto sul da sala de mistura" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="frequency"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Frequência</FormLabel>
                                    <FormControl>
                                        <Input placeholder="ex: Semanal, Quinzenal, Mensal" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <DialogFooter className="pt-4">
                            <Button type="submit" disabled={loading}>
                                {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                                {mode === "create" ? "Criar Ponto" : "Salvar Alterações"}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}

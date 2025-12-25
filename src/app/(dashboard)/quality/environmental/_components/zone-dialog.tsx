"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { EnvironmentalZoneSchema } from "@/schemas/compliance";
import type { z } from "zod";

type EnvironmentalZoneFormValues = z.infer<typeof EnvironmentalZoneSchema>;
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Edit2, Loader2 } from "lucide-react";
import { createEnvironmentalZone, updateEnvironmentalZone } from "@/app/actions/environmental";
import { toast } from "sonner";

interface ZoneDialogProps {
    mode: "create" | "edit";
    zone?: any;
}

export function ZoneDialog({ mode, zone }: ZoneDialogProps) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    const form = useForm<EnvironmentalZoneFormValues>({
        resolver: zodResolver(EnvironmentalZoneSchema),
        defaultValues: {
            name: zone?.name || "",
            description: zone?.description || "",
            risk_level: zone?.risk_level || 3,
        },
    });

    async function onSubmit(values: EnvironmentalZoneFormValues) {
        setLoading(true);
        try {
            if (mode === "create") {
                await createEnvironmentalZone(values);
                toast.success("Zona ambiental criada com sucesso!");
            } else {
                await updateEnvironmentalZone(zone.id, values);
                toast.success("Zona ambiental atualizada!");
            }
            setOpen(false);
            form.reset();
        } catch (error: any) {
            toast.error(error.message || "Erro ao guardar zona.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {mode === "create" ? (
                    <Button className="gap-2">
                        <Plus className="h-4 w-4" />
                        Nova Zona
                    </Button>
                ) : (
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Edit2 className="h-3.5 w-3.5" />
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{mode === "create" ? "Criar Zona Ambiental" : "Editar Zona"}</DialogTitle>
                    <DialogDescription>
                        Defina as zonas de monitorização ambiental e o seu nível de risco.
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Nome da Zona</FormLabel>
                                    <FormControl>
                                        <Input placeholder="ex: Linha de Enchimento 1" {...field} />
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
                                    <FormLabel>Descrição</FormLabel>
                                    <FormControl>
                                        <Input placeholder="ex: Área de alto risco microbiológico" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="risk_level"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Nível de Risco (1-4)</FormLabel>
                                    <Select onValueChange={(v) => field.onChange(parseInt(v))} defaultValue={field.value.toString()}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Selecione o risco" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="1">Zona 1 (Alto Risco - Contacto com Produto)</SelectItem>
                                            <SelectItem value="2">Zona 2 (Risco Médio-Alto - Próximo do Produto)</SelectItem>
                                            <SelectItem value="3">Zona 3 (Risco Médio - Área de Produção)</SelectItem>
                                            <SelectItem value="4">Zona 4 (Baixo Risco - Áreas Periféricas)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <DialogFooter className="pt-4">
                            <Button type="submit" disabled={loading}>
                                {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                                {mode === "create" ? "Criar Zona" : "Salvar Alterações"}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}

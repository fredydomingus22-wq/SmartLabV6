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
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Loader2 } from "lucide-react";
import { createRawMaterialAction } from "@/app/actions/raw-materials";
import { toast } from "sonner";
import { SearchableSelect } from "@/components/smart/searchable-select";
import { ScrollArea } from "@/components/ui/scroll-area";

const formSchema = z.object({
    name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
    code: z.string().min(2, "Código deve ter pelo menos 2 caracteres"),
    description: z.string().optional(),
    category: z.string().optional(),
    unit: z.string().default("kg"),
    allergens: z.string().optional(),
    storage_conditions: z.string().optional(),
    plant_id: z.string().uuid("Unidade inválida"),
});

interface CreateRawMaterialDialogProps {
    plantId: string;
}

export function CreateRawMaterialDialog({ plantId }: CreateRawMaterialDialogProps) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema) as any,
        defaultValues: {
            name: "",
            code: "",
            description: "",
            category: "",
            unit: "kg",
            allergens: "",
            storage_conditions: "",
            plant_id: plantId,
        },
    });

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setLoading(true);
        try {
            const formData = new FormData();
            Object.entries(values).forEach(([key, value]) => {
                if (value) formData.append(key, value);
            });

            const res = await createRawMaterialAction(formData);
            if (res.success) {
                toast.success(res.message);
                setOpen(false);
                form.reset();
            } else {
                toast.error(res.message);
            }
        } catch (error: any) {
            toast.error("Erro ao configurar matéria-prima");
        } finally {
            setLoading(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="bg-slate-900/50 border-slate-800 hover:bg-blue-600 hover:text-white rounded-xl shadow-lg font-black uppercase text-[10px] tracking-widest transition-all">
                    <Plus className="h-3.5 w-3.5 mr-2 stroke-[1.5px]" />
                    Nova Matéria-Prima
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] border-slate-800 bg-slate-950 shadow-2xl p-0 overflow-hidden max-h-[95vh] flex flex-col text-slate-100">
                <DialogHeader className="p-6 pb-2 border-b border-white/5 bg-white/5">
                    <DialogTitle className="text-sm font-black uppercase tracking-widest italic text-white">Registo de Matéria-Prima</DialogTitle>
                    <DialogDescription className="text-[11px] text-slate-500 italic">
                        Configuração técnica de novos recursos para o mestre de materiais.
                    </DialogDescription>
                </DialogHeader>

                <ScrollArea className="flex-1">
                    <div className="p-6">
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="code"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Código Técnico</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="ex: MP-001" {...field} className="bg-slate-900/50 border-slate-800 focus:border-blue-500/50 transition-all rounded-xl h-11" />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="name"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Designação da Matéria</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="ex: Farinha de Trigo" {...field} className="bg-slate-900/50 border-slate-800 focus:border-blue-500/50 transition-all rounded-xl h-11" />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="category"
                                        render={({ field }) => (
                                            <FormItem className="flex flex-col">
                                                <FormLabel className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Categoria Operacional</FormLabel>
                                                <SearchableSelect
                                                    options={[
                                                        { label: "Cereais", value: "cereais" },
                                                        { label: "Laticínios", value: "laticinios" },
                                                        { label: "Frutas", value: "frutas" },
                                                        { label: "Aditivos", value: "aditivos" },
                                                        { label: "Embalagens", value: "embalagens" },
                                                        { label: "Outros", value: "outros" },
                                                    ]}
                                                    value={field.value}
                                                    onValueChange={field.onChange}
                                                    placeholder="Selecione..."
                                                    className="h-11 rounded-xl bg-slate-900/50 border-slate-800 focus:ring-blue-500/20"
                                                />
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="unit"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Unidade Padrão</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="ex: kg, L, un" {...field} className="bg-slate-900/50 border-slate-800 focus:border-blue-500/50 transition-all rounded-xl h-11" />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <FormField
                                    control={form.control}
                                    name="allergens"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Declaração de Alérgenos</FormLabel>
                                            <FormControl>
                                                <Input placeholder="ex: Glúten, Soja (separados por vírgula)" {...field} className="bg-slate-900/50 border-slate-800 focus:border-blue-500/50 transition-all rounded-xl h-11" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="storage_conditions"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Condições de Armazenamento</FormLabel>
                                            <FormControl>
                                                <Input placeholder="ex: Local fresco e seco (< 25ºC)" {...field} className="bg-slate-900/50 border-slate-800 focus:border-blue-500/50 transition-all rounded-xl h-11" />
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
                                            <FormLabel className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Descrição Detalhada</FormLabel>
                                            <FormControl>
                                                <Textarea
                                                    placeholder="Notas técnicas sobre a matéria-prima..."
                                                    {...field}
                                                    className="bg-slate-900/50 border-slate-800 focus:border-blue-500/50 transition-all rounded-xl resize-none"
                                                    rows={3}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <DialogFooter className="pt-2">
                                    <Button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black uppercase text-[10px] tracking-widest h-11 rounded-xl shadow-lg shadow-blue-900/20 transition-all">
                                        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "REGISTAR MATÉRIA-PRIMA"}
                                    </Button>
                                </DialogFooter>
                            </form>
                        </Form>
                    </div>
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
}

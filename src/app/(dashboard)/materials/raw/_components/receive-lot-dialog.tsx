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
import { Label } from "@/components/ui/label";
import { receiveLotAction } from "@/app/actions/raw-materials";
import { FileUpload } from "@/components/smart/file-upload";
import { toast } from "sonner";
import { SearchableSelect } from "@/components/smart/searchable-select";
import { ScrollArea } from "@/components/ui/scroll-area";

const formSchema = z.object({
    raw_material_id: z.string().uuid("Seleccione uma matéria-prima"),
    supplier_id: z.string().uuid("Seleccione um fornecedor").optional(),
    lot_code: z.string().min(1, "Código do lote é obrigatório"),
    quantity_received: z.coerce.number().positive("Quantidade deve ser positiva"),
    unit: z.string().min(1, "Unidade é obrigatória"),
    expiry_date: z.string().optional(),
    production_date: z.string().optional(),
    certificate_number: z.string().optional(),
    coa_file_url: z.string().url().optional().or(z.literal("")),
    storage_location: z.string().optional(),
    notes: z.string().optional(),
    plant_id: z.string().uuid("Unidade inválida"),
});

interface ReceiveLotDialogProps {
    plantId: string;
    materials: { id: string; name: string; code: string; unit: string }[];
    suppliers: { id: string; name: string }[];
}

export function ReceiveLotDialog({ plantId, materials, suppliers }: ReceiveLotDialogProps) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema) as any,
        defaultValues: {
            raw_material_id: "",
            supplier_id: "",
            lot_code: "",
            quantity_received: 0,
            unit: "",
            expiry_date: "",
            production_date: "",
            certificate_number: "",
            coa_file_url: "",
            storage_location: "",
            notes: "",
            plant_id: plantId,
        },
    });

    const onMaterialChange = (materialId: string) => {
        const material = materials.find(m => m.id === materialId);
        if (material) {
            form.setValue("unit", material.unit);
        }
    };

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setLoading(true);
        try {
            const formData = new FormData();
            Object.entries(values).forEach(([key, value]) => {
                if (value) formData.append(key, value.toString());
            });

            const res = await receiveLotAction(formData);
            if (res.success) {
                toast.success(res.message);
                setOpen(false);
                form.reset();
            } else {
                toast.error(res.message);
            }
        } catch (error: any) {
            toast.error("Erro ao registar receção de lote");
        } finally {
            setLoading(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="bg-slate-900/50 border-slate-800 hover:bg-emerald-600 hover:text-white rounded-xl shadow-lg font-black uppercase text-[10px] tracking-widest transition-all">
                    <Plus className="h-3.5 w-3.5 mr-2 stroke-[1.5px]" />
                    Receber Lote
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] border-slate-800 bg-slate-950 shadow-2xl p-0 overflow-hidden max-h-[95vh] flex flex-col text-slate-100">
                <DialogHeader className="p-6 pb-2 border-b border-white/5 bg-white/5">
                    <DialogTitle className="text-sm font-black uppercase tracking-widest italic text-white">Receção de Lote (Matéria-Prima)</DialogTitle>
                    <DialogDescription className="text-[11px] text-slate-500 italic">
                        Registo de entrada e conformidade documental de lotes recebidos.
                    </DialogDescription>
                </DialogHeader>

                <ScrollArea className="flex-1">
                    <div className="p-6">
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="raw_material_id"
                                        render={({ field }) => (
                                            <FormItem className="flex flex-col">
                                                <FormLabel className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Matéria-Prima</FormLabel>
                                                <SearchableSelect
                                                    options={materials.map(m => ({ label: `${m.name} (${m.code})`, value: m.id }))}
                                                    value={field.value}
                                                    onValueChange={(val) => {
                                                        field.onChange(val);
                                                        onMaterialChange(val);
                                                    }}
                                                    placeholder="Seleccione..."
                                                    className="h-11 rounded-xl bg-slate-900/50 border-slate-800 focus:ring-emerald-500/20"
                                                />
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="supplier_id"
                                        render={({ field }) => (
                                            <FormItem className="flex flex-col">
                                                <FormLabel className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Fornecedor Homologado</FormLabel>
                                                <SearchableSelect
                                                    options={suppliers.map(s => ({ label: s.name, value: s.id }))}
                                                    value={field.value}
                                                    onValueChange={field.onChange}
                                                    placeholder="Seleccione..."
                                                    className="h-11 rounded-xl bg-slate-900/50 border-slate-800 focus:ring-emerald-500/20"
                                                />
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="lot_code"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Código do Lote</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="ex: LOT-2023-001" {...field} className="bg-slate-900/50 border-slate-800 focus:border-emerald-500/50 transition-all rounded-xl h-11" />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <div className="grid grid-cols-2 gap-2">
                                        <FormField
                                            control={form.control}
                                            name="quantity_received"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Qtd Recebida</FormLabel>
                                                    <FormControl>
                                                        <Input type="number" step="0.01" {...field} className="bg-slate-900/50 border-slate-800 focus:border-emerald-500/50 transition-all rounded-xl h-11" />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="unit"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Unidade</FormLabel>
                                                    <FormControl>
                                                        <Input {...field} className="bg-slate-900/50 border-slate-800 focus:border-emerald-500/50 transition-all rounded-xl h-11" />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="production_date"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Data de Fabrico</FormLabel>
                                                <FormControl>
                                                    <Input type="date" {...field} className="bg-slate-900/50 border-slate-800 focus:border-emerald-500/50 transition-all rounded-xl h-11 [color-scheme:dark]" />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="expiry_date"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Data de Validade</FormLabel>
                                                <FormControl>
                                                    <Input type="date" {...field} className="bg-slate-900/50 border-slate-800 focus:border-emerald-500/50 transition-all rounded-xl h-11 [color-scheme:dark]" />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="certificate_number"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Nº Certificado / COA</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="ex: COA-9988" {...field} className="bg-slate-900/50 border-slate-800 focus:border-emerald-500/50 transition-all rounded-xl h-11" />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="storage_location"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Célula de Armazenamento</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="ex: Armazém MP - Prateleira A1" {...field} className="bg-slate-900/50 border-slate-800 focus:border-emerald-500/50 transition-all rounded-xl h-11" />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <div className="border border-white/5 rounded-2xl p-4 bg-white/5">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1 mb-2 block">Documentação de Conformidade (COA)</Label>
                                    <FileUpload
                                        name="coa_file_url"
                                        label="Submeter Certificado de Análise"
                                        bucket="coa-documents"
                                        folder="raw-materials"
                                        onUploadComplete={(url) => form.setValue("coa_file_url", url)}
                                    />
                                </div>

                                <FormField
                                    control={form.control}
                                    name="notes"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Notas Operacionais</FormLabel>
                                            <FormControl>
                                                <Textarea
                                                    placeholder="Observações relevantes sobre o lote..."
                                                    {...field}
                                                    className="bg-slate-900/50 border-slate-800 focus:border-emerald-500/50 transition-all rounded-xl resize-none"
                                                    rows={3}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <DialogFooter className="pt-2">
                                    <Button type="submit" disabled={loading} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black uppercase text-[10px] tracking-widest h-11 rounded-xl shadow-lg shadow-emerald-900/20 transition-all">
                                        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "REGISTAR RECEÇÃO DE LOTE"}
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

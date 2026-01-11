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
import { Plus, Layers, Loader2, Calendar as CalendarIcon } from "lucide-react";
import { receiveLotAction } from "@/app/actions/raw-materials";
import { FileUpload } from "@/components/smart/file-upload";
import { toast } from "sonner";
import { SearchableSelect } from "@/components/smart/searchable-select";

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

    // Update unit when material is selected
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
            toast.error("Erro ao receber lote");
        } finally {
            setLoading(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl shadow-lg shadow-emerald-900/20 font-semibold tracking-wide border border-transparent hover:border-emerald-400/30 transition-all duration-300">
                    <Plus className="h-4 w-4 mr-2" />
                    Receber Lote
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] bg-slate-950 border-slate-800 max-h-[90vh] overflow-y-auto shadow-2xl shadow-emerald-900/10">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Layers className="h-5 w-5 text-blue-400" />
                        Receção de Lote (MP)
                    </DialogTitle>
                    <DialogDescription>
                        Registe a entrada de um novo lote de matéria-prima.
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="raw_material_id"
                                render={({ field }) => (
                                    <FormItem className="flex flex-col">
                                        <FormLabel>Matéria-Prima</FormLabel>
                                        <SearchableSelect
                                            options={materials.map(m => ({ label: `${m.name} (${m.code})`, value: m.id }))}
                                            value={field.value}
                                            onValueChange={(val) => {
                                                field.onChange(val);
                                                onMaterialChange(val);
                                            }}
                                            placeholder="Seleccione..."
                                            className="bg-slate-900 border-slate-800"
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
                                        <FormLabel>Fornecedor</FormLabel>
                                        <SearchableSelect
                                            options={suppliers.map(s => ({ label: s.name, value: s.id }))}
                                            value={field.value}
                                            onValueChange={field.onChange}
                                            placeholder="Seleccione..."
                                            className="bg-slate-900 border-slate-800"
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
                                        <FormLabel>Código do Lote</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Ex: LOT-2023-001" {...field} className="bg-slate-900/50 border-slate-700/50 focus:border-emerald-500/50 focus:ring-emerald-500/20 transition-all text-slate-100" />
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
                                            <FormLabel>Qtd Recebida</FormLabel>
                                            <FormControl>
                                                <Input type="number" step="0.01" {...field} className="bg-slate-900/50 border-slate-700/50 focus:border-emerald-500/50 focus:ring-emerald-500/20 transition-all text-slate-100" />
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
                                            <FormLabel>Unidade</FormLabel>
                                            <FormControl>
                                                <Input {...field} className="bg-slate-900/50 border-slate-700/50 focus:border-emerald-500/50 focus:ring-emerald-500/20 transition-all text-slate-100" />
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
                                        <FormLabel>Data de Produção</FormLabel>
                                        <FormControl>
                                            <Input type="date" {...field} className="bg-slate-900 border-slate-800" />
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
                                        <FormLabel>Data de Validade</FormLabel>
                                        <FormControl>
                                            <Input type="date" {...field} className="bg-slate-900 border-slate-800" />
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
                                        <FormLabel>Nº Certificado / COA</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Ex: COA-9988" {...field} className="bg-slate-900/50 border-slate-700/50 focus:border-emerald-500/50 focus:ring-emerald-500/20 transition-all text-slate-100" />
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
                                        <FormLabel>Local de Armazenamento</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Ex: Armazém MP - Prateleira A1" {...field} className="bg-slate-900/50 border-slate-700/50 focus:border-emerald-500/50 focus:ring-emerald-500/20 transition-all text-slate-100" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="border border-white/5 rounded-xl p-4 bg-white/5">
                            <FileUpload
                                name="coa_file_url"
                                label="Anexo do Certificado (COA)"
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
                                    <FormLabel>Notas</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Observações adicionais..."
                                            {...field}
                                            className="bg-slate-900/50 border-slate-700/50 focus:border-emerald-500/50 focus:ring-emerald-500/20 transition-all text-slate-100 min-h-[60px]"
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <DialogFooter>
                            <Button type="button" variant="ghost" onClick={() => setOpen(false)} disabled={loading}>
                                Cancelar
                            </Button>
                            <Button type="submit" disabled={loading} className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg shadow-emerald-900/20 border border-transparent hover:border-emerald-400/30 transition-all duration-300">
                                {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                                Receber Lote
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}

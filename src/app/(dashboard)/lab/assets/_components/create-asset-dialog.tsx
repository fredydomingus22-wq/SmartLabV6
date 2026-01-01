"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTransition, useState, useEffect } from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CreateLabAssetFormValues, CreateLabAssetSchema } from "@/schemas/lab";
import { createLabAssetAction, updateLabAssetAction, deleteLabAssetAction } from "@/app/actions/lab_modules/assets";
import { Plus, RotateCw, FlaskConical, Trash2 } from "lucide-react";

interface AssetDialogProps {
    plants?: { id: string; name: string }[];
    children?: React.ReactNode; // For custom trigger
    assetToEdit?: any; // Using any for now to facilitate mapping, ideally should be a type matching the DB schema
    mode?: "create" | "edit";
}

export function AssetDialog({ plants, children, assetToEdit, mode = "create" }: AssetDialogProps) {
    const [open, setOpen] = useState(false);
    const [isPending, startTransition] = useTransition();

    // Helper to format ISO date to YYYY-MM-DD for input[type=date]
    const formatDate = (dateString: string | null) => {
        if (!dateString) return "";
        return new Date(dateString).toISOString().split('T')[0];
    };

    const form = useForm<CreateLabAssetFormValues>({
        resolver: zodResolver(CreateLabAssetSchema) as any,
        defaultValues: {
            name: "",
            code: "",
            manufacturer: "",
            model: "",
            serial_number: "",
            calibration_date: "",
            next_calibration_date: "",
            asset_category: "general",
            criticality: "medium",
            status: "active",
        },
    });

    // Reset form when opening/changing mode
    useEffect(() => {
        if (open) {
            if (mode === "edit" && assetToEdit) {
                form.reset({
                    name: assetToEdit.name || "",
                    code: assetToEdit.code || "",
                    manufacturer: assetToEdit.manufacturer || "",
                    model: assetToEdit.model || "",
                    serial_number: assetToEdit.serial_number || "",
                    calibration_date: formatDate(assetToEdit.last_calibration_date),
                    next_calibration_date: formatDate(assetToEdit.next_calibration_date),
                    asset_category: assetToEdit.asset_category || "general",
                    criticality: assetToEdit.criticality || "medium",
                    status: assetToEdit.status || "active",
                    plant_id: assetToEdit.plant_id || undefined
                });
            } else {
                form.reset({
                    name: "",
                    code: "",
                    manufacturer: "",
                    model: "",
                    serial_number: "",
                    calibration_date: "",
                    next_calibration_date: "",
                    asset_category: "general",
                    criticality: "medium",
                    status: "active",
                });
            }
        }
    }, [open, mode, assetToEdit, form]);

    const onSubmit = (data: CreateLabAssetFormValues) => {
        startTransition(async () => {
            const payload = {
                ...data,
                plant_id: data.plant_id || undefined,
                calibration_date: data.calibration_date || undefined,
                next_calibration_date: data.next_calibration_date || undefined,
            };

            let result;
            if (mode === "edit" && assetToEdit) {
                result = await updateLabAssetAction(assetToEdit.id, payload);
            } else {
                result = await createLabAssetAction(payload);
            }

            if (result.success) {
                toast.success(mode === "edit" ? "Instrumento atualizado!" : "Instrumento criado com sucesso!");
                setOpen(false);
                if (mode === "create") form.reset();
            } else {
                toast.error(result.message || "Erro na operação.");
            }
        });
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {children || (
                    <Button
                        className="relative z-10 bg-emerald-600 hover:bg-emerald-500 text-white font-bold h-12 px-8 rounded-xl shadow-lg shadow-emerald-500/20 active:scale-95 transition-all"
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        Novo Instrumento
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-y-auto glass border-white/10">
                <DialogHeader>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-emerald-500/10 rounded-lg">
                            <FlaskConical className="h-5 w-5 text-emerald-400" />
                        </div>
                        <DialogTitle className="text-xl font-bold text-white">
                            {mode === "edit" ? "Editar Instrumento" : "Novo Instrumento"}
                        </DialogTitle>
                    </div>
                    <DialogDescription className="text-slate-400">
                        {mode === "edit" ? "Atualize as informações do equipamento." : "Adicione um novo equipamento ao inventário do laboratório."}
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        {/* Form fields remain mostly same, just ensuring plants are handled */}
                        <div className="grid grid-cols-2 gap-4">
                            {plants && plants.length > 0 && (
                                <FormField
                                    control={form.control}
                                    name="plant_id"
                                    render={({ field }) => (
                                        <FormItem className="col-span-2">
                                            <FormLabel className="text-slate-300">Unidade (Planta)</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value || undefined} value={field.value || undefined}>
                                                <FormControl>
                                                    <SelectTrigger className="bg-white/5 border-white/10 text-white">
                                                        <SelectValue placeholder="Selecione a planta de origem" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {plants.map((plant) => (
                                                        <SelectItem key={plant.id} value={plant.id}>
                                                            {plant.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            )}

                            {/* Name */}
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem className="col-span-2">
                                        <FormLabel className="text-slate-300">Nome do Instrumento</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Ex: Balança Analítica 01" {...field} className="bg-white/5 border-white/10 text-white placeholder:text-slate-600 focus:border-emerald-500/50" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Code */}
                            <FormField
                                control={form.control}
                                name="code"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-slate-300">Código Interno</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Ex: INS-001" {...field} className="bg-white/5 border-white/10 text-white placeholder:text-slate-600" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Category */}
                            <FormField
                                control={form.control}
                                name="asset_category"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-slate-300">Categoria</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                                            <FormControl>
                                                <SelectTrigger className="bg-white/5 border-white/10 text-white">
                                                    <SelectValue placeholder="Selecione..." />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="balance">Balança</SelectItem>
                                                <SelectItem value="ph_meter">pH-Metro</SelectItem>
                                                <SelectItem value="refractometer">Refratómetro</SelectItem>
                                                <SelectItem value="thermometer">Termómetro</SelectItem>
                                                <SelectItem value="spectrophotometer">Espectrofotómetro</SelectItem>
                                                <SelectItem value="viscometer">Viscosímetro</SelectItem>
                                                <SelectItem value="general">Geral</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Manufacturer */}
                            <FormField
                                control={form.control}
                                name="manufacturer"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-slate-300">Fabricante</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Ex: Mettler Toledo" {...field} className="bg-white/5 border-white/10 text-white placeholder:text-slate-600" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Model */}
                            <FormField
                                control={form.control}
                                name="model"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-slate-300">Modelo</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Ex: XPE205" {...field} className="bg-white/5 border-white/10 text-white placeholder:text-slate-600" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Serial Number */}
                            <FormField
                                control={form.control}
                                name="serial_number"
                                render={({ field }) => (
                                    <FormItem className="col-span-2">
                                        <FormLabel className="text-slate-300">Número de Série</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Ex: 123456789" {...field} className="bg-white/5 border-white/10 text-white placeholder:text-slate-600" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Calibration Date */}
                            <FormField
                                control={form.control}
                                name="calibration_date"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-slate-300">Última Calibração</FormLabel>
                                        <FormControl>
                                            <Input type="date" {...field} className="bg-white/5 border-white/10 text-white [color-scheme:dark]" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Next Calibration */}
                            <FormField
                                control={form.control}
                                name="next_calibration_date"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-slate-300">Próxima Calibração</FormLabel>
                                        <FormControl>
                                            <Input type="date" {...field} className="bg-white/5 border-white/10 text-white [color-scheme:dark]" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Criticality */}
                            <FormField
                                control={form.control}
                                name="criticality"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-slate-300">Criticidade</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                                            <FormControl>
                                                <SelectTrigger className="bg-white/5 border-white/10 text-white">
                                                    <SelectValue />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="low">Baixa</SelectItem>
                                                <SelectItem value="medium">Média</SelectItem>
                                                <SelectItem value="high">Alta</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <DialogFooter className={mode === "edit" ? "sm:justify-between" : ""}>
                            {mode === "edit" && (
                                <Button
                                    type="button"
                                    variant="destructive"
                                    onClick={() => {
                                        if (confirm("Tem a certeza que deseja eliminar este instrumento? Esta ação não pode ser desfeita.")) {
                                            startTransition(async () => {
                                                const result = await deleteLabAssetAction(assetToEdit.id);
                                                if (result.success) {
                                                    toast.success("Instrumento eliminado!");
                                                    setOpen(false);
                                                } else {
                                                    toast.error(result.message);
                                                }
                                            });
                                        }
                                    }}
                                    disabled={isPending}
                                >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Eliminar
                                </Button>
                            )}
                            <div className="flex gap-2">
                                <Button type="button" variant="ghost" onClick={() => setOpen(false)} className="text-slate-400 hover:text-white">
                                    Cancelar
                                </Button>
                                <Button type="submit" disabled={isPending} className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold min-w-[120px]">
                                    {isPending ? <RotateCw className="h-4 w-4 animate-spin" /> : (mode === "edit" ? "Atualizar" : "Criar Instrumento")}
                                </Button>
                            </div>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog >
    );
}

// Backwards compatibility export if needed, or simply export the new name
export const CreateAssetDialog = AssetDialog;

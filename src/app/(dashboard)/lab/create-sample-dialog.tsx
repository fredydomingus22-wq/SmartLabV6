"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SearchableSelect } from "@/components/smart/searchable-select";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, Loader2, FlaskConical, Beaker, MapPin, Calendar, User, Info } from "lucide-react";
import { createSampleAction } from "@/app/actions/lab";
import { CreateSampleSchema, CreateSampleFormValues } from "@/schemas/lab";
import { isFinishedProduct, isIntermediateProduct, isRawMaterial, isUtility } from "@/lib/constants/lab";
import { cn } from "@/lib/utils";
import { useTankContext } from "@/hooks/useTankContext";

interface Tank {
    id: string;
    code: string;
    status: string;
    volume?: number | null;
    unit?: string | null;
    batch: {
        id: string;
        code: string;
        product: { id: string; name: string } | { id: string; name: string }[] | null;
    } | { id: string; code: string; product: { id: string; name: string } | { id: string; name: string }[] | null; }[] | null;
}

interface SampleType {
    id: string;
    name: string;
    code: string;
    test_category?: string;
}

interface SamplingPoint {
    id: string;
    name: string;
    code: string;
    location?: string;
}

interface CreateSampleDialogProps {
    sampleTypes: SampleType[];
    tanks: Tank[];
    samplingPoints: SamplingPoint[];
    plantId: string;
    users: { id: string, full_name: string | null, role: string }[];
}

export function CreateSampleDialog({ sampleTypes, tanks, samplingPoints, plantId, users }: CreateSampleDialogProps) {
    const searchParams = useSearchParams();
    const router = useRouter();
    const [open, setOpen] = useState(false);

    // Initialize form
    const form = useForm<CreateSampleFormValues>({
        resolver: zodResolver(CreateSampleSchema),
        defaultValues: {
            code: "AUTO-GENERATED",
            plant_id: plantId,
            collected_at: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
        },
    });

    // Auto-open if create=true is in URL
    useEffect(() => {
        if (searchParams.get("create") === "true") {
            setOpen(true);
            const params = new URLSearchParams(searchParams.toString());
            params.delete("create");
            router.replace(`/lab?${params.toString()}`, { scroll: false });
        }
    }, [searchParams, router]);

    const isSubmitting = form.formState.isSubmitting;
    const selectedTankId = form.watch("intermediate_product_id");
    const selectedTypeId = form.watch("sample_type_id");
    const selectedType = sampleTypes.find(t => t.id === selectedTypeId);

    // Business Logic
    const isProductSample = selectedType?.code ? (isFinishedProduct(selectedType.code) || isIntermediateProduct(selectedType.code)) : false;

    // Use shared context hook
    const tankContext = useTankContext(selectedTankId || null);

    const onSubmit = async (data: CreateSampleFormValues) => {
        const formData = new FormData();
        formData.append("code", data.code || "");
        formData.append("sample_type_id", data.sample_type_id);
        if (data.collected_at) formData.append("collected_at", data.collected_at);
        if (data.plant_id) formData.append("plant_id", data.plant_id);
        if (data.assignee_id) formData.append("assignee_id", data.assignee_id);

        if (isProductSample) {
            if (data.intermediate_product_id) {
                formData.append("intermediate_product_id", data.intermediate_product_id);
                // Use resolved context from hook
                if (tankContext.batchId) {
                    formData.append("production_batch_id", tankContext.batchId);
                }
            }
        }

        if (!isProductSample || data.sampling_point_id) {
            if (data.sampling_point_id) formData.append("sampling_point_id", data.sampling_point_id);
        }

        const result = await createSampleAction(formData);

        if (result.success) {
            toast.success("Amostra Registada", {
                description: `Código: ${(result as any).code || 'Sucesso'}`
            });
            setOpen(false);
            form.reset();
            router.refresh();
        } else {
            toast.error("Erro no Registo", {
                description: result.message
            });
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 transition-all">
                    <Plus className="h-4 w-4 mr-2" />
                    Nova Amostra
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[900px] p-0 overflow-hidden gap-0">
                <DialogHeader className="p-6 pb-4 bg-slate-50/50 dark:bg-slate-900/50 backdrop-blur-sm border-b">
                    <DialogTitle className="flex items-center gap-2 text-xl">
                        <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                            <FlaskConical className="h-5 w-5" />
                        </div>
                        <div>
                            Registo de Amostra
                            <span className="block text-xs font-normal text-muted-foreground mt-1">
                                Preencha os detalhes da colheita para controlo laboratorial.
                            </span>
                        </div>
                    </DialogTitle>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="contents">
                        <ScrollArea className="h-[65vh] p-6 bg-slate-50/30 dark:bg-slate-950/30">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                                {/* SECTION 1: IDENTIFICATION */}
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-100 mb-2">
                                        <Info className="h-4 w-4 text-blue-500" />
                                        Identificação Base
                                    </div>
                                    <div className="p-4 rounded-xl border bg-card/50 shadow-sm space-y-4">
                                        <FormField
                                            control={form.control}
                                            name="sample_type_id"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Tipo de Amostra</FormLabel>
                                                    <SearchableSelect
                                                        options={sampleTypes.map(type => ({
                                                            value: type.id,
                                                            label: `${type.name} (${type.code})`
                                                        }))}
                                                        placeholder="Selecione o tipo..."
                                                        onValueChange={(val) => {
                                                            field.onChange(val);
                                                            // Optional: Reset dependent fields
                                                        }}
                                                        value={field.value}
                                                    />
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <FormField
                                            control={form.control}
                                            name="code"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Código Interno</FormLabel>
                                                    <FormControl>
                                                        <Input {...field} disabled className="bg-slate-100 dark:bg-slate-800 font-mono text-xs" />
                                                    </FormControl>
                                                    <p className="text-[10px] text-muted-foreground">
                                                        Gerado automaticamente (SKU + Data + Sequencial)
                                                    </p>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                </div>

                                {/* SECTION 2: CONTEXT & ORIGIN */}
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-100 mb-2">
                                        <MapPin className="h-4 w-4 text-emerald-500" />
                                        Origem da Amostra
                                    </div>
                                    <div className="p-4 rounded-xl border bg-card/50 shadow-sm space-y-4 min-h-[160px]">
                                        {!selectedTypeId ? (
                                            <div className="flex items-center justify-center h-full text-sm text-muted-foreground italic">
                                                Selecione um tipo de amostra primeiro.
                                            </div>
                                        ) : isProductSample ? (
                                            <FormField
                                                control={form.control}
                                                name="intermediate_product_id"
                                                render={({ field }) => (
                                                    <FormItem className="animate-in fade-in zoom-in-95 duration-300">
                                                        <FormLabel className="flex justify-between">
                                                            Tanque / Lote
                                                            <span className="text-xs font-normal text-emerald-600">Produto em Processo</span>
                                                        </FormLabel>
                                                        <SearchableSelect
                                                            options={tanks.map(tank => {
                                                                const batch = Array.isArray(tank.batch) ? tank.batch[0] : tank.batch;
                                                                const product = Array.isArray(batch?.product) ? batch?.product[0] : batch?.product;
                                                                const productName = product?.name || "Desconhecido";
                                                                return {
                                                                    value: tank.id,
                                                                    label: `${tank.code} - ${productName}`
                                                                };
                                                            })}
                                                            placeholder="Selecione o tanque..."
                                                            onValueChange={field.onChange}
                                                            value={field.value}
                                                        />
                                                        <div className="mt-2 text-xs p-2 bg-emerald-500/10 rounded border border-emerald-500/20 text-emerald-700 dark:text-emerald-400">
                                                            <strong>Lote Associado:</strong> {tankContext.isLoading ? <Loader2 className="inline h-3 w-3 animate-spin ml-1" /> : (tankContext.batchCode || "-")}
                                                        </div>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        ) : (
                                            <FormField
                                                control={form.control}
                                                name="sampling_point_id"
                                                render={({ field }) => (
                                                    <FormItem className="animate-in fade-in zoom-in-95 duration-300">
                                                        <FormLabel>Ponto de Amostragem</FormLabel>
                                                        <SearchableSelect
                                                            options={samplingPoints.map(sp => ({
                                                                value: sp.id,
                                                                label: `${sp.name} (${sp.code})`
                                                            }))}
                                                            placeholder="Selecione o ponto..."
                                                            onValueChange={field.onChange}
                                                            value={field.value}
                                                        />
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        )}
                                    </div>
                                </div>

                                {/* SECTION 3: LOGISTICS */}
                                <div className="space-y-4 md:col-span-2">
                                    <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-100 mb-2">
                                        <Calendar className="h-4 w-4 text-purple-500" />
                                        Logística e Atribuição
                                    </div>
                                    <div className="p-4 rounded-xl border bg-card/50 shadow-sm grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <FormField
                                            control={form.control}
                                            name="assignee_id"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Analista Responsável</FormLabel>
                                                    <SearchableSelect
                                                        options={users.map(u => ({
                                                            value: u.id,
                                                            label: `${u.full_name || 'Usuário'} (${u.role})`
                                                        }))}
                                                        placeholder="Atribuir a..."
                                                        onValueChange={field.onChange}
                                                        value={field.value}
                                                    />
                                                </FormItem>
                                            )}
                                        />

                                        <FormField
                                            control={form.control}
                                            name="collected_at"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Data/Hora da Colheita</FormLabel>
                                                    <FormControl>
                                                        <Input type="datetime-local" {...field} />
                                                    </FormControl>
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                </div>

                            </div>
                        </ScrollArea>

                        <DialogFooter className="p-4 border-t bg-slate-50/50 dark:bg-slate-900/50 backdrop-blur-sm">
                            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                                Cancelar
                            </Button>
                            <Button
                                type="submit"
                                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md border-0"
                                disabled={
                                    isSubmitting ||
                                    !selectedTypeId ||
                                    (isProductSample && !form.watch("intermediate_product_id")) ||
                                    (!isProductSample && !selectedType && false) // Logic simplification for 'not selected'
                                }
                            >
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Registar Amostra
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}

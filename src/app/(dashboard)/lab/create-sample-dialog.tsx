"use client";

import { useState } from "react";
import { format } from "date-fns";
import { useRouter } from "next/navigation";
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
import { Plus, Loader2, FlaskConical } from "lucide-react";
import { createSampleAction } from "@/app/actions/lab";
import { CreateSampleSchema, CreateSampleFormValues } from "@/schemas/lab";

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
}

export function CreateSampleDialog({ sampleTypes, tanks, samplingPoints, plantId }: CreateSampleDialogProps) {
    const [open, setOpen] = useState(false);
    const router = useRouter();

    const form = useForm<CreateSampleFormValues>({
        resolver: zodResolver(CreateSampleSchema),
        defaultValues: {
            code: "AUTO-GENERATED",
            plant_id: plantId,
            collected_at: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
        },
    });

    const isSubmitting = form.formState.isSubmitting;
    const selectedTankId = form.watch("intermediate_product_id");
    const selectedTypeId = form.watch("sample_type_id");
    const selectedType = sampleTypes.find(t => t.id === selectedTypeId);

    // Business Rule: PA (Final Product) and IP (Intermediate) require Batch/Tank.
    // Others (Water, Env, CIP) require Sampling Point.
    const isProductSample = selectedType?.code?.startsWith("PA") || selectedType?.code?.startsWith("IP");
    const isWaterOrEnv = selectedType?.code?.startsWith("WAT") || selectedType?.code?.startsWith("ENV") || selectedType?.code?.startsWith("CIP");

    // Helper to get product name from tank
    const getProductName = (tank: Tank) => {
        const batch = Array.isArray(tank.batch) ? tank.batch[0] : tank.batch;
        if (!batch?.product) return "";
        if (Array.isArray(batch.product)) {
            return batch.product[0]?.name || "";
        }
        return batch.product.name || "";
    };

    // Helper to get batch from tank
    const getBatch = (tank: Tank) => {
        return Array.isArray(tank.batch) ? tank.batch[0] : tank.batch;
    };

    const onSubmit = async (data: CreateSampleFormValues) => {
        const formData = new FormData();
        formData.append("code", data.code || "");
        formData.append("sample_type_id", data.sample_type_id);
        if (data.collected_at) formData.append("collected_at", data.collected_at);
        if (data.plant_id) formData.append("plant_id", data.plant_id);

        // For Product Samples (PA/IP), Tank/Batch is mandatory
        if (isProductSample) {
            if (data.intermediate_product_id) {
                formData.append("intermediate_product_id", data.intermediate_product_id);
                const tank = tanks.find(t => t.id === data.intermediate_product_id);
                const batch = tank ? getBatch(tank) : null;
                if (batch?.id) {
                    formData.append("production_batch_id", batch.id);
                }
            }
        }

        // For Non-Product Samples, Sampling Point is mandatory
        if (!isProductSample || data.sampling_point_id) {
            if (data.sampling_point_id) formData.append("sampling_point_id", data.sampling_point_id);
        }

        const result = await createSampleAction(formData);

        if (result.success) {
            toast.success("Sample Registered", {
                description: result.message
            });
            setOpen(false);
            form.reset();
            router.refresh();
        } else {
            toast.error("Registration Failed", {
                description: result.message
            });
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Sample
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <FlaskConical className="h-5 w-5 text-blue-500" />
                        Register New Sample
                    </DialogTitle>
                    <DialogDescription>
                        Create a sample for laboratory analysis. Link to a Tank for traceability.
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        {/* Sample Code */}
                        <FormField
                            control={form.control}
                            name="code"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Sample Code</FormLabel>
                                    <FormControl>
                                        <Input {...field} disabled className="bg-slate-100 dark:bg-slate-800" />
                                    </FormControl>
                                    <p className="text-[10px] text-muted-foreground">
                                        The official code will be generated automatically based on Product SKU and Sample Type.
                                    </p>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Sample Type */}
                        <FormField
                            control={form.control}
                            name="sample_type_id"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Sample Type *</FormLabel>
                                    <SearchableSelect
                                        options={sampleTypes.map(type => ({
                                            value: type.id,
                                            label: `${type.name} (${type.code})`
                                        }))}
                                        placeholder="Select type..."
                                        onValueChange={field.onChange}
                                        value={field.value}
                                    />
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Tank Selection - Only for PA/IP */}
                        {isProductSample && (
                            <FormField
                                control={form.control}
                                name="intermediate_product_id"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Tank (Intermediate Product) *</FormLabel>
                                        <SearchableSelect
                                            options={tanks.map(tank => ({
                                                value: tank.id,
                                                label: `${tank.code} - ${getProductName(tank)} (${getBatch(tank)?.code || ''})`
                                            }))}
                                            placeholder="Select tank..."
                                            onValueChange={field.onChange}
                                            value={field.value}
                                        />
                                        {selectedTankId && (
                                            <p className="text-xs text-muted-foreground mt-1">
                                                Linked to Batch: {(() => {
                                                    const t = tanks.find(t => t.id === selectedTankId);
                                                    return t ? getBatch(t)?.code : "-";
                                                })()}
                                            </p>
                                        )}
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        )}

                        {/* Sampling Point Selection - Only for Water/Env/CIP */}
                        {!isProductSample && (
                            <FormField
                                control={form.control}
                                name="sampling_point_id"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Sampling Point *</FormLabel>
                                        <SearchableSelect
                                            options={samplingPoints.map(sp => ({
                                                value: sp.id,
                                                label: `${sp.name} (${sp.code})`
                                            }))}
                                            placeholder="Select sampling point..."
                                            onValueChange={field.onChange}
                                            value={field.value}
                                        />
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        )}

                        {/* Collected At */}
                        <FormField
                            control={form.control}
                            name="collected_at"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Collection Time</FormLabel>
                                    <FormControl>
                                        <Input type="datetime-local" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="flex justify-end gap-2 pt-4">
                            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={
                                    isSubmitting ||
                                    !selectedTypeId ||
                                    (isProductSample && !form.watch("intermediate_product_id")) ||
                                    (!isProductSample && !form.watch("sampling_point_id"))
                                }
                            >
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Create Sample
                            </Button>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}

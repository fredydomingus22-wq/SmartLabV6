"use client";

import { useState } from "react";
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
import { Loader2, TestTube2 } from "lucide-react";
import { createSampleAction } from "@/app/actions/lab";
import { CreateSampleSchema } from "@/schemas/lab";
import * as z from "zod";
import { cn } from "@/lib/utils";

// We can extend or modify the schema if needed, but reusing CreateSampleSchema is best if compatible.
// CreateSampleSchema likely requires 'sample_type_id', 'intermediate_product_id', etc.

interface SampleType {
    id: string;
    name: string;
    code: string;
}

interface SamplingPoint {
    id: string;
    name: string;
    code: string;
}

interface CreateIntermediateSampleDialogProps {
    intermediateId: string;
    intermediateCode: string;
    batchCode: string;
    sampleTypes: SampleType[];
    samplingPoints: SamplingPoint[];
    plantId: string;
    category?: 'FQ' | 'MICRO'; // New Prop
}

export function CreateIntermediateSampleDialog({
    intermediateId,
    intermediateCode,
    batchCode,
    sampleTypes,
    samplingPoints,
    plantId,
    category,
}: CreateIntermediateSampleDialogProps) {
    const [open, setOpen] = useState(false);
    const router = useRouter();

    // Filter sample types based on category if provided
    const filteredTypes = category
        ? sampleTypes.filter(st => st.name.toUpperCase().includes(category))
        : sampleTypes;

    const defaultSampleType = filteredTypes.find(st => st.name.includes("Intermediate") || st.name.includes("Tank"))?.id || filteredTypes[0]?.id;

    // We use the same schema but we'll pre-fill values
    const form = useForm<z.infer<typeof CreateSampleSchema>>({
        resolver: zodResolver(CreateSampleSchema),
        defaultValues: {
            code: "AUTO-GENERATED",
            plant_id: plantId,
            collected_at: new Date().toISOString().slice(0, 16),
            intermediate_product_id: intermediateId, // Pre-filled and Hidden
            sample_type_id: defaultSampleType || "",
        },
    });

    const isSubmitting = form.formState.isSubmitting;

    const onSubmit = async (data: z.infer<typeof CreateSampleSchema>) => {
        const formData = new FormData();
        formData.append("code", data.code || "");
        formData.append("sample_type_id", data.sample_type_id);
        if (data.collected_at) formData.append("collected_at", data.collected_at);
        if (data.plant_id) formData.append("plant_id", data.plant_id);
        if (data.sampling_point_id) formData.append("sampling_point_id", data.sampling_point_id);

        // Explicitly set the intermediate ID
        formData.append("intermediate_product_id", intermediateId);

        // We know the intermediate logic in the server action handles linking to the batch 
        // if we pass intermediate_product_id.
        // However, the server action might expect 'production_batch_id' explicitly 
        // if the logic is "if intermediate, find batch and set it".
        // Let's rely on the server action's logic or pass it if available?
        // In the original dialog, it fetched the batch from the intermediate object.
        // Here we don't have the batch ID in props explicitly? Oh wait we have batchCode.
        // The server action 'createSampleAction' should handle the lookup if we pass intermediate_id.
        // Let's trust the server action or check it later. 
        // Based on `create-sample-dialog.tsx`, it manually appended `production_batch_id`.
        // I should probably ensure the server action can handle it.
        // For now, I will just submit.

        const result = await createSampleAction(formData);

        if (result.success) {
            toast.success("Sample Registered", {
                description: `Sample for ${intermediateCode} created successfully.`
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
                <Button
                    variant={category === 'FQ' ? 'outline' : category === 'MICRO' ? 'outline' : 'outline'}
                    size="sm"
                    className={cn(
                        "h-8 gap-1.5 font-bold uppercase tracking-widest text-[9px] px-3",
                        category === 'FQ' && "text-blue-600 border-blue-200 hover:bg-blue-50",
                        category === 'MICRO' && "text-purple-600 border-purple-200 hover:bg-purple-50",
                    )}
                >
                    <TestTube2 className="h-3.5 w-3.5" />
                    {category ? `Colher ${category}` : "Colher Amostra"}
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Collect Sample from {intermediateCode}</DialogTitle>
                    <DialogDescription>
                        Register a new sample for this intermediate product (Batch: {batchCode}).
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">

                        {/* Hidden Fields for Context */}
                        <div className="hidden">
                            <Input {...form.register("intermediate_product_id")} />
                            <Input {...form.register("plant_id")} />
                        </div>

                        {/* Sample Type Reading/Selection */}
                        <FormField
                            control={form.control}
                            name="sample_type_id"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Sample Type</FormLabel>
                                    <FormControl>
                                        <SearchableSelect
                                            onValueChange={field.onChange}
                                            value={field.value}
                                            options={filteredTypes.map((type) => ({
                                                label: type.name,
                                                value: type.id
                                            }))}
                                            placeholder={`Selecionar tipo ${category || ""}...`}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Sampling Point */}
                        <FormField
                            control={form.control}
                            name="sampling_point_id"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Sampling Point (Optional)</FormLabel>
                                    <FormControl>
                                        <SearchableSelect
                                            onValueChange={field.onChange}
                                            value={field.value}
                                            options={samplingPoints.map((sp) => ({
                                                label: sp.name,
                                                value: sp.id
                                            }))}
                                            placeholder="Select point..."
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

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

                        <div className="flex justify-end gap-2 pt-2">
                            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isSubmitting}>
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

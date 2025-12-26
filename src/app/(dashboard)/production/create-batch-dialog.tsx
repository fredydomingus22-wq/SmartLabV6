"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { createGoldenBatchFromFormAction } from "@/app/actions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SearchableSelect } from "@/components/smart/searchable-select";
import { DatePicker } from "@/components/ui/date-picker";

interface CreateBatchDialogProps {
    products: any[];
    lines: any[];
    plantId: string;
}

import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" disabled={pending}>
            {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Start Production
        </Button>
    );
}

export function CreateBatchDialog({ products, lines, plantId }: CreateBatchDialogProps) {
    const [open, setOpen] = useState(false);
    const [date, setDate] = useState<Date | undefined>(new Date());

    const handleSubmit = async (formData: FormData) => {
        try {
            if (!formData.get("product_id") || !formData.get("production_line_id")) {
                toast.error("Please select Product and Line");
                return;
            }

            await createGoldenBatchFromFormAction(formData);
            toast.success("Batch created successfully");
            setOpen(false);
        } catch (error: any) {
            console.error(error);
            toast.error(error.message || "Failed to create batch");
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Golden Batch
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] glass">
                <DialogHeader>
                    <DialogTitle>Create Golden Batch</DialogTitle>
                </DialogHeader>

                <form action={handleSubmit} className="grid gap-4 py-4">
                    <input type="hidden" name="plant_id" value={plantId} />

                    <div className="grid gap-2">
                        <Label htmlFor="product">Product</Label>
                        <SearchableSelect
                            name="product_id"
                            options={products.map(p => ({
                                label: `${p.name} (${p.sku})`,
                                value: p.id
                            }))}
                            placeholder="Select product..."
                            required
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="line_id">Production Line</Label>
                            <SearchableSelect
                                name="production_line_id"
                                options={lines.map(l => ({
                                    label: `${l.name} (${l.code})`,
                                    value: l.id
                                }))}
                                placeholder="Select line..."
                                required
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="date">Start Date</Label>
                            <Input
                                id="date"
                                name="start_date"
                                type="date"
                                defaultValue={new Date().toISOString().split('T')[0]}
                                required
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="code">Batch Code</Label>
                            <Input
                                id="code"
                                name="code"
                                placeholder="e.g., B-2023-001"
                                required
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="quantity">Planned Quantity</Label>
                            <Input
                                id="quantity"
                                name="planned_quantity"
                                type="number"
                                placeholder="e.g., 1000"
                                required
                            />
                        </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-4">
                        <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                            Cancel
                        </Button>
                        <SubmitButton />
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}

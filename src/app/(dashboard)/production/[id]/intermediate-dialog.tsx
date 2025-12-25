"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Loader2 } from "lucide-react";
import { createIntermediateProductAction } from "@/app/actions/production";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

import { SearchableSelect } from "@/components/smart/searchable-select";

interface IntermediateDialogProps {
    batchId: string;
    availableTanks: { id: string; name: string; code: string }[];
}

export function IntermediateDialog({ batchId, availableTanks }: IntermediateDialogProps) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [selectedTank, setSelectedTank] = useState<string>("");
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);

        const formData = new FormData(e.currentTarget);
        formData.set("production_batch_id", batchId);

        // Find selected tank to send name/code as 'code'
        const tank = availableTanks.find(t => t.id === selectedTank);
        if (tank) {
            formData.set("code", tank.name); // Using Name as the friendly code/identifier
            formData.set("equipment_id", tank.id);
        }

        const result = await createIntermediateProductAction(formData);

        if (result.success) {
            toast.success(result.message);
            setOpen(false);
            router.refresh();
        } else {
            toast.error(result.message);
        }
        setLoading(false);
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Tank
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] glass">
                <DialogHeader>
                    <DialogTitle>Add Intermediate Product</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="equipment_id">Tank / Container</Label>
                        <SearchableSelect
                            name="equipment_id" // Form action reads this
                            options={availableTanks.map(t => ({
                                label: `${t.name} (${t.code})`,
                                value: t.id
                            }))}
                            placeholder="Select a tank..."
                            required
                            onValueChange={(val) => {
                                setSelectedTank(val); // Keep local state for other logic if needed
                                // NOTE: The hidden input inside SearchableSelect handles the 'equipment_id' value for FormData.
                                // However, this component also used to use hidden input manually.
                                // The original code used `selectedTank` to set the `code` field via name lookup in handleSubmit.
                            }}
                        />
                        {/* We need to pass the tank NAME as 'code' as per original logic. */}
                        {/* The original code set formData.set("code", tank.name) in handleSubmit based on selectedTank state. */}
                        {/* So we MUST maintain selectedTank state update. */}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="volume">Volume</Label>
                            <Input
                                id="volume"
                                name="volume"
                                type="number"
                                step="0.01"
                                placeholder="e.g., 1000"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="unit">Unit</Label>
                            <Input
                                id="unit"
                                name="unit"
                                placeholder="L"
                                defaultValue="L"
                            />
                        </div>
                    </div>

                    <div className="flex justify-end pt-4">
                        <Button type="submit" disabled={loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Create Tank
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}

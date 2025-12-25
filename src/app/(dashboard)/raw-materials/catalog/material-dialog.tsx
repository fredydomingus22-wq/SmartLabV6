"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { ActionForm } from "@/components/smart/action-form";
import { createRawMaterialAction } from "@/app/actions/raw-materials";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SearchableSelect } from "@/components/smart/searchable-select";
import { Textarea } from "@/components/ui/textarea";

interface MaterialDialogProps {
    plantId: string;
}

const CATEGORIES = [
    "ingredient",
    "additive",
    "packaging",
    "consumable",
    "cleaning",
    "other"
];

export function MaterialDialog({ plantId }: MaterialDialogProps) {
    const [open, setOpen] = useState(false);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Material
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] glass">
                <DialogHeader>
                    <DialogTitle>Add Raw Material to Catalog</DialogTitle>
                </DialogHeader>

                <ActionForm
                    action={createRawMaterialAction}
                    onSuccess={() => setOpen(false)}
                    submitText="Create Material"
                >
                    <div className="grid gap-4 py-4">
                        <input type="hidden" name="plant_id" value={plantId} />

                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="code">Material Code *</Label>
                                <Input id="code" name="code" required placeholder="e.g., RM-001" />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="name">Name *</Label>
                                <Input id="name" name="name" required placeholder="e.g., Sugar" />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label>Category</Label>
                                <SearchableSelect
                                    name="category"
                                    placeholder="Select category..."
                                    options={CATEGORIES.map(c => ({
                                        value: c,
                                        label: c.charAt(0).toUpperCase() + c.slice(1)
                                    }))}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="unit">Base Unit *</Label>
                                <Input id="unit" name="unit" defaultValue="kg" required />
                            </div>
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="description">Description</Label>
                            <Textarea id="description" name="description" placeholder="Material description..." rows={2} />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="allergens">Allergens (comma-separated)</Label>
                            <Input id="allergens" name="allergens" placeholder="e.g., gluten, milk, nuts" />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="storage_conditions">Storage Conditions</Label>
                            <Input id="storage_conditions" name="storage_conditions" placeholder="e.g., Cool dry place, <25°C" />
                        </div>
                    </div>
                </ActionForm>
            </DialogContent>
        </Dialog>
    );
}

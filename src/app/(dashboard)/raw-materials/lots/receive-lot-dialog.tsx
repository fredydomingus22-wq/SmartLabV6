"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { ActionForm } from "@/components/smart/action-form";
import { receiveLotAction } from "@/app/actions/raw-materials";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SearchableSelect } from "@/components/smart/searchable-select";
import { Textarea } from "@/components/ui/textarea";
import { FileUpload } from "@/components/smart/file-upload";

interface ReceiveLotDialogProps {
    materials: { id: string; name: string; code: string; unit: string }[];
    suppliers: { id: string; name: string; code: string }[];
    plantId: string;
}

export function ReceiveLotDialog({ materials, suppliers, plantId }: ReceiveLotDialogProps) {
    const [open, setOpen] = useState(false);
    const [selectedMaterial, setSelectedMaterial] = useState<string>("");
    const [selectedSupplier, setSelectedSupplier] = useState<string>("");

    const material = materials.find(m => m.id === selectedMaterial);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Receive Lot
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[550px] glass max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Receive Raw Material Lot</DialogTitle>
                </DialogHeader>

                <ActionForm
                    action={receiveLotAction}
                    onSuccess={() => setOpen(false)}
                    submitText="Receive Lot"
                >
                    <div className="grid gap-4 py-4">
                        <input type="hidden" name="plant_id" value={plantId} />

                        <div className="grid gap-2">
                            <Label>Raw Material *</Label>
                            <SearchableSelect
                                name="raw_material_id"
                                options={materials.map(m => ({
                                    label: `${m.name} (${m.code})`,
                                    value: m.id
                                }))}
                                placeholder="Select material..."
                                required
                                onValueChange={(val) => setSelectedMaterial(val)}
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label>Supplier</Label>
                            <SearchableSelect
                                name="supplier_id"
                                options={suppliers.map(s => ({
                                    label: `${s.name} (${s.code})`,
                                    value: s.id
                                }))}
                                placeholder="Select supplier..."
                                onValueChange={(val) => setSelectedSupplier(val)}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="lot_code">Lot Code *</Label>
                                <Input id="lot_code" name="lot_code" required placeholder="e.g., LOT-2024-001" />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="quantity_received">Quantity *</Label>
                                <div className="flex gap-2">
                                    <Input
                                        id="quantity_received"
                                        name="quantity_received"
                                        type="number"
                                        step="0.01"
                                        required
                                        className="flex-1"
                                    />
                                    <Input
                                        name="unit"
                                        defaultValue={material?.unit || "kg"}
                                        className="w-20"
                                        readOnly={!!material}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="production_date">Production Date</Label>
                                <Input id="production_date" name="production_date" type="date" />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="expiry_date">Expiry Date</Label>
                                <Input id="expiry_date" name="expiry_date" type="date" />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="certificate_number">Certificate/CoA No.</Label>
                                <Input id="certificate_number" name="certificate_number" placeholder="e.g., COA-12345" />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="storage_location">Storage Location</Label>
                                <Input id="storage_location" name="storage_location" placeholder="e.g., Warehouse A" />
                            </div>
                        </div>

                        {/* COA File Upload */}
                        <FileUpload
                            name="coa_file_url"
                            label="Certificate of Analysis (PDF/Document)"
                            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                            bucket="coa-documents"
                            folder="raw-materials"
                        />

                        <div className="grid gap-2">
                            <Label htmlFor="notes">Notes</Label>
                            <Textarea id="notes" name="notes" placeholder="Any additional notes..." rows={2} />
                        </div>
                    </div>
                </ActionForm>
            </DialogContent>
        </Dialog>
    );
}


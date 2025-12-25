"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { ActionForm } from "@/components/smart/action-form";
import { createSupplierAction } from "@/app/actions/raw-materials";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface SupplierDialogProps {
    plantId: string;
}

export function SupplierDialog({ plantId }: SupplierDialogProps) {
    const [open, setOpen] = useState(false);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Supplier
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] glass">
                <DialogHeader>
                    <DialogTitle>Add New Supplier</DialogTitle>
                </DialogHeader>

                <ActionForm
                    action={createSupplierAction}
                    onSuccess={() => setOpen(false)}
                    submitText="Create Supplier"
                >
                    <div className="grid gap-4 py-4">
                        <input type="hidden" name="plant_id" value={plantId} />

                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="code">Supplier Code *</Label>
                                <Input id="code" name="code" required placeholder="e.g., SUP-001" />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="name">Company Name *</Label>
                                <Input id="name" name="name" required placeholder="e.g., Acme Corp" />
                            </div>
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="contact_name">Contact Person</Label>
                            <Input id="contact_name" name="contact_name" placeholder="e.g., John Doe" />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="contact_email">Email</Label>
                                <Input id="contact_email" name="contact_email" type="email" placeholder="john@acme.com" />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="contact_phone">Phone</Label>
                                <Input id="contact_phone" name="contact_phone" placeholder="+351 xxx xxx xxx" />
                            </div>
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="address">Address</Label>
                            <Textarea id="address" name="address" placeholder="Full address..." rows={2} />
                        </div>
                    </div>
                </ActionForm>
            </DialogContent>
        </Dialog>
    );
}

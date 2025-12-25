"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { ActionForm } from "@/components/smart/action-form";
import { createMediaLotAction } from "@/app/actions/micro";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SearchableSelect } from "@/components/smart/searchable-select";
import { DatePicker } from "@/components/ui/date-picker";

interface CreateMediaDialogProps {
    mediaTypes: any[];
    plantId: string;
}

export function CreateMediaDialog({ mediaTypes, plantId }: CreateMediaDialogProps) {
    const [open, setOpen] = useState(false);
    const [date, setDate] = useState<Date | undefined>(new Date());

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Register Media Lot
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] glass">
                <DialogHeader>
                    <DialogTitle>Register Media Lot</DialogTitle>
                </DialogHeader>

                <ActionForm
                    action={createMediaLotAction}
                    onSuccess={() => setOpen(false)}
                    submitText="Register"
                >
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right">Type</Label>
                            <div className="col-span-3">
                                <SearchableSelect
                                    name="media_type_id"
                                    required
                                    placeholder="Select Media Type"
                                    options={mediaTypes.map((t) => ({
                                        label: t.name,
                                        value: t.id
                                    }))}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="lot_code" className="text-right">Lot Code</Label>
                            <Input id="lot_code" name="lot_code" placeholder="Batch 123" className="col-span-3" required />
                        </div>

                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="quantity" className="text-right">Qty</Label>
                            <Input id="quantity" name="quantity" type="number" className="col-span-3" required />
                        </div>

                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="expiry" className="text-right">Expiry</Label>
                            <div className="col-span-3">
                                <input type="hidden" name="expiry_date" value={date ? date.toISOString().split('T')[0] : ''} />
                                <DatePicker date={date} setDate={setDate} />
                            </div>
                        </div>

                        <input type="hidden" name="plant_id" value={plantId} />
                    </div>
                </ActionForm>
            </DialogContent>
        </Dialog>
    );
}

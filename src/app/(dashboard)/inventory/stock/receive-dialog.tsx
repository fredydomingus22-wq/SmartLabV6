"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ArchiveRestore, Plus } from "lucide-react";
import { ActionForm } from "@/components/smart/action-form";
import { receiveStockAction } from "@/app/actions/inventory";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DatePicker } from "@/components/ui/date-picker";

interface ReceiveStockDialogProps {
    reagentId: string;
    reagentName: string;
}

export function ReceiveStockDialog({ reagentId, reagentName }: ReceiveStockDialogProps) {
    const [open, setOpen] = useState(false);
    const [date, setDate] = useState<Date | undefined>();

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button size="sm" variant="ghost">
                    <ArchiveRestore className="mr-2 h-4 w-4" />
                    Receive
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] glass">
                <DialogHeader>
                    <DialogTitle>Receive Stock: {reagentName}</DialogTitle>
                </DialogHeader>

                <ActionForm
                    action={receiveStockAction}
                    onSuccess={() => setOpen(false)}
                    submitText="Confirm Receipt"
                >
                    <div className="grid gap-4 py-4">
                        <input type="hidden" name="reagent_id" value={reagentId} />

                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="quantity" className="text-right">Qty</Label>
                            <Input id="quantity" name="quantity" type="number" step="0.1" className="col-span-3" required />
                        </div>

                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="batch_number" className="text-right">Lot / Batch</Label>
                            <Input id="batch_number" name="batch_number" className="col-span-3" />
                        </div>

                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right">Expiry</Label>
                            <div className="col-span-3">
                                <input type="hidden" name="expiry_date" value={date ? date.toISOString().split('T')[0] : ''} />
                                <DatePicker date={date} setDate={setDate} />
                            </div>
                        </div>

                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="notes" className="text-right">Notes</Label>
                            <Input id="notes" name="notes" className="col-span-3" />
                        </div>

                    </div>
                </ActionForm>
            </DialogContent>
        </Dialog>
    );
}

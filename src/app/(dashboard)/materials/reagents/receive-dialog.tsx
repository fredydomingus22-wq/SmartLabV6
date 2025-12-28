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
                <Button size="sm" variant="ghost" className="text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10">
                    <ArchiveRestore className="mr-2 h-4 w-4" />
                    Receber
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] glass border-slate-800 bg-slate-900/95 text-slate-100">
                <DialogHeader>
                    <DialogTitle>Receber Stock: {reagentName}</DialogTitle>
                </DialogHeader>

                <ActionForm
                    action={receiveStockAction}
                    onSuccess={() => setOpen(false)}
                    submitText="Confirmar Receção"
                >
                    <div className="grid gap-4 py-4">
                        <input type="hidden" name="reagent_id" value={reagentId} />

                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="quantity" className="text-right text-slate-400">Qtd.</Label>
                            <Input id="quantity" name="quantity" type="number" step="0.1" className="col-span-3 bg-slate-800/50 border-slate-700 text-slate-100" required />
                        </div>

                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="batch_number" className="text-right text-slate-400">Lote</Label>
                            <Input id="batch_number" name="batch_number" className="col-span-3 bg-slate-800/50 border-slate-700 text-slate-100" />
                        </div>

                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right text-slate-400">Validade</Label>
                            <div className="col-span-3">
                                <input type="hidden" name="expiry_date" value={date ? date.toISOString().split('T')[0] : ''} />
                                <DatePicker date={date} setDate={setDate} />
                            </div>
                        </div>

                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="notes" className="text-right text-slate-400">Notas</Label>
                            <Input id="notes" name="notes" placeholder="Opcional" className="col-span-3 bg-slate-800/50 border-slate-700 text-slate-100" />
                        </div>

                    </div>
                </ActionForm>
            </DialogContent>
        </Dialog>
    );
}

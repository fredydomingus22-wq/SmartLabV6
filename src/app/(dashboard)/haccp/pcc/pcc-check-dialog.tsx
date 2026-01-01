"use client";

import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ClipboardCheck } from "lucide-react";
import { logPCCCheckAction } from "@/app/actions/haccp";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SearchableSelect } from "@/components/smart/searchable-select";
import { SignatureDialog } from "@/components/smart/signature-dialog";
import { toast } from "sonner";

interface PCCCheckDialogProps {
    hazard: any;
    equipments: { id: string; name: string; code: string }[];
    activeBatches: any[];
}

export function PCCCheckDialog({ hazard, equipments, activeBatches }: PCCCheckDialogProps) {
    const [open, setOpen] = useState(false);
    const [showSignature, setShowSignature] = useState(false);
    const [loading, setLoading] = useState(false);
    const formRef = useRef<HTMLFormElement>(null);

    const handlePreSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setShowSignature(true);
    };

    const handleConfirmSignature = async (password: string) => {
        if (!formRef.current) return;
        setLoading(true);

        const formData = new FormData(formRef.current);
        formData.append("password", password);

        try {
            const result = await logPCCCheckAction(formData);
            if (result.success) {
                toast.success(result.message);
                setOpen(false);
                setShowSignature(false);
            } else {
                toast.error(result.message);
            }
        } catch (error) {
            toast.error("An unexpected error occurred");
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                    <Button className="w-full">
                        <ClipboardCheck className="mr-2 h-4 w-4" />
                        Log Check
                    </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[450px] glass">
                    <DialogHeader>
                        <DialogTitle>Log {hazard.is_pcc ? 'CCP' : 'OPRP'} Check: {hazard.process_step}</DialogTitle>
                    </DialogHeader>

                    <form ref={formRef} onSubmit={handlePreSubmit} className="space-y-4 py-4">
                        <input type="hidden" name="hazard_id" value={hazard.id} />

                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right text-xs">Lote em Produção</Label>
                            <div className="col-span-3">
                                <SearchableSelect
                                    name="production_batch_id"
                                    options={activeBatches.map(b => ({
                                        label: `${b.batch_number} - ${b.product?.name || 'Unknown'}`,
                                        value: b.id
                                    }))}
                                    placeholder="Select active batch (traceability)..."
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right">Equipment</Label>
                            <div className="col-span-3">
                                <SearchableSelect
                                    name="equipment_id"
                                    options={equipments.map(e => ({
                                        label: `${e.name} (${e.code})`,
                                        value: e.id
                                    }))}
                                    placeholder="Select equipment..."
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right">Limit Min</Label>
                            <Input name="critical_limit_min" type="number" step="0.1" placeholder="72" className="col-span-3 glass" />
                        </div>

                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right">Limit Max</Label>
                            <Input name="critical_limit_max" type="number" step="0.1" placeholder="85" className="col-span-3 glass" />
                        </div>

                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right">Actual Value</Label>
                            <Input name="actual_value" type="number" step="0.1" className="col-span-3 glass" required />
                        </div>

                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right">Action (if deviation)</Label>
                            <Input name="action_taken" placeholder="Product held for review" className="col-span-3 glass" />
                        </div>

                        <div className="flex justify-end pt-4">
                            <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700">
                                Verify & Sign Check
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

            <SignatureDialog
                open={showSignature}
                onOpenChange={setShowSignature}
                onConfirm={handleConfirmSignature}
                loading={loading}
                title={`Sign ${hazard.is_pcc ? 'CCP' : 'OPRP'} Log`}
                description="Your signature confirms that this measurement was taken at the specified process step."
            />
        </>
    );
}

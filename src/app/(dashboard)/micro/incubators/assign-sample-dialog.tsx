"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FlaskConical } from "lucide-react";
import { ActionForm } from "@/components/smart/action-form";
import { startIncubationAction } from "@/app/actions/micro";
import { Label } from "@/components/ui/label";
import { SearchableSelect } from "@/components/smart/searchable-select";

interface AssignSampleDialogProps {
    incubatorId: string;
    incubatorName: string;
    samples: any[];
    mediaLots: any[];
}

export function AssignSampleDialog({ incubatorId, incubatorName, samples, mediaLots }: AssignSampleDialogProps) {
    const [open, setOpen] = useState(false);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="w-full">
                    <FlaskConical className="mr-2 h-4 w-4" />
                    Incubate
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] glass">
                <DialogHeader>
                    <DialogTitle>Mover to {incubatorName}</DialogTitle>
                </DialogHeader>

                <ActionForm
                    action={startIncubationAction}
                    onSuccess={() => setOpen(false)}
                    submitText="Start Incubation"
                >
                    <div className="grid gap-4 py-4">
                        <input type="hidden" name="incubator_id" value={incubatorId} />

                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right">Sample</Label>
                            <div className="col-span-3">
                                <SearchableSelect
                                    name="sample_id"
                                    required
                                    placeholder="Select Sample"
                                    options={samples.map((s) => ({
                                        label: `${s.code} (${s.status})`,
                                        value: s.id
                                    }))}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right">Media</Label>
                            <div className="col-span-3">
                                <SearchableSelect
                                    name="media_lot_id"
                                    required
                                    placeholder="Select Media Lot"
                                    options={mediaLots.map((l) => ({
                                        label: `${l.lot_code} (Exp: ${l.expiry_date})`,
                                        value: l.id
                                    }))}
                                />
                            </div>
                        </div>

                    </div>
                </ActionForm>
            </DialogContent>
        </Dialog>
    );
}

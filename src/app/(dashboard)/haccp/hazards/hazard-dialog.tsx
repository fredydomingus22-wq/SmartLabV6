"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { ActionForm } from "@/components/smart/action-form";
import { createHazardAction } from "@/app/actions/haccp";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SearchableSelect } from "@/components/smart/searchable-select";
import { Checkbox } from "@/components/ui/checkbox";

interface HazardDialogProps {
    plantId: string;
}

export function HazardDialog({ plantId }: HazardDialogProps) {
    const [open, setOpen] = useState(false);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Hazard
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[550px] glass">
                <DialogHeader>
                    <DialogTitle>Define New Hazard</DialogTitle>
                </DialogHeader>

                <ActionForm
                    action={createHazardAction}
                    onSuccess={() => setOpen(false)}
                    submitText="Create Hazard"
                >
                    <div className="grid gap-4 py-4">
                        <input type="hidden" name="plant_id" value={plantId} />

                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right">Process Step</Label>
                            <Input name="process_step" placeholder="Pasteurization" className="col-span-3" required />
                        </div>

                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right">Description</Label>
                            <Input name="hazard_description" placeholder="Survive of pathogenic organisms" className="col-span-3" required />
                        </div>

                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right">Category</Label>
                            <div className="col-span-3">
                                <SearchableSelect
                                    name="hazard_category"
                                    defaultValue="biological"
                                    options={[
                                        { label: "Biological", value: "biological" },
                                        { label: "Chemical", value: "chemical" },
                                        { label: "Physical", value: "physical" },
                                        { label: "Allergen", value: "allergen" },
                                        { label: "Radiological", value: "radiological" },
                                    ]}
                                    placeholder="Select category..."
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right">Probability (1-5)</Label>
                            <Input name="risk_probability" type="number" min="1" max="5" defaultValue="3" className="col-span-3" required />
                        </div>

                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right">Severity (1-5)</Label>
                            <Input name="risk_severity" type="number" min="1" max="5" defaultValue="4" className="col-span-3" required />
                        </div>

                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right">Control Measure</Label>
                            <Input name="control_measure" placeholder="Min 72°C for 15s" className="col-span-3" />
                        </div>

                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right">Is CCP?</Label>
                            <div className="col-span-3 flex items-center gap-2">
                                <Checkbox name="is_pcc" id="is_pcc" />
                                <Label htmlFor="is_pcc" className="text-sm font-normal">This is a Critical Control Point</Label>
                            </div>
                        </div>

                    </div>
                </ActionForm>
            </DialogContent>
        </Dialog>
    );
}

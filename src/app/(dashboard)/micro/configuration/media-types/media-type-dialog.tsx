"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { PlusCircle, Edit } from "lucide-react";
import { ActionForm } from "@/components/smart/action-form";
import { createMediaTypeAction, updateMediaTypeAction } from "@/app/actions/micro-media";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface MediaTypeDialogProps {
    plantId: string;
    mediaType?: {
        id: string;
        name: string;
        description: string | null;
        incubation_hours_min: number | null;
        incubation_hours_max: number | null;
        incubation_temp_c: number | null;
    };
}

export function MediaTypeDialog({ plantId, mediaType }: MediaTypeDialogProps) {
    const [open, setOpen] = useState(false);
    const isEditing = !!mediaType;

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {isEditing ? (
                    <Button variant="ghost" size="icon">
                        <Edit className="h-4 w-4" />
                    </Button>
                ) : (
                    <Button>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Add Media Type
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] glass">
                <DialogHeader>
                    <DialogTitle>{isEditing ? "Edit" : "New"} Media Type</DialogTitle>
                </DialogHeader>

                <ActionForm
                    action={isEditing ? updateMediaTypeAction : createMediaTypeAction}
                    onSuccess={() => setOpen(false)}
                    submitText={isEditing ? "Update" : "Create"}
                >
                    <div className="grid gap-4 py-4">
                        <input type="hidden" name="plant_id" value={plantId} />
                        {isEditing && <input type="hidden" name="id" value={mediaType.id} />}

                        <div className="grid gap-2">
                            <Label htmlFor="name">Name</Label>
                            <Input
                                id="name"
                                name="name"
                                placeholder="e.g. PCA, VRB"
                                defaultValue={mediaType?.name}
                                required
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="description">Description</Label>
                            <Textarea
                                id="description"
                                name="description"
                                placeholder="Details about this media..."
                                defaultValue={mediaType?.description || ""}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="incubation_hours_min">Min Hours</Label>
                                <Input
                                    id="incubation_hours_min"
                                    name="incubation_hours_min"
                                    type="number"
                                    min={0}
                                    defaultValue={mediaType?.incubation_hours_min || 24}
                                    required
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="incubation_hours_max">Max Hours</Label>
                                <Input
                                    id="incubation_hours_max"
                                    name="incubation_hours_max"
                                    type="number"
                                    min={0}
                                    defaultValue={mediaType?.incubation_hours_max || 48}
                                    required
                                />
                            </div>
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="incubation_temp_c">Temperature (°C)</Label>
                            <Input
                                id="incubation_temp_c"
                                name="incubation_temp_c"
                                type="number"
                                step="0.1"
                                min={0}
                                defaultValue={mediaType?.incubation_temp_c || 35}
                                required
                            />
                        </div>
                    </div>
                </ActionForm>
            </DialogContent>
        </Dialog>
    );
}

"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";
import { createProgramAction } from "@/app/actions/cip";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SearchableSelect } from "@/components/smart/searchable-select";
import { useFormStatus } from "react-dom";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface ProgramDialogProps {
    plantId: string;
}

// Custom Form Component since ActionForm doesn't easily support dynamic arrays of steps without complex overrides
// We will manually construct the payload or use hidden inputs.
// Given strictness, let's build a client-side form state and submit as JSON.

export function ProgramDialog({ plantId }: ProgramDialogProps) {
    const [open, setOpen] = useState(false);
    const [steps, setSteps] = useState<any[]>([{ step_order: 1, name: "", target_temp_c: "", target_duration_sec: "", target_conductivity: "" }]);
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    const addStep = () => {
        setSteps([...steps, { step_order: steps.length + 1, name: "", target_temp_c: "", target_duration_sec: "", target_conductivity: "" }]);
    };

    const removeStep = (index: number) => {
        const newSteps = steps.filter((_, i) => i !== index).map((s, i) => ({ ...s, step_order: i + 1 }));
        setSteps(newSteps);
    };

    const updateStep = (index: number, field: string, value: any) => {
        const newSteps = [...steps];
        newSteps[index] = { ...newSteps[index], [field]: value };
        setSteps(newSteps);
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        const formData = new FormData(e.currentTarget);

        // Add steps as JSON
        formData.set("steps_json", JSON.stringify(steps));
        formData.set("plant_id", plantId);

        const result = await createProgramAction(formData);
        setLoading(false);

        if (result.success) {
            toast.success(result.message);
            setOpen(false);
            setSteps([{ step_order: 1, name: "", target_temp_c: "", target_duration_sec: "", target_conductivity: "" }]);
        } else {
            toast.error(result.message);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    New CIP Program
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[700px] glass">
                <DialogHeader>
                    <DialogTitle>Create CIP Program (Recipe)</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="grid gap-4 py-4 max-h-[80vh] overflow-y-auto">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label>Program Name</Label>
                            <Input name="name" placeholder="Tank Alkaline Wash" required />
                        </div>
                        <div className="grid gap-2">
                            <Label>Target Equipment</Label>
                            <SearchableSelect
                                name="target_equipment_type"
                                defaultValue="tank"
                                options={[
                                    { value: "tank", label: "Tank" },
                                    { value: "line", label: "Line" },
                                    { value: "silo", label: "Silo" },
                                ]}
                                placeholder="Select type"
                            />
                        </div>
                    </div>

                    <div className="space-y-4">
                        <Label className="text-lg font-semibold">Cleaning Steps</Label>
                        {steps.map((step, index) => (
                            <div key={index} className="flex gap-2 items-end border p-3 rounded-lg bg-card/50">
                                <div className="w-10 text-center font-bold text-muted-foreground">{step.step_order}</div>

                                <div className="grid gap-1 flex-1">
                                    <Label className="text-xs">Step Name</Label>
                                    <SearchableSelect
                                        value={step.name}
                                        onValueChange={(val) => updateStep(index, "name", val)}
                                        options={[
                                            { value: "Pre-rinse", label: "Pre-rinse" },
                                            { value: "Caustic Wash", label: "Caustic Wash" },
                                            { value: "Acid Wash", label: "Acid Wash" },
                                            { value: "Intermediate Rinse", label: "Intermediate Rinse" },
                                            { value: "Final Rinse", label: "Final Rinse" },
                                            { value: "Sanitization", label: "Sanitization" },
                                        ]}
                                        placeholder="Select Step"
                                    />
                                </div>

                                <div className="grid gap-1 w-20">
                                    <Label className="text-xs">Temp (°C)</Label>
                                    <Input
                                        type="number"
                                        step="1"
                                        value={step.target_temp_c}
                                        onChange={(e) => updateStep(index, "target_temp_c", e.target.value)}
                                    />
                                </div>

                                <div className="grid gap-1 w-20">
                                    <Label className="text-xs">Secs</Label>
                                    <Input
                                        type="number"
                                        value={step.target_duration_sec}
                                        onChange={(e) => updateStep(index, "target_duration_sec", e.target.value)}
                                    />
                                </div>

                                <Button type="button" variant="ghost" size="icon" onClick={() => removeStep(index)} disabled={steps.length === 1}>
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                            </div>
                        ))}
                        <Button type="button" variant="outline" size="sm" onClick={addStep} className="w-full">
                            <Plus className="mr-2 h-4 w-4" /> Add Step
                        </Button>
                    </div>

                    <div className="flex justify-end gap-2 pt-4">
                        <Button type="submit" disabled={loading}>
                            {loading ? "Creating..." : "Create Program"}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SearchableSelect } from "@/components/smart/searchable-select";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Pencil, Loader2, Trash2 } from "lucide-react";
import { createSpecificationAction, updateSpecificationAction, deleteSpecificationAction } from "@/app/actions/specifications";
import { toast } from "sonner";

interface Parameter {
    id: string;
    name: string;
    code: string;
    unit?: string;
    category?: string;
}

interface Specification {
    id: string;
    qa_parameter_id: string;
    min_value?: number;
    max_value?: number;
    target_value?: number;
    text_value_expected?: string;
    is_critical?: boolean;
    sampling_frequency?: string;
    test_method_override?: string;
    sample_type_id?: string;
    sampling_point_id?: string;
    parameter?: Parameter;
}

interface SpecDialogProps {
    mode: "create" | "edit";
    productId?: string;
    specification?: Specification;
    availableParameters: Parameter[];
    sampleTypes: { id: string; name: string; code: string }[];
    samplingPoints?: { id: string; name: string; code: string }[];
}

export function SpecDialog({ mode, productId, specification, availableParameters, sampleTypes, samplingPoints = [] }: SpecDialogProps) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [isCritical, setIsCritical] = useState(specification?.is_critical ?? false);

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setLoading(true);

        const formData = new FormData(e.currentTarget);
        if (productId) formData.set("product_id", productId);
        formData.set("is_critical", isCritical.toString());

        if (specification?.id) {
            formData.set("id", specification.id);
            formData.set("qa_parameter_id", specification.qa_parameter_id);
        }

        const action = mode === "create" ? createSpecificationAction : updateSpecificationAction;
        const result = await action(formData);

        setLoading(false);

        if (result.success) {
            toast.success(result.message);
            setOpen(false);
        } else {
            toast.error(result.message);
        }
    }

    async function handleDelete() {
        if (!specification?.id) return;
        if (!confirm("Are you sure you want to delete this specification?")) return;

        setLoading(true);
        const formData = new FormData();
        formData.set("id", specification.id);

        const result = await deleteSpecificationAction(formData);
        setLoading(false);

        if (result.success) {
            toast.success(result.message);
            setOpen(false);
        } else {
            toast.error(result.message);
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {mode === "create" ? (
                    <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Specification
                    </Button>
                ) : (
                    <Button variant="ghost" size="sm">
                        <Pencil className="h-4 w-4" />
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>
                        {mode === "create" ? "Add Specification" : "Edit Specification"}
                    </DialogTitle>
                    <DialogDescription>
                        {mode === "create"
                            ? "Add a quality specification"
                            : `Editing: ${specification?.parameter?.name}`
                        }
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {mode === "create" && (
                        <div className="space-y-2">
                            <Label htmlFor="qa_parameter_id">Parameter *</Label>
                            <SearchableSelect
                                name="qa_parameter_id"
                                required
                                placeholder="Select parameter..."
                                options={availableParameters.map(param => ({
                                    value: param.id,
                                    label: `${param.name} (${param.code})${param.unit ? ` - ${param.unit}` : ''}`
                                }))}
                            />
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="sample_type_id">Phase / Physical Stage</Label>
                            <SearchableSelect
                                name="sample_type_id"
                                placeholder="Select stage..."
                                defaultValue={specification?.sample_type_id || "null"}
                                options={[
                                    { value: "null", label: "Finished Product / Global" },
                                    ...sampleTypes.map(type => ({
                                        value: type.id,
                                        label: `${type.name} (${type.code})`
                                    }))
                                ]}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="sampling_point_id">Sampling Point</Label>
                            <SearchableSelect
                                name="sampling_point_id"
                                placeholder="Select point..."
                                defaultValue={specification?.sampling_point_id || "null"}
                                options={[
                                    { value: "null", label: "None / Not Applicable" },
                                    ...samplingPoints.map(point => ({
                                        value: point.id,
                                        label: `${point.name} (${point.code})`
                                    }))
                                ]}
                            />
                        </div>
                    </div>
                    <p className="text-[10px] text-muted-foreground -mt-2">
                        Specify a Phase for intermediate products (e.g. Syrup) or a Sampling Point for environmental monitoring.
                    </p>

                    <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="min_value">Min (LSL)</Label>
                            <Input
                                id="min_value"
                                name="min_value"
                                type="number"
                                step="any"
                                placeholder="e.g., 3.2"
                                defaultValue={specification?.min_value}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="target_value">Target</Label>
                            <Input
                                id="target_value"
                                name="target_value"
                                type="number"
                                step="any"
                                placeholder="e.g., 3.5"
                                defaultValue={specification?.target_value}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="max_value">Max (USL)</Label>
                            <Input
                                id="max_value"
                                name="max_value"
                                type="number"
                                step="any"
                                placeholder="e.g., 3.8"
                                defaultValue={specification?.max_value}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="text_value_expected">Text Value (for pass/fail)</Label>
                        <Input
                            id="text_value_expected"
                            name="text_value_expected"
                            placeholder="e.g., Negative, Absent"
                            defaultValue={specification?.text_value_expected}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="sampling_frequency">Sampling Frequency</Label>
                            <Input
                                id="sampling_frequency"
                                name="sampling_frequency"
                                placeholder="e.g. Per Batch, Hourly..."
                                defaultValue={specification?.sampling_frequency || "Per Batch"}
                                list="frequency-suggestions"
                            />
                            <datalist id="frequency-suggestions">
                                <option value="Per Batch" />
                                <option value="Hourly" />
                                <option value="Per Shift" />
                                <option value="Daily" />
                                <option value="Weekly" />
                            </datalist>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="test_method_override">Method Override</Label>
                            <Input
                                id="test_method_override"
                                name="test_method_override"
                                placeholder="Optional override"
                                defaultValue={specification?.test_method_override}
                            />
                        </div>
                    </div>

                    <div className="flex items-center space-x-2">
                        <Checkbox
                            id="is_critical"
                            checked={isCritical}
                            onCheckedChange={(checked) => setIsCritical(checked === true)}
                        />
                        <Label htmlFor="is_critical" className="text-sm">
                            Critical Parameter (auto-creates NC on failure)
                        </Label>
                    </div>

                    <DialogFooter className="gap-2">
                        {mode === "edit" && (
                            <Button
                                type="button"
                                variant="destructive"
                                onClick={handleDelete}
                                disabled={loading}
                            >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                            </Button>
                        )}
                        <Button type="submit" disabled={loading}>
                            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                            {mode === "create" ? "Add Specification" : "Save Changes"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

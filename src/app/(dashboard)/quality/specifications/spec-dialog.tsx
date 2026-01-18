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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Pencil, Loader2, Trash2, AlertTriangle } from "lucide-react";
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
    haccp_hazard_id?: string;
    haccp_hazard?: {
        is_pcc: boolean;
        hazard_description: string;
        hazard_category: string;
    };
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
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
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

                    {/* Main Settings */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="sample_type_id">Sample Type / Phase</Label>
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

                        {/* Hide Sampling Point for Products unless explicitly needed (e.g. hygiene monitoring on line) */}
                        {/* Logic: Show if Global Mode (no product) OR if it already has a value OR if user toggles 'Show Advanced Location' */}
                        {(!productId || specification?.sampling_point_id) && (
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
                        )}
                    </div>

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

                    {/* Advanced Settings Checkbox/Toggle */}
                    <div className="border rounded-md p-3 bg-muted/20">
                        <details className="group">
                            <summary className="flex items-center justify-between cursor-pointer list-none text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                                <span>Advanced Settings</span>
                                <div className="p-1 rounded hover:bg-muted transition-colors">
                                    <h4 className="text-xs underlinedecoration-dashed">Show Optional Fields</h4>
                                </div>
                            </summary>

                            <div className="mt-4 space-y-4 pt-2 border-t">
                                <div className="space-y-2">
                                    <Label htmlFor="text_value_expected">Text Value (for pass/fail)</Label>
                                    <Input
                                        id="text_value_expected"
                                        name="text_value_expected"
                                        placeholder="e.g., Negative, Absent"
                                        defaultValue={specification?.text_value_expected}
                                    />
                                    <p className="text-[10px] text-muted-foreground">Used for qualitative tests (e.g. Microbiology).</p>
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
                        </details>
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

                    <div className="bg-slate-900/40 p-5 rounded-xl border border-slate-800/60 shadow-inner">
                        <div className="flex items-center space-x-2 mb-5">
                            <Checkbox
                                id="haccp_linked"
                                name="haccp_linked"
                                value="true"
                                defaultChecked={!!specification?.haccp_hazard_id}
                                onCheckedChange={(checked) => {
                                    const fields = document.getElementById("haccp-fields");
                                    if (fields) fields.style.display = checked ? "block" : "none";
                                }}
                                className="border-slate-600 data-[state=checked]:bg-orange-500 data-[state=checked]:border-orange-500"
                            />
                            <Label htmlFor="haccp_linked" className="font-bold flex items-center gap-2 text-slate-200 cursor-pointer">
                                <AlertTriangle className="h-4 w-4 text-orange-500" />
                                HACCP Integration (CCP / OPRP)
                            </Label>
                        </div>

                        <div id="haccp-fields" style={{ display: !!specification?.haccp_hazard_id ? "block" : "none" }} className="space-y-5 animate-in fade-in slide-in-from-top-2">
                            <input type="hidden" name="haccp_update_needed" value="true" />

                            <div className="space-y-3">
                                <Label className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Hazard Classification</Label>
                                <RadioGroup defaultValue={specification?.haccp_hazard?.is_pcc?.toString() ?? "false"} name="haccp_is_pcc" className="grid grid-cols-2 gap-3">
                                    <div>
                                        <RadioGroupItem value="false" id="type_oprp" className="peer sr-only" />
                                        <Label
                                            htmlFor="type_oprp"
                                            className="flex flex-col items-center justify-center p-3 rounded-lg border border-slate-800 bg-slate-950/40 cursor-pointer hover:bg-slate-900/60 transition-all peer-data-[state=checked]:border-blue-500/50 peer-data-[state=checked]:bg-blue-500/10 group"
                                        >
                                            <span className="text-xs font-medium text-slate-400 group-peer-data-[state=checked]:text-blue-400">OPRP</span>
                                            <span className="text-[10px] text-slate-500 group-peer-data-[state=checked]:text-blue-500/70">Prerequisite</span>
                                        </Label>
                                    </div>

                                    <div>
                                        <RadioGroupItem value="true" id="type_ccp" className="peer sr-only" />
                                        <Label
                                            htmlFor="type_ccp"
                                            className="flex flex-col items-center justify-center p-3 rounded-lg border border-slate-800 bg-slate-950/40 cursor-pointer hover:bg-slate-900/60 transition-all peer-data-[state=checked]:border-red-500/50 peer-data-[state=checked]:bg-red-500/10 group"
                                        >
                                            <span className="text-xs font-bold text-slate-400 group-peer-data-[state=checked]:text-red-400 uppercase">CCP</span>
                                            <span className="text-[10px] text-slate-500 group-peer-data-[state=checked]:text-red-500/70 text-center leading-tight">Critical Control Point</span>
                                        </Label>
                                    </div>
                                </RadioGroup>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="haccp_description" className="text-slate-300">Hazard Description</Label>
                                <Input
                                    id="haccp_description"
                                    name="haccp_description"
                                    placeholder="e.g. Survival of Pathogens (Salmonella)"
                                    defaultValue={specification?.haccp_hazard?.hazard_description}
                                    className="bg-slate-950/50 border-slate-800 focus:border-orange-500/50 text-slate-200"
                                />
                                <p className="text-[10px] text-slate-500 italic">
                                    This will create or link a Hazard in the HACCP plan for automated monitoring.
                                </p>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="haccp_category" className="text-slate-300">Hazard Category</Label>
                                <Select name="haccp_category" defaultValue={specification?.haccp_hazard?.hazard_category || "biological"}>
                                    <SelectTrigger className="bg-slate-950/50 border-slate-800 text-slate-200 focus:ring-orange-500/50">
                                        <SelectValue placeholder="Select category" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="biological">Biological</SelectItem>
                                        <SelectItem value="chemical">Chemical</SelectItem>
                                        <SelectItem value="physical">Physical</SelectItem>
                                        <SelectItem value="allergen">Allergen</SelectItem>
                                        <SelectItem value="radiological">Radiological</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
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

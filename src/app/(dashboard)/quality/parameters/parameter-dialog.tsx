"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Plus, Pencil, Loader2 } from "lucide-react";
import { createParameterAction, updateParameterAction, deleteParameterAction } from "@/app/actions/parameters";
import { toast } from "sonner";

interface Parameter {
    id: string;
    name: string;
    code: string;
    unit?: string;
    category?: string;
    method?: string;
    precision?: number;
    analysis_time_minutes?: number;
    equipment_required?: string;
    description?: string;
    status: string;
    version?: number;
}

interface ParameterDialogProps {
    mode: "create" | "edit";
    parameter?: Parameter;
}

export function ParameterDialog({ mode, parameter }: ParameterDialogProps) {
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    // Controlled form state
    const [formData, setFormData] = useState({
        name: "",
        code: "",
        unit: "",
        category: "physico_chemical",
        method: "",
        precision: "2",
        analysis_time_minutes: "",
        equipment_required: "",
        description: "",
        status: "active",
    });

    // Reset form when dialog opens with parameter data
    useEffect(() => {
        if (open && parameter) {
            setFormData({
                name: parameter.name || "",
                code: parameter.code || "",
                unit: parameter.unit || "",
                category: parameter.category || "physico_chemical",
                method: parameter.method || "",
                precision: String(parameter.precision ?? 2),
                analysis_time_minutes: parameter.analysis_time_minutes ? String(parameter.analysis_time_minutes) : "",
                equipment_required: parameter.equipment_required || "",
                description: parameter.description || "",
                status: parameter.status || "active",
            });
        } else if (open && mode === "create") {
            setFormData({
                name: "",
                code: "",
                unit: "",
                category: "physico_chemical",
                method: "",
                precision: "2",
                analysis_time_minutes: "",
                equipment_required: "",
                description: "",
                status: "active",
            });
        }
    }, [open, parameter, mode]);

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setLoading(true);

        const fd = new FormData();
        fd.set("name", formData.name);
        fd.set("code", formData.code);
        fd.set("unit", formData.unit);
        fd.set("category", formData.category);
        fd.set("method", formData.method);
        fd.set("precision", formData.precision);
        fd.set("analysis_time_minutes", formData.analysis_time_minutes);
        fd.set("equipment_required", formData.equipment_required);
        fd.set("description", formData.description);
        fd.set("status", formData.status);

        if (parameter?.id) {
            fd.set("id", parameter.id);
        }

        const action = mode === "create" ? createParameterAction : updateParameterAction;
        const result = await action(fd);

        setLoading(false);

        if (result.success) {
            toast.success(result.message);
            setOpen(false);
            router.refresh();
        } else {
            toast.error(result.message);
        }
    }

    async function handleDelete() {
        if (!parameter?.id) return;
        if (!confirm("Are you sure you want to deactivate this parameter?")) return;

        setLoading(true);
        const fd = new FormData();
        fd.set("id", parameter.id);

        const result = await deleteParameterAction(fd);
        setLoading(false);

        if (result.success) {
            toast.success(result.message);
            setOpen(false);
            router.refresh();
        } else {
            toast.error(result.message);
        }
    }

    const updateField = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {mode === "create" ? (
                    <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        New Parameter
                    </Button>
                ) : (
                    <Button variant="ghost" size="sm">
                        <Pencil className="h-4 w-4" />
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[550px]">
                <DialogHeader>
                    <DialogTitle>
                        {mode === "create" ? "Create Parameter" : `Edit Parameter: ${parameter?.name}`}
                    </DialogTitle>
                    <DialogDescription>
                        {mode === "create"
                            ? "Add a new QA parameter for quality analysis"
                            : `Version ${parameter?.version || 1} - Updates will create a new version`
                        }
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Name *</Label>
                            <Input
                                id="name"
                                value={formData.name}
                                onChange={(e) => updateField("name", e.target.value)}
                                placeholder="e.g., pH"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="code">Code *</Label>
                            <Input
                                id="code"
                                value={formData.code}
                                onChange={(e) => updateField("code", e.target.value.toUpperCase())}
                                placeholder="e.g., PH"
                                className="uppercase"
                                required
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="unit">Unit</Label>
                            <Input
                                id="unit"
                                value={formData.unit}
                                onChange={(e) => updateField("unit", e.target.value)}
                                placeholder="e.g., pH, °Bx, mg/L"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="category">Category</Label>
                            <Select
                                value={formData.category}
                                onValueChange={(v) => updateField("category", v)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select category" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="physico_chemical">Físico-Químico</SelectItem>
                                    <SelectItem value="microbiological">Microbiológico</SelectItem>
                                    <SelectItem value="sensory">Sensorial</SelectItem>
                                    <SelectItem value="other">Outro</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="method">Analysis Method</Label>
                        <Input
                            id="method"
                            value={formData.method}
                            onChange={(e) => updateField("method", e.target.value)}
                            placeholder="e.g., ISO 4833, AOAC 981.12, Internal"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="precision">Decimal Precision</Label>
                            <Input
                                id="precision"
                                type="number"
                                min="0"
                                max="6"
                                value={formData.precision}
                                onChange={(e) => updateField("precision", e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="analysis_time_minutes">Time (minutes)</Label>
                            <Input
                                id="analysis_time_minutes"
                                type="number"
                                min="1"
                                value={formData.analysis_time_minutes}
                                onChange={(e) => updateField("analysis_time_minutes", e.target.value)}
                                placeholder="e.g., 30"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="equipment_required">Equipment Required</Label>
                        <Input
                            id="equipment_required"
                            value={formData.equipment_required}
                            onChange={(e) => updateField("equipment_required", e.target.value)}
                            placeholder="e.g., pH meter, refractometer"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                            id="description"
                            value={formData.description}
                            onChange={(e) => updateField("description", e.target.value)}
                            placeholder="Optional description or notes..."
                            rows={2}
                        />
                    </div>

                    {mode === "edit" && (
                        <div className="space-y-2">
                            <Label htmlFor="status">Status</Label>
                            <Select
                                value={formData.status}
                                onValueChange={(v) => updateField("status", v)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="active">Active</SelectItem>
                                    <SelectItem value="inactive">Inactive</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    <DialogFooter className="gap-2">
                        {mode === "edit" && (
                            <Button
                                type="button"
                                variant="destructive"
                                onClick={handleDelete}
                                disabled={loading}
                            >
                                Deactivate
                            </Button>
                        )}
                        <Button type="submit" disabled={loading}>
                            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                            {mode === "create" ? "Create" : "Save Changes"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

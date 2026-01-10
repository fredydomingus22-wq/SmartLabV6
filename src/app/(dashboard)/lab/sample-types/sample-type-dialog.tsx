"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Pencil, Loader2, Trash2 } from "lucide-react";
import { SearchableSelect } from "@/components/smart/searchable-select";
import {
    createSampleTypeAction,
    updateSampleTypeAction,
    deleteSampleTypeAction,
} from "@/app/actions/sample-types";

interface SampleType {
    id: string;
    name: string;
    code: string;
    test_category?: string;
    retention_time_days?: number;
    default_sla_minutes?: number;
}

interface SampleTypeDialogProps {
    mode: "create" | "edit";
    sampleType?: SampleType;
    trigger?: React.ReactNode;
}

export function SampleTypeDialog({ mode, sampleType, trigger }: SampleTypeDialogProps) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [name, setName] = useState(sampleType?.name || "");
    const [code, setCode] = useState(sampleType?.code || "");
    const [testCategory, setTestCategory] = useState(sampleType?.test_category || "physico_chemical");
    const [retentionDays, setRetentionDays] = useState(sampleType?.retention_time_days?.toString() || "30");
    const [slaMinutes, setSlaMinutes] = useState(sampleType?.default_sla_minutes?.toString() || "2880");
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);

        const formData = new FormData();
        formData.set("name", name);
        formData.set("code", code);
        formData.set("test_category", testCategory);
        formData.set("retention_time_days", retentionDays);
        formData.set("default_sla_minutes", slaMinutes);

        if (mode === "edit" && sampleType) {
            formData.set("id", sampleType.id);
        }

        const action = mode === "create" ? createSampleTypeAction : updateSampleTypeAction;
        const result = await action(formData);

        setLoading(false);

        if (result.success) {
            toast.success(result.message);
            setOpen(false);
            if (mode === "create") {
                setName("");
                setCode("");
                setTestCategory("physico_chemical");
                setRetentionDays("30");
                setSlaMinutes("2880");
            }
            router.refresh();
        } else {
            toast.error(result.message);
        }
    };

    const handleDelete = async () => {
        if (!sampleType) return;
        if (!confirm("Are you sure you want to delete this sample type?")) return;

        setLoading(true);
        const formData = new FormData();
        formData.set("id", sampleType.id);

        const result = await deleteSampleTypeAction(formData);
        setLoading(false);

        if (result.success) {
            toast.success(result.message);
            setOpen(false);
            router.refresh();
        } else {
            toast.error(result.message);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || (mode === "create" ? (
                    <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        New Type
                    </Button>
                ) : (
                    <Button variant="outline" size="sm">
                        <Pencil className="h-4 w-4" />
                    </Button>
                ))}
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>
                        {mode === "create" ? "Create Sample Type" : "Edit Sample Type"}
                    </DialogTitle>
                    <DialogDescription>
                        {mode === "create"
                            ? "Add a new sample type to the system."
                            : "Update the sample type information."}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="name">Name *</Label>
                            <Input
                                id="name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Ex: Tank, Line, Final Product"
                                required
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="code">Code *</Label>
                            <Input
                                id="code"
                                value={code}
                                onChange={(e) => setCode(e.target.value.toUpperCase())}
                                placeholder="Ex: TNK, LN, FP"
                                className="font-mono"
                                required
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label>Test Category *</Label>
                            <SearchableSelect
                                value={testCategory}
                                onValueChange={setTestCategory}
                                options={[
                                    { value: "physico_chemical", label: "Físico-Químico" },
                                    { value: "microbiological", label: "Microbiológico" },
                                    { value: "both", label: "Ambos" },
                                ]}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="retention">Retention (Days)</Label>
                                <Input
                                    id="retention"
                                    type="number"
                                    min="0"
                                    value={retentionDays}
                                    onChange={(e) => setRetentionDays(e.target.value)}
                                    placeholder="30"
                                    required
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="sla">Default SLA (Min)</Label>
                                <Input
                                    id="sla"
                                    type="number"
                                    min="0"
                                    step="60"
                                    value={slaMinutes}
                                    onChange={(e) => setSlaMinutes(e.target.value)}
                                    placeholder="2880"
                                    required
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-between pt-4">
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
                        <div className={`flex gap-2 ${mode === "create" ? "ml-auto" : ""}`}>
                            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={loading}>
                                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {mode === "create" ? "Create" : "Save"}
                            </Button>
                        </div>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}

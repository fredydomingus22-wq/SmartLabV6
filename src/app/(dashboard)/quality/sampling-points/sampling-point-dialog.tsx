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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Plus, Pencil, Loader2 } from "lucide-react";
import { createSamplingPointAction, updateSamplingPointAction, deleteSamplingPointAction } from "@/app/actions/sampling-points";
import { toast } from "sonner";

interface SamplingPoint {
    id: string;
    name: string;
    code: string;
    location?: string;
    equipment_id?: string;
    status: string;
}

interface SamplingPointDialogProps {
    mode: "create" | "edit";
    point?: SamplingPoint;
}

export function SamplingPointDialog({ mode, point }: SamplingPointDialogProps) {
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        name: "",
        code: "",
        location: "",
        equipment_id: "",
        status: "active",
    });

    useEffect(() => {
        if (open && point) {
            setFormData({
                name: point.name || "",
                code: point.code || "",
                location: point.location || "",
                equipment_id: point.equipment_id || "",
                status: point.status || "active",
            });
        } else if (open && mode === "create") {
            setFormData({
                name: "",
                code: "",
                location: "",
                equipment_id: "",
                status: "active",
            });
        }
    }, [open, point, mode]);

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setLoading(true);

        const fd = new FormData();
        fd.set("name", formData.name);
        fd.set("code", formData.code);
        fd.set("location", formData.location);
        fd.set("equipment_id", formData.equipment_id);
        fd.set("status", formData.status);

        if (point?.id) {
            fd.set("id", point.id);
        }

        const action = mode === "create" ? createSamplingPointAction : updateSamplingPointAction;
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
        if (!point?.id) return;
        if (!confirm("Deactivate this sampling point?")) return;

        setLoading(true);
        const fd = new FormData();
        fd.set("id", point.id);

        const result = await deleteSamplingPointAction(fd);
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
                        New Sampling Point
                    </Button>
                ) : (
                    <Button variant="ghost" size="sm">
                        <Pencil className="h-4 w-4" />
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[450px]">
                <DialogHeader>
                    <DialogTitle>
                        {mode === "create" ? "Create Sampling Point" : `Edit: ${point?.name}`}
                    </DialogTitle>
                    <DialogDescription>
                        {mode === "create"
                            ? "Define where samples are collected"
                            : "Update sampling point details"
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
                                placeholder="e.g., Tank 1 Outlet"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="code">Code *</Label>
                            <Input
                                id="code"
                                value={formData.code}
                                onChange={(e) => updateField("code", e.target.value.toUpperCase())}
                                placeholder="e.g., SP-TK01"
                                className="uppercase"
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="location">Location / Description</Label>
                        <Input
                            id="location"
                            value={formData.location}
                            onChange={(e) => updateField("location", e.target.value)}
                            placeholder="e.g., Production Hall, Line A"
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
                            {mode === "create" ? "Create" : "Save"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

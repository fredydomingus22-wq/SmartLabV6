"use client";

import { useState } from "react";
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
import { SearchableSelect } from "@/components/smart/searchable-select";
import { Plus, Pencil, Loader2, Trash2 } from "lucide-react";
import {
    createProductionLineAction,
    updateProductionLineAction,
    deleteProductionLineAction,
} from "@/app/actions/production-lines";

interface ProductionLine {
    id: string;
    name: string;
    code: string;
    status: string;
}

interface ProductionLineDialogProps {
    mode: "create" | "edit";
    line?: ProductionLine;
}

export function ProductionLineDialog({ mode, line }: ProductionLineDialogProps) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [name, setName] = useState(line?.name || "");
    const [code, setCode] = useState(line?.code || "");
    const [status, setStatus] = useState(line?.status || "active");
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);

        const formData = new FormData();
        formData.set("name", name);
        formData.set("code", code);
        formData.set("status", status);

        if (mode === "edit" && line) {
            formData.set("id", line.id);
        }

        const action = mode === "create" ? createProductionLineAction : updateProductionLineAction;
        const result = await action(formData);

        setLoading(false);

        if (result.success) {
            toast.success(result.message);
            setOpen(false);
            if (mode === "create") {
                setName("");
                setCode("");
                setStatus("active");
            }
            router.refresh();
        } else {
            toast.error(result.message);
        }
    };

    const handleDelete = async () => {
        if (!line) return;
        if (!confirm("Are you sure you want to delete this line?")) return;

        setLoading(true);
        const formData = new FormData();
        formData.set("id", line.id);

        const result = await deleteProductionLineAction(formData);
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
                {mode === "create" ? (
                    <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        New Line
                    </Button>
                ) : (
                    <Button variant="outline" size="sm">
                        <Pencil className="h-4 w-4" />
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>
                        {mode === "create" ? "Create Production Line" : "Edit Line"}
                    </DialogTitle>
                    <DialogDescription>
                        {mode === "create"
                            ? "Add a new production line."
                            : "Update the line information."}
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
                                placeholder="Ex: Line 01"
                                required
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="code">Code *</Label>
                            <Input
                                id="code"
                                value={code}
                                onChange={(e) => setCode(e.target.value.toUpperCase())}
                                placeholder="Ex: L01"
                                className="font-mono"
                                required
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="status">Status</Label>
                            <SearchableSelect
                                value={status}
                                onValueChange={setStatus}
                                options={[
                                    { value: "active", label: "Active" },
                                    { value: "maintenance", label: "Maintenance" },
                                    { value: "inactive", label: "Inactive" },
                                ]}
                            />
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

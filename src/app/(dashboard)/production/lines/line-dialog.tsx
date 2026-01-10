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
                    <Button className="h-10 px-6 bg-blue-600 hover:bg-blue-500 text-white font-black uppercase tracking-widest text-[10px] rounded-full shadow-[0_0_20px_rgba(59,130,246,0.3)] transition-all duration-300 hover:scale-105 active:scale-95 border border-blue-400/20">
                        <Plus className="h-4 w-4 mr-2 stroke-[3px]" />
                        New Production Line
                    </Button>
                ) : (
                    <Button variant="outline" size="icon" className="h-8 w-8 rounded-xl bg-white/5 border-white/10 hover:bg-blue-500/10 hover:border-blue-500/30 hover:text-blue-400 transition-all">
                        <Pencil className="h-3.5 w-3.5" />
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="glass border-white/10 bg-[#020617]/90 backdrop-blur-2xl text-slate-100 sm:max-w-[450px] rounded-[32px] overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.5)]">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 via-indigo-500 to-blue-600" />

                <DialogHeader className="space-y-2 pt-4">
                    <DialogTitle className="text-2xl font-black tracking-tighter uppercase flex items-center gap-3">
                        <div className="h-6 w-1 bg-blue-500 rounded-full" />
                        {mode === "create" ? "New Production Line" : "Edit Asset Profile"}
                    </DialogTitle>
                    <DialogDescription className="text-slate-400 text-xs font-medium tracking-tight">
                        {mode === "create"
                            ? "Configure a new processing or filling unit for the plant infrastructure."
                            : "Modify the technical specifications and operational status of this line."}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6 py-4 px-1">
                    <div className="space-y-5">
                        <div className="grid gap-2">
                            <Label htmlFor="name" className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-500 ml-1">Asset Name</Label>
                            <Input
                                id="name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Ex: Filling Line 05 (Sidel)"
                                className="h-12 bg-white/5 border-white/10 rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all font-bold placeholder:font-normal placeholder:opacity-30"
                                required
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="code" className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-500 ml-1">Industrial Code</Label>
                            <Input
                                id="code"
                                value={code}
                                onChange={(e) => setCode(e.target.value.toUpperCase())}
                                placeholder="Ex: L5-SIDEL"
                                className="h-12 bg-white/5 border-white/10 rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all font-mono font-bold tracking-widest placeholder:font-sans placeholder:font-normal placeholder:opacity-30"
                                required
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="status" className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-500 ml-1">Lifecycle Status</Label>
                            <SearchableSelect
                                value={status}
                                onValueChange={setStatus}
                                options={[
                                    { value: "active", label: "🟢 Operational (Ready)" },
                                    { value: "maintenance", label: "🟠 Maintenance (Scheduled)" },
                                    { value: "inactive", label: "⚪ Decommissioned" },
                                ]}
                            />
                        </div>
                    </div>

                    <div className="flex items-center justify-between pt-6 border-t border-white/5">
                        {mode === "edit" ? (
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={handleDelete}
                                disabled={loading}
                                className="h-11 px-5 text-rose-500 hover:text-rose-400 hover:bg-rose-500/10 font-bold uppercase tracking-widest text-[10px] rounded-2xl border border-transparent hover:border-rose-500/20"
                            >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Decommission
                            </Button>
                        ) : (
                            <Button type="button" variant="ghost" onClick={() => setOpen(false)} className="h-11 px-6 text-slate-500 hover:text-white font-bold uppercase tracking-widest text-[10px] rounded-2xl hover:bg-white/5 transition-all">
                                Cancel
                            </Button>
                        )}

                        <div className="flex gap-2">
                            {mode === "edit" && (
                                <Button type="button" variant="ghost" onClick={() => setOpen(false)} className="h-11 px-6 text-slate-500 hover:text-white font-bold uppercase tracking-widest text-[10px] rounded-2xl hover:bg-white/5 transition-all">
                                    Cancel
                                </Button>
                            )}
                            <Button
                                type="submit"
                                disabled={loading}
                                className="h-11 px-8 bg-blue-600 hover:bg-blue-500 text-white font-black uppercase tracking-widest text-[10px] rounded-2xl shadow-lg transition-all duration-300 hover:scale-105 active:scale-95 disabled:opacity-50"
                            >
                                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {mode === "create" ? "Deploy Infrastructure" : "Sync Profile"}
                            </Button>
                        </div>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}

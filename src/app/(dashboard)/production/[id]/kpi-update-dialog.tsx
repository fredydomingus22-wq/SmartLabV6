"use client";

import { useState, useTransition } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
    DialogDescription
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Edit3, AlertTriangle, RefreshCcw } from "lucide-react";
import { updateScrapReworkAction } from "@/app/actions/production";
import { toast } from "sonner";

interface KPIUpdateDialogProps {
    batchId: string;
    currentScrap: number;
    currentRework: number;
}

export function KPIUpdateDialog({ batchId, currentScrap, currentRework }: KPIUpdateDialogProps) {
    const [open, setOpen] = useState(false);
    const [isPending, startTransition] = useTransition();
    const [scrap, setScrap] = useState(currentScrap.toString());
    const [rework, setRework] = useState(currentRework.toString());

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        startTransition(async () => {
            const formData = new FormData();
            formData.append("production_batch_id", batchId);
            formData.append("scrap_quantity", scrap);
            formData.append("rework_quantity", rework);

            const result = await updateScrapReworkAction(formData);
            if (result.success) {
                toast.success("KPIs atualizados com sucesso.");
                setOpen(false);
            } else {
                toast.error("Erro ao atualizar KPIs.");
            }
        });
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="h-6 px-2 text-[10px] font-bold uppercase tracking-widest text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10">
                    <Edit3 className="mr-1 h-3 w-3" /> Editar KPIs
                </Button>
            </DialogTrigger>
            <DialogContent className="bg-slate-900 border-slate-800 text-white sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Edit3 className="h-5 w-5 text-indigo-400" />
                        Atualizar KPIs de Produção
                    </DialogTitle>
                    <DialogDescription className="text-slate-400">
                        Registe as quantidades de refugo e retrabalho para este lote.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-6 py-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="scrap" className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                                <AlertTriangle className="h-3 w-3 text-red-500" />
                                Refugo / Perdas
                            </Label>
                            <Input
                                id="scrap"
                                type="number"
                                step="0.01"
                                value={scrap}
                                onChange={(e) => setScrap(e.target.value)}
                                className="bg-slate-950 border-slate-800 focus:ring-red-500/20 focus:border-red-500/50"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="rework" className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                                <RefreshCcw className="h-3 w-3 text-amber-500" />
                                Retrabalho
                            </Label>
                            <Input
                                id="rework"
                                type="number"
                                step="0.01"
                                value={rework}
                                onChange={(e) => setRework(e.target.value)}
                                className="bg-slate-950 border-slate-800 focus:ring-amber-500/20 focus:border-amber-500/50"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="ghost" onClick={() => setOpen(false)} disabled={isPending}>
                            Cancelar
                        </Button>
                        <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white" disabled={isPending}>
                            {isPending ? "A guardar..." : "Guardar Alterações"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

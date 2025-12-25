"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SearchableSelect } from "@/components/smart/searchable-select";
import { TrendingUp } from "lucide-react";
import { ActionForm } from "@/components/smart/action-form";
import { updateObjectiveProgressAction } from "@/app/actions/objectives";

interface UpdateProgressDialogProps {
    objectiveId: string;
    currentValue: number;
    currentStatus: string;
}

export function UpdateProgressDialog({ objectiveId, currentValue, currentStatus }: UpdateProgressDialogProps) {
    const [open, setOpen] = useState(false);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="h-7 text-xs text-emerald-400 hover:bg-emerald-500/10">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    Atualizar
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md glass">
                <DialogHeader>
                    <DialogTitle>Atualizar Progresso</DialogTitle>
                    <DialogDescription>
                        Registe o valor atual e atualize o estado do objetivo.
                    </DialogDescription>
                </DialogHeader>

                <ActionForm
                    action={updateObjectiveProgressAction}
                    onSuccess={() => setOpen(false)}
                    submitText="Guardar"
                >
                    <input type="hidden" name="objective_id" value={objectiveId} />

                    <div className="space-y-4">
                        <div className="grid gap-2">
                            <Label htmlFor="current_value">Valor Atual *</Label>
                            <Input
                                id="current_value"
                                name="current_value"
                                type="number"
                                min="0"
                                step="0.01"
                                defaultValue={currentValue}
                                required
                                className="glass"
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="status">Estado</Label>
                            <SearchableSelect
                                name="status"
                                defaultValue={currentStatus}
                                options={[
                                    { value: "on_track", label: "Em Progresso" },
                                    { value: "at_risk", label: "Em Risco" },
                                    { value: "achieved", label: "Atingido" },
                                    { value: "missed", label: "Não Atingido" },
                                ]}
                                placeholder="Selecionar..."
                            />
                        </div>
                    </div>
                </ActionForm>
            </DialogContent>
        </Dialog>
    );
}

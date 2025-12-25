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
import { Textarea } from "@/components/ui/textarea";
import { ClipboardList, Loader2 } from "lucide-react";
import { ActionForm } from "@/components/smart/action-form";
import { SearchableSelect } from "@/components/smart/searchable-select";
import { logMetrologyActivityAction } from "@/app/actions/metrology";

interface LogActivityDialogProps {
    equipmentId: string;
}

export function LogActivityDialog({ equipmentId }: LogActivityDialogProps) {
    const [open, setOpen] = useState(false);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="glass-primary w-full">
                    <ClipboardList className="h-4 w-4 mr-2" />
                    Registar Atividade
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md glass border-slate-800">
                <DialogHeader>
                    <DialogTitle>Registar Atividade Metrológica</DialogTitle>
                    <DialogDescription>
                        Registe uma manutenção, calibração ou verificação interna realizada no equipamento.
                    </DialogDescription>
                </DialogHeader>

                <ActionForm
                    action={logMetrologyActivityAction}
                    onSuccess={() => setOpen(false)}
                    submitText="Registar Agora"
                >
                    <input type="hidden" name="equipment_id" value={equipmentId} />

                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="activity_type">Tipo de Atividade *</Label>
                                <SearchableSelect
                                    name="activity_type"
                                    options={[
                                        { value: "maintenance", label: "Manutenção" },
                                        { value: "calibration", label: "Calibração" },
                                        { value: "verification", label: "Verificação" },
                                        { value: "repair", label: "Reparação" },
                                    ]}
                                    placeholder="Selecionar..."
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="result">Resultado *</Label>
                                <SearchableSelect
                                    name="result"
                                    options={[
                                        { value: "pass", label: "Conforme (Pass)" },
                                        { value: "fail", label: "Não Conforme (Fail)" },
                                    ]}
                                    placeholder="Resultado..."
                                />
                            </div>
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="performed_at">Data e Hora da Execução *</Label>
                            <Input
                                id="performed_at"
                                name="performed_at"
                                type="datetime-local"
                                defaultValue={new Date().toISOString().slice(0, 16)}
                                required
                                className="glass"
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="description">Descrição Breve *</Label>
                            <Input
                                id="description"
                                name="description"
                                placeholder="ex: Calibração externa RBC"
                                required
                                className="glass"
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="notes">Observações / Comentários</Label>
                            <Textarea
                                id="notes"
                                name="notes"
                                placeholder="Detalhes adicionais sobre a intervenção..."
                                className="glass"
                            />
                        </div>

                        <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                            <p className="text-[10px] text-amber-200 leading-relaxed">
                                <b>Nota:</b> Ao registar uma calibração ou manutenção conforme, as datas do próximo vencimento serão automaticamente atualizadas com base nos planos ativos.
                            </p>
                        </div>
                    </div>
                </ActionForm>
            </DialogContent>
        </Dialog>
    );
}

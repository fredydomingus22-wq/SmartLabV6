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
import { Plus, BookOpen } from "lucide-react";
import { ActionForm } from "@/components/smart/action-form";
import { createTrainingRecordAction } from "@/app/actions/training";

interface AddTrainingRecordDialogProps {
    employeeId: string;
    employeeName?: string;
}

export function AddTrainingRecordDialog({ employeeId, employeeName }: AddTrainingRecordDialogProps) {
    const [open, setOpen] = useState(false);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/10">
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Formação
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg glass">
                <DialogHeader>
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
                            <BookOpen className="h-5 w-5" />
                        </div>
                        <div>
                            <DialogTitle>Registar Formação</DialogTitle>
                            <DialogDescription>
                                Adicionar registo de formação para {employeeName || "funcionário"}.
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <ActionForm
                    action={createTrainingRecordAction}
                    onSuccess={() => setOpen(false)}
                    submitText="Guardar Formação"
                >
                    <input type="hidden" name="employee_id" value={employeeId} />

                    <div className="space-y-4">
                        <div className="grid gap-2">
                            <Label htmlFor="title">Título da Formação *</Label>
                            <Input
                                id="title"
                                name="title"
                                placeholder="ex: Boas Práticas de Laboratório"
                                required
                                className="glass"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="category">Categoria *</Label>
                                <SearchableSelect
                                    name="category"
                                    defaultValue="technical"
                                    options={[
                                        { value: "onboarding", label: "Integração" },
                                        { value: "compliance", label: "Conformidade / ISO" },
                                        { value: "technical", label: "Técnica" },
                                        { value: "safety", label: "Segurança" },
                                        { value: "soft_skills", label: "Soft Skills" },
                                        { value: "other", label: "Outras" },
                                    ]}
                                    placeholder="Selecionar..."
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="score">Pontuação (%)</Label>
                                <Input
                                    id="score"
                                    name="score"
                                    type="number"
                                    min="0"
                                    max="100"
                                    placeholder="ex: 85"
                                    className="glass"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="completion_date">Data de Conclusão *</Label>
                                <Input
                                    id="completion_date"
                                    name="completion_date"
                                    type="date"
                                    defaultValue={new Date().toISOString().split("T")[0]}
                                    className="glass text-white [color-scheme:dark]"
                                    required
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="expiry_date">Data de Validade</Label>
                                <Input
                                    id="expiry_date"
                                    name="expiry_date"
                                    type="date"
                                    className="glass text-white [color-scheme:dark]"
                                />
                            </div>
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="certificate_url">Link do Certificado (Opcional)</Label>
                            <Input
                                id="certificate_url"
                                name="certificate_url"
                                type="url"
                                placeholder="https://..."
                                className="glass"
                            />
                        </div>
                    </div>
                </ActionForm>
            </DialogContent>
        </Dialog>
    );
}

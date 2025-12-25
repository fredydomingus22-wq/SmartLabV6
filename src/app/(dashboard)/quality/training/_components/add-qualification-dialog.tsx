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
import { Plus, ShieldCheck } from "lucide-react";
import { ActionForm } from "@/components/smart/action-form";
import { addQualificationAction } from "@/app/actions/training";
import { SearchableSelect } from "@/components/smart/searchable-select";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

interface AddQualificationDialogProps {
    employeeId: string;
    parameters: any[];
}

export function AddQualificationDialog({ employeeId, parameters }: AddQualificationDialogProps) {
    const [open, setOpen] = useState(false);

    const parameterOptions = parameters.map(p => ({
        label: `${p.code} - ${p.name}`,
        value: p.id
    }));

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button size="sm" className="bg-emerald-600 hover:bg-emerald-500 text-white">
                    <Plus className="mr-2 h-4 w-4" />
                    Adicionar Qualificação
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md glass border-slate-800">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <ShieldCheck className="h-5 w-5 text-emerald-400" />
                        Atribuir Qualificação
                    </DialogTitle>
                    <DialogDescription>
                        Defina o nível de competência para um parâmetro analítico específico.
                    </DialogDescription>
                </DialogHeader>

                <ActionForm
                    action={addQualificationAction}
                    onSuccess={() => setOpen(false)}
                    submitText="Registar Qualificação"
                >
                    <input type="hidden" name="employee_id" value={employeeId} />

                    <div className="space-y-4">
                        <div className="grid gap-2">
                            <Label>Parâmetro Analítico *</Label>
                            <SearchableSelect
                                name="qa_parameter_id"
                                options={parameterOptions}
                                placeholder="Pesquisar parâmetro..."
                                required
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="status">Nível de Competência *</Label>
                            <Select name="status" defaultValue="trainee">
                                <SelectTrigger className="glass">
                                    <SelectValue placeholder="Selecionar nível" />
                                </SelectTrigger>
                                <SelectContent className="glass">
                                    <SelectItem value="trainee">Trainee (Em Formação)</SelectItem>
                                    <SelectItem value="qualified">Qualified (Qualificado)</SelectItem>
                                    <SelectItem value="expert">Expert (Sénior/Aprovador)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="qualified_at">Data de Qualificação</Label>
                                <Input id="qualified_at" name="qualified_at" type="date" className="glass" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="valid_until">Válido Até</Label>
                                <Input id="valid_until" name="valid_until" type="date" className="glass" />
                            </div>
                        </div>
                    </div>
                </ActionForm>
            </DialogContent>
        </Dialog>
    );
}

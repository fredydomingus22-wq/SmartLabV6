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
import { SearchableSelect } from "@/components/smart/searchable-select";
import { Plus, ClipboardCheck } from "lucide-react";
import { ActionForm } from "@/components/smart/action-form";
import { createAuditAction } from "@/app/actions/audits";

interface CreateAuditDialogProps {
    checklists: { id: string; name: string }[];
    users: { id: string; full_name: string }[];
}

export function CreateAuditDialog({ checklists, users }: CreateAuditDialogProps) {
    const [open, setOpen] = useState(false);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="glass-primary">
                    <Plus className="h-4 w-4 mr-2" />
                    Agendar Auditoria
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto glass">
                <DialogHeader>
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
                            <ClipboardCheck className="h-5 w-5" />
                        </div>
                        <div>
                            <DialogTitle>Agendar Nova Auditoria</DialogTitle>
                            <DialogDescription>
                                Definir planeamento para uma nova auditoria interna ou externa
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <ActionForm
                    action={createAuditAction}
                    onSuccess={() => setOpen(false)}
                    submitText="Agendar Auditoria"
                >
                    <div className="space-y-4">
                        <div className="grid gap-2">
                            <Label htmlFor="title">Título da Auditoria *</Label>
                            <Input
                                id="title"
                                name="title"
                                placeholder="ex: Auditoria Interna ISO 9001:2015"
                                required
                                className="glass"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="checklist_id">Checklist de Referência *</Label>
                                <SearchableSelect
                                    name="checklist_id"
                                    options={checklists.map(c => ({ value: c.id, label: c.name }))}
                                    placeholder="Selecionar checklist..."
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="planned_date">Data Planeada</Label>
                                <Input
                                    id="planned_date"
                                    name="planned_date"
                                    type="date"
                                    defaultValue={new Date().toISOString().split("T")[0]}
                                    className="glass text-white [color-scheme:dark]"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="auditor_id">Auditor Responsável</Label>
                                <SearchableSelect
                                    name="auditor_id"
                                    options={users.map(u => ({ value: u.id, label: u.full_name }))}
                                    placeholder="Selecionar auditor..."
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="auditee_id">Acompanhante (Auditee)</Label>
                                <SearchableSelect
                                    name="auditee_id"
                                    options={users.map(u => ({ value: u.id, label: u.full_name }))}
                                    placeholder="Selecionar utilizador..."
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="audit_type">Tipo de Auditoria *</Label>
                                <SearchableSelect
                                    name="audit_type"
                                    defaultValue="internal"
                                    options={[
                                        { value: "internal", label: "Interna" },
                                        { value: "external", label: "Externa (Certificação)" },
                                        { value: "client", label: "Cliente" },
                                        { value: "supplier", label: "Fornecedor" },
                                    ]}
                                    placeholder="Selecionar tipo..."
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="standard">Norma/Certificação</Label>
                                <SearchableSelect
                                    name="standard"
                                    options={[
                                        { value: "ISO 9001:2015", label: "ISO 9001:2015" },
                                        { value: "FSSC 22000 v6", label: "FSSC 22000 v6" },
                                        { value: "ISO 22000:2018", label: "ISO 22000:2018" },
                                        { value: "IFS Food v8", label: "IFS Food v8" },
                                        { value: "BRC GS v9", label: "BRC GS v9" },
                                        { value: "ISO 14001:2015", label: "ISO 14001:2015" },
                                        { value: "ISO 45001:2018", label: "ISO 45001:2018" },
                                        { value: "Outras", label: "Outras" },
                                    ]}
                                    placeholder="Selecionar norma..."
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="situation">Situação</Label>
                                <SearchableSelect
                                    name="situation"
                                    defaultValue="scheduled"
                                    options={[
                                        { value: "scheduled", label: "Programada" },
                                        { value: "surprise", label: "Surpresa" },
                                    ]}
                                    placeholder="Selecionar..."
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="external_entity">Entidade Externa</Label>
                                <Input
                                    id="external_entity"
                                    name="external_entity"
                                    placeholder="ex: SGS, APCER, Cliente XYZ..."
                                    className="glass"
                                />
                            </div>
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="scope">Âmbito da Auditoria</Label>
                            <Textarea
                                id="scope"
                                name="scope"
                                placeholder="Descrever processos ou áreas a auditar..."
                                rows={3}
                                className="glass"
                            />
                        </div>
                    </div>
                </ActionForm>
            </DialogContent>
        </Dialog>
    );
}

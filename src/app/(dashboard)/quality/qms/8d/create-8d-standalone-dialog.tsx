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
import { Plus } from "lucide-react";
import { ActionForm } from "@/components/smart/action-form";
import { create8DAction } from "@/app/actions/qms";

interface Create8DStandaloneDialogProps {
    users: { id: string, full_name: string | null, role: string }[];
}

export function Create8DStandaloneDialog({ users }: Create8DStandaloneDialogProps) {
    const [open, setOpen] = useState(false);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="glass-primary">
                    <Plus className="h-4 w-4 mr-2" />
                    Novo Relatório 8D
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg glass border-slate-800">
                <DialogHeader>
                    <DialogTitle>Criar Relatório 8D</DialogTitle>
                    <DialogDescription>
                        Iniciar uma nova investigação 8D para resolução de problemas
                    </DialogDescription>
                </DialogHeader>

                <ActionForm
                    action={create8DAction}
                    onSuccess={() => setOpen(false)}
                    submitText="Criar Relatório 8D"
                >
                    <div className="space-y-4 pt-4">
                        <div className="grid gap-2">
                            <Label htmlFor="champion">Líder da Equipa (Champion) *</Label>
                            <SearchableSelect
                                name="champion"
                                options={users.map(u => ({
                                    value: u.id,
                                    label: `${u.full_name || 'Sem Nome'} (${u.role})`
                                }))}
                                placeholder="Selecionar líder para atribuição de tarefas..."
                                required
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="problem_description">
                                D2: Descrição do Problema *
                            </Label>
                            <Textarea
                                id="problem_description"
                                name="problem_description"
                                placeholder="Descreva o problema usando 5W2H (O quê, Onde, Quando, Quem, Porquê, Como, Quanto)"
                                rows={4}
                                required
                                className="glass"
                            />
                        </div>

                        <div className="p-3 bg-muted/30 border border-slate-800 rounded-lg text-sm">
                            <p className="font-medium mb-2 text-slate-300">Passos do 8D:</p>
                            <ol className="list-decimal list-inside space-y-1 text-slate-400 text-xs text-left">
                                <li>Formar Equipa</li>
                                <li>Descrever Problema</li>
                                <li>Ação de Contenção</li>
                                <li>Causa Raiz</li>
                                <li>Ações Corretivas</li>
                                <li>Implementação</li>
                                <li>Prevenir Recorrência</li>
                                <li>Felicitar Equipa</li>
                            </ol>
                        </div>
                    </div>
                </ActionForm>
            </DialogContent>
        </Dialog>
    );
}


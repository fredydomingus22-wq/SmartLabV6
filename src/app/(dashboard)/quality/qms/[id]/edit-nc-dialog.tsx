"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
import { Pencil } from "lucide-react";
import { ActionForm } from "@/components/smart/action-form";
import { updateNCAction } from "@/app/actions/qms";

interface NC {
    id: string;
    title: string;
    description: string;
    nc_type: string;
    severity: string;
    category?: string;
    source_reference?: string;
    due_date?: string;
    notes?: string;
}

interface EditNCDialogProps {
    nc: NC;
}

export function EditNCDialog({ nc }: EditNCDialogProps) {
    const [open, setOpen] = useState(false);
    const router = useRouter();

    const handleSuccess = () => {
        setOpen(false);
        router.refresh();
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="glass">
                    <Pencil className="h-4 w-4 mr-2" />
                    Editar
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto glass">
                <DialogHeader>
                    <DialogTitle>Editar Não Conformidade</DialogTitle>
                    <DialogDescription>
                        Atualize os detalhes desta não conformidade
                    </DialogDescription>
                </DialogHeader>

                <ActionForm
                    action={updateNCAction}
                    onSuccess={handleSuccess}
                    submitText="Guardar Alterações"
                >

                    <div className="space-y-4 pt-4">
                        <input type="hidden" name="id" value={nc.id} />

                        <div className="grid gap-2">
                            <Label htmlFor="title">Título</Label>
                            <Input
                                id="title"
                                name="title"
                                defaultValue={nc.title}
                                className="glass"
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="description">Descrição</Label>
                            <Textarea
                                id="description"
                                name="description"
                                defaultValue={nc.description}
                                rows={3}
                                className="glass"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="nc_type">Tipo</Label>
                                <SearchableSelect
                                    name="nc_type"
                                    defaultValue={nc.nc_type}
                                    options={[
                                        { label: "Interna", value: "internal" },
                                        { label: "Fornecedor", value: "supplier" },
                                        { label: "Reclamação de Cliente", value: "customer" },
                                        { label: "Constatação de Auditoria", value: "audit" },
                                    ]}
                                    placeholder="Selecionar tipo"
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="severity">Gravidade</Label>
                                <SearchableSelect
                                    name="severity"
                                    defaultValue={nc.severity}
                                    options={[
                                        { label: "Menor", value: "minor" },
                                        { label: "Maior", value: "major" },
                                        { label: "Crítica", value: "critical" },
                                    ]}
                                    placeholder="Selecionar gravidade"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="category">Categoria</Label>
                                <SearchableSelect
                                    name="category"
                                    defaultValue={nc.category || ""}
                                    options={[
                                        { label: "Produto", value: "product" },
                                        { label: "Processo", value: "process" },
                                        { label: "Documentação", value: "documentation" },
                                        { label: "Equipamento", value: "equipment" },
                                        { label: "Embalagem", value: "packaging" },
                                        { label: "Higiene", value: "hygiene" },
                                        { label: "Outro", value: "other" },
                                    ]}
                                    placeholder="Selecionar categoria"
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="due_date">Data Limite</Label>
                                <Input
                                    id="due_date"
                                    name="due_date"
                                    type="date"
                                    defaultValue={nc.due_date?.split("T")[0]}
                                    className="glass text-white [color-scheme:dark]"
                                />
                            </div>
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="source_reference">Referência de Origem</Label>
                            <Input
                                id="source_reference"
                                name="source_reference"
                                defaultValue={nc.source_reference}
                                className="glass"
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="notes">Notas</Label>
                            <Textarea
                                id="notes"
                                name="notes"
                                defaultValue={nc.notes}
                                rows={2}
                                className="glass"
                            />
                        </div>
                    </div>

                </ActionForm>
            </DialogContent>
        </Dialog>
    );
}

"use client";

import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Pencil, Trash2, Clock, Zap, Hand, Plus } from "lucide-react";
import { toast } from "sonner";
import { toggleSamplingPlanActiveAction, deleteSamplingPlanAction } from "@/app/actions/sampling-plans";
import { SamplingPlanDialog } from "./sampling-plan-dialog";

interface SamplingPlan {
    id: string;
    name: string;
    description?: string;
    trigger_type: "time_based" | "event_based" | "manual";
    event_anchor?: string;
    frequency_minutes?: number;
    trigger_on_start: boolean;
    is_active: boolean;
    parameter_ids?: string[];
    product: { id: string; name: string; sku: string } | null;
    sample_type: { id: string; name: string; code: string } | null;
}

interface Props {
    plans: SamplingPlan[];
    products: { id: string; name: string; sku: string }[];
    sampleTypes: { id: string; name: string; code: string }[];
}

export function SamplingPlansClient({ plans, products, sampleTypes }: Props) {
    const [editingPlan, setEditingPlan] = React.useState<SamplingPlan | null>(null);

    const handleToggleActive = async (id: string, currentValue: boolean) => {
        const result = await toggleSamplingPlanActiveAction(id, !currentValue);
        if (result.success) {
            toast.success(result.message);
        } else {
            toast.error(result.message);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Tem certeza que deseja eliminar este plano?")) return;
        const result = await deleteSamplingPlanAction(id);
        if (result.success) {
            toast.success(result.message);
        } else {
            toast.error(result.message);
        }
    };

    const getTriggerIcon = (type: string) => {
        switch (type) {
            case "time_based": return <Clock className="h-3.5 w-3.5 text-blue-400" />;
            case "event_based": return <Zap className="h-3.5 w-3.5 text-amber-400" />;
            case "manual": return <Hand className="h-3.5 w-3.5 text-slate-400" />;
            default: return null;
        }
    };

    const getTriggerLabel = (type: string) => {
        switch (type) {
            case "time_based": return "Temporal";
            case "event_based": return "Evento";
            case "manual": return "Manual";
            default: return type;
        }
    };

    const getEventAnchorLabel = (anchor?: string) => {
        const labels: Record<string, string> = {
            batch_start: "Início Lote",
            batch_end: "Fim Lote",
            shift_change: "Mudança Turno",
            process_step: "Etapa Processo",
        };
        return anchor ? labels[anchor] || anchor : "-";
    };

    const formatFrequency = (minutes?: number) => {
        if (!minutes) return "-";
        if (minutes < 60) return `${minutes} min`;
        if (minutes < 1440) return `${Math.round(minutes / 60)}h`;
        return `${Math.round(minutes / 1440)}d`;
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-end">
                <SamplingPlanDialog
                    mode="create"
                    products={products}
                    sampleTypes={sampleTypes}
                    trigger={
                        <Button className="h-9 bg-indigo-600 hover:bg-indigo-500 text-white font-bold uppercase text-[10px] tracking-widest rounded-xl">
                            <Plus className="h-4 w-4 mr-2" />
                            Novo Plano
                        </Button>
                    }
                />
            </div>

            <Card className="bg-card border-slate-800 overflow-hidden rounded-2xl">
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow className="border-slate-800 hover:bg-transparent">
                                <TableHead className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Nome</TableHead>
                                <TableHead className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Produto</TableHead>
                                <TableHead className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Tipo Amostra</TableHead>
                                <TableHead className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Trigger</TableHead>
                                <TableHead className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Frequência</TableHead>
                                <TableHead className="text-[10px] font-bold uppercase tracking-widest text-slate-500 text-center">Ativo</TableHead>
                                <TableHead className="text-[10px] font-bold uppercase tracking-widest text-slate-500 w-[50px]"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {plans.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center py-12 text-slate-500 text-sm">
                                        Nenhum plano de amostragem configurado
                                    </TableCell>
                                </TableRow>
                            ) : (
                                plans.map((plan) => {
                                    const product = Array.isArray(plan.product) ? plan.product[0] : plan.product;
                                    const sampleType = Array.isArray(plan.sample_type) ? plan.sample_type[0] : plan.sample_type;

                                    return (
                                        <TableRow key={plan.id} className="border-slate-800/50 hover:bg-slate-900/30">
                                            <TableCell>
                                                <div>
                                                    <p className="font-medium text-white">{plan.name}</p>
                                                    {plan.description && (
                                                        <p className="text-xs text-slate-500 truncate max-w-[200px]">{plan.description}</p>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <span className="text-sm">{product?.name || "-"}</span>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className="text-[9px] font-bold uppercase">
                                                    {sampleType?.name || "-"}
                                                </Badge>
                                                {plan.parameter_ids && plan.parameter_ids.length > 0 && (
                                                    <span className="ml-2 bg-slate-800 text-slate-400 text-[9px] px-1.5 py-0.5 rounded-full border border-slate-700">
                                                        {plan.parameter_ids.length}p
                                                    </span>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    {getTriggerIcon(plan.trigger_type)}
                                                    <span className="text-xs">{getTriggerLabel(plan.trigger_type)}</span>
                                                    {plan.trigger_type === "event_based" && (
                                                        <span className="text-[10px] text-slate-500">({getEventAnchorLabel(plan.event_anchor)})</span>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <span className="text-sm font-mono">{formatFrequency(plan.frequency_minutes)}</span>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <Switch
                                                    checked={plan.is_active}
                                                    onCheckedChange={() => handleToggleActive(plan.id, plan.is_active)}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8">
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="bg-slate-950 border-slate-800">
                                                        <SamplingPlanDialog
                                                            mode="edit"
                                                            initialData={plan}
                                                            products={products}
                                                            sampleTypes={sampleTypes}
                                                            trigger={
                                                                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                                                    <Pencil className="h-4 w-4 mr-2" />
                                                                    Editar
                                                                </DropdownMenuItem>
                                                            }
                                                        />
                                                        <DropdownMenuItem
                                                            onClick={() => handleDelete(plan.id)}
                                                            className="text-red-400 focus:text-red-400"
                                                        >
                                                            <Trash2 className="h-4 w-4 mr-2" />
                                                            Eliminar
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}

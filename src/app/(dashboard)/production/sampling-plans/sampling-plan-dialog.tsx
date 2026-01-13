"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { SearchableSelect } from "@/components/smart/searchable-select";
import { Loader2, Clock, Zap, Hand } from "lucide-react";
import { toast } from "sonner";
import { createSamplingPlanAction, updateSamplingPlanAction, getProductParametersAction } from "@/app/actions/sampling-plans";

interface Props {
    mode: "create" | "edit";
    initialData?: any;
    products: { id: string; name: string; sku: string }[];
    sampleTypes: { id: string; name: string; code: string }[];
    trigger: React.ReactNode;
}

export function SamplingPlanDialog({ mode, initialData, products, sampleTypes, trigger }: Props) {
    const [open, setOpen] = React.useState(false);
    const [loading, setLoading] = React.useState(false);
    const [fetchingParams, setFetchingParams] = React.useState(false);

    const [triggerType, setTriggerType] = React.useState<string>(initialData?.trigger_type || "event_based");
    const [eventAnchor, setEventAnchor] = React.useState<string>(initialData?.event_anchor || "batch_start");
    const [productId, setProductId] = React.useState<string>(initialData?.product?.id || "");
    const [sampleTypeId, setSampleTypeId] = React.useState<string>(initialData?.sample_type?.id || "");
    const [availableParameters, setAvailableParameters] = React.useState<any[]>([]);
    const [selectedParameterIds, setSelectedParameterIds] = React.useState<string[]>(initialData?.parameter_ids || []);

    React.useEffect(() => {
        if (open && initialData) {
            setTriggerType(initialData.trigger_type || "event_based");
            setEventAnchor(initialData.event_anchor || "batch_start");
            setProductId(initialData.product?.id || "");
            setSampleTypeId(initialData.sample_type?.id || "");
            setSelectedParameterIds(initialData.parameter_ids || []);
        }
    }, [open, initialData]);

    React.useEffect(() => {
        if (productId) {
            setFetchingParams(true);
            getProductParametersAction(productId).then(res => {
                if (res.success) {
                    setAvailableParameters(res.data);
                }
                setFetchingParams(false);
            });
        } else {
            setAvailableParameters([]);
        }
    }, [productId]);

    const toggleParameter = (id: string) => {
        setSelectedParameterIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);

        const formData = new FormData(e.currentTarget);
        formData.set("trigger_type", triggerType);
        formData.set("event_anchor", eventAnchor);
        formData.set("product_id", productId);
        formData.set("sample_type_id", sampleTypeId);
        formData.set("trigger_on_start", formData.get("trigger_on_start") ? "true" : "false");
        formData.set("is_active", formData.get("is_active") ? "true" : "false");
        formData.set("parameter_ids", JSON.stringify(selectedParameterIds));

        const result = mode === "create"
            ? await createSamplingPlanAction(formData)
            : await updateSamplingPlanAction(initialData.id, formData);

        setLoading(false);

        if (result.success) {
            toast.success(result.message);
            setOpen(false);
        } else {
            toast.error(result.message);
        }
    };

    const eventAnchorOptions = [
        { value: "batch_start", label: "Início do Lote" },
        { value: "batch_end", label: "Fim do Lote" },
        { value: "shift_change", label: "Mudança de Turno" },
        { value: "process_step", label: "Etapa do Processo" },
    ];

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>{trigger}</DialogTrigger>
            <DialogContent className="sm:max-w-[500px] max-h-[85vh] bg-slate-950 border-slate-800 flex flex-col">
                <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-bold">
                            {mode === "create" ? "Novo Plano de Amostragem" : "Editar Plano"}
                        </DialogTitle>
                        <DialogDescription className="text-slate-500">
                            Configure quando e como amostras devem ser coletadas automaticamente.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="flex-1 overflow-y-auto pr-2 -mr-2">
                        <div className="grid gap-5 py-6">
                            {/* Name */}
                            <div className="space-y-2">
                                <Label htmlFor="name" className="text-xs font-bold uppercase tracking-widest text-slate-400">Nome do Plano</Label>
                                <Input
                                    id="name"
                                    name="name"
                                    defaultValue={initialData?.name || ""}
                                    required
                                    className="bg-slate-900 border-slate-800"
                                    placeholder="Ex: Amostragem Horária FP"
                                />
                            </div>

                            {/* Description */}
                            <div className="space-y-2">
                                <Label htmlFor="description" className="text-xs font-bold uppercase tracking-widest text-slate-400">Descrição</Label>
                                <Input
                                    id="description"
                                    name="description"
                                    defaultValue={initialData?.description || ""}
                                    className="bg-slate-900 border-slate-800"
                                    placeholder="Opcional"
                                />
                            </div>

                            {/* Product */}
                            <div className="space-y-2">
                                <Label className="text-xs font-bold uppercase tracking-widest text-slate-400">Produto</Label>
                                <SearchableSelect
                                    options={products.map(p => ({ value: p.id, label: `${p.name} [${p.sku}]` }))}
                                    value={productId}
                                    onValueChange={setProductId}
                                    placeholder="Selecione o produto..."
                                />
                            </div>

                            {/* Sample Type */}
                            <div className="space-y-2">
                                <Label className="text-xs font-bold uppercase tracking-widest text-slate-400">Tipo de Amostra</Label>
                                <SearchableSelect
                                    options={sampleTypes.map(t => ({ value: t.id, label: `${t.name} (${t.code})` }))}
                                    value={sampleTypeId}
                                    onValueChange={setSampleTypeId}
                                    placeholder="Selecione o tipo..."
                                />
                            </div>

                            {/* Parameters Selection */}
                            <div className="space-y-3">
                                <Label className="text-xs font-bold uppercase tracking-widest text-slate-400 flex items-center justify-between">
                                    Parâmetros Requeridos
                                    {fetchingParams && <Loader2 className="h-3 w-3 animate-spin text-slate-500" />}
                                </Label>

                                {productId ? (
                                    <div className="grid grid-cols-2 gap-2 p-3 rounded-xl bg-slate-900/50 border border-slate-800 max-h-[200px] overflow-y-auto">
                                        {availableParameters.length > 0 ? (
                                            availableParameters.map((param) => (
                                                <div
                                                    key={param.id}
                                                    className={cn(
                                                        "flex items-center space-x-2 p-2 rounded-lg transition-colors cursor-pointer",
                                                        selectedParameterIds.includes(param.id) ? "bg-indigo-500/10 border-indigo-500/20" : "hover:bg-slate-800"
                                                    )}
                                                    onClick={() => toggleParameter(param.id)}
                                                >
                                                    <Checkbox
                                                        id={`param-${param.id}`}
                                                        checked={selectedParameterIds.includes(param.id)}
                                                        onCheckedChange={() => toggleParameter(param.id)}
                                                    />
                                                    <div className="flex flex-col">
                                                        <span className="text-xs font-medium text-slate-200 leading-none">{param.name}</span>
                                                        <span className="text-[10px] text-slate-500 font-mono mt-1">{param.code}</span>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="col-span-2 py-4 text-center">
                                                <span className="text-xs text-slate-500 italic">Nenhum parâmetro definido para este produto.</span>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="p-4 rounded-xl border border-dashed border-slate-800 text-center">
                                        <span className="text-xs text-slate-500 italic">Selecione um produto primeiro.</span>
                                    </div>
                                )}
                                <p className="text-[10px] text-slate-500 italic px-1">
                                    Se vago, o sistema assumirá todos os parâmetros da especificação.
                                </p>
                            </div>

                            {/* Trigger Type */}
                            <div className="space-y-2">
                                <Label className="text-xs font-bold uppercase tracking-widest text-slate-400">Tipo de Disparo</Label>
                                <ToggleGroup
                                    type="single"
                                    value={triggerType}
                                    onValueChange={(v) => v && setTriggerType(v)}
                                    className="justify-start gap-2"
                                >
                                    <ToggleGroupItem
                                        value="time_based"
                                        className="px-4 h-9 rounded-lg text-xs font-medium bg-transparent text-slate-400 border border-transparent data-[state=on]:bg-blue-600 data-[state=on]:text-white data-[state=on]:border-blue-600"
                                    >
                                        <Clock className="h-3.5 w-3.5 mr-2" />
                                        Temporal
                                    </ToggleGroupItem>
                                    <ToggleGroupItem
                                        value="event_based"
                                        className="px-4 h-9 rounded-lg text-xs font-medium bg-transparent text-slate-400 border border-transparent data-[state=on]:bg-amber-600 data-[state=on]:text-white data-[state=on]:border-amber-600"
                                    >
                                        <Zap className="h-3.5 w-3.5 mr-2" />
                                        Evento
                                    </ToggleGroupItem>
                                    <ToggleGroupItem
                                        value="manual"
                                        className="px-4 h-9 rounded-lg text-xs font-medium bg-transparent text-slate-400 border border-transparent data-[state=on]:bg-slate-600 data-[state=on]:text-white data-[state=on]:border-slate-600"
                                    >
                                        <Hand className="h-3.5 w-3.5 mr-2" />
                                        Manual
                                    </ToggleGroupItem>
                                </ToggleGroup>
                            </div>

                            {/* Event Anchor - only for event_based */}
                            {triggerType === "event_based" && (
                                <div className="space-y-2">
                                    <Label className="text-xs font-bold uppercase tracking-widest text-slate-400">Evento Âncora</Label>
                                    <SearchableSelect
                                        options={eventAnchorOptions}
                                        value={eventAnchor}
                                        onValueChange={setEventAnchor}
                                        placeholder="Selecione o evento..."
                                    />
                                </div>
                            )}

                            {/* Frequency - only for time_based */}
                            {triggerType === "time_based" && (
                                <div className="space-y-2">
                                    <Label htmlFor="frequency_minutes" className="text-xs font-bold uppercase tracking-widest text-slate-400">
                                        Frequência (minutos)
                                    </Label>
                                    <Input
                                        id="frequency_minutes"
                                        name="frequency_minutes"
                                        type="number"
                                        min={1}
                                        defaultValue={initialData?.frequency_minutes || 60}
                                        className="bg-slate-900 border-slate-800"
                                    />
                                </div>
                            )}

                            {/* Checkboxes */}
                            <div className="flex gap-6 pt-2">
                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="trigger_on_start"
                                        name="trigger_on_start"
                                        defaultChecked={initialData?.trigger_on_start ?? true}
                                    />
                                    <Label htmlFor="trigger_on_start" className="text-sm text-slate-300">
                                        Disparar ao iniciar lote
                                    </Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="is_active"
                                        name="is_active"
                                        defaultChecked={initialData?.is_active ?? true}
                                    />
                                    <Label htmlFor="is_active" className="text-sm text-slate-300">
                                        Plano ativo
                                    </Label>
                                </div>
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="pt-4 border-t border-slate-800 mt-2">
                        <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={loading} className="bg-indigo-600 hover:bg-indigo-500">
                            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                            {mode === "create" ? "Criar Plano" : "Guardar"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

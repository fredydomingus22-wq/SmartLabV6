"use client";

import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { SearchableSelect } from "@/components/smart/searchable-select";
import { Filter, CalendarDays } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface SPCFiltersProps {
    products: any[];
    parameters: any[];
    sampleTypes: any[];
    batches: any[];
    selectedProduct: string;
    onProductChange: (val: string) => void;
    selectedParameter: string;
    onParameterChange: (val: string) => void;
    selectedSampleType: string;
    onSampleTypeChange: (val: string) => void;
    selectedBatch: string;
    onBatchChange: (val: string) => void;
    startDate: string;
    onStartDateChange: (val: string) => void;
    endDate: string;
    onEndDateChange: (val: string) => void;
}

export function SPCFilters({
    products,
    parameters,
    sampleTypes,
    batches,
    selectedProduct,
    onProductChange,
    selectedParameter,
    onParameterChange,
    selectedSampleType,
    onSampleTypeChange,
    selectedBatch,
    onBatchChange,
    startDate,
    onStartDateChange,
    endDate,
    onEndDateChange
}: SPCFiltersProps) {
    return (
        <Card className="h-full bg-slate-950/50 border-r border-white/10 backdrop-blur-md rounded-none flex flex-col pt-4">
            <div className="flex items-center gap-2 mb-4 px-4 flex-shrink-0">
                <div className="h-8 w-8 rounded-lg bg-indigo-500/10 flex items-center justify-center">
                    <Filter className="h-4 w-4 text-indigo-400" />
                </div>
                <h2 className="font-bold text-slate-200">Configuração</h2>
            </div>

            <ScrollArea className="flex-1 w-full">
                <div className="p-4 space-y-6">
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label className="text-xs font-bold uppercase tracking-widest text-slate-500">Tipo de Amostra</Label>
                            <SearchableSelect
                                value={selectedSampleType}
                                onValueChange={onSampleTypeChange}
                                options={[
                                    { value: "all", label: "Todos os Tipos" },
                                    ...sampleTypes.map(st => ({ value: st.id, label: st.name }))
                                ]}
                                placeholder="Tipo de Amostra..."
                            />
                        </div>

                        <div className="space-y-2">
                            <Label className="text-xs font-bold uppercase tracking-widest text-slate-500">Produto</Label>
                            <SearchableSelect
                                value={selectedProduct}
                                onValueChange={onProductChange}
                                options={[
                                    { value: "all", label: "Todos os Produtos" },
                                    ...products.map(p => ({ value: p.id, label: p.name }))
                                ]}
                                placeholder="Selecione o Produto..."
                            />
                        </div>

                        <div className="space-y-2">
                            <Label className="text-xs font-bold uppercase tracking-widest text-slate-500">Lote</Label>
                            <SearchableSelect
                                disabled={selectedProduct === "all"}
                                value={selectedBatch}
                                onValueChange={onBatchChange}
                                options={[
                                    { value: "all", label: "Todos os Lotes" },
                                    ...(batches || []).map(b => ({ value: b.id, label: b.code || b.id }))
                                ]}
                                placeholder={selectedProduct === "all" ? "Selecione um Produto primeiro" : "Selecione o Lote..."}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label className="text-xs font-bold uppercase tracking-widest text-slate-500">Parâmetro</Label>
                            <SearchableSelect
                                value={selectedParameter}
                                onValueChange={onParameterChange}
                                options={parameters.map(p => ({ value: p.id, label: p.name }))}
                                placeholder="Selecione o Parâmetro..."
                            />
                        </div>

                        <div className="pt-4 border-t border-white/10 space-y-4">
                            <div className="flex items-center gap-2">
                                <CalendarDays className="h-4 w-4 text-slate-500" />
                                <span className="text-xs font-bold uppercase tracking-widest text-slate-500">Período</span>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-[10px] text-slate-400">Início</Label>
                                <Input
                                    type="date"
                                    className="bg-slate-900 border-white/10 text-slate-200"
                                    value={startDate}
                                    onChange={(e) => onStartDateChange(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] text-slate-400">Fim</Label>
                                <Input
                                    type="date"
                                    className="bg-slate-900 border-white/10 text-slate-200"
                                    value={endDate}
                                    onChange={(e) => onEndDateChange(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="pt-6 text-[10px] uppercase font-bold tracking-[0.2em] text-slate-600 text-center flex-shrink-0">
                        SmartLab V6 Engine
                    </div>
                </div>
            </ScrollArea>
        </Card>
    );
}

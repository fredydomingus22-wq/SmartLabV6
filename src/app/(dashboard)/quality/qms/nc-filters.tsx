"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { SearchableSelect } from "@/components/smart/searchable-select";
import { Filter, X, ChevronDown, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function NCFilters() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const [status, setStatus] = useState(searchParams.get("status") || "");
    const [severity, setSeverity] = useState(searchParams.get("severity") || "");
    const [ncType, setNcType] = useState(searchParams.get("type") || "");

    const applyFilters = () => {
        const params = new URLSearchParams();
        if (status) params.set("status", status);
        if (severity) params.set("severity", severity);
        if (ncType) params.set("type", ncType);
        router.push(`/quality/qms?${params.toString()}`);
    };

    const clearFilters = () => {
        setStatus("");
        setSeverity("");
        setNcType("");
        router.push("/quality/qms");
    };

    const hasFilters = status || severity || ncType;

    return (
        <div className="glass-dark p-6 rounded-2xl border-white/5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
                        <Filter className="h-4 w-4 text-indigo-400" />
                    </div>
                    <div>
                        <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Filtragem Avançada</h4>
                        <p className="text-[9px] text-slate-600 font-bold uppercase tracking-widest mt-0.5">Refine a sua visualização de desvios</p>
                    </div>
                </div>

                {hasFilters && (
                    <Button
                        onClick={clearFilters}
                        variant="ghost"
                        size="sm"
                        className="h-8 text-[9px] font-black uppercase tracking-widest text-rose-400 hover:bg-rose-500/10 transition-colors"
                    >
                        <Trash2 className="h-3 w-3 mr-2" />
                        Limpar Filtros
                    </Button>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-1.5">
                    <label className="text-[9px] font-black uppercase tracking-widest text-slate-500 ml-1">Estado</label>
                    <SearchableSelect
                        value={status}
                        onValueChange={setStatus}
                        placeholder="Todos os Estados"
                        options={[
                            { value: "open", label: "Aberta" },
                            { value: "under_investigation", label: "Em Investigação" },
                            { value: "containment", label: "Contenção" },
                            { value: "corrective_action", label: "Ação Corretiva" },
                            { value: "verification", label: "Verificação" },
                            { value: "closed", label: "Fechada" },
                        ]}
                        className="glass border-white/5 text-[11px] font-bold"
                    />
                </div>

                <div className="space-y-1.5">
                    <label className="text-[9px] font-black uppercase tracking-widest text-slate-500 ml-1">Gravidade</label>
                    <SearchableSelect
                        value={severity}
                        onValueChange={setSeverity}
                        placeholder="Todas as Gravidades"
                        options={[
                            { value: "minor", label: "Menor" },
                            { value: "major", label: "Maior" },
                            { value: "critical", label: "Crítica" },
                        ]}
                    />
                </div>

                <div className="space-y-1.5">
                    <label className="text-[9px] font-black uppercase tracking-widest text-slate-500 ml-1">Tipo de Ocorrência</label>
                    <SearchableSelect
                        value={ncType}
                        onValueChange={setNcType}
                        placeholder="Todos os Tipos"
                        options={[
                            { value: "internal", label: "Interna" },
                            { value: "supplier", label: "Fornecedor" },
                            { value: "customer", label: "Cliente" },
                            { value: "audit", label: "Auditoria" },
                        ]}
                    />
                </div>

                <div className="flex items-end">
                    <Button
                        onClick={applyFilters}
                        className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-black uppercase tracking-widest text-[10px] h-10 shadow-lg shadow-indigo-600/20"
                    >
                        Filtrar Resultados
                    </Button>
                </div>
            </div>
        </div>
    );
}

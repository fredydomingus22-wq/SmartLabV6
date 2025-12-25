"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { SearchableSelect } from "@/components/smart/searchable-select";
import { Filter, X } from "lucide-react";

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
        <div className="flex flex-wrap items-center gap-3 p-4 bg-muted/30 rounded-lg border border-slate-800">
            <div className="flex items-center gap-2 text-sm font-medium text-slate-400">
                <Filter className="h-4 w-4" />
                Filtros:
            </div>

            <SearchableSelect
                value={status}
                onValueChange={setStatus}
                placeholder="Status"
                options={[
                    { value: "open", label: "Aberta" },
                    { value: "under_investigation", label: "Em Investigação" },
                    { value: "containment", label: "Contenção" },
                    { value: "corrective_action", label: "Ação Corretiva" },
                    { value: "verification", label: "Verificação" },
                    { value: "closed", label: "Fechada" },
                ]}
            />

            <SearchableSelect
                value={severity}
                onValueChange={setSeverity}
                placeholder="Gravidade"
                options={[
                    { value: "minor", label: "Menor" },
                    { value: "major", label: "Maior" },
                    { value: "critical", label: "Crítica" },
                ]}
            />

            <SearchableSelect
                value={ncType}
                onValueChange={setNcType}
                placeholder="Tipo"
                options={[
                    { value: "internal", label: "Interna" },
                    { value: "supplier", label: "Fornecedor" },
                    { value: "customer", label: "Cliente" },
                    { value: "audit", label: "Auditoria" },
                ]}
            />

            <Button onClick={applyFilters} size="sm">
                Aplicar
            </Button>

            {hasFilters && (
                <Button onClick={clearFilters} variant="ghost" size="sm" className="text-slate-400 hover:text-white">
                    <X className="h-4 w-4 mr-1" />
                    Limpar
                </Button>
            )}
        </div>
    );
}

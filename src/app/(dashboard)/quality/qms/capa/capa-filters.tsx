"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { SearchableSelect } from "@/components/smart/searchable-select";
import { Filter, X } from "lucide-react";

export function CAPAFilters() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const [status, setStatus] = useState(searchParams.get("status") || "");
    const [type, setType] = useState(searchParams.get("type") || "");

    const applyFilters = () => {
        const params = new URLSearchParams();
        if (status) params.set("status", status);
        if (type) params.set("type", type);
        router.push(`/quality/qms/capa?${params.toString()}`);
    };

    const clearFilters = () => {
        setStatus("");
        setType("");
        router.push("/quality/qms/capa");
    };

    const hasFilters = status || type;

    return (
        <div className="flex flex-wrap items-center gap-3 p-4 bg-muted/30 rounded-lg border border-slate-800 glass">
            <div className="flex items-center gap-2 text-sm font-medium text-slate-400">
                <Filter className="h-4 w-4" />
                Filtros:
            </div>

            <SearchableSelect
                value={status}
                onValueChange={setStatus}
                placeholder="Status"
                options={[
                    { value: "planned", label: "Planeada" },
                    { value: "in_progress", label: "Em Progresso" },
                    { value: "completed", label: "Concluída" },
                    { value: "verified", label: "Verificada" },
                    { value: "closed", label: "Fechada" },
                ]}
            />

            <SearchableSelect
                value={type}
                onValueChange={setType}
                placeholder="Tipo"
                options={[
                    { value: "corrective", label: "Corretiva" },
                    { value: "preventive", label: "Preventiva" },
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

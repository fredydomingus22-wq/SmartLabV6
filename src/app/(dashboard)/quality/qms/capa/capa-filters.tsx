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
        <div className="flex flex-row items-center gap-2 w-full">
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
                className="w-[180px]"
            />

            <SearchableSelect
                value={type}
                onValueChange={setType}
                placeholder="Tipo"
                options={[
                    { value: "corrective", label: "Corretiva" },
                    { value: "preventive", label: "Preventiva" },
                ]}
                className="w-[180px]"
            />

            <div className="flex items-center gap-2 ml-auto">
                {hasFilters && (
                    <Button onClick={clearFilters} variant="ghost" size="sm" className="h-8 px-2 text-muted-foreground hover:text-foreground">
                        <X className="h-3 w-3 mr-1" />
                        Limpar
                    </Button>
                )}
                <Button onClick={applyFilters} size="sm" className="h-8">
                    Aplicar
                </Button>
            </div>
        </div>
    );
}

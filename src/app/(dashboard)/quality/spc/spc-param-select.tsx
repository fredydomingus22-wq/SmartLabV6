"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { SearchableSelect } from "@/components/smart/searchable-select";

interface Parameter {
    id: string;
    name: string;
    code: string;
    unit: string;
}

interface SPCParameterSelectProps {
    parameters: Parameter[];
    selectedId?: string;
}

export function SPCParameterSelect({ parameters, selectedId }: SPCParameterSelectProps) {
    const router = useRouter();
    const searchParams = useSearchParams();

    const handleChange = (value: string) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set("parameter", value);
        router.push(`/quality/spc?${params.toString()}`);
    };

    return (
        <div className="flex items-center gap-4">
            <label className="text-sm font-medium">Select Parameter:</label>
            <SearchableSelect
                value={selectedId}
                onValueChange={handleChange}
                placeholder="Choose a parameter..."
                options={parameters.map((p) => ({
                    value: p.id,
                    label: `${p.name} (${p.code}) - ${p.unit}`
                }))}
            />
        </div>
    );
}

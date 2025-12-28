"use client";

import { useEffect, useState } from "react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { getActiveLabAssetsAction } from "@/app/actions/lab-assets";
import { cn } from "@/lib/utils";

interface LabAsset {
    id: string;
    name: string;
    code: string;
    asset_category: string;
    status: string;
}

interface LabInstrumentSelectProps {
    value?: string;
    onValueChange: (value: string) => void;
    disabled?: boolean;
    error?: boolean;
}

export function LabInstrumentSelect({ value, onValueChange, disabled, error }: LabInstrumentSelectProps) {
    const [instruments, setInstruments] = useState<LabAsset[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadInstruments() {
            const result = await getActiveLabAssetsAction();
            if (result.success && result.data) {
                setInstruments(result.data);
            }
            setLoading(false);
        }
        loadInstruments();
    }, []);

    return (
        <Select value={value} onValueChange={onValueChange} disabled={disabled || loading}>
            <SelectTrigger className={cn(
                "w-[180px] bg-slate-900/50 border-slate-700 text-slate-100 text-xs h-9",
                error && "border-rose-500/50 ring-1 ring-rose-500/20"
            )}>
                <SelectValue placeholder={loading ? "Carregando..." : "Selecione..."} />
            </SelectTrigger>
            <SelectContent className="bg-slate-900 border-slate-800 text-slate-100">
                {instruments.map((inst) => (
                    <SelectItem key={inst.id} value={inst.id} className="focus:bg-slate-800 focus:text-white">
                        <div className="flex flex-col gap-0.5">
                            <span className="font-medium text-xs">{inst.name}</span>
                            <span className="text-[10px] text-slate-500 font-mono">{inst.code}</span>
                        </div>
                    </SelectItem>
                ))}
                {instruments.length === 0 && !loading && (
                    <div className="p-2 text-xs text-slate-500 italic">Nenhum instrumento encontrado</div>
                )}
            </SelectContent>
        </Select>
    );
}

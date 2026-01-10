"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Factory, Clock, RotateCcw } from "lucide-react";

interface ApprovalFiltersProps {
    shifts: any[];
    batches: any[];
}

export function ApprovalFilters({ shifts, batches }: ApprovalFiltersProps) {
    const router = useRouter();
    const searchParams = useSearchParams();

    const currentBatch = searchParams.get("batchId") || "all";
    const currentShift = searchParams.get("shiftId") || "all";

    const updateFilter = (key: string, value: string) => {
        const params = new URLSearchParams(searchParams.toString());
        if (value === "all") {
            params.delete(key);
        } else {
            params.set(key, value);
        }
        router.push(`/lab/approvals?${params.toString()}`);
    };

    const clearFilters = () => {
        router.push("/lab/approvals");
    };

    const hasFilters = currentBatch !== "all" || currentShift !== "all";

    return (
        <div className="flex flex-wrap items-center gap-4 p-4 glass rounded-2xl border-white/5 bg-slate-900/40">
            <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                    <Factory className="h-4 w-4 text-emerald-400" />
                </div>
                <Select value={currentBatch} onValueChange={(val) => updateFilter("batchId", val)}>
                    <SelectTrigger className="w-[200px] h-11 bg-slate-950/50 border-slate-800 rounded-xl focus:ring-emerald-500/20">
                        <SelectValue placeholder="Lote de Produção" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-950 border-slate-800 text-slate-200">
                        <SelectItem value="all">Todos os Lotes</SelectItem>
                        {batches.map((batch) => (
                            <SelectItem key={batch.id} value={batch.id}>
                                {batch.code}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20">
                    <Clock className="h-4 w-4 text-blue-400" />
                </div>
                <Select value={currentShift} onValueChange={(val) => updateFilter("shiftId", val)}>
                    <SelectTrigger className="w-[180px] h-11 bg-slate-950/50 border-slate-800 rounded-xl focus:ring-blue-500/20">
                        <SelectValue placeholder="Turno de Trabalho" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-950 border-slate-800 text-slate-200">
                        <SelectItem value="all">Todos os Turnos</SelectItem>
                        {shifts.map((shift) => (
                            <SelectItem key={shift.id} value={shift.id}>
                                {shift.name} ({shift.start_time.substring(0, 5)} - {shift.end_time.substring(0, 5)})
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {hasFilters && (
                <Button
                    variant="ghost"
                    onClick={clearFilters}
                    className="h-11 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 px-4"
                >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Limpar Filtros
                </Button>
            )}
        </div>
    );
}

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
        <div className="flex flex-wrap items-center gap-2 mb-6">
            <div className="flex items-center gap-1.5 px-3 h-9 rounded-xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.05] transition-all">
                <Factory className="h-3.5 w-3.5 text-emerald-500/70" />
                <Select value={currentBatch} onValueChange={(val) => updateFilter("batchId", val)}>
                    <SelectTrigger className="border-none bg-transparent h-auto p-0 text-[11px] font-bold uppercase tracking-widest text-slate-300 focus:ring-0 w-auto gap-2">
                        <SelectValue placeholder="Lote" />
                    </SelectTrigger>
                    <SelectContent className="glass border-white/10">
                        <SelectItem value="all" className="text-[10px] font-bold uppercase tracking-widest">Todos Lotes</SelectItem>
                        {batches.map((batch) => (
                            <SelectItem key={batch.id} value={batch.id} className="text-[10px] font-bold uppercase tracking-widest">
                                {batch.code}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <div className="flex items-center gap-1.5 px-3 h-9 rounded-xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.05] transition-all">
                <Clock className="h-3.5 w-3.5 text-blue-500/70" />
                <Select value={currentShift} onValueChange={(val) => updateFilter("shiftId", val)}>
                    <SelectTrigger className="border-none bg-transparent h-auto p-0 text-[11px] font-bold uppercase tracking-widest text-slate-300 focus:ring-0 w-auto gap-2">
                        <SelectValue placeholder="Turno" />
                    </SelectTrigger>
                    <SelectContent className="glass border-white/10">
                        <SelectItem value="all" className="text-[10px] font-bold uppercase tracking-widest">Todos Turnos</SelectItem>
                        {shifts.map((shift) => (
                            <SelectItem key={shift.id} value={shift.id} className="text-[10px] font-bold uppercase tracking-widest">
                                {shift.name.substring(0, 10)}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {hasFilters && (
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearFilters}
                    className="h-9 px-2 text-slate-500 hover:text-rose-400 transition-colors"
                >
                    <RotateCcw className="h-3.5 w-3.5" />
                </Button>
            )}
        </div>
    );
}

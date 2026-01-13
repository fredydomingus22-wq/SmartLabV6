"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { CalendarIcon, FilterX } from "lucide-react";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function DashboardToolbar() {
    const router = useRouter();
    const searchParams = useSearchParams();

    // Initial State from URL
    const initialFrom = searchParams.get("from") ? new Date(searchParams.get("from")!) : undefined;
    const initialTo = searchParams.get("to") ? new Date(searchParams.get("to")!) : undefined;
    const initialScope = searchParams.get("scope") || "all";

    const [date, setDate] = useState<{ from: Date | undefined; to: Date | undefined }>({
        from: initialFrom,
        to: initialTo,
    });

    const [scope, setScope] = useState(initialScope);

    // Sync to URL
    useEffect(() => {
        const params = new URLSearchParams(searchParams.toString());

        if (date.from) params.set("from", date.from.toISOString());
        else params.delete("from");

        if (date.to) params.set("to", date.to.toISOString());
        else params.delete("to");

        if (scope && scope !== "all") params.set("scope", scope);
        else params.delete("scope");

        router.push(`?${params.toString()}`);
    }, [date, scope, router, searchParams]);

    const clearFilters = () => {
        setDate({ from: undefined, to: undefined });
        setScope("all");
    };

    return (
        <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 px-3 h-9 rounded-xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.05] transition-all">
                <CalendarIcon className="h-3.5 w-3.5 text-emerald-500/70" />
                {/* Date Range Picker */}
                <Popover>
                    <PopoverTrigger asChild>
                        <button
                            id="date"
                            className={cn(
                                "text-[11px] font-bold uppercase tracking-widest outline-none",
                                !date.from ? "text-slate-500" : "text-slate-200"
                            )}
                        >
                            {date.from ? (
                                date.to ? (
                                    <>
                                        {format(date.from, "dd MMM", { locale: pt })} -{" "}
                                        {format(date.to, "dd MMM", { locale: pt })}
                                    </>
                                ) : (
                                    format(date.from, "dd MMM", { locale: pt })
                                )
                            ) : (
                                "Período"
                            )}
                        </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 glass border-white/10" align="start">
                        <Calendar
                            initialFocus
                            mode="range"
                            defaultMonth={date.from}
                            selected={date}
                            onSelect={setDate as any}
                            numberOfMonths={2}
                            locale={pt}
                            className="bg-transparent"
                        />
                    </PopoverContent>
                </Popover>
            </div>

            <div className="flex items-center">
                {/* Scope Filter */}
                <Select value={scope} onValueChange={setScope}>
                    <SelectTrigger className="h-9 px-3 bg-white/[0.03] border-white/5 rounded-xl text-[11px] font-bold uppercase tracking-widest text-slate-300 hover:bg-white/[0.05] transition-all w-auto gap-2">
                        <SelectValue placeholder="Área" />
                    </SelectTrigger>
                    <SelectContent className="glass border-white/10">
                        <SelectItem value="all" className="text-xs font-bold uppercase tracking-wider">🌏 Todos</SelectItem>
                        <SelectItem value="lab" className="text-xs font-bold uppercase tracking-wider">🧪 Lab FQ</SelectItem>
                        <SelectItem value="micro" className="text-xs font-bold uppercase tracking-wider">🔬 Micro</SelectItem>
                        <SelectItem value="production" className="text-xs font-bold uppercase tracking-wider">🏭 Produção</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Clear Button */}
            {(date.from || scope !== "all") && (
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearFilters}
                    className="h-9 px-2 text-slate-500 hover:text-rose-400 transition-colors"
                >
                    <FilterX className="h-3.5 w-3.5" />
                </Button>
            )}
        </div>
    );
}

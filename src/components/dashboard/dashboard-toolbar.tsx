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
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900/50 p-4 rounded-lg border border-slate-800/50 backdrop-blur-sm">
            <div className="flex items-center gap-2 w-full sm:w-auto">
                {/* Date Range Picker */}
                <Popover>
                    <PopoverTrigger asChild>
                        <Button
                            id="date"
                            variant={"outline"}
                            className={cn(
                                "w-full sm:w-[260px] justify-start text-left font-normal bg-slate-950 border-slate-800",
                                !date.from && "text-muted-foreground"
                            )}
                        >
                            <CalendarIcon className="mr-2 h-4 w-4 text-emerald-500" />
                            {date.from ? (
                                date.to ? (
                                    <>
                                        {format(date.from, "dd MMM", { locale: pt })} -{" "}
                                        {format(date.to, "dd MMM", { locale: pt })}
                                    </>
                                ) : (
                                    format(date.from, "dd MMM, yyyy", { locale: pt })
                                )
                            ) : (
                                <span>Filtrar por data...</span>
                            )}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                            initialFocus
                            mode="range"
                            defaultMonth={date.from}
                            selected={date}
                            onSelect={setDate as any}
                            numberOfMonths={2}
                            locale={pt}
                            className="bg-slate-950 border-slate-800"
                        />
                    </PopoverContent>
                </Popover>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
                {/* Scope Filter */}
                <Select value={scope} onValueChange={setScope}>
                    <SelectTrigger className="w-[180px] bg-slate-950 border-slate-800">
                        <SelectValue placeholder="Escopo" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-950 border-slate-800">
                        <SelectItem value="all">Todas as Áreas</SelectItem>
                        <SelectItem value="lab">Laboratório Físico-Químico</SelectItem>
                        <SelectItem value="micro">Microbiologia</SelectItem>
                        <SelectItem value="production">Produção</SelectItem>
                    </SelectContent>
                </Select>

                {/* Clear Button */}
                {(date.from || scope !== "all") && (
                    <Button variant="ghost" size="icon" onClick={clearFilters} className="text-muted-foreground hover:text-red-400">
                        <FilterX className="h-4 w-4" />
                    </Button>
                )}
            </div>
        </div>
    );
}

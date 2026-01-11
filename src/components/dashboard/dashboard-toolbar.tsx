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
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 glass border-white/10 p-5 rounded-2xl backdrop-blur-md shadow-2xl">
            <div className="flex items-center gap-3 w-full sm:w-auto">
                <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                    <CalendarIcon className="h-5 w-5 text-emerald-500" />
                </div>
                {/* Date Range Picker */}
                <Popover>
                    <PopoverTrigger asChild>
                        <Button
                            id="date"
                            variant={"outline"}
                            className={cn(
                                "w-full sm:w-[280px] justify-start text-left font-semibold h-11 glass border-white/5 hover:bg-white/5 transition-all text-sm",
                                !date.from && "text-muted-foreground"
                            )}
                        >
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
                                <span>Filtrar período...</span>
                            )}
                        </Button>
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

            <div className="flex items-center gap-3 w-full sm:w-auto">
                {/* Scope Filter */}
                <Select value={scope} onValueChange={setScope}>
                    <SelectTrigger className="w-[200px] h-11 glass border-white/5 font-semibold text-sm">
                        <SelectValue placeholder="Escopo" />
                    </SelectTrigger>
                    <SelectContent className="glass border-white/10">
                        <SelectItem value="all">🌏 Todas as Áreas</SelectItem>
                        <SelectItem value="lab">🧪 Lab Físico-Químico</SelectItem>
                        <SelectItem value="micro">🔬 Microbiologia</SelectItem>
                        <SelectItem value="production">🏭 Produção MES</SelectItem>
                    </SelectContent>
                </Select>

                {/* Clear Button */}
                {(date.from || scope !== "all") && (
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={clearFilters}
                        className="h-11 w-11 rounded-xl text-muted-foreground hover:text-red-400 hover:bg-red-400/10 transition-colors"
                    >
                        <FilterX className="h-4 w-4" />
                    </Button>
                )}
            </div>
        </div>
    );
}

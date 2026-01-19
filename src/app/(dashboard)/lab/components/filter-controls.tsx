"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Search, Calendar, RotateCcw } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import { cn } from "@/lib/utils";

export function FilterControls() {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const search = searchParams.get("search") || "";
    const dateParam = searchParams.get("date") || "";
    const date = dateParam ? new Date(dateParam) : undefined;

    const updateParams = (updates: Record<string, string | null>) => {
        const params = new URLSearchParams(searchParams.toString());
        Object.entries(updates).forEach(([key, value]) => {
            if (value === null) {
                params.delete(key);
            } else {
                params.set(key, value);
            }
        });
        router.push(`${pathname}?${params.toString()}`);
    };

    const handleDateSelect = (newDate: Date | undefined) => {
        updateParams({ date: newDate ? format(newDate, "yyyy-MM-dd") : null });
    };

    return (
        <div className="flex items-center gap-3">
            {/* Search */}
            <div className="relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
                <Input
                    placeholder="Pesquisar..."
                    className="h-10 w-[240px] pl-9 text-[11px] font-bold uppercase tracking-wider bg-slate-950/40 border-white/5 text-slate-200 placeholder:text-slate-600 focus-visible:ring-blue-500/30 rounded-xl"
                    value={search}
                    onChange={(e) => updateParams({ search: e.target.value })}
                />
            </div>

            {/* Date Picker */}
            <Popover>
                <PopoverTrigger asChild>
                    <Button
                        variant="ghost"
                        className={cn(
                            "h-10 px-4 rounded-xl bg-slate-950/40 border border-white/5 text-[10px] font-black uppercase tracking-widest transition-all",
                            !date ? "text-slate-500" : "text-blue-400"
                        )}
                    >
                        <Calendar className={cn("mr-2 h-3.5 w-3.5", date ? "text-blue-500" : "text-slate-500")} />
                        {date ? format(date, "dd MMM", { locale: pt }) : "Data"}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 border-white/10 bg-slate-950" align="end">
                    <CalendarComponent
                        mode="single"
                        selected={date}
                        onSelect={handleDateSelect}
                        initialFocus
                        locale={pt}
                        className="p-3"
                    />
                </PopoverContent>
            </Popover>

            {/* Reset */}
            {(search || date) && (
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                        updateParams({ search: null, date: null });
                    }}
                    className="h-10 w-10 text-slate-600 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all"
                >
                    <RotateCcw className="h-4 w-4" />
                </Button>
            )}
        </div>
    );
}


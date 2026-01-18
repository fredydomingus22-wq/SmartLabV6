"use client";

import { useQueryState } from "nuqs";
import { Search, Filter, Calendar } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { useState } from "react";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface FilterControlsProps {
    variant?: "default" | "compact";
}

export function FilterControls({ variant = "default" }: FilterControlsProps) {
    // URL state management
    const [search, setSearch] = useQueryState("search", { defaultValue: "", shallow: false });
    const [status, setStatus] = useQueryState("status", { defaultValue: "all", shallow: false });
    const [dateParam, setDateParam] = useQueryState("date", { defaultValue: "", shallow: false });

    const date = dateParam ? new Date(dateParam) : undefined;

    const handleDateSelect = (newDate: Date | undefined) => {
        if (newDate) {
            setDateParam(format(newDate, "yyyy-MM-dd"));
        } else {
            setDateParam(null); // Clear param
        }
    };

    if (variant === "compact") {
        return (
            <div className="flex items-center gap-2">
                <div className="relative group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500 group-focus-within:text-blue-400/70 transition-colors" />
                    <Input
                        placeholder="Pesquisar..."
                        className="h-9 w-[180px] sm:w-[220px] pl-9 text-[11px] font-bold uppercase tracking-wider bg-white/[0.03] border-white/5 text-slate-200 placeholder:text-slate-600 focus-visible:ring-0 focus:bg-white/[0.06] rounded-xl transition-all"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>

                <Popover>
                    <PopoverTrigger asChild>
                        <Button
                            variant="ghost"
                            size="sm"
                            className={cn(
                                "h-9 px-3 rounded-xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.06] text-[11px] font-bold uppercase tracking-widest transition-all",
                                !date ? "text-slate-500" : "text-emerald-400"
                            )}
                        >
                            <Calendar className={cn("mr-1.5 h-3.5 w-3.5", date ? "text-emerald-500" : "text-slate-500")} />
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

                {(search || date) && (
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                            setSearch("");
                            setDateParam(null);
                        }}
                        className="h-9 w-9 text-slate-600 hover:text-rose-400 transition-colors"
                    >
                        <Filter className="h-3.5 w-3.5" />
                    </Button>
                )}
            </div>
        );
    }

    return (
        <div className="flex flex-col sm:flex-row gap-4 mb-8 p-6 glass rounded-[2rem] border-white/5 bg-slate-900/40 shadow-xl">
            <div className="relative flex-1 group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 group-focus-within:text-blue-400/70 transition-colors" />
                <Input
                    placeholder="Pesquisar por código, produto ou lote..."
                    className="h-11 pl-10 text-[11px] font-bold uppercase tracking-widest bg-white/[0.03] border-white/5 text-slate-200 placeholder:text-slate-600 focus-visible:ring-0 focus:bg-white/[0.06] rounded-xl transition-all"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>

            <div className="flex flex-wrap sm:flex-nowrap gap-3">
                <Select value={status} onValueChange={setStatus}>
                    <SelectTrigger className="h-11 min-w-[180px] bg-white/[0.03] border-white/5 text-slate-300 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-white/[0.06] transition-all">
                        <div className="flex items-center gap-2">
                            <Filter className="h-3.5 w-3.5 text-slate-500" />
                            <SelectValue placeholder="Estado" />
                        </div>
                    </SelectTrigger>
                    <SelectContent className="bg-slate-950 border-white/10 text-slate-300">
                        <SelectItem value="all" className="text-[10px] font-bold uppercase tracking-widest">Todos os Estados</SelectItem>
                        <SelectItem value="pending" className="text-[10px] font-bold uppercase tracking-widest">Pendente</SelectItem>
                        <SelectItem value="collected" className="text-[10px] font-bold uppercase tracking-widest text-blue-400">Colhida</SelectItem>
                        <SelectItem value="in_analysis" className="text-[10px] font-bold uppercase tracking-widest text-amber-400">Em Análise</SelectItem>
                        <SelectItem value="under_review" className="text-[10px] font-bold uppercase tracking-widest text-purple-400">Em Revisão</SelectItem>
                        <SelectItem value="approved" className="text-[10px] font-bold uppercase tracking-widest text-emerald-400">Aprovada</SelectItem>
                    </SelectContent>
                </Select>

                <Popover>
                    <PopoverTrigger asChild>
                        <Button
                            variant="outline"
                            className={cn(
                                "h-11 min-w-[180px] justify-start text-left font-black uppercase tracking-widest text-[10px] bg-white/[0.03] border-white/5 hover:bg-white/[0.06] hover:text-white transition-all rounded-xl",
                                !date ? "text-slate-500" : "text-emerald-400"
                            )}
                        >
                            <Calendar className={cn("mr-2 h-3.5 w-3.5", date ? "text-emerald-500" : "text-slate-500")} />
                            {date ? format(date, "PPP", { locale: pt }) : "Data de Colheita"}
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

                {(search || status !== "all" || date) && (
                    <Button
                        variant="ghost"
                        onClick={() => {
                            setSearch("");
                            setStatus("all");
                            setDateParam(null);
                        }}
                        className="h-11 px-4 text-[10px] font-bold uppercase tracking-widest text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all"
                    >
                        Limpar Filtros
                    </Button>
                )}
            </div>
        </div>
    );
}


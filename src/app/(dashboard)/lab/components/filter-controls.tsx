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

export function FilterControls() {
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

    return (
        <div className="flex flex-col sm:flex-row gap-4 mb-6 p-4 glass rounded-xl border border-white/20 shadow-sm">
            <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Procurar por código de amostra..."
                    className="pl-9 bg-background/50 border-input focus:bg-background transition-all"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>

            <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0">
                <Select value={status} onValueChange={setStatus}>
                    <SelectTrigger className="w-[180px] bg-background/50 border-input">
                        <Filter className="h-4 w-4 mr-2 text-muted-foreground" />
                        <SelectValue placeholder="Estado" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Todos os Estados</SelectItem>
                        <SelectItem value="pending">Pendente</SelectItem>
                        <SelectItem value="collected">Colhida</SelectItem>
                        <SelectItem value="in_analysis">Em Análise</SelectItem>
                        <SelectItem value="reviewed">Revista</SelectItem>
                        <SelectItem value="approved">Aprovada</SelectItem>
                    </SelectContent>
                </Select>

                <Popover>
                    <PopoverTrigger asChild>
                        <Button
                            variant="outline"
                            className={cn(
                                "w-[180px] justify-start text-left font-normal bg-background/50 border-input",
                                !date && "text-muted-foreground"
                            )}
                        >
                            <Calendar className="mr-2 h-4 w-4" />
                            {date ? format(date, "PPP", { locale: pt }) : "Data de Colheita"}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="end">
                        <CalendarComponent
                            mode="single"
                            selected={date}
                            onSelect={handleDateSelect}
                            initialFocus
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
                        className="text-muted-foreground hover:text-foreground"
                    >
                        Limpar
                    </Button>
                )}
            </div>
        </div>
    );
}

"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useTransition } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Search, Filter, Loader2, X } from "lucide-react";
import { useDebouncedCallback } from "use-debounce";

interface ParametersToolbarProps {
    totalResults: number;
}

export function ParametersToolbar({ totalResults }: ParametersToolbarProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [isPending, startTransition] = useTransition();

    const createQueryString = useCallback(
        (name: string, value: string) => {
            const params = new URLSearchParams(searchParams.toString());
            if (value) {
                params.set(name, value);
            } else {
                params.delete(name);
            }
            return params.toString();
        },
        [searchParams]
    );

    const handleSearch = useDebouncedCallback((term: string) => {
        startTransition(() => {
            router.push(`?${createQueryString("search", term)}`);
        });
    }, 300);

    const handleStatusChange = (value: string) => {
        startTransition(() => {
            router.push(`?${createQueryString("status", value === "all" ? "" : value)}`);
        });
    };

    const handleClear = () => {
        startTransition(() => {
            router.push("?");
        });
    };

    // Get current values
    const currentSearch = searchParams.get("search") || "";
    const currentStatus = searchParams.get("status") || "all";

    return (
        <div className="flex flex-col md:flex-row gap-4 p-4 rounded-lg bg-slate-900/50 border border-slate-800 items-center justify-between">
            <div className="flex-1 w-full md:w-auto flex gap-3 items-center">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Buscar por nome ou código..."
                        className="pl-10 pr-4 bg-slate-950 border-slate-800 text-slate-200 focus-visible:ring-primary"
                        defaultValue={currentSearch}
                        onChange={(e) => handleSearch(e.target.value)}
                    />
                </div>

                <div className="w-[180px]">
                    <Select value={currentStatus} onValueChange={handleStatusChange}>
                        <SelectTrigger className="bg-slate-950 border-slate-800 text-slate-200">
                            <div className="flex items-center gap-2">
                                <Filter className="h-4 w-4 text-muted-foreground" />
                                <SelectValue placeholder="Status" />
                            </div>
                        </SelectTrigger>
                        <SelectContent className="bg-slate-900 border-slate-800">
                            <SelectItem value="all">Todos os Status</SelectItem>
                            <SelectItem value="active">Ativos</SelectItem>
                            <SelectItem value="inactive">Inativos</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {(currentSearch || currentStatus !== "all") && (
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleClear}
                        className="h-9 w-9 text-slate-400 hover:text-slate-200"
                        title="Limpar filtros"
                    >
                        <X className="h-4 w-4" />
                    </Button>
                )}

                {isPending && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
            </div>

            <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                <span className="text-white">{totalResults}</span> resultados
            </div>
        </div>
    );
}

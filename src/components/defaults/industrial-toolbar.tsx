"use client";

import React, { ReactNode } from "react";
import { Search, Loader2, LayoutGrid, List, Table as TableIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

interface IndustrialToolbarProps {
    totalResults: number;
    searchValue?: string;
    onSearchChange?: (value: string) => void;
    isPending?: boolean;
    filters?: ReactNode;
    actions?: ReactNode;
    viewMode?: "grid" | "list" | "table";
    onViewModeChange?: (mode: "grid" | "list" | "table") => void;
    className?: string;
}

export function IndustrialToolbar({
    totalResults,
    searchValue,
    onSearchChange,
    isPending,
    filters,
    actions,
    viewMode,
    onViewModeChange,
    className
}: IndustrialToolbarProps) {
    return (
        <div className={cn(
            "flex flex-col lg:flex-row gap-4 p-5 rounded-3xl bg-slate-900/40 border border-white/5 backdrop-blur-md items-center justify-between",
            className
        )}>
            {/* Search & Left Filters */}
            <div className="flex flex-col sm:flex-row gap-3 items-center w-full lg:w-auto">
                <div className="relative w-full sm:w-[320px]">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                    <Input
                        placeholder="Buscar..."
                        className="pl-10 h-11 bg-slate-950/50 border-white/5 text-slate-200 placeholder:text-slate-600 focus-visible:ring-blue-500/30 rounded-2xl shadow-inner"
                        value={searchValue}
                        onChange={(e) => onSearchChange?.(e.target.value)}
                    />
                    {isPending && (
                        <div className="absolute right-3.5 top-1/2 -translate-y-1/2">
                            <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                        </div>
                    )}
                </div>

                <div className="flex gap-2 items-center w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
                    {filters}
                </div>
            </div>

            {/* View Mode & Right Actions */}
            <div className="flex items-center gap-4 w-full lg:w-auto justify-between lg:justify-end">
                {onViewModeChange && viewMode && (
                    <ToggleGroup
                        type="single"
                        value={viewMode}
                        onValueChange={(v) => v && onViewModeChange(v as any)}
                        className="bg-slate-950/50 p-1 rounded-xl border border-white/5 shadow-inner"
                    >
                        <ToggleGroupItem value="grid" aria-label="Vista em Grelha" className="rounded-lg h-9 w-9 data-[state=on]:bg-blue-500/20 data-[state=on]:text-blue-400">
                            <LayoutGrid className="h-4 w-4" />
                        </ToggleGroupItem>
                        <ToggleGroupItem value="list" aria-label="Vista em Lista" className="rounded-lg h-9 w-9 data-[state=on]:bg-blue-500/20 data-[state=on]:text-blue-400">
                            <List className="h-4 w-4" />
                        </ToggleGroupItem>
                        <ToggleGroupItem value="table" aria-label="Vista em Tabela" className="rounded-lg h-9 w-9 data-[state=on]:bg-blue-500/20 data-[state=on]:text-blue-400">
                            <TableIcon className="h-4 w-4" />
                        </ToggleGroupItem>
                    </ToggleGroup>
                )}

                <div className="flex items-center gap-4">
                    <div className="hidden sm:flex flex-col items-end">
                        <span className="text-white text-xs font-black italic tracking-tighter">{totalResults}</span>
                        <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 leading-none whitespace-nowrap">Resultados</span>
                    </div>
                    {actions}
                </div>
            </div>
        </div>
    );
}

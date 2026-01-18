"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProductsToolbarProps {
    searchTerm: string;
    setSearchTerm: (value: string) => void;
    filterStatus: string | null;
    setFilterStatus: (value: string | null) => void;
}

export function ProductsToolbar({
    searchTerm,
    setSearchTerm,
    filterStatus,
    setFilterStatus
}: ProductsToolbarProps) {
    return (
        <div className="p-4 border-b border-white/10 flex flex-col sm:flex-row gap-4 justify-between items-center bg-white/20 dark:bg-slate-900/20">
            <div className="relative w-full sm:w-96">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                    type="text"
                    placeholder="Pesquisar por nome ou SKU..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-10 h-10 rounded-xl border-white/5 bg-white/50 dark:bg-slate-900/50 focus:ring-2 focus:ring-primary/20 transition-all font-medium text-sm placeholder:text-slate-400"
                />
                {searchTerm && (
                    <button
                        onClick={() => setSearchTerm("")}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded-md hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
                    >
                        <X className="h-3 w-3 text-slate-400" />
                    </button>
                )}
            </div>
            <div className="flex items-center gap-2 bg-slate-100/50 dark:bg-slate-900/50 p-1 rounded-xl border border-white/5">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setFilterStatus(filterStatus === 'active' ? null : 'active')}
                    className={cn(
                        "h-8 px-4 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                        filterStatus === 'active'
                            ? "bg-emerald-500 text-white hover:bg-emerald-600 shadow-lg shadow-emerald-500/20"
                            : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                    )}
                >
                    Ativos
                </Button>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setFilterStatus(filterStatus === 'inactive' ? null : 'inactive')}
                    className={cn(
                        "h-8 px-4 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                        filterStatus === 'inactive'
                            ? "bg-slate-600 text-white hover:bg-slate-700 shadow-lg shadow-slate-500/20"
                            : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                    )}
                >
                    Inativos
                </Button>
            </div>
        </div>
    );
}

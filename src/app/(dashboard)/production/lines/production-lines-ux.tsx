"use client";

import { useState, useMemo } from "react";
import {
    LayoutGrid,
    List,
    Search,
    Filter,
    Factory,
    ClipboardList,
    AlertTriangle,
    CheckCircle2,
    Settings2
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { ProductionLineDialog } from "./line-dialog";

interface ProductionLine {
    id: string;
    name: string;
    code: string;
    status: string;
}

interface ProductionLinesUXProps {
    lines: ProductionLine[];
    countByLine: Record<string, number>;
}

export function ProductionLinesUX({ lines, countByLine }: ProductionLinesUXProps) {
    const [view, setView] = useState<"grid" | "list">("grid");
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("all");

    const filteredLines = useMemo(() => {
        return lines.filter(line => {
            const matchesSearch = line.name.toLowerCase().includes(search.toLowerCase()) ||
                line.code.toLowerCase().includes(search.toLowerCase());
            const matchesStatus = statusFilter === "all" || line.status === statusFilter;
            return matchesSearch && matchesStatus;
        });
    }, [lines, search, statusFilter]);

    const stats = useMemo(() => {
        const total = lines.length;
        const active = lines.filter(l => l.status === 'active').length;
        const maintenance = lines.filter(l => l.status === 'maintenance').length;
        return { total, active, maintenance };
    }, [lines]);

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* 📊 KPI DASHBOARD SECTION */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                    { label: "Total Asset Units", val: stats.total, color: "blue", icon: Factory, desc: "Configured Infrastructure" },
                    { label: "Operational (Ready)", val: stats.active, color: "emerald", icon: CheckCircle2, desc: "Active in Production" },
                    { label: "Attention Required", val: stats.maintenance, color: "amber", icon: AlertTriangle, desc: "Maintenance / Blocked" },
                ].map((kpi, i) => (
                    <div key={i} className="p-6 glass rounded-[2rem] border border-white/5 relative overflow-hidden group">
                        <div className={cn("absolute -right-8 -top-8 h-32 w-32 blur-[60px] opacity-10 group-hover:opacity-20 transition-opacity", `bg-${kpi.color}-500`)} />
                        <div className="relative z-10 flex items-center justify-between">
                            <div className="space-y-1">
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">{kpi.label}</p>
                                <h3 className="text-3xl font-black tracking-tighter text-white">{kpi.val}</h3>
                                <p className="text-[10px] font-medium text-slate-400 italic">{kpi.desc}</p>
                            </div>
                            <div className={cn("h-12 w-12 rounded-2xl flex items-center justify-center border", `bg-${kpi.color}-500/10 border-${kpi.color}-500/20 text-${kpi.color}-400`)}>
                                <kpi.icon className="h-6 w-6 uppercase" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* 🛠️ NAVIGATION & TOOLBAR */}
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between p-4 glass rounded-[2.5rem] border border-white/5 backdrop-blur-3xl sticky top-[104px] z-30">
                <div className="flex items-center gap-3 w-full md:w-auto">
                    <div className="relative flex-1 md:w-72">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                        <Input
                            placeholder="Search by ID or Name..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-11 h-11 bg-white/5 border-white/10 rounded-full focus:ring-blue-500/20 text-sm font-medium"
                        />
                    </div>
                    <div className="flex p-1 bg-white/5 rounded-full border border-white/10">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setView("grid")}
                            className={cn("h-9 w-9 rounded-full transition-all", view === "grid" ? "bg-blue-500 text-white shadow-lg" : "text-slate-500")}
                        >
                            <LayoutGrid className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setView("list")}
                            className={cn("h-9 w-9 rounded-full transition-all", view === "list" ? "bg-blue-500 text-white shadow-lg" : "text-slate-500")}
                        >
                            <List className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
                    {["all", "active", "maintenance", "inactive"].map((s) => (
                        <Button
                            key={s}
                            variant="ghost"
                            size="sm"
                            onClick={() => setStatusFilter(s)}
                            className={cn(
                                "h-8 px-4 rounded-full text-[10px] font-black uppercase tracking-widest transition-all border",
                                statusFilter === s
                                    ? "bg-white/10 text-white border-white/20"
                                    : "text-slate-500 border-transparent hover:text-slate-300 hover:bg-white/5"
                            )}
                        >
                            {s}
                        </Button>
                    ))}
                </div>
            </div>

            {/* 🎨 CONTENT AREA */}
            {view === "grid" ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredLines.map((line) => {
                        const batchCount = countByLine[line.id] || 0;
                        const isActive = line.status === 'active';
                        const isMaintenance = line.status === 'maintenance';

                        return (
                            <div
                                key={line.id}
                                className="group relative glass border border-white/5 rounded-[2.5rem] overflow-hidden transition-all duration-500 hover:border-blue-500/30 hover:shadow-[0_20px_50px_-15px_rgba(59,130,246,0.15)] animate-in zoom-in-95 duration-500"
                            >
                                <div className={cn(
                                    "absolute -top-24 -right-24 h-48 w-48 blur-[100px] opacity-0 group-hover:opacity-20 transition-opacity duration-700 rounded-full",
                                    isActive ? "bg-emerald-500" : isMaintenance ? "bg-amber-500" : "bg-slate-500"
                                )} />

                                <div className="relative p-8 space-y-6">
                                    <div className="flex items-start justify-between">
                                        <div className="space-y-1">
                                            <h3 className="text-xl font-black tracking-tighter uppercase text-slate-100 group-hover:text-white transition-colors">
                                                {line.name}
                                            </h3>
                                            <div className="flex items-center gap-2">
                                                <div className={cn(
                                                    "h-2 w-2 rounded-full",
                                                    isActive ? "bg-emerald-500 animate-pulse" : isMaintenance ? "bg-amber-500" : "bg-slate-500"
                                                )} />
                                                <span className={cn(
                                                    "text-[10px] font-black uppercase tracking-widest",
                                                    isActive ? "text-emerald-400" : isMaintenance ? "text-amber-400" : "text-slate-400"
                                                )}>
                                                    Line {line.status}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="h-12 w-12 glass border border-white/10 rounded-2xl flex items-center justify-center text-[10px] font-black text-slate-500 group-hover:text-blue-400 transition-colors shadow-inner tracking-widest">
                                            {line.code}
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/[0.03]">
                                        <div className="flex items-center gap-3">
                                            <div className="h-9 w-9 bg-blue-500/10 rounded-xl flex items-center justify-center border border-blue-500/20">
                                                <ClipboardList className="h-4 w-4 text-blue-400" />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 leading-none mb-1">Activity Log</p>
                                                <p className="text-sm font-bold text-slate-200">{batchCount} processed batches</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between pt-4 border-t border-white/5">
                                        <div className="flex items-center gap-2">
                                            <div className="h-8 w-8 rounded-xl bg-slate-800/50 flex items-center justify-center border border-white/5 group-hover:border-blue-500/30 transition-colors">
                                                <Settings2 className="h-4 w-4 text-slate-500 group-hover:text-blue-400" />
                                            </div>
                                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">Config</span>
                                        </div>
                                        <ProductionLineDialog mode="edit" line={line} />
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="glass border border-white/5 rounded-[2.5rem] overflow-hidden shadow-2xl animate-in fade-in duration-500">
                    <table className="w-full text-left">
                        <thead className="bg-white/5 border-b border-white/5">
                            <tr className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                                <th className="px-8 py-5">Industrial Asset</th>
                                <th className="px-8 py-5">Code</th>
                                <th className="px-8 py-5">Lifecycle Status</th>
                                <th className="px-8 py-5 text-center">Batch History</th>
                                <th className="px-8 py-5 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {filteredLines.map((line) => (
                                <tr key={line.id} className="group hover:bg-white/[0.02] transition-colors">
                                    <td className="px-8 py-5">
                                        <div className="flex items-center gap-4">
                                            <div className="h-10 w-10 glass border border-white/10 rounded-xl flex items-center justify-center text-blue-400">
                                                <Factory className="h-5 w-5" />
                                            </div>
                                            <div>
                                                <p className="font-bold text-slate-200 group-hover:text-blue-400 transition-colors">{line.name}</p>
                                                <p className="text-[10px] font-medium text-slate-500 tracking-tight italic">Production Unit</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-5">
                                        <span className="font-mono text-xs font-bold text-slate-400 bg-white/5 px-3 py-1.5 rounded-lg border border-white/5 tracking-widest group-hover:text-slate-200 group-hover:border-white/10 transition-all uppercase">
                                            {line.code}
                                        </span>
                                    </td>
                                    <td className="px-8 py-5">
                                        <div className="flex items-center gap-2">
                                            <div className={cn(
                                                "h-1.5 w-1.5 rounded-full shadow-[0_0_10px_currentcolor]",
                                                line.status === 'active' ? "bg-emerald-500 text-emerald-500" : "bg-amber-500 text-amber-500"
                                            )} />
                                            <span className={cn(
                                                "text-[10px] font-black uppercase tracking-widest",
                                                line.status === 'active' ? "text-emerald-400" : "text-amber-400"
                                            )}>
                                                {line.status}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-5 text-center">
                                        <Badge variant="outline" className="bg-blue-500/5 text-blue-400 border-blue-500/20 font-black px-3 rounded-full">
                                            {countByLine[line.id] || 0} batches
                                        </Badge>
                                    </td>
                                    <td className="px-8 py-5 text-right">
                                        <ProductionLineDialog mode="edit" line={line} />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* 📭 EMPTY STATE */}
            {filteredLines.length === 0 && (
                <div className="py-24 glass border border-white/5 rounded-[3rem] flex flex-col items-center justify-center text-center space-y-6 max-w-2xl mx-auto border-dashed">
                    <div className="h-24 w-24 bg-blue-500/5 rounded-full flex items-center justify-center border border-blue-500/10">
                        <Factory className="h-12 w-12 text-blue-500/20" />
                    </div>
                    <div className="space-y-2 px-8">
                        <h3 className="text-2xl font-black tracking-tighter uppercase text-slate-200">No Infrastructure Match</h3>
                        <p className="text-slate-400 max-w-xs mx-auto text-sm font-medium leading-relaxed">
                            Plant search yielded no results for the current criteria. Adjust your filters or deploy new infrastructure.
                        </p>
                    </div>
                    <Button
                        variant="outline"
                        onClick={() => { setSearch(""); setStatusFilter("all"); }}
                        className="rounded-full border-blue-500/30 text-blue-400 hover:bg-blue-500/10 font-bold uppercase tracking-widest text-[10px] h-10 px-6"
                    >
                        Reset Controls
                    </Button>
                </div>
            )}
        </div>
    );
}

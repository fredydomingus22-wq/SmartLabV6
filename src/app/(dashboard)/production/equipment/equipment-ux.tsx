"use client";

import { useState, useMemo } from "react";
import {
    LayoutGrid,
    List,
    Search,
    Filter,
    Settings2,
    Zap,
    Activity,
    Wrench,
    AlertTriangle,
    Boxes,
    ArrowUpRight,
    ClipboardCheck,
    ArrowRight
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { differenceInDays, format } from "date-fns";
import Link from "next/link";
import { EquipmentDialog } from "./equipment-dialog";

interface ProcessEquipment {
    id: string;
    name: string;
    code: string;
    equipment_category: string;
    equipment_type: string;
    manufacturer: string | null;
    model: string | null;
    serial_number: string | null;
    status: string;
    next_maintenance_date: string | null;
}

interface EquipmentUXProps {
    equipment: ProcessEquipment[];
    categories: string[];
    categoryLabels: Record<string, string>;
    categoryIcons: Record<string, string>;
    statusColors: Record<string, string>;
}

export function EquipmentUX({
    equipment,
    categories,
    categoryLabels,
    categoryIcons,
    statusColors
}: EquipmentUXProps) {
    const [view, setView] = useState<"grid" | "list">("grid");
    const [search, setSearch] = useState("");
    const today = new Date();

    const filteredEquipment = useMemo(() => {
        return equipment.filter(e => {
            const matchesSearch = e.name.toLowerCase().includes(search.toLowerCase()) ||
                e.code.toLowerCase().includes(search.toLowerCase()) ||
                (e.manufacturer?.toLowerCase() || "").includes(search.toLowerCase());
            return matchesSearch;
        });
    }, [equipment, search]);

    const stats = useMemo(() => {
        const total = equipment.length;
        const active = equipment.filter(e => e.status === 'active').length;
        const maintenance = equipment.filter(e => e.status === 'maintenance').length;
        const overdue = equipment.filter(e => {
            if (!e.next_maintenance_date) return false;
            return differenceInDays(new Date(e.next_maintenance_date), today) < 0;
        }).length;
        return { total, active, maintenance, overdue };
    }, [equipment]);

    const equipmentByCategory = useMemo(() => {
        const grouped: Record<string, ProcessEquipment[]> = {};
        filteredEquipment.forEach(e => {
            if (!grouped[e.equipment_category]) grouped[e.equipment_category] = [];
            grouped[e.equipment_category].push(e);
        });
        return grouped;
    }, [filteredEquipment]);

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* 📊 KPI DASHBOARD */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[
                    { label: "Asset Units", val: stats.total, color: "blue", icon: Boxes, desc: "Total Inventory" },
                    { label: "Operational", val: stats.active, color: "emerald", icon: Activity, desc: "Ready for Shift" },
                    { label: "Maintenance", val: stats.maintenance, color: "amber", icon: Wrench, desc: "In Service" },
                    { label: "Urgent Attention", val: stats.overdue, color: "rose", icon: AlertTriangle, desc: "Overdue Service" },
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
                                <kpi.icon className="h-6 w-6" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* 🛠️ CONTROLS & SEARCH */}
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between p-4 glass rounded-[2.5rem] border border-white/5 backdrop-blur-3xl sticky top-[104px] z-30">
                <div className="flex items-center gap-3 w-full md:w-auto">
                    <div className="relative flex-1 md:w-80">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                        <Input
                            placeholder="Find by ID, Asset Name or OEM..."
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

                <div className="flex items-center gap-2">
                    <Button variant="ghost" className="h-10 px-6 rounded-full text-[10px] font-black uppercase tracking-widest text-slate-500 border border-white/5 hover:bg-white/5">
                        <Filter className="h-4 w-4 mr-2" />
                        Filter Pipeline
                    </Button>
                </div>
            </div>

            {/* 🎨 CONTENT AREA */}
            <Tabs defaultValue={categories[0]} className="space-y-8 mt-0 outline-none">
                <TabsList className="glass border-white/5 p-1 h-auto bg-slate-900/40 rounded-[2rem] flex flex-wrap gap-1">
                    {categories.map(cat => (
                        <TabsTrigger
                            key={cat}
                            value={cat}
                            className="data-[state=active]:bg-blue-500 data-[state=active]:text-white h-11 px-6 rounded-full font-black text-[10px] uppercase tracking-widest transition-all gap-3"
                        >
                            <span>{categoryIcons[cat] || "⚙️"}</span>
                            {categoryLabels[cat] || cat}
                            <Badge className="bg-white/10 text-white font-black text-[10px] rounded-full px-2 border-none">
                                {equipment.filter(e => e.equipment_category === cat).length}
                            </Badge>
                        </TabsTrigger>
                    ))}
                </TabsList>

                {categories.map(cat => (
                    <TabsContent key={cat} value={cat} className="space-y-6 mt-0 animate-in fade-in slide-in-from-bottom-2 duration-500">
                        {view === "grid" ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                {(equipmentByCategory[cat] || []).map((eq) => {
                                    const nextMaint = eq.next_maintenance_date ? new Date(eq.next_maintenance_date) : null;
                                    const isOverdue = nextMaint ? differenceInDays(nextMaint, today) < 0 : false;

                                    return (
                                        <div key={eq.id} className="group relative glass border border-white/5 rounded-[2.5rem] overflow-hidden transition-all duration-500 hover:border-blue-500/30 hover:shadow-[0_20px_50px_-15px_rgba(59,130,246,0.15)]">
                                            <div className={cn(
                                                "absolute -top-20 -right-20 h-40 w-40 blur-[80px] opacity-0 group-hover:opacity-20 transition-opacity duration-700 rounded-full",
                                                eq.status === 'active' ? "bg-emerald-500" : eq.status === 'maintenance' ? "bg-amber-500" : "bg-slate-500"
                                            )} />

                                            <div className="relative p-7 space-y-6">
                                                <div className="flex items-start justify-between">
                                                    <div className="h-12 w-12 glass border border-white/10 rounded-2xl flex items-center justify-center text-xl shadow-inner group-hover:scale-110 transition-transform">
                                                        {categoryIcons[cat] || "⚙️"}
                                                    </div>
                                                    <Badge className={cn("h-7 px-3 rounded-full text-[9px] font-black uppercase tracking-widest border border-transparent", statusColors[eq.status])}>
                                                        {eq.status === 'active' ? 'Operational' : eq.status}
                                                    </Badge>
                                                </div>

                                                <div className="space-y-1">
                                                    <h3 className="text-xl font-black tracking-tighter uppercase text-slate-100 group-hover:text-white transition-colors">
                                                        {eq.name}
                                                    </h3>
                                                    <div className="flex items-center gap-3">
                                                        <span className="font-mono text-[9px] font-bold text-slate-500 bg-white/5 px-2 py-0.5 rounded tracking-widest border border-white/5">
                                                            {eq.code}
                                                        </span>
                                                        <span className="text-[9px] font-black uppercase tracking-widest text-slate-600">{eq.manufacturer || "OEM UNKNOWN"}</span>
                                                    </div>
                                                </div>

                                                {nextMaint && (
                                                    <div className={cn(
                                                        "p-5 rounded-2xl border transition-all duration-300",
                                                        isOverdue
                                                            ? "bg-rose-500/5 border-rose-500/20 group-hover:bg-rose-500/10"
                                                            : "bg-white/5 border-white/5 group-hover:bg-amber-500/5"
                                                    )}>
                                                        <div className="flex items-center justify-between mb-2">
                                                            <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">Service Pipeline</span>
                                                            <Wrench className={cn("h-3.5 w-3.5", isOverdue ? "text-rose-500" : "text-amber-500")} />
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <span className={cn("text-xl font-black", isOverdue ? "text-rose-400" : "text-slate-100 tracking-tight")}>
                                                                {format(nextMaint, "dd MMM yyyy")}
                                                            </span>
                                                            {isOverdue && (
                                                                <span className="text-[9px] text-rose-500 font-black uppercase tracking-tighter mt-1 animate-pulse">
                                                                    Immediate Action Required
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}

                                                <div className="flex items-center justify-between pt-4 border-t border-white/5">
                                                    <Link href={`/production/equipment/${eq.id}`} className="group/btn">
                                                        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 group-hover/btn:text-blue-400 transition-colors">
                                                            Detailed Audit <ArrowRight className="h-3 w-3 group-hover/btn:translate-x-1 transition-transform" />
                                                        </div>
                                                    </Link>
                                                    <EquipmentDialog mode="edit" equipment={eq} />
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="glass border border-white/5 rounded-[2.5rem] overflow-hidden shadow-2xl">
                                <table className="w-full text-left">
                                    <thead className="bg-white/5 border-b border-white/5">
                                        <tr className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                                            <th className="px-8 py-5">Asset Intelligence</th>
                                            <th className="px-8 py-5">OEM Specification</th>
                                            <th className="px-8 py-5">Status</th>
                                            <th className="px-8 py-5 text-center">Next Service</th>
                                            <th className="px-8 py-5 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {(equipmentByCategory[cat] || []).map((eq) => (
                                            <tr key={eq.id} className="group hover:bg-white/[0.02] transition-colors">
                                                <td className="px-8 py-5">
                                                    <div className="flex items-center gap-4">
                                                        <div className="h-10 w-10 glass border border-white/10 rounded-xl flex items-center justify-center text-lg">
                                                            {categoryIcons[cat]}
                                                        </div>
                                                        <div>
                                                            <p className="font-bold text-slate-200 group-hover:text-blue-400 transition-colors uppercase tracking-tight">{eq.name}</p>
                                                            <p className="font-mono text-[9px] text-slate-500 tracking-widest">{eq.code}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-5">
                                                    <div className="space-y-1">
                                                        <p className="text-xs font-bold text-slate-400">{eq.manufacturer || "---"}</p>
                                                        <p className="text-[10px] text-slate-600 font-medium uppercase tracking-tighter">{eq.model || "Standard Model"}</p>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-5">
                                                    <div className="flex items-center gap-2">
                                                        <div className={cn(
                                                            "h-1.5 w-1.5 rounded-full shadow-[0_0_10px_currentcolor]",
                                                            eq.status === 'active' ? "bg-emerald-500 text-emerald-500" : "bg-amber-500 text-amber-500"
                                                        )} />
                                                        <span className={cn(
                                                            "text-[10px] font-black uppercase tracking-widest",
                                                            eq.status === 'active' ? "text-emerald-400" : "text-amber-400"
                                                        )}>
                                                            {eq.status}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-5 text-center">
                                                    {eq.next_maintenance_date ? (
                                                        <span className={cn(
                                                            "font-mono text-xs font-bold px-3 py-1.5 rounded-lg border",
                                                            differenceInDays(new Date(eq.next_maintenance_date), today) < 0
                                                                ? "bg-rose-500/10 text-rose-500 border-rose-500/20"
                                                                : "bg-white/5 text-slate-300 border-white/10"
                                                        )}>
                                                            {format(new Date(eq.next_maintenance_date), "dd/MM/yyyy")}
                                                        </span>
                                                    ) : "-- / -- / --"}
                                                </td>
                                                <td className="px-8 py-5 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <Link href={`/production/equipment/${eq.id}`}>
                                                            <Button variant="ghost" size="icon" className="h-9 w-9 glass border border-white/5 text-slate-500 hover:text-blue-400 hover:border-blue-500/30 rounded-full">
                                                                <Activity className="h-4 w-4" />
                                                            </Button>
                                                        </Link>
                                                        <EquipmentDialog mode="edit" equipment={eq} />
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </TabsContent>
                ))}
            </Tabs>
        </div>
    );
}

"use client";

import { useState, useMemo } from "react";
import {
    LayoutGrid,
    List,
    Search,
    Filter,
    Container,
    Droplets,
    Settings2,
    Activity,
    ArrowRight,
    FlaskConical,
    Waves
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { TankDialog } from "./_components/tank-dialog";

interface Tank {
    id: string;
    name: string;
    code: string;
    capacity: number | null;
    capacity_unit: string | null;
    status: string;
    created_at: string;
    description: string | null;
}

interface TankContent {
    id: string;
    code: string;
    status: string;
    volume: number | null;
    unit: string | null;
    equipment_id: string;
    batch: { id: string; code: string; product: { id: string; name: string } | null } | null;
}

interface TankUXProps {
    tanks: Tank[];
    contentMap: Map<string, TankContent>;
    statusColors: Record<string, string>;
}

export function TankUX({ tanks, contentMap, statusColors }: TankUXProps) {
    const [view, setView] = useState<"grid" | "list">("grid");
    const [search, setSearch] = useState("");

    const filteredTanks = useMemo(() => {
        return tanks.filter(t =>
            t.name.toLowerCase().includes(search.toLowerCase()) ||
            t.code.toLowerCase().includes(search.toLowerCase())
        );
    }, [tanks, search]);

    const stats = useMemo(() => {
        const total = tanks.length;
        const active = tanks.filter(t => t.status === 'active').length;
        const withContent = contentMap.size;
        const maintenance = tanks.filter(t => t.status === 'maintenance').length;
        return { total, active, withContent, maintenance };
    }, [tanks, contentMap]);

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* 📊 TANK KPI GRID */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: "Total Asset Tanks", val: stats.total, color: "blue", icon: Container, desc: "Process Inventory" },
                    { label: "Ready / Online", val: stats.active, color: "emerald", icon: Activity, desc: "Operational State" },
                    { label: "Utilized Capacity", val: stats.withContent, color: "indigo", icon: Waves, desc: "Active Payloads" },
                    { label: "Out of Service", val: stats.maintenance, color: "amber", icon: Settings2, desc: "Maintenance Pipe" },
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

            {/* 🔍 SEARCH & VIEW ENGINE */}
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between p-4 glass rounded-[2.5rem] border border-white/5 backdrop-blur-3xl sticky top-[104px] z-30">
                <div className="flex items-center gap-3 w-full md:w-auto">
                    <div className="relative flex-1 md:w-80">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                        <Input
                            placeholder="Identify Tank by Name / Serial..."
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
                        Filter Logic
                    </Button>
                </div>
            </div>

            {/* 🌊 TANK VIEWPORT */}
            {view === "grid" ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredTanks.map((tank) => {
                        const content = contentMap.get(tank.id);
                        const batch = content?.batch;
                        const product = batch?.product;
                        const fillPercent = tank.capacity && content?.volume
                            ? Math.min((content.volume / tank.capacity) * 100, 100)
                            : 0;

                        return (
                            <div key={tank.id} className="group relative glass border border-white/5 rounded-[2.5rem] overflow-hidden transition-all duration-500 hover:border-blue-500/30 hover:shadow-[0_20px_50px_-15px_rgba(59,130,246,0.15)]">
                                <div className={cn(
                                    "absolute -top-20 -right-20 h-40 w-40 blur-[80px] opacity-0 group-hover:opacity-20 transition-opacity duration-700 rounded-full",
                                    content ? "bg-blue-500" : "bg-slate-500"
                                )} />

                                <div className="relative p-7 space-y-6">
                                    <div className="flex items-start justify-between">
                                        <div className="h-12 w-12 glass border border-white/10 rounded-2xl flex items-center justify-center text-xl shadow-inner group-hover:scale-110 transition-all">
                                            <Container className={cn("h-6 w-6 transition-colors", content ? "text-blue-400" : "text-slate-600")} />
                                        </div>
                                        <Badge className={cn("h-7 px-3 rounded-full text-[9px] font-black uppercase tracking-widest border border-transparent", statusColors[tank.status])}>
                                            {tank.status}
                                        </Badge>
                                    </div>

                                    <div className="space-y-1">
                                        <h3 className="text-xl font-black tracking-tighter uppercase text-slate-100 group-hover:text-white transition-colors">
                                            {tank.name}
                                        </h3>
                                        <div className="flex items-center gap-3">
                                            <span className="font-mono text-[9px] font-bold text-slate-500 bg-white/5 px-2 py-0.5 rounded tracking-widest border border-white/5">
                                                {tank.code}
                                            </span>
                                            {tank.capacity && (
                                                <span className="text-[9px] font-black uppercase tracking-widest text-slate-600 flex items-center gap-1">
                                                    <Droplets className="h-3 w-3" /> {tank.capacity.toLocaleString()}{tank.capacity_unit || 'L'}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* TANK VISUALIZER */}
                                    <div className="relative h-32 w-full bg-slate-950/50 rounded-[1.5rem] border border-white/5 overflow-hidden group-hover:bg-slate-950/80 transition-all">
                                        {content ? (
                                            <>
                                                <div
                                                    className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-blue-600 to-blue-400 transition-all duration-1000 ease-in-out"
                                                    style={{ height: `${fillPercent}%` }}
                                                >
                                                    <div className="absolute top-0 left-0 w-full h-2 bg-white/20 blur-sm" />
                                                </div>
                                                <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center">
                                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-200 drop-shadow-md">{product?.name || "LOCKED PAYLOAD"}</p>
                                                    <p className="text-2xl font-black text-white tracking-tighter drop-shadow-lg">{fillPercent.toFixed(0)}<span className="text-xs">%</span></p>
                                                    <p className="text-[9px] font-bold text-blue-300/80 uppercase tracking-widest">BATCH: {batch?.code || content.code}</p>
                                                </div>
                                            </>
                                        ) : (
                                            <div className="absolute inset-0 flex flex-col items-center justify-center opacity-30">
                                                <FlaskConical className="h-8 w-8 text-slate-600 mb-2" />
                                                <p className="text-[9px] font-black uppercase tracking-widest text-slate-700">TANK EMPTY</p>
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex items-center justify-between pt-4 border-t border-white/5">
                                        <Link href={`/production/tanks/${tank.id}`} className="group/btn">
                                            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 group-hover/btn:text-blue-400 transition-colors">
                                                Technical Log <ArrowRight className="h-3 w-3 group-hover/btn:translate-x-1 transition-transform" />
                                            </div>
                                        </Link>
                                        <TankDialog tank={tank} trigger={
                                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-slate-600 hover:text-white hover:bg-white/5">
                                                <Settings2 className="h-4 w-4" />
                                            </Button>
                                        } />
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
                                <th className="px-8 py-5">Status</th>
                                <th className="px-8 py-5">Current Payload</th>
                                <th className="px-8 py-5 text-center">Efficiency</th>
                                <th className="px-8 py-5 text-right">Registry</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {filteredTanks.map((tank) => {
                                const content = contentMap.get(tank.id);
                                const batch = content?.batch;
                                const fillPercent = tank.capacity && content?.volume
                                    ? Math.min((content.volume / tank.capacity) * 100, 100)
                                    : 0;

                                return (
                                    <tr key={tank.id} className="group hover:bg-white/[0.02] transition-colors">
                                        <td className="px-8 py-5">
                                            <div className="flex items-center gap-4">
                                                <div className="h-10 w-10 glass border border-white/10 rounded-xl flex items-center justify-center text-blue-400 shadow-inner">
                                                    <Container className="h-5 w-5" />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-slate-200 group-hover:text-blue-400 transition-colors uppercase tracking-tight">{tank.name}</p>
                                                    <p className="font-mono text-[9px] text-slate-500 tracking-widest">{tank.code}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5">
                                            <div className="flex items-center gap-2">
                                                <div className={cn(
                                                    "h-1.5 w-1.5 rounded-full shadow-[0_0_10px_currentcolor]",
                                                    tank.status === 'active' ? "bg-emerald-500 text-emerald-500" : "bg-amber-500 text-amber-500"
                                                )} />
                                                <span className={cn(
                                                    "text-[10px] font-black uppercase tracking-widest",
                                                    tank.status === 'active' ? "text-emerald-400" : "text-amber-400"
                                                )}>
                                                    {tank.status}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5">
                                            {content ? (
                                                <div className="space-y-0.5">
                                                    <p className="text-xs font-bold text-slate-200 uppercase tracking-tighter">{content.batch?.product?.name || "Product"}</p>
                                                    <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest">LOT: {content.batch?.code}</p>
                                                </div>
                                            ) : (
                                                <span className="text-[10px] font-medium text-slate-600 italic">EMPTY_STATE</span>
                                            )}
                                        </td>
                                        <td className="px-8 py-5 text-center">
                                            <div className="flex flex-col items-center gap-1.5">
                                                <div className="w-24 h-1.5 bg-white/5 rounded-full overflow-hidden border border-white/5">
                                                    <div
                                                        className={cn("h-full rounded-full transition-all duration-1000", content ? "bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]" : "bg-transparent")}
                                                        style={{ width: `${fillPercent}%` }}
                                                    />
                                                </div>
                                                <span className="text-[10px] font-black text-slate-400">{fillPercent.toFixed(1)}%</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <Link href={`/production/tanks/${tank.id}`}>
                                                    <Button variant="ghost" size="icon" className="h-9 w-9 glass border border-white/5 text-slate-500 hover:text-blue-400 hover:border-blue-500/30 rounded-full">
                                                        <Activity className="h-4 w-4" />
                                                    </Button>
                                                </Link>
                                                <TankDialog tank={tank} trigger={
                                                    <Button variant="ghost" size="icon" className="h-9 w-9 glass border border-white/5 text-slate-500 hover:text-white hover:border-white/20 rounded-full">
                                                        <Settings2 className="h-4 w-4" />
                                                    </Button>
                                                } />
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

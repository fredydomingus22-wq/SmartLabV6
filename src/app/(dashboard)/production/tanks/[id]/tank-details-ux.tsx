"use client";

import {
    Activity,
    Droplets,
    History,
    Settings2,
    Scale,
    ArrowRight,
    RefreshCcw,
    User,
    Calendar,
    ChevronRight,
    CornerDownRight
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import Link from "next/link";

interface TankDetailsUXProps {
    tank: any;
}

export function TankDetailsUX({ tank }: TankDetailsUXProps) {
    // Standardize lists to max 3 items for enterprise focus
    const content = tank.currentContent;
    const preparations = (tank.preparations || []).slice(0, 3);
    const cipHistory = (tank.cipHistory || []).slice(0, 3);

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-16">

            {/* 1. KEY PERFORMANCE INDICATORS (KPI) CARD GRID */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[
                    { label: "Operating State", val: tank.status, icon: Activity, color: tank.status === 'active' ? "text-emerald-500" : "text-amber-500" },
                    { label: "Engineering Code", val: tank.code, icon: Settings2, color: "text-blue-500" },
                    { label: "Installed Capacity", val: `${tank.capacity?.toLocaleString()} ${tank.capacity_unit}`, icon: Scale, color: "text-slate-400" },
                    { label: "Deployment Date", val: tank.created_at ? format(new Date(tank.created_at), "dd/MM/yyyy") : "N/A", icon: Calendar, color: "text-slate-400" }
                ].map((stat, i) => (
                    <Card key={i} className="p-6 bg-[#020617]/40 border-white/5 flex items-start justify-between group hover:bg-white/[0.02] transition-colors">
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 mb-1">{stat.label}</p>
                            <h3 className={cn("text-lg font-bold tracking-tight uppercase", stat.color)}>{stat.val}</h3>
                        </div>
                        <stat.icon className={cn("h-4 w-4 opacity-20 group-hover:opacity-40 transition-opacity", stat.color)} />
                    </Card>
                ))}
            </div>

            {/* 2. ACTIVE INVENTORY PANEL */}
            <Card className={cn(
                "overflow-hidden border-white/5 bg-slate-900/40 relative",
                content ? "border-l-4 border-l-blue-500" : "border-l-4 border-l-slate-800"
            )}>
                <div className="p-8 flex flex-col md:flex-row items-center justify-between gap-8 relative z-10">
                    <div className="flex-1 space-y-6">
                        <div className="space-y-1">
                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-500 flex items-center gap-2">
                                <div className="h-1 w-1 rounded-full bg-blue-500 animate-pulse" />
                                Current Asset Payload
                            </span>
                            <h2 className="text-3xl font-bold tracking-tight text-white uppercase">
                                {content?.batch?.code || content?.code || "Asset Available"}
                            </h2>
                            {content && (
                                <div className="flex items-center gap-3 mt-2">
                                    <Badge variant="outline" className="text-[10px] font-bold border-blue-500/20 text-blue-400 py-1 bg-blue-500/5 uppercase">
                                        {content.product?.name || content.batch?.product?.name}
                                    </Badge>
                                    <span className="text-[11px] text-slate-500 font-medium tracking-tight">
                                        Processing Volume: <span className="text-blue-400 font-bold">{content.volume?.toLocaleString()} {content.unit}</span>
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>

                    {content && (
                        <Link href={`/production/${content.batch?.id || content.id}`}>
                            <Button className="h-12 px-8 bg-blue-600 hover:bg-blue-500 text-white font-bold text-[11px] uppercase tracking-widest rounded-lg shadow-lg">
                                Open Batch Record <ArrowRight className="h-4 w-4 ml-2" />
                            </Button>
                        </Link>
                    )}
                </div>
            </Card>

            {/* 3. CORE INDUSTRIAL LOGS (2-COL) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                {/* A. PRODUCT PREPARATIONS (MAX 3) */}
                <Card className="bg-[#020617]/40 border-white/5 overflow-hidden">
                    <div className="px-6 py-5 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
                        <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400 flex items-center gap-3">
                            <History className="h-4 w-4 text-blue-500" /> Preparation History
                        </h3>
                        <span className="text-[10px] font-bold text-slate-600 uppercase">Limit: 03 Items</span>
                    </div>
                    <div className="divide-y divide-white/5">
                        {preparations.map((prep: any) => (
                            <div key={prep.id} className="p-6 flex items-center justify-between transition-colors hover:bg-white/[0.01]">
                                <div className="space-y-1.5 flex-1">
                                    <p className="text-[11px] font-bold text-slate-200 uppercase tracking-tight">
                                        {prep.product?.name || "Product Formulation"}
                                    </p>
                                    <div className="flex items-center gap-3">
                                        <div className="flex items-center gap-1 text-[10px] font-bold font-mono text-blue-400 bg-blue-500/5 px-2 py-0.5 rounded border border-blue-500/10 uppercase">
                                            <CornerDownRight className="h-3 w-3" /> LOTE: {prep.batch?.code || prep.code}
                                        </div>
                                        <span className="text-[10px] font-medium text-slate-500">
                                            Prepared: <span className="text-slate-300">{prep.volume?.toLocaleString()} {prep.unit}</span>
                                        </span>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-[11px] font-bold text-slate-400 font-mono tracking-tighter">
                                        {format(new Date(prep.created_at), "dd/MM/yy")}
                                    </p>
                                    <p className="text-[10px] font-medium text-slate-600 uppercase">{format(new Date(prep.created_at), "HH:mm")}</p>
                                </div>
                            </div>
                        ))}
                        {preparations.length === 0 && (
                            <div className="p-10 text-center text-[10px] text-slate-600 font-bold uppercase tracking-widest italic border-white/5">
                                No historical preparations recorded
                            </div>
                        )}
                    </div>
                </Card>

                {/* B. CIP / SANITIZATION LOG (MAX 3) */}
                <Card className="bg-[#020617]/40 border-white/5 overflow-hidden">
                    <div className="px-6 py-5 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
                        <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400 flex items-center gap-3">
                            <RefreshCcw className="h-4 w-4 text-emerald-500" /> Sanitization History
                        </h3>
                        <span className="text-[10px] font-bold text-slate-600 uppercase">Audit Ready</span>
                    </div>
                    <div className="divide-y divide-white/5">
                        {cipHistory.map((cip: any) => (
                            <div key={cip.id} className="p-6 flex items-center justify-between transition-colors hover:bg-white/[0.01]">
                                <div className="space-y-1.5 flex-1">
                                    <p className="text-[11px] font-bold text-slate-200 uppercase tracking-tight">
                                        {cip.program?.name || "Standard Sanitization"}
                                    </p>
                                    <div className="flex items-center gap-2 text-[10px] text-slate-500 font-medium">
                                        <User className="h-3 w-3 opacity-30" />
                                        {cip.operator?.full_name || "Plant Operator"}
                                    </div>
                                </div>
                                <div className="text-right space-y-2">
                                    <p className="text-[11px] font-bold text-slate-400 font-mono tracking-tighter">
                                        {format(new Date(cip.start_time), "dd/MM HH:mm")}
                                    </p>
                                    <Badge variant="outline" className={cn(
                                        "h-5 text-[9px] font-black border-none",
                                        cip.status === 'completed' ? "bg-emerald-500/10 text-emerald-400" : "bg-amber-500/10 text-amber-400"
                                    )}>
                                        {cip.status.toUpperCase()}
                                    </Badge>
                                </div>
                            </div>
                        ))}
                        {cipHistory.length === 0 && (
                            <div className="p-10 text-center text-[10px] text-slate-600 font-bold uppercase tracking-widest italic border-white/5">
                                No sanitation logs found for this asset
                            </div>
                        )}
                    </div>
                </Card>
            </div>

            {/* 4. TECHNICAL FOOTER / MAINTENANCE */}
            <div className="pt-4 flex items-center justify-between border-t border-white/5">
                <div className="text-[10px] font-medium text-slate-600 uppercase tracking-widest flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 opacity-50" />
                    System is Monitoring Asset Node: {tank.code}
                </div>
                <div className="flex gap-4">
                    <Button variant="link" className="text-[10px] font-bold text-slate-500 hover:text-white uppercase tracking-widest h-auto p-0">Maintenance Log</Button>
                    <Button variant="link" className="text-[10px] font-bold text-slate-500 hover:text-white uppercase tracking-widest h-auto p-0">Technical Data Sheet</Button>
                </div>
            </div>
        </div>
    );
}

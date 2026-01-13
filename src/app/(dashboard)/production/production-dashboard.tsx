"use client";

import React from "react";
import { Badge } from "@/components/ui/badge";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription
} from "@/components/ui/card";
import {
    ArrowUpRight,
    Clock,
    AlertTriangle,
    Package,
    CheckCircle,
    XCircle,
    Activity,
    TrendingUp
} from "lucide-react";
import { KPISparkCard } from "@/components/ui/kpi-spark-card";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface ProductionBatch {
    id: string;
    code: string;
    status: string;
    product?: { name: string } | null;
    planned_quantity?: number;
    actual_quantity?: number;
}

interface ProductionDashboardProps {
    stats: {
        planned: number;
        inProcess: number;
        released: number;
        qualityRate: number | string;
        yieldRate: number | string;
        avgTAT: number | string;
        rejected: number;
        completed?: number;
        blocked?: number;
    };
    batchesList: ProductionBatch[] | React.ReactNode;
}

export function ProductionDashboard({ stats, batchesList }: ProductionDashboardProps) {

    // Check if batchesList is an array of batch objects or a React element
    const isArrayOfBatches = Array.isArray(batchesList);

    const getStatusIcon = (status: string) => {
        switch (status) {
            case "released":
            case "closed":
                return <CheckCircle className="h-4 w-4" />;
            case "rejected":
                return <XCircle className="h-4 w-4" />;
            case "in_progress":
            case "open":
                return <Clock className="h-4 w-4" />;
            default:
                return <Package className="h-4 w-4" />;
        }
    };

    const getStatusVariant = (status: string) => {
        switch (status) {
            case "released":
            case "closed":
                return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
            case "rejected":
                return "bg-rose-500/10 text-rose-400 border-rose-500/20";
            case "in_progress":
            case "open":
                return "bg-blue-500/10 text-blue-400 border-blue-500/20";
            case "blocked":
                return "bg-amber-500/10 text-amber-400 border-amber-500/20";
            default:
                return "bg-slate-500/10 text-slate-400 border-slate-500/20";
        }
    };

    return (
        <div className="space-y-12 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* 📊 MASTER STANDARD KPI GRID */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <KPISparkCard
                    variant="indigo"
                    title="Ordens Planeadas"
                    value={stats.planned.toString().padStart(2, '0')}
                    description="Próximas 24 horas"
                    icon={<Package className="h-3.5 w-3.5" />}
                    data={[8, 10, 9, 11, 10, 12, 8].map(v => ({ value: v }))}
                />
                <KPISparkCard
                    variant="blue"
                    title="Em Processamento"
                    value={stats.inProcess.toString().padStart(2, '0')}
                    description="Atividade em linha"
                    icon={<Activity className="h-3.5 w-3.5" />}
                    data={[12, 14, 13, 15, 14, 16, 17].map(v => ({ value: v }))}
                />
                <KPISparkCard
                    variant="emerald"
                    title="Taxa de Qualidade"
                    value={`${stats.qualityRate}%`}
                    description="Release Efficiency"
                    icon={<CheckCircle className="h-3.5 w-3.5" />}
                    data={[98, 97, 99, 98, 99, 100, 99].map(v => ({ value: v }))}
                />
                <KPISparkCard
                    variant="purple"
                    title="Lotes Finalizados"
                    value={stats.released.toString().padStart(2, '0')}
                    description="Prontos para logística"
                    icon={<CheckCircle className="h-3.5 w-3.5" />}
                    data={[15, 18, 16, 19, 20, 22, 21].map(v => ({ value: v }))}
                />
            </div>

            {/* 📉 STRATEGIC OVERLAYS */}
            <div className="grid gap-6 md:grid-cols-3">
                <Card className="bg-card border-slate-800 shadow-xl overflow-hidden">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-slate-900/20">
                        <CardTitle className="text-[10px] font-black uppercase tracking-widest text-slate-500 italic">Industrial Yield</CardTitle>
                        <ArrowUpRight className="h-3.5 w-3.5 text-emerald-500 opacity-70" />
                    </CardHeader>
                    <CardContent className="pt-4 flex items-center justify-between gap-4">
                        <div>
                            <div className="text-3xl font-black italic tracking-tight text-white mb-1">{stats.yieldRate}%</div>
                            <p className="text-[9px] font-bold text-slate-600 uppercase tracking-[0.2em]">Release vs Planned</p>
                        </div>
                        <Badge className="bg-emerald-500/10 text-emerald-500 border-none text-[8px] font-black uppercase">Optimal</Badge>
                    </CardContent>
                </Card>

                <Card className="bg-card border-slate-800 shadow-xl overflow-hidden">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-slate-900/20">
                        <CardTitle className="text-[10px] font-black uppercase tracking-widest text-slate-500 italic">Average TAT</CardTitle>
                        <Clock className="h-3.5 w-3.5 text-blue-500 opacity-70" />
                    </CardHeader>
                    <CardContent className="pt-4 flex items-center justify-between gap-4">
                        <div>
                            <div className="text-3xl font-black italic tracking-tight text-white mb-1">{stats.avgTAT}h</div>
                            <p className="text-[9px] font-bold text-slate-600 uppercase tracking-[0.2em]">Mean turnaround time</p>
                        </div>
                        <Badge className="bg-blue-500/10 text-blue-400 border-none text-[8px] font-black uppercase">Efficiency</Badge>
                    </CardContent>
                </Card>

                <Card className="bg-card border-slate-800 shadow-xl overflow-hidden border-l-4 border-l-rose-500">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-rose-500/5">
                        <CardTitle className="text-[10px] font-black uppercase tracking-widest text-rose-400 italic">Rejeições</CardTitle>
                        <AlertTriangle className="h-3.5 w-3.5 text-rose-500" />
                    </CardHeader>
                    <CardContent className="pt-4 flex items-center justify-between gap-4">
                        <div>
                            <div className="text-3xl font-black italic tracking-tight text-rose-400 mb-1">{stats.rejected.toString()}</div>
                            <p className="text-[9px] font-bold text-slate-600 uppercase tracking-[0.2em]">Non-compliant assets</p>
                        </div>
                        <Badge className="bg-rose-500 text-white border-none text-[8px] font-black uppercase font-black">Risk Area</Badge>
                    </CardContent>
                </Card>
            </div>

            {/* BATCHES LIST */}
            <section className="space-y-6">
                <div className="flex items-center justify-between">
                    <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500 flex items-center gap-2 italic">
                        <Package className="h-3 w-3" />
                        Lotes Ativos
                    </h2>
                    <Badge variant="outline" className="text-[9px] font-bold uppercase tracking-widest border-slate-800 text-slate-400">
                        Batch Monitor
                    </Badge>
                </div>

                <Card className="bg-card border-slate-800 shadow-xl overflow-hidden">
                    <CardHeader className="border-b border-slate-800 bg-slate-900/50 pb-4">
                        <CardTitle className="text-[11px] font-black uppercase tracking-[0.2em] text-white flex items-center gap-2 italic">
                            Monitorização de Produção
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        {isArrayOfBatches ? (
                            <>
                                {batchesList.length > 0 ? (
                                    <div className="divide-y divide-slate-800/50">
                                        {batchesList.slice(0, 5).map((batch) => (
                                            <Link key={batch.id} href={`/production/${batch.id}`} className="flex items-center justify-between p-4 hover:bg-slate-900/40 transition-colors">
                                                <div className="flex items-center gap-4">
                                                    <div className={cn(
                                                        "h-10 w-10 rounded-xl flex items-center justify-center border shadow-inner",
                                                        getStatusVariant(batch.status)
                                                    )}>
                                                        {getStatusIcon(batch.status)}
                                                    </div>
                                                    <div>
                                                        <p className="text-xs font-black text-white italic uppercase tracking-tight">{batch.code}</p>
                                                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-none mt-1">{batch.product?.name || "Produto não definido"}</p>
                                                    </div>
                                                </div>
                                                <Badge className={cn("text-[8px] font-black uppercase tracking-widest", getStatusVariant(batch.status))}>
                                                    {batch.status}
                                                </Badge>
                                            </Link>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-20 text-slate-500 text-[10px] font-black uppercase tracking-widest italic border-2 border-dashed border-slate-800/50 m-6 rounded-2xl bg-slate-950/20">
                                        <Package className="h-10 w-10 mx-auto mb-4 opacity-20" />
                                        Sem lotes registrados
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="p-4">
                                {batchesList}
                            </div>
                        )}
                    </CardContent>
                    <div className="p-4 border-t border-slate-800 bg-slate-950/20">
                        <Link href="/production" className="text-[10px] font-black uppercase tracking-widest text-blue-400 hover:text-blue-300 transition-colors flex items-center justify-center gap-2">
                            Ver Todos os Lotes
                            <TrendingUp className="h-3 w-3" />
                        </Link>
                    </div>
                </Card>
            </section>
        </div>
    );
}

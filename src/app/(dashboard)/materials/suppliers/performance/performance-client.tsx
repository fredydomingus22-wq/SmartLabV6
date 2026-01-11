"use client";

import { useState, useMemo } from "react";
import { SupplierMetric } from "@/lib/queries/suppliers-performance";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import {
    Activity,
    AlertTriangle,
    CheckCircle2,
    Package,
    Search,
    TrendingUp,
    ChevronRight,
    Filter,
    ArrowUpRight,
    ArrowDownRight,
    ShieldCheck,
    FlaskConical
} from "lucide-react";
import { ParetoChart } from "@/components/smart/pareto-chart";
import { cn } from "@/lib/utils";

interface PerformanceClientProps {
    initialData: SupplierMetric[];
}

export function SupplierPerformanceClient({ initialData }: PerformanceClientProps) {
    const [searchTerm, setSearchTerm] = useState("");
    const [filter, setFilter] = useState<'all' | 'critical' | 'warning'>('all');

    // Stats
    const stats = useMemo(() => {
        const total = initialData.length;
        const avgCompliance = initialData.reduce((acc, m) => acc + m.complianceRate, 0) / (total || 1);
        const totalRejectedCount = initialData.reduce((acc, m) => acc + m.rejectedLots, 0);
        const criticalSuppliers = initialData.filter(m => m.complianceRate < 90).length;

        return {
            total,
            avgCompliance,
            totalRejectedCount,
            criticalSuppliers
        };
    }, [initialData]);

    // Pareto Data for Top NC Suppliers
    const paretoData = useMemo(() => {
        const sorted = [...initialData]
            .filter(m => m.rejectedLots > 0)
            .sort((a, b) => b.rejectedLots - a.rejectedLots);

        const totalRejections = sorted.reduce((acc, m) => acc + m.rejectedLots, 0);
        let cumulative = 0;

        return sorted.map(m => {
            const percentage = (m.rejectedLots / totalRejections) * 100;
            cumulative += percentage;
            return {
                name: m.name.length > 15 ? m.name.slice(0, 12) + "..." : m.name,
                count: m.rejectedLots,
                percentage,
                cumulativePercentage: cumulative
            };
        }).slice(0, 10);
    }, [initialData]);

    // Filtered List
    const filteredData = initialData
        .filter(m => {
            const matchesSearch = m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                m.code.toLowerCase().includes(searchTerm.toLowerCase());
            if (filter === 'critical') return matchesSearch && m.complianceRate < 80;
            if (filter === 'warning') return matchesSearch && m.complianceRate < 95 && m.complianceRate >= 80;
            return matchesSearch;
        })
        .sort((a, b) => b.totalLots - a.totalLots);

    return (
        <div className="space-y-8 animate-in fade-in duration-700">

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <KPICard
                    title="Média de Conformidade"
                    value={`${stats.avgCompliance.toFixed(1)}%`}
                    subtitle="Global dos fornecedores"
                    icon={<TrendingUp className="h-5 w-5 text-emerald-400" />}
                    trend={stats.avgCompliance > 95 ? "up" : "down"}
                />
                <KPICard
                    title="Lotes Rejeitados"
                    value={stats.totalRejectedCount.toString()}
                    subtitle="Acumulativo histórico"
                    icon={<AlertTriangle className="h-5 w-5 text-rose-400" />}
                    color="rose"
                />
                <KPICard
                    title="Fornecedores Críticos"
                    value={stats.criticalSuppliers.toString()}
                    subtitle="Taxa de aprovação < 90%"
                    icon={<Activity className="h-5 w-5 text-amber-400" />}
                    color="amber"
                />
                <KPICard
                    title="Total de Fornecedores"
                    value={stats.total.toString()}
                    subtitle="Parceiros ativos"
                    icon={<Package className="h-5 w-5 text-blue-400" />}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Pareto Chart Section */}
                <div className="lg:col-span-12 xl:col-span-5">
                    <ParetoChart
                        data={paretoData}
                        title="Top Rejeições por Fornecedor"
                        description="Análise de impacto (Pareto) dos lotes rejeitados na entrada."
                    />
                </div>

                {/* Main List Section */}
                <div className="lg:col-span-12 xl:col-span-7 space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass p-4 rounded-2xl border-slate-800">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                            <Input
                                placeholder="Filtrar fornecedores por nome ou código..."
                                className="pl-10 bg-slate-950/50 border-slate-800 h-10 text-sm focus:ring-blue-500/20"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="flex gap-2">
                            <Badge
                                className={cn("cursor-pointer px-4 py-1.5 rounded-lg border text-[10px] font-black uppercase tracking-widest transition-all", filter === 'all' ? "bg-blue-600 border-blue-500 text-white" : "bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800")}
                                onClick={() => setFilter('all')}
                            >
                                Todos
                            </Badge>
                            <Badge
                                className={cn("cursor-pointer px-4 py-1.5 rounded-lg border text-[10px] font-black uppercase tracking-widest transition-all", filter === 'critical' ? "bg-rose-600 border-rose-500 text-white font-black" : "bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800")}
                                onClick={() => setFilter('critical')}
                            >
                                Críticos
                            </Badge>
                        </div>
                    </div>

                    <div className="space-y-4">
                        {filteredData.map(supplier => (
                            <SupplierRow key={supplier.id} supplier={supplier} />
                        ))}

                        {filteredData.length === 0 && (
                            <div className="py-20 text-center border border-dashed border-slate-800 rounded-3xl bg-slate-900/20">
                                <Search className="h-10 w-10 text-slate-700 mx-auto mb-4" />
                                <h3 className="text-lg font-bold text-slate-500 uppercase tracking-tight">Nenhum resultado encontrado</h3>
                                <p className="text-sm text-slate-600">Altere os filtros ou pesquise por outro termo.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

function KPICard({ title, value, subtitle, icon, trend, color = "blue" }: any) {
    const colors = {
        blue: "from-blue-500/10 text-blue-400 border-blue-500/20 shadow-blue-500/5",
        emerald: "from-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-emerald-500/5",
        rose: "from-rose-500/10 text-rose-400 border-rose-500/20 shadow-rose-500/5",
        amber: "from-amber-500/10 text-amber-400 border-amber-500/20 shadow-amber-500/5",
    };

    return (
        <Card className={cn("glass border-slate-800 relative overflow-hidden group hover:scale-[1.02] transition-all duration-300", colors[color as keyof typeof colors])}>
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br transition-all duration-500 opacity-20 -mr-8 -mt-8 group-hover:scale-110" />
            <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                    <div className="p-2.5 rounded-xl bg-slate-950/50 border border-slate-800 shadow-inner group-hover:border-slate-700 transition-colors">
                        {icon}
                    </div>
                    {trend && (
                        <div className={cn("flex items-center text-[10px] font-black uppercase tracking-tighter", trend === 'up' ? "text-emerald-400" : "text-rose-400")}>
                            {trend === 'up' ? <ArrowUpRight className="h-3 w-3 mr-0.5" /> : <ArrowDownRight className="h-3 w-3 mr-0.5" />}
                            Trends
                        </div>
                    )}
                </div>
                <div className="space-y-1">
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">{title}</h3>
                    <div className="text-4xl font-black tracking-tighter text-white">{value}</div>
                    <p className="text-[10px] text-slate-500 font-medium uppercase tracking-tighter">{subtitle}</p>
                </div>
            </CardContent>
        </Card>
    );
}

function SupplierRow({ supplier }: { supplier: SupplierMetric }) {
    const isCritical = supplier.complianceRate < 80;
    const isWarning = supplier.complianceRate < 95 && supplier.complianceRate >= 80;

    return (
        <div className="glass p-5 rounded-2xl border-slate-800/80 hover:bg-slate-900/40 transition-all hover:border-slate-700 group ring-1 ring-white/5">
            <div className="flex flex-col sm:flex-row gap-6 sm:items-center">

                {/* ID & Basic Info */}
                <div className="flex items-center gap-4 min-w-[200px]">
                    <div className={cn(
                        "p-3 rounded-2xl border flex items-center justify-center transition-all shadow-lg shadow-black/20",
                        isCritical ? "bg-rose-500/10 border-rose-500/30 text-rose-400" :
                            isWarning ? "bg-amber-500/10 border-amber-500/30 text-amber-400" :
                                "bg-blue-500/10 border-blue-500/30 text-blue-400"
                    )}>
                        <Package className="h-5 w-5" />
                    </div>
                    <div className="flex flex-col">
                        <h4 className="font-black text-slate-100 italic uppercase tracking-tighter leading-tight group-hover:text-blue-400 transition-colors">
                            {supplier.name}
                        </h4>
                        <span className="text-[10px] font-mono text-slate-500 font-bold uppercase tracking-widest">{supplier.code}</span>
                    </div>
                </div>

                {/* Progress Mini Chart */}
                <div className="flex-1 flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Taxa de Conformidade</span>
                        <span className={cn("text-xs font-black uppercase tracking-tighter", isCritical ? "text-rose-400" : isWarning ? "text-amber-400" : "text-emerald-400")}>
                            {supplier.complianceRate.toFixed(1)}%
                        </span>
                    </div>
                    <Progress
                        value={supplier.complianceRate}
                        className="h-1.5 bg-slate-950 shadow-inner"
                        indicatorClassName={isCritical ? "bg-rose-500" : isWarning ? "bg-amber-500" : "bg-emerald-500"}
                    />
                </div>

                {/* Stats Dots */}
                <div className="flex gap-4 sm:ml-auto">
                    <div className="flex flex-col items-center">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Total Lotes</span>
                        <div className="px-3 py-1 rounded-lg bg-slate-950/80 border border-slate-800 font-bold text-slate-300 min-w-[50px] text-center shadow-inner">
                            {supplier.totalLots}
                        </div>
                    </div>
                    <div className="flex flex-col items-center">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 text-rose-500/70">Rejeições</span>
                        <div className={cn("px-3 py-1 rounded-lg border font-bold min-w-[50px] text-center shadow-inner", supplier.rejectedLots > 0 ? "bg-rose-500/10 border-rose-500/30 text-rose-400" : "bg-slate-950/80 border-slate-800 text-slate-600")}>
                            {supplier.rejectedLots}
                        </div>
                    </div>
                    <div className="flex flex-col items-center">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 text-amber-500/70">NCs Lab</span>
                        <div className={cn("px-3 py-1 rounded-lg border font-bold min-w-[50px] text-center shadow-inner", supplier.totalNCs > 0 ? "bg-amber-500/10 border-amber-500/30 text-amber-400" : "bg-slate-950/80 border-slate-800 text-slate-600")}>
                            {supplier.totalNCs}
                        </div>
                    </div>
                </div>

                {/* Action arrow */}
                <div className="hidden sm:block p-2 rounded-full hover:bg-white/5 transition-colors cursor-pointer text-slate-600 hover:text-white">
                    <ChevronRight className="h-5 w-5" />
                </div>
            </div>
        </div>
    );
}


import { createClient } from "@/lib/supabase/server";
import { CreateBatchDialog } from "./create-batch-dialog";
import { ProductionCharts } from "./production-charts";
import { ProductionPageClient } from "./production-page-client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, Activity, CheckCircle2, ShieldAlert, BrainCircuit, BarChart3, TrendingUp, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function ProductionPage() {
    const supabase = await createClient();

    // 1. Auth & Context
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return <div>Please log in</div>;

    const { data: profile } = await supabase
        .from("user_profiles")
        .select("organization_id, plant_id")
        .eq("id", user.id)
        .single();

    if (!profile || !profile.organization_id || !profile.plant_id) {
        return <div>Missing profile or plant context. Please contact support.</div>;
    }

    const { organization_id, plant_id } = profile;

    // 2. Fetch Metadata (Products & Lines)
    const { data: products } = await supabase
        .from("products")
        .select("id, name, sku")
        .eq("plant_id", plant_id)
        .eq("status", "active");

    // CRITICAL FIX: Use production_lines table, NOT equipments
    const { data: lines } = await supabase
        .from("production_lines")
        .select("id, name, code")
        .eq("plant_id", plant_id)
        .eq("status", "active");

    // 3. Fetch Batches (Scoped to Plant) with QC Status aggregation
    const { data: batches, error: batchesError } = await supabase
        .from("production_batches")
        .select(`
            *,
            product:products(name),
            samples:samples(ai_risk_status)
        `)
        .eq("plant_id", plant_id)
        .order("created_at", { ascending: false });

    if (batchesError) {
        console.error("BATCHES_FETCH_ERROR:", batchesError);
    }

    // 4. Metrics Calculation (Enterprise MES Style)
    const now = new Date();
    const batchesList = batches || [];

    // Status counts
    const planned = batchesList.filter(b => b.status === 'planned' || (b.status === 'open' && (!b.start_date || new Date(b.start_date) > now))).length;
    const inProcess = batchesList.filter(b => b.status === 'in_progress' || (b.status === 'open' && b.start_date && new Date(b.start_date) <= now)).length;
    const completed = batchesList.filter(b => b.status === 'completed').length;
    const blocked = batchesList.filter(b => b.status === 'blocked').length;
    const released = batchesList.filter(b => b.status === 'released' || b.status === 'closed').length;
    const rejected = batchesList.filter(b => b.status === 'rejected').length;

    // Industrial KPIs
    const totalProcessed = released + blocked + rejected;
    const yieldRate = batchesList.length > 0 ? (released / batchesList.length) * 100 : 0;
    const qualityRate = totalProcessed > 0 ? (released / totalProcessed) * 100 : 0;

    // Average Turnaround Time (TAT) in hours
    const completedBatches = batchesList.filter(b => b.start_date && b.end_date);
    const avgTAT = completedBatches.length > 0
        ? completedBatches.reduce((acc, b) => {
            const start = new Date(b.start_date!).getTime();
            const end = new Date(b.end_date!).getTime();
            return acc + (end - start);
        }, 0) / (completedBatches.length * 3600000)
        : 0;

    const stats = {
        planned,
        inProcess,
        completed,
        blocked,
        released,
        rejected,
        yieldRate: yieldRate.toFixed(1),
        qualityRate: qualityRate.toFixed(1),
        avgTAT: avgTAT.toFixed(1)
    };

    return (
        <div className="flex-1 flex flex-col min-h-screen bg-[#020617] text-slate-100 selection:bg-blue-500/30">
            {/* 🏙️ PREMIUM HEADER */}
            <header className="sticky top-0 z-40 bg-[#020617]/80 backdrop-blur-xl border-b border-white/5 px-8 py-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 max-w-[1600px] mx-auto">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2 mb-2">
                            <Badge variant="outline" className="h-7 px-3 text-[10px] font-black uppercase tracking-tighter bg-blue-500/10 text-blue-400 border-blue-500/20 rounded-full animate-pulse-slow">
                                MES Operator Station
                            </Badge>
                            <Badge variant="outline" className="h-7 px-3 text-[10px] font-black uppercase tracking-tighter bg-emerald-500/10 text-emerald-400 border-emerald-500/20 rounded-full">
                                Plant {profile.plant_id || 'Alpha'}
                            </Badge>
                        </div>
                        <h1 className="text-4xl font-black tracking-tighter uppercase flex items-center gap-4">
                            <div className="h-10 w-1 pt-1 bg-gradient-to-b from-blue-500 to-indigo-600 rounded-full" />
                            Production <span className="text-slate-500">Queue</span>
                        </h1>
                        <p className="text-sm text-slate-400 font-medium tracking-tight flex items-center gap-2">
                            <Activity className="h-4 w-4 text-blue-500/50" />
                            Batch management and industrial execution logic.
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <CreateBatchDialog
                            products={products || []}
                            lines={lines || []}
                            plantId={plant_id}
                        />
                    </div>
                </div>
            </header>

            <main className="flex-1 p-8 space-y-8 max-w-[1600px] mx-auto w-full">
                {/* 📊 INDUSTRIAL KPI GRID */}
                <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
                    {[
                        { label: "Planned", val: stats.planned, color: "blue", icon: Clock },
                        { label: "In Process", val: stats.inProcess, color: "amber", icon: Activity },
                        { label: "Finalized", val: stats.completed, color: "purple", icon: CheckCircle2 },
                        { label: "Blocked", val: stats.blocked, color: "rose", icon: ShieldAlert },
                        { label: "Released", val: stats.released, color: "emerald", icon: CheckCircle2 },
                        { label: "Quality Rate", val: `${stats.qualityRate}%`, color: "indigo", icon: BrainCircuit },
                    ].map((kpi, i) => (
                        <div key={i} className="group relative glass border border-white/5 rounded-3xl overflow-hidden transition-all duration-500 hover:border-white/10 p-5">
                            <div className={cn(
                                "absolute -top-12 -right-12 h-24 w-24 blur-[40px] opacity-10 group-hover:opacity-25 transition-opacity duration-700 rounded-full",
                                `bg-${kpi.color}-500`
                            )} />

                            <div className="relative z-10 flex flex-col gap-3">
                                <div className="flex items-center justify-between">
                                    <p className={cn("text-[9px] font-black uppercase tracking-widest", `text-${kpi.color}-400`)}>{kpi.label}</p>
                                    <kpi.icon className={cn("h-3 w-3", `text-${kpi.color}-400`)} />
                                </div>
                                <p className="text-3xl font-black tracking-tighter text-slate-100">{kpi.val}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* 📈 STRATEGIC OVERLAYS */}
                <div className="grid gap-6 md:grid-cols-3">
                    {[
                        { label: "Industrial Yield", val: `${stats.yieldRate}%`, icon: "Y", color: "emerald", desc: "Release vs Planned ratio" },
                        { label: "Average TAT", val: `${stats.avgTAT}h`, icon: "T", color: "blue", desc: "Mean turnaround time" },
                        { label: "Rejected Batches", val: stats.rejected, icon: "R", color: "rose", desc: "Non-compliant assets" },
                    ].map((kpi, i) => (
                        <div key={i} className="flex items-center gap-5 p-6 glass border border-white/5 rounded-[2.5rem] relative overflow-hidden group">
                            <div className={cn("absolute -left-12 -bottom-12 h-24 w-24 blur-[50px] opacity-5 group-hover:opacity-10 transition-opacity rounded-full", `bg-${kpi.color}-500`)} />

                            <div className={cn("h-12 w-12 rounded-2xl flex items-center justify-center font-black text-xl border", `bg-${kpi.color}-500/10 border-${kpi.color}-500/20 text-${kpi.color}-400`)}>
                                {kpi.icon}
                            </div>
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-1">{kpi.label}</p>
                                <p className="text-2xl font-black tracking-tighter text-slate-100">{kpi.val}</p>
                                <p className="text-[9px] font-medium text-slate-400 italic mt-0.5">{kpi.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* 📉 VISUAL ANALYTICS */}
                <div className="glass border border-white/5 rounded-[2.5rem] p-8 overflow-hidden shadow-2xl relative">
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 bg-indigo-500/10 rounded-xl flex items-center justify-center border border-indigo-500/20">
                                <TrendingUp className="h-5 w-5 text-indigo-400" />
                            </div>
                            <div>
                                <h2 className="text-xl font-black tracking-tighter uppercase">Trend Analytics</h2>
                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Real-time production throughput</p>
                            </div>
                        </div>
                    </div>
                    <ProductionCharts batches={batchesList} />
                </div>

                {/* 📑 PRODUCTION QUEUE TABLE */}
                <div className="glass border border-white/5 rounded-[2.5rem] p-4 shadow-2xl overflow-hidden">
                    <ProductionPageClient batches={batchesList} />
                </div>
            </main>
        </div>
    );
}


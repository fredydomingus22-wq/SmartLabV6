import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, Activity, Plus } from "lucide-react";
import { ProductionDashboard } from "./production-dashboard";

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

    // 2. Fetch Metadata (Products & Lines) - Still useful for context
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
            <header className="sticky top-0 z-40 bg-slate-950/60 backdrop-blur-2xl border-b border-white/5 px-8 py-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 max-w-[1700px] mx-auto">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2 text-primary mb-2">
                            <Activity className="h-4 w-4" />
                            <span className="text-xs font-bold uppercase tracking-widest opacity-70">Manufacturing Execution System</span>
                        </div>
                        <h1 className="text-4xl font-extrabold tracking-tight">
                            Production Center
                        </h1>
                        <p className="text-muted-foreground text-lg">
                            Real-time monitoring, batch execution, and industrial performance.
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <Link href="/production/config/shifts">
                            <Button variant="outline" className="h-11 border-slate-800 bg-slate-900/50 hover:bg-slate-800 text-slate-300 font-bold uppercase text-[10px] tracking-widest px-6 rounded-2xl">
                                <Clock className="h-4 w-4 mr-2" />
                                Gestão de Turnos
                            </Button>
                        </Link>
                        <Link href="/production/orders">
                            <Button className="h-11 bg-blue-600 hover:bg-blue-500 text-white font-black uppercase text-[10px] tracking-widest px-6 rounded-2xl shadow-lg shadow-blue-500/20">
                                <Plus className="h-4 w-4 mr-2" />
                                Nova Ordem de Produção
                            </Button>
                        </Link>
                    </div>
                </div>
            </header>

            <main className="flex-1 p-8 max-w-[1700px] mx-auto w-full">
                <ProductionDashboard stats={stats} batchesList={batchesList} />
            </main>
        </div>
    );
}


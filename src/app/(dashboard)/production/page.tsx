import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, Activity, Plus, Factory } from "lucide-react";
import { ProductionDashboard } from "./production-dashboard";
import { PageHeader } from "@/components/layout/page-header";
import { PageShell } from "@/components/defaults/page-shell";

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
        <PageShell className="space-y-6 pb-10">
            <PageHeader
                variant="indigo"
                icon={<Factory className="h-4 w-4" />}
                overline="Manufacturing Execution System"
                title="Production Center"
                description="Monitoramento em tempo real, execução de lotes e performance industrial estratégica."
                actions={
                    <div className="flex items-center gap-2">
                        <Link href="/production/config/shifts">
                            <Button variant="ghost" className="h-9 border border-white/5 bg-white/[0.03] hover:bg-white/[0.06] text-slate-400 font-bold uppercase text-[9px] tracking-widest px-4 rounded-xl transition-all">
                                <Clock className="h-3.5 w-3.5 mr-2 opacity-70" />
                                Turnos
                            </Button>
                        </Link>
                        <Link href="/production/orders">
                            <Button className="h-9 bg-indigo-600 hover:bg-indigo-500 text-white font-black uppercase text-[9px] tracking-widest px-4 rounded-xl shadow-lg shadow-indigo-500/10 transition-all">
                                <Plus className="h-3.5 w-3.5 mr-1" />
                                Nova Ordem
                            </Button>
                        </Link>
                    </div>
                }
            />

            <div className="px-4 md:px-6 pb-6 space-y-6">
                <main className="relative">
                    <ProductionDashboard stats={stats} batchesList={batchesList} />
                </main>

                {/* Global Status Footer */}
                <footer className="flex items-center justify-between pt-10 border-t border-white/5 opacity-50">
                    <span className="text-[10px] font-mono tracking-widest uppercase">MES Production Engine • GAMP 5</span>
                    <div className="flex items-center gap-2">
                        <div className="h-1.5 w-1.5 rounded-full bg-indigo-500 animate-pulse shadow-[0_0_8px_rgba(99,102,241,0.5)]" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-indigo-500">Live Production Monitoring</span>
                    </div>
                </footer>
            </div>
        </PageShell>
    );
}


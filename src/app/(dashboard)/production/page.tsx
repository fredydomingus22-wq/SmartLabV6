import { createClient } from "@/lib/supabase/server";
import { CreateBatchDialog } from "./create-batch-dialog";
import { ProductionCharts } from "./production-charts";
import { ProductionPageClient } from "./production-page-client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

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

    // 3. Fetch Batches (Scoped to Plant)
    const { data: batches, error: batchesError } = await supabase
        .from("production_batches")
        .select(`
            *,
            product:products(name)
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
        <div className="container py-8 space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Fila de Produção</h1>
                    <p className="text-muted-foreground">Gestão de lotes e execução industrial.</p>
                </div>
                <CreateBatchDialog
                    products={products || []}
                    lines={lines || []}
                    plantId={plant_id}
                />
            </div>

            {/* Industrial KPI Cards */}
            <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
                <div className="p-4 glass rounded-2xl border border-blue-500/10 bg-blue-500/5">
                    <p className="text-[9px] font-bold uppercase tracking-wider text-blue-600/70 mb-1">Planeados</p>
                    <p className="text-2xl font-bold text-blue-700">{stats.planned}</p>
                </div>
                <div className="p-4 glass rounded-2xl border border-amber-500/10 bg-amber-500/5">
                    <p className="text-[9px] font-bold uppercase tracking-wider text-amber-600/70 mb-1">Em Processo</p>
                    <p className="text-2xl font-bold text-amber-700">{stats.inProcess}</p>
                </div>
                <div className="p-4 glass rounded-2xl border border-purple-500/10 bg-purple-500/5">
                    <p className="text-[9px] font-bold uppercase tracking-wider text-purple-600/70 mb-1">Finalizados</p>
                    <p className="text-2xl font-bold text-purple-700">{stats.completed}</p>
                </div>
                <div className="p-4 glass rounded-2xl border border-rose-500/10 bg-rose-500/5">
                    <p className="text-[9px] font-bold uppercase tracking-wider text-rose-600/70 mb-1">Bloqueados</p>
                    <p className="text-2xl font-bold text-rose-700">{stats.blocked}</p>
                </div>
                <div className="p-4 glass rounded-2xl border border-emerald-500/10 bg-emerald-500/5">
                    <p className="text-[9px] font-bold uppercase tracking-wider text-emerald-600/70 mb-1">Liberados</p>
                    <p className="text-2xl font-bold text-emerald-700">{stats.released}</p>
                </div>
                <div className="p-4 glass rounded-2xl border border-indigo-500/10 bg-indigo-500/5">
                    <p className="text-[9px] font-bold uppercase tracking-wider text-indigo-600/70 mb-1">Quality Rate</p>
                    <p className="text-2xl font-bold text-indigo-700">{stats.qualityRate}%</p>
                </div>
            </div>

            {/* Strategic KPI Overlay */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card className="glass border-none shadow-sm flex items-center p-4 gap-4">
                    <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold">Y</div>
                    <div>
                        <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Yield Industrial</p>
                        <p className="text-xl font-bold">{stats.yieldRate}%</p>
                    </div>
                </Card>
                <Card className="glass border-none shadow-sm flex items-center p-4 gap-4">
                    <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold">T</div>
                    <div>
                        <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Tempo Médio (TAT)</p>
                        <p className="text-xl font-bold">{stats.avgTAT}h</p>
                    </div>
                </Card>
                <Card className="glass border-none shadow-sm flex items-center p-4 gap-4">
                    <div className="h-10 w-10 rounded-full bg-rose-100 flex items-center justify-center text-rose-700 font-bold">R</div>
                    <div>
                        <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Lotes Rejeitados</p>
                        <p className="text-xl font-bold text-rose-600">{stats.rejected}</p>
                    </div>
                </Card>
            </div>

            <ProductionCharts batches={batchesList} />

            <div className="glass rounded-2xl p-6 border-none shadow-sm">
                <ProductionPageClient batches={batchesList} />
            </div>
        </div>
    );
}


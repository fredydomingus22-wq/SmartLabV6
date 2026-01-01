import { createClient } from "@/lib/supabase/server";
import { CreateBatchDialog } from "./create-batch-dialog";
import { ProductionCharts } from "./production-charts";
import { ProductionPageClient } from "./production-page-client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
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

            {/* Industrial KPI Cards - Professional Grid */}
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
                {[
                    { label: "Planeados", val: stats.planned, color: "blue", icon: Clock },
                    { label: "Em Processo", val: stats.inProcess, color: "amber", icon: Activity },
                    { label: "Finalizados", val: stats.completed, color: "purple", icon: CheckCircle2 },
                    { label: "Bloqueados", val: stats.blocked, color: "rose", icon: ShieldAlert },
                    { label: "Liberados", val: stats.released, color: "emerald", icon: CheckCircle2 },
                    { label: "Taxa Qualidade", val: `${stats.qualityRate}%`, color: "indigo", icon: BrainCircuit },
                ].map((kpi, i) => (
                    <div key={i} className={cn(
                        "p-5 glass rounded-3xl border transition-all hover:scale-[1.02] relative overflow-hidden group",
                        `border-${kpi.color}-500/20 bg-${kpi.color}-500/5`
                    )}>
                        <div className={cn("absolute top-0 right-0 w-16 h-16 blur-[40px] -mr-8 -mt-8 rounded-full opacity-20 transition-all group-hover:opacity-40", `bg-${kpi.color}-500`)} />
                        <div className="flex flex-col gap-2 relative z-10">
                            <div className="flex items-center justify-between">
                                <p className={cn("text-[9px] font-black uppercase tracking-widest opacity-60", `text-${kpi.color}-400`)}>{kpi.label}</p>
                                <kpi.icon className={cn("h-3 w-3", `text-${kpi.color}-400`)} />
                            </div>
                            <p className={cn("text-3xl font-black tracking-tighter", `text-${kpi.color}-200`)}>{kpi.val}</p>
                        </div>
                    </div>
                ))}
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


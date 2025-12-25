import { createClient } from "@/lib/supabase/server";
import { CreateBatchDialog } from "./create-batch-dialog";
import { ProductionCharts } from "./production-charts";
import { ProductionPageClient } from "./production-page-client";

export const dynamic = "force-dynamic";

export default async function ProductionPage() {
    const supabase = await createClient();

    // Fetch Batches
    const { data: batches } = await supabase
        .from("production_batches")
        .select("id, code, status, planned_quantity, start_date, product:products(name)")
        .order("created_at", { ascending: false });

    // Fetch Metadata for Create Dialog
    const { data: products } = await supabase.from("products").select("id, name, sku").eq("status", "active");
    const { data: lines } = await supabase.from("equipments").select("id, name, code").eq("equipment_type", "production_line").eq("status", "active");
    const { data: tanks } = await supabase.from("equipments").select("id, name, code").eq("equipment_type", "tank").eq("status", "active");
    const { data: plant } = await supabase.from("plants").select("id").limit(1).single();

    // Aggregate Volume (Batches per Day of Week)
    const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const volumeMap = new Map<string, number>(daysOfWeek.map(d => [d, 0]));

    batches?.forEach(b => {
        if (b.start_date) {
            const date = new Date(b.start_date);
            // Only count if within current week or recent? For MVP showing all-time distribution by day name, 
            // or we could filter purely for "This Week". Let's do "This Week" filter for better realism.
            // Actually, simpler for now: just map all recent batches to their day name.
            const dayName = daysOfWeek[date.getDay()];
            volumeMap.set(dayName, (volumeMap.get(dayName) || 0) + 1);
        }
    });

    // Format for Recharts (Order Mon-Fri usually)
    // Let's stick to Mon-Sun or just Mon-Fri
    const chartData = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(day => ({
        name: day,
        batches: volumeMap.get(day) || 0
    }));

    return (
        <div className="container py-8 space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Production</h1>
                    <p className="text-muted-foreground">Manage production batches and executions.</p>
                </div>
                <CreateBatchDialog products={products || []} lines={lines || []} plantId={plant?.id || ""} />
            </div>

            <ProductionCharts batches={batches || []} volumeData={chartData} />

            <div className="glass rounded-xl p-6">
                <ProductionPageClient batches={batches || []} />
            </div>
        </div>
    );
}


import { createClient } from "@/lib/supabase/server";
import { ReagentDialog } from "./reagent-dialog";
import { StockMovementDialog } from "./stock-movement-dialog";
import { StockPageClient } from "./stock-page-client";
import { InventoryDashboard } from "./inventory-dashboard";

export const dynamic = "force-dynamic";

export default async function StockPage() {
    const supabase = await createClient();

    // Fetch Reagents
    const { data: reagents } = await supabase
        .from("reagents")
        .select("*")
        .order("name");

    // Fetch all movements for calculation (MVP only)
    const { data: movements } = await supabase
        .from("reagent_movements")
        .select("reagent_id, quantity, movement_type, expiry_date");

    // Calculate Stock & KPIs
    const stockMap = new Map<string, number>();
    const usageMap = new Map<string, number>();

    movements?.forEach(m => {
        const qty = Number(m.quantity);
        if (m.movement_type === 'out') {
            const currentUsage = usageMap.get(m.reagent_id) || 0;
            usageMap.set(m.reagent_id, currentUsage + qty);

            const currentStock = stockMap.get(m.reagent_id) || 0;
            stockMap.set(m.reagent_id, currentStock - qty);
        } else {
            const currentStock = stockMap.get(m.reagent_id) || 0;
            stockMap.set(m.reagent_id, currentStock + qty);
        }
    });

    const processedData = reagents?.map(r => ({
        ...r,
        current_stock: stockMap.get(r.id) || 0
    })) || [];

    // KPI: Low Stock
    const lowStockItems = processedData.filter(r => r.current_stock < (r.min_stock_level || 0));
    const activeReagents = processedData.filter(r => r.current_stock > 0).length;

    // KPI: Most Used (Top 5)
    // Map usageMap back to Reagent Names
    const mostUsed = Array.from(usageMap.entries())
        .map(([id, qty]) => {
            const r = reagents?.find(i => i.id === id);
            return { name: r?.name || "Unknown", quantity: qty };
        })
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, 5);

    // KPI: Expiring Soon (batches expiring in next 30 days)
    const now = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(now.getDate() + 30);

    const expiringBatches = movements
        ?.filter(m => m.movement_type === 'in' && m.expiry_date)
        .filter(m => {
            const exp = new Date(m.expiry_date);
            return exp >= now && exp <= thirtyDaysFromNow;
        })
        .map(m => {
            const r = reagents?.find(i => i.id === m.reagent_id);
            return {
                reagent: r?.name || "Unknown",
                batch: "Batch " + m.expiry_date, // or m.batch_number if we fetched it
                expiry: m.expiry_date
            };
        }) || [];

    // Fetch a Plant ID
    const { data: plants } = await supabase.from("plants").select("id").limit(1);
    const plantId = plants?.[0]?.id || "00000000-0000-0000-0000-000000000000";

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Chemical Inventory</h1>
                    <p className="text-muted-foreground">Manage reagents, solvents, and consumables.</p>
                </div>
                <div className="flex gap-2">
                    <StockMovementDialog reagents={reagents || []} />
                    <ReagentDialog plantId={plantId} />
                </div>
            </div>

            <InventoryDashboard
                totalReagents={reagents?.length || 0}
                activeReagents={activeReagents}
                lowStockCount={lowStockItems.length}
                lowStockItems={lowStockItems.map(i => ({ name: i.name, current: i.current_stock, min: i.min_stock_level || 0, unit: i.unit || 'units' }))}
                mostUsed={mostUsed}
                expiringBatches={expiringBatches}
            />

            <div className="glass rounded-xl p-6">
                <StockPageClient data={processedData} />
            </div>
        </div>
    );
}


import { createClient } from "@/lib/supabase/server";
import { ReagentDialog } from "./reagent-dialog";
import { StockMovementDialog } from "./stock-movement-dialog";
import { StockPageClient } from "./stock-page-client";
import { MovementsPageClient } from "./movements-page-client";
import { InventoryDashboard } from "./inventory-dashboard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Beaker, History, ArrowLeft, Plus, Sparkles } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

import { format } from "date-fns";
import { pt } from "date-fns/locale";

import { PageShell } from "@/components/defaults/page-shell";
import { PageHeader } from "@/components/layout/page-header";

export default async function ReagentsPage() {
    const supabase = await createClient();

    // Fetch Reagents
    const { data: reagents } = await supabase
        .from("reagents")
        .select("*")
        .order("name");

    // Fetch all movements for calculation and list
    const { data: movements } = await supabase
        .from("reagent_movements")
        .select(`
            *,
            reagent:reagents(name, unit)
        `)
        .order("created_at", { ascending: false });

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

    // KPI calculation
    const lowStockItems = processedData.filter(r => r.current_stock < (r.min_stock_level || 0));
    const activeReagents = processedData.filter(r => r.current_stock > 0).length;

    const mostUsed = Array.from(usageMap.entries())
        .map(([id, qty]) => {
            const r = reagents?.find(i => i.id === id);
            return { name: r?.name || "Unknown", quantity: qty };
        })
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, 5);

    const now = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(now.getDate() + 30);

    const expiringBatches = (movements || [])
        .filter(m => m.movement_type === 'in' && m.expiry_date)
        .filter(m => {
            const exp = new Date(m.expiry_date);
            return exp >= now && exp <= thirtyDaysFromNow;
        })
        .map(m => {
            const r = reagents?.find(i => i.id === m.reagent_id);
            return {
                reagent: r?.name || "Unknown",
                batch: "Lote " + m.expiry_date,
                expiry: m.expiry_date
            };
        });

    // Trend Calculation
    const today = new Date();
    const getLast7DaysMovement = (type: 'in' | 'out') => {
        const days = Array.from({ length: 7 }, (_, i) => {
            const d = new Date();
            d.setDate(today.getDate() - (6 - i));
            return { date: format(d, 'dd/MM', { locale: pt }), value: 0, rawDate: d.toDateString() };
        });

        movements?.forEach(m => {
            if (m.movement_type !== type || !m.created_at) return;
            const itemDate = new Date(m.created_at).toDateString();
            const day = days.find(d => d.rawDate === itemDate);
            if (day) day.value += Number(m.quantity);
        });

        return days.map(({ date, value }) => ({ date, value }));
    };

    const stockInTrend = getLast7DaysMovement('in');
    const stockOutTrend = getLast7DaysMovement('out');
    const totalTrend = stockInTrend.map((item, i) => ({ ...item, value: item.value + stockOutTrend[i].value }));

    const { data: plants } = await supabase.from("plants").select("id").limit(1);
    const plantId = plants?.[0]?.id || "";

    return (
        <PageShell>
            <PageHeader
                variant="blue"
                icon={<Beaker className="h-4 w-4 stroke-[1.5px]" />}
                overline="Gestão Laboratorial • Entidades Químicas"
                title="Entidades Químicas & Reagentes"
                description="Gestão técnico-operacional de stocks, validades e conformidade de reagentes."
                backHref="/materials"
                actions={
                    <div className="flex items-center gap-3">
                        <StockMovementDialog reagents={reagents || []} />
                        <ReagentDialog plantId={plantId} />
                    </div>
                }
            />

            <div className="p-6 space-y-6 pb-20">
                <InventoryDashboard
                    totalReagents={reagents?.length || 0}
                    activeReagents={activeReagents}
                    lowStockCount={lowStockItems.length}
                    lowStockItems={lowStockItems.map(i => ({ name: i.name, current: i.current_stock, min: i.min_stock_level || 0, unit: i.unit || 'units' }))}
                    mostUsed={mostUsed}
                    expiringBatches={expiringBatches}
                    stockInTrend={stockInTrend}
                    stockOutTrend={stockOutTrend}
                    totalTrend={totalTrend}
                />

                <Tabs defaultValue="stock" className="space-y-6">
                    <TabsList className="bg-slate-900/50 border border-slate-800 p-1 h-11 rounded-xl">
                        <TabsTrigger value="stock" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white rounded-lg py-1.5 px-6 shadow-none font-black uppercase text-[10px] tracking-widest transition-all h-full">
                            <Beaker className="h-3.5 w-3.5 mr-2 stroke-[1.5px]" />
                            Stock Atual
                        </TabsTrigger>
                        <TabsTrigger value="history" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white rounded-lg py-1.5 px-6 shadow-none font-black uppercase text-[10px] tracking-widest transition-all h-full">
                            <History className="h-3.5 w-3.5 mr-2 stroke-[1.5px]" />
                            Histórico de Movimentos
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="stock" className="space-y-4 outline-none">
                        <div className="bg-slate-900/30 border border-slate-800/60 rounded-2xl overflow-hidden shadow-xl">
                            <StockPageClient data={processedData} />
                        </div>
                    </TabsContent>

                    <TabsContent value="history" className="space-y-4 outline-none">
                        <div className="bg-slate-900/30 border border-slate-800/60 rounded-2xl overflow-hidden shadow-xl">
                            <MovementsPageClient movements={movements || []} />
                        </div>
                    </TabsContent>
                </Tabs>
            </div>
        </PageShell>
    );
}

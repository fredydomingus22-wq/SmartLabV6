import { createClient } from "@/lib/supabase/server";
import { getPackagingMaterials, getPackagingLots } from "@/lib/queries/packaging";
import { PackagingPageClient } from "./packaging-page-client";
import { PackagingLotsClient } from "./lots/packaging-lots-client";
import { PackagingDialog } from "./packaging-dialog";
import { PackagingLotDialog } from "./lots/packaging-lot-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PremiumAnalyticsCard } from "@/components/dashboard/premium-analytics-card";
import { Sparkles, Box, Layers, ArrowLeft, Plus } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

// Local helper for trend simulation
const mockTrend = { value: 0, isPositive: true };
const mockSeries = Array.from({ length: 7 }, (_, i) => ({ date: `D${i}`, value: Math.floor(Math.random() * 100) }));

export const dynamic = "force-dynamic";

export default async function PackagingMaterialsPage() {
    const [materials, lots] = await Promise.all([
        getPackagingMaterials(),
        getPackagingLots()
    ]);

    const activeLots = lots?.filter(l => l.status === 'active').length || 0;

    return (

        <div className="container max-w-[1600px] mx-auto py-8 space-y-10 pb-20">
            {/* Header - Industrial Premium */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-1">
                    <div className="flex items-center gap-2 text-emerald-400">
                        <Sparkles className="h-4 w-4" />
                        <span className="text-xs font-bold uppercase tracking-widest opacity-80">Inventory Control</span>
                    </div>
                    <h1 className="text-4xl font-extrabold tracking-tight text-white flex items-center gap-3">
                        Gestão de Embalagem
                    </h1>
                    <p className="text-slate-400 text-lg">
                        Catálogo e controlo de lotes de materiais de embalagem.
                    </p>
                </div>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <PremiumAnalyticsCard
                    title="Catálogo"
                    value={String(materials?.length || 0)}
                    description="Itens de embalagem"
                    trend={mockTrend}
                    data={mockSeries}
                    dataKey="value"
                    color="#10b981" // emerald
                />
                <PremiumAnalyticsCard
                    title="Lotes Ativos"
                    value={String(activeLots)}
                    description="Em uso na produção"
                    trend={{ value: 5, isPositive: true }}
                    data={mockSeries}
                    dataKey="value"
                    color="#3b82f6" // blue
                />
                {/* Placeholder Cards for symmetry */}
                <PremiumAnalyticsCard
                    title="Total Movimentado"
                    value="1.2k"
                    description="Unidades este mês"
                    trend={{ value: 12, isPositive: true }}
                    data={mockSeries}
                    dataKey="value"
                    color="#f59e0b" // amber
                />
                <PremiumAnalyticsCard
                    title="Stock Baixo"
                    value="0"
                    description="Itens abaixo do mínimo"
                    trend={{ value: 0, isPositive: true }}
                    data={mockSeries}
                    dataKey="value"
                    color="#f43f5e" // rose
                />
            </div>

            <Tabs defaultValue="catalog" className="space-y-4">
                <TabsList className="bg-slate-900/50 border border-slate-800">
                    <TabsTrigger value="catalog" className="data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-400">
                        <Box className="h-4 w-4 mr-2" />
                        Catálogo ({materials?.length || 0})
                    </TabsTrigger>
                    <TabsTrigger value="lots" className="data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-400">
                        <Layers className="h-4 w-4 mr-2" />
                        Lotes ({lots?.length || 0})
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="catalog" className="space-y-4">
                    <div className="flex justify-end">
                        <PackagingDialog />
                    </div>
                    <div className="glass rounded-xl p-6">
                        <PackagingPageClient materials={materials || []} />
                    </div>
                </TabsContent>

                <TabsContent value="lots" className="space-y-4">
                    <div className="flex justify-end">
                        <PackagingLotDialog materials={materials || []} />
                    </div>
                    <div className="glass rounded-xl p-6">
                        <PackagingLotsClient lots={lots || []} />
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}

import { createClient } from "@/lib/supabase/server";
import { getPackagingMaterials, getPackagingLots } from "@/lib/queries/packaging";
import { PackagingPageClient } from "./packaging-page-client";
import { PackagingLotsClient } from "./lots/packaging-lots-client";
import { PackagingDialog } from "./packaging-dialog";
import { PackagingLotDialog } from "./lots/packaging-lot-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/layout/page-header";
import { KPISparkCard } from "@/components/ui/kpi-spark-card";
import { Sparkles, Box, Layers, ArrowLeft, Plus, CheckCircle, TrendingUp, AlertTriangle } from "lucide-react";
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

        <div className="space-y-10 pb-20">
            <PageHeader
                variant="emerald"
                icon={<Box className="h-4 w-4" />}
                overline="Inventory Control • Site Logistics"
                title="Gestão de Embalagem"
                description="Catálogo e controlo de lotes de materiais de embalagem."
                backHref="/materials"
            />

            {/* KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <KPISparkCard
                    variant="emerald"
                    title="Catálogo"
                    value={String(materials?.length || 0).padStart(3, '0')}
                    description="Itens de embalagem"
                    icon={<Box className="h-4 w-4" />}
                    data={mockSeries.map(s => ({ value: s.value }))}
                />
                <KPISparkCard
                    variant="blue"
                    title="Lotes Ativos"
                    value={String(activeLots).padStart(3, '0')}
                    description="Em uso na produção"
                    icon={<CheckCircle className="h-4 w-4" />}
                    data={mockSeries.map(s => ({ value: s.value }))}
                />
                <KPISparkCard
                    variant="amber"
                    title="Total Movimentado"
                    value="1.2k"
                    description="Unidades este mês"
                    icon={<TrendingUp className="h-4 w-4" />}
                    data={mockSeries.map(s => ({ value: s.value }))}
                />
                <KPISparkCard
                    variant="destructive"
                    title="Stock Baixo"
                    value="000"
                    description="Itens abaixo do mínimo"
                    icon={<AlertTriangle className="h-4 w-4" />}
                    data={mockSeries.map(s => ({ value: s.value }))}
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
                    <div className="bg-card border border-slate-800 rounded-xl p-6 shadow-xl">
                        <PackagingPageClient materials={materials || []} />
                    </div>
                </TabsContent>

                <TabsContent value="lots" className="space-y-4">
                    <div className="flex justify-end">
                        <PackagingLotDialog materials={materials || []} />
                    </div>
                    <div className="bg-card border border-slate-800 rounded-xl p-6 shadow-xl">
                        <PackagingLotsClient lots={lots || []} />
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}

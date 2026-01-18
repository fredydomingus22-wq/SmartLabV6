import { PageShell } from "@/components/defaults/page-shell";
import { PageHeader } from "@/components/layout/page-header";
import { KPISparkCard } from "@/components/ui/kpi-spark-card";
import { PackagingDialog } from "./packaging-dialog";
import { PackagingLotDialog } from "./lots/packaging-lot-dialog";
import { getPackagingMaterials, getPackagingLots } from "@/lib/queries/packaging";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Box, Layers, CheckCircle, TrendingUp, AlertTriangle } from "lucide-react";
import { PackagingPageClient } from "./packaging-page-client";
import { PackagingLotsClient } from "./lots/packaging-lots-client";

export const dynamic = "force-dynamic";

// Local helper for trend simulation
const mockSeries = Array.from({ length: 7 }, (_, i) => ({ date: `D${i}`, value: Math.floor(Math.random() * 10) }));

export default async function PackagingMaterialsPage() {
    const [materials, lots] = await Promise.all([
        getPackagingMaterials(),
        getPackagingLots()
    ]);

    const activeLots = lots?.filter(l => l.status === 'active').length || 0;

    return (
        <PageShell>
            <PageHeader
                variant="blue"
                icon={<Box className="h-4 w-4 stroke-[1.5px]" />}
                overline="Gestão de Stock • Eficiência de Linha"
                title="Materiais de Embalagem"
                description="Controlo de catálogo técnico e rastreabilidade de lotes de embalagem primária e secundária."
                backHref="/materials"
                actions={
                    <div className="flex items-center gap-3">
                        <PackagingDialog />
                        <PackagingLotDialog materials={materials || []} />
                    </div>
                }
            />

            <div className="p-6 space-y-6 pb-20">
                {/* KPIs */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <KPISparkCard
                        variant="blue"
                        title="Catálogo"
                        value={String(materials?.length || 0).padStart(3, '0')}
                        description="Itens registados"
                        icon={<Box className="h-4 w-4 stroke-[1.5px]" />}
                        data={mockSeries}
                    />
                    <KPISparkCard
                        variant="emerald"
                        title="Lotes Ativos"
                        value={String(activeLots).padStart(3, '0')}
                        description="Em uso na produção"
                        icon={<CheckCircle className="h-4 w-4 stroke-[1.5px]" />}
                        data={mockSeries}
                    />
                    <KPISparkCard
                        variant="amber"
                        title="Movimentação"
                        value="1.2k"
                        description="Unidades (Mês Atual)"
                        icon={<TrendingUp className="h-4 w-4 stroke-[1.5px]" />}
                        data={mockSeries}
                    />
                    <KPISparkCard
                        variant="rose"
                        title="Stock Crítico"
                        value="000"
                        description="Itens abaixo do mínimo"
                        icon={<AlertTriangle className="h-4 w-4 stroke-[1.5px]" />}
                        data={mockSeries}
                    />
                </div>

                <Tabs defaultValue="catalog" className="space-y-6">
                    <div className="flex items-center gap-2">
                        <Layers className="h-4 w-4 text-cyan-400 stroke-[1.5px]" />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                            Inventário Técnico • Operacional
                        </span>
                    </div>

                    <TabsList className="bg-slate-900/50 border border-slate-800 p-1 h-11 rounded-xl">
                        <TabsTrigger value="catalog" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white rounded-lg py-1.5 px-6 shadow-none font-black uppercase text-[10px] tracking-widest transition-all h-full">
                            <Box className="h-3.5 w-3.5 mr-2 stroke-[1.5px]" />
                            Catálogo Técnico ({materials?.length || 0})
                        </TabsTrigger>
                        <TabsTrigger value="lots" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white rounded-lg py-1.5 px-6 shadow-none font-black uppercase text-[10px] tracking-widest transition-all h-full">
                            <Layers className="h-3.5 w-3.5 mr-2 stroke-[1.5px]" />
                            Controlo de Lotes ({lots?.length || 0})
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="catalog" className="space-y-4 outline-none">
                        <div className="bg-slate-900/30 border border-slate-800/60 rounded-2xl overflow-hidden shadow-xl">
                            <PackagingPageClient materials={materials || []} />
                        </div>
                    </TabsContent>

                    <TabsContent value="lots" className="space-y-4 outline-none">
                        <div className="bg-slate-900/30 border border-slate-800/60 rounded-2xl overflow-hidden shadow-xl">
                            <PackagingLotsClient lots={lots || []} />
                        </div>
                    </TabsContent>
                </Tabs>
            </div>
        </PageShell>
    );
}

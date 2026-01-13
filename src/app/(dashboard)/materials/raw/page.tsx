import { createClient } from "@/lib/supabase/server";
import { getSafeUser } from "@/lib/auth.server";
import { getRawMaterials, getLots, getSuppliers, getRawMaterialStats } from "@/lib/queries/raw-materials";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Package,
    Layers,
    ArrowLeft,
    Plus,
    AlertTriangle,
    Calendar,
    Search,
    Filter,
    ArrowUpRight,
    FileText,
    ExternalLink,
    ChevronLeft,
    ChevronRight,
    SearchCode,
    Sparkles,
    Warehouse,
    Activity,
    CheckCircle
} from "lucide-react";
import Link from "next/link";
import { format, differenceInDays } from "date-fns";
import { pt } from "date-fns/locale";
import { CreateRawMaterialDialog } from "./_components/create-material-dialog";
import { ReceiveLotDialog } from "./_components/receive-lot-dialog";
import { ConsumeLotDialog } from "./_components/consume-lot-dialog";
import { PageHeader } from "@/components/layout/page-header";
import { KPISparkCard } from "@/components/ui/kpi-spark-card";

export const dynamic = "force-dynamic";

const statusColors: Record<string, string> = {
    approved: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    in_use: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    quarantine: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    rejected: "bg-rose-500/10 text-rose-400 border-rose-500/20",
    expired: "bg-slate-500/10 text-slate-400 border-slate-800",
    exhausted: "bg-slate-500/5 text-slate-500 border-slate-800 opacity-50",
};

interface PageProps {
    searchParams: Promise<{
        tab?: string;
        page_catalog?: string;
        page_lots?: string;
    }>;
}

export default async function RawMaterialsPage({ searchParams }: PageProps) {
    const user = await getSafeUser();
    const params = await searchParams;
    const activeTab = params.tab || "lots";
    const pageCatalog = Number(params.page_catalog) || 1;
    const pageLots = Number(params.page_lots) || 1;
    const limit = 5;

    const today = new Date();

    // Fetch data with pagination
    const { data: materials, count: totalMaterials } = await getRawMaterials({ page: pageCatalog, limit });
    const { data: lots, count: totalLots } = await getLots({ page: pageLots, limit });
    const suppliers = await getSuppliers();
    const stats = await getRawMaterialStats();

    // Local helper for trend simulation
    const mockTrend = { value: 0, isPositive: true };
    const mockSeries = Array.from({ length: 7 }, (_, i) => ({ date: `D${i}`, value: Math.floor(Math.random() * 100) }));

    const totalPagesCatalog = Math.ceil(totalMaterials / limit);
    const totalPagesLots = Math.ceil(totalLots / limit);

    return (
        <div className="space-y-10 pb-20">
            <PageHeader
                variant="blue"
                icon={<Warehouse className="h-4 w-4" />}
                overline="Inventory Control • Site Logistics"
                title="Matérias-Primas"
                description="Controlo técnico de insumos e rastreabilidade de lotes."
                backHref="/materials"
                actions={
                    <div className="flex items-center gap-3">
                        <CreateRawMaterialDialog plantId={user.plant_id!} />
                        <ReceiveLotDialog
                            plantId={user.plant_id!}
                            materials={materials.map(m => ({ id: m.id, name: m.name, code: m.code, unit: m.unit || 'kg' }))}
                            suppliers={suppliers.map(s => ({ id: s.id, name: s.name }))}
                        />
                    </div>
                }
            />

            {/* Premium Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <KPISparkCard
                    variant="blue"
                    title="Catálogo MP"
                    value={String(totalMaterials).padStart(3, '0')}
                    description="Itens registados"
                    icon={<Layers className="h-4 w-4" />}
                    sparklineData={mockSeries.map(s => ({ value: s.value }))}
                />
                <KPISparkCard
                    variant="emerald"
                    title="Lotes Aprovados"
                    value={String(stats.approved).padStart(3, '0')}
                    description="Prontos para produção"
                    icon={<CheckCircle className="h-4 w-4" />}
                    sparklineData={mockSeries.map(s => ({ value: s.value }))}
                />
                <KPISparkCard
                    variant="amber"
                    title="Em Quarentena"
                    value={String(stats.inQuarantine).padStart(3, '0')}
                    description="Aguardando CQ"
                    icon={<Activity className="h-4 w-4" />}
                    sparklineData={mockSeries.map(s => ({ value: s.value }))}
                />
                <KPISparkCard
                    variant="rose"
                    title="Críticos/Validade"
                    value={String(stats.expiringSoon).padStart(3, '0')}
                    description="Expira em < 30 dias"
                    icon={<AlertTriangle className="h-4 w-4" />}
                    sparklineData={mockSeries.map(s => ({ value: s.value }))}
                />
            </div>

            {/* Tabs */}
            <Tabs defaultValue={activeTab} className="space-y-6">
                <div className="flex items-center justify-between">
                    <TabsList className="bg-slate-900/50 border border-slate-800 p-1 h-11 rounded-xl">
                        <TabsTrigger value="lots" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white rounded-lg py-1.5 px-6 shadow-none font-black uppercase text-[10px] tracking-widest transition-all h-full">
                            <Link href={`/materials/raw?tab=lots&page_lots=${pageLots}&page_catalog=${pageCatalog}`} className="flex items-center h-full w-full">
                                <Layers className="h-3.5 w-3.5 mr-2" />
                                Lista de Lotes
                            </Link>
                        </TabsTrigger>
                        <TabsTrigger value="catalog" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white rounded-lg py-1.5 px-6 shadow-none font-black uppercase text-[10px] tracking-widest transition-all h-full">
                            <Link href={`/materials/raw?tab=catalog&page_lots=${pageLots}&page_catalog=${pageCatalog}`} className="flex items-center h-full w-full">
                                <Package className="h-3.5 w-3.5 mr-2" />
                                Catálogo Técnico
                            </Link>
                        </TabsTrigger>
                    </TabsList>

                    <div className="flex items-center gap-2">
                        <div className="relative group hidden md:block">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
                            <input
                                placeholder="Filtrar matérias-primas..."
                                className="bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-[10px] font-bold uppercase tracking-widest text-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500/30 w-72 h-11 transition-all"
                            />
                        </div>
                    </div>
                </div>

                {/* Lots Tab */}
                <TabsContent value="lots" className="space-y-4 outline-none">
                    <Card className="bg-card border-slate-800 shadow-xl overflow-hidden rounded-2xl">
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="border-b border-slate-800 bg-slate-900/50">
                                            <th className="py-4 px-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] italic">Lote</th>
                                            <th className="py-4 px-4 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] italic">Matéria-Prima</th>
                                            <th className="py-4 px-4 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] italic">Fornecedor</th>
                                            <th className="py-4 px-4 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] italic text-center">Data Receção</th>
                                            <th className="py-4 px-4 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] italic text-center">Validade</th>
                                            <th className="py-4 px-4 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] italic text-right">Stock</th>
                                            <th className="py-4 px-4 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] italic text-center">Status</th>
                                            <th className="py-4 px-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] italic text-right whitespace-nowrap">Ações</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-800/40">
                                        {lots.map((l: any) => {
                                            const isExpiring = l.expiry_date && differenceInDays(new Date(l.expiry_date), today) <= 30;
                                            const isExpired = l.expiry_date && new Date(l.expiry_date) < today;

                                            return (
                                                <tr key={l.id} className="hover:bg-slate-900/40 transition-colors group">
                                                    <td className="py-3 px-6">
                                                        <Link href={`/materials/raw/lots/${l.id}`} className="font-mono text-[10px] font-black text-blue-400 hover:text-blue-300 transition-colors bg-blue-500/5 px-2 py-1 rounded-md border border-blue-500/10">
                                                            {l.lot_code}
                                                        </Link>
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        <div className="flex flex-col">
                                                            <span className="text-xs font-black text-white italic tracking-tight">{l.raw_material?.name}</span>
                                                            <span className="text-[9px] text-slate-600 font-mono uppercase tracking-widest mt-0.5">{l.raw_material?.code}</span>
                                                        </div>
                                                    </td>
                                                    <td className="py-3 px-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest truncate max-w-[140px]">{l.supplier?.name || "N/A"}</td>
                                                    <td className="py-3 px-4 text-[10px] font-bold text-slate-500 text-center uppercase tracking-widest">
                                                        {l.received_date ? format(new Date(l.received_date), "dd MMM yyyy", { locale: pt }) : "-"}
                                                    </td>
                                                    <td className="py-3 px-4 text-center">
                                                        {l.expiry_date ? (
                                                            <Badge variant="outline" className={cn(
                                                                "text-[9px] font-black px-2 py-0.5 gap-1.5 border-none",
                                                                isExpired ? 'bg-rose-500/10 text-rose-500' : isExpiring ? 'bg-amber-500/10 text-amber-500' : 'bg-slate-500/5 text-slate-500'
                                                            )}>
                                                                <Calendar className="h-3 w-3" />
                                                                {format(new Date(l.expiry_date), "dd/MM/yyyy")}
                                                            </Badge>
                                                        ) : (
                                                            <span className="text-[9px] text-slate-800 font-black uppercase tracking-widest">—</span>
                                                        )}
                                                    </td>
                                                    <td className="py-3 px-4 text-right">
                                                        <div className="flex flex-col items-end">
                                                            <span className="text-xs font-black text-white italic tracking-tight">{l.quantity_remaining}</span>
                                                            <span className="text-[9px] text-slate-600 uppercase font-black tracking-tighter leading-none">{l.unit} / {l.quantity_received} orig.</span>
                                                        </div>
                                                    </td>
                                                    <td className="py-3 px-4 text-center">
                                                        <Badge className={cn("text-[8px] font-black uppercase tracking-widest px-2.5 py-0.5 border shadow-sm", statusColors[l.status])}>
                                                            {l.status}
                                                        </Badge>
                                                    </td>
                                                    <td className="py-3 px-6 text-right">
                                                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all transform group-hover:translate-x-0 translate-x-2">
                                                            <Button variant="ghost" size="icon" title="Rastreabilidade Forward" className="h-8 w-8 text-emerald-500/70 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-xl" asChild>
                                                                <Link href={`/traceability/forward?q=${encodeURIComponent(l.lot_code)}`}>
                                                                    <SearchCode className="h-4 w-4" />
                                                                </Link>
                                                            </Button>
                                                            {l.status === 'approved' && l.quantity_remaining > 0 && (
                                                                <ConsumeLotDialog
                                                                    lotId={l.id}
                                                                    lotCode={l.lot_code}
                                                                    maxQuantity={l.quantity_remaining}
                                                                    unit={l.unit}
                                                                />
                                                            )}
                                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-white hover:bg-slate-800 rounded-xl" asChild>
                                                                <Link href={`/materials/raw/lots/${l.id}`}>
                                                                    <ExternalLink className="h-4 w-4" />
                                                                </Link>
                                                            </Button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                        {lots.length === 0 && (
                                            <tr>
                                                <td colSpan={8} className="p-20 text-center">
                                                    <div className="flex flex-col items-center gap-4 opacity-20">
                                                        <Layers className="h-12 w-12 text-slate-600" />
                                                        <p className="text-[10px] font-black uppercase tracking-[0.3em] italic">Nenhum lote registrado</p>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                            <div className="p-4 bg-slate-950/20 border-t border-slate-800">
                                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-600 text-center italic">
                                    SmartLab Logistics Engine • Inventory Control System
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Pagination for Lots */}
                    <div className="flex items-center justify-between px-2 pt-2">
                        <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em] italic flex items-center gap-2">
                            <Activity className="h-3 w-3" />
                            Showing {lots.length} of {totalLots} entities
                        </p>
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2 bg-slate-900/50 p-1 rounded-xl border border-slate-800 shadow-inner">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0 text-slate-500 hover:text-white hover:bg-slate-800 disabled:opacity-20 rounded-lg"
                                    disabled={pageLots <= 1}
                                    asChild
                                >
                                    <Link href={`/materials/raw?tab=lots&page_lots=${pageLots - 1}&page_catalog=${pageCatalog}`}>
                                        <ChevronLeft className="h-4 w-4" />
                                    </Link>
                                </Button>
                                <span className="text-[10px] font-black text-white px-2 py-1 uppercase tracking-widest min-w-[60px] text-center italic border-x border-slate-800">
                                    PG. {pageLots} <span className="text-slate-600">/</span> {totalPagesLots || 1}
                                </span>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0 text-slate-500 hover:text-white hover:bg-slate-800 disabled:opacity-20 rounded-lg"
                                    disabled={pageLots >= totalPagesLots}
                                    asChild
                                >
                                    <Link href={`/materials/raw?tab=lots&page_lots=${pageLots + 1}&page_catalog=${pageCatalog}`}>
                                        <ChevronRight className="h-4 w-4" />
                                    </Link>
                                </Button>
                            </div>
                        </div>
                    </div>
                </TabsContent>

                {/* Catalog Tab */}
                <TabsContent value="catalog" className="space-y-4 outline-none">
                    <Card className="bg-card border-slate-800 shadow-xl overflow-hidden rounded-2xl">
                        <CardContent className="p-0">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 divide-x divide-y divide-slate-800/40">
                                {materials.map((m: any) => (
                                    <Link key={m.id} href={`/materials/raw/${m.id}`} className="p-6 hover:bg-slate-900/40 transition-all group relative overflow-hidden">
                                        <div className="absolute top-0 right-0 p-5 opacity-0 group-hover:opacity-100 transition-all transform group-hover:translate-x-0 translate-x-2">
                                            <ArrowUpRight className="h-5 w-5 text-blue-500 shadow-xl" />
                                        </div>
                                        <div className="flex items-start gap-5">
                                            <div className="h-12 w-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform shadow-inner">
                                                <Package className="h-6 w-6" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h4 className="font-black text-white mb-1 truncate group-hover:text-blue-400 transition-colors uppercase tracking-tight italic text-sm">{m.name}</h4>
                                                <div className="flex items-center gap-3">
                                                    <Badge variant="outline" className="text-[9px] font-mono border-slate-800 bg-slate-950/50 text-slate-400 px-1.5 py-0">
                                                        {m.code}
                                                    </Badge>
                                                    <span className="h-1 w-1 rounded-full bg-slate-800" />
                                                    <span className="text-[9px] text-slate-500 uppercase font-black tracking-widest">{m.category || "General"}</span>
                                                </div>
                                                <div className="mt-5 flex items-center justify-between">
                                                    <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-600 italic">Unidade: <span className="text-slate-400">{m.unit}</span></span>
                                                    {m.allergens && (
                                                        <Badge className="bg-rose-500/10 text-rose-500 border-none text-[8px] font-black uppercase tracking-widest flex items-center gap-1.5 px-2 py-0.5">
                                                            <AlertTriangle className="h-3 w-3" />
                                                            Alérgenos
                                                        </Badge>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                                {materials.length === 0 && (
                                    <div className="col-span-full p-24 text-center">
                                        <div className="flex flex-col items-center gap-4 opacity-20">
                                            <Package className="h-12 w-12 text-slate-600" />
                                            <p className="text-[10px] font-black uppercase tracking-[0.3em] italic">Catálogo de matérias-primas vazio</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div className="p-4 bg-slate-950/20 border-t border-slate-800 text-center">
                                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-600 italic">
                                    Technical Catalog Integration • SmartLab Warehouse
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Pagination for Catalog */}
                    <div className="flex items-center justify-between px-2 pt-2">
                        <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em] italic flex items-center gap-2">
                            <Sparkles className="h-3 w-3 text-blue-500" />
                            Showing {materials.length} of {totalMaterials} technical entries
                        </p>
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2 bg-slate-900/50 p-1 rounded-xl border border-slate-800 shadow-inner">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0 text-slate-500 hover:text-white hover:bg-slate-800 disabled:opacity-20 rounded-lg"
                                    disabled={pageCatalog <= 1}
                                    asChild
                                >
                                    <Link href={`/materials/raw?tab=catalog&page_catalog=${pageCatalog - 1}&page_lots=${pageLots}`}>
                                        <ChevronLeft className="h-4 w-4" />
                                    </Link>
                                </Button>
                                <span className="text-[10px] font-black text-white px-2 py-1 uppercase tracking-widest min-w-[60px] text-center italic border-x border-slate-800">
                                    PG. {pageCatalog} <span className="text-slate-600">/</span> {totalPagesCatalog || 1}
                                </span>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0 text-slate-500 hover:text-white hover:bg-slate-800 disabled:opacity-20 rounded-lg"
                                    disabled={pageCatalog >= totalPagesCatalog}
                                    asChild
                                >
                                    <Link href={`/materials/raw?tab=catalog&page_catalog=${pageCatalog + 1}&page_lots=${pageLots}`}>
                                        <ChevronRight className="h-4 w-4" />
                                    </Link>
                                </Button>
                            </div>
                        </div>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}

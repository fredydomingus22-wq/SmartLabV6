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
    SearchCode
} from "lucide-react";
import Link from "next/link";
import { format, differenceInDays } from "date-fns";
import { pt } from "date-fns/locale";
import { CreateRawMaterialDialog } from "./_components/create-material-dialog";
import { ReceiveLotDialog } from "./_components/receive-lot-dialog";
import { ConsumeLotDialog } from "./_components/consume-lot-dialog";

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

    const totalPagesCatalog = Math.ceil(totalMaterials / limit);
    const totalPagesLots = Math.ceil(totalLots / limit);

    return (
        <div className="container py-8 space-y-8 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Link href="/materials">
                        <Button variant="ghost" size="icon" className="text-slate-400 rounded-full hover:bg-slate-900">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                    </Link>
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline" className="text-[10px] uppercase tracking-widest bg-blue-500/5 text-blue-400 border-blue-500/20">
                                Inventory Control
                            </Badge>
                        </div>
                        <h1 className="text-3xl font-black tracking-tight text-white flex items-center gap-3">
                            <Package className="h-8 w-8 text-blue-500" />
                            Matérias-Primas
                        </h1>
                        <p className="text-slate-400 text-sm font-medium">Controlo técnico de insumos e rastreabilidade de lotes.</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <CreateRawMaterialDialog plantId={user.plant_id!} />
                    <ReceiveLotDialog
                        plantId={user.plant_id!}
                        materials={materials.map(m => ({ id: m.id, name: m.name, code: m.code, unit: m.unit || 'kg' }))}
                        suppliers={suppliers.map(s => ({ id: s.id, name: s.name }))}
                    />
                </div>
            </div>

            {/* Futuristic Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: "Catálogo MP", value: totalMaterials, sub: "Itens Registados", icon: Package, color: "text-blue-400", bg: "bg-blue-500/10" },
                    { label: "Lotes Aprovados", value: stats.approved, sub: "Prontos para Produção", icon: Layers, color: "text-emerald-400", bg: "bg-emerald-500/10" },
                    { label: "Em Quarentena", value: stats.inQuarantine, sub: "Aguardando CQ", icon: AlertTriangle, color: "text-amber-400", bg: "bg-amber-500/10" },
                    { label: "Críticos/Validade", value: stats.expiringSoon, sub: "Expira em < 30 dias", icon: Calendar, color: "text-rose-400", bg: "bg-rose-500/10" }
                ].map((s, i) => (
                    <Card key={i} className="bg-slate-900/40 border-slate-800 shadow-xl overflow-hidden group">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between mb-2">
                                <div className={`p-2 rounded-xl ${s.bg} ${s.color}`}>
                                    <s.icon className="h-5 w-5" />
                                </div>
                                <ArrowUpRight className="h-4 w-4 text-slate-700 group-hover:text-slate-400 transition-colors" />
                            </div>
                            <h3 className="text-2xl font-black text-white">{s.value}</h3>
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">{s.label}</p>
                            <p className="text-[10px] text-slate-400 mt-1">{s.sub}</p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Tabs */}
            <Tabs defaultValue={activeTab} className="space-y-6">
                <div className="flex items-center justify-between">
                    <TabsList className="bg-slate-900/50 border border-slate-800 p-1">
                        <TabsTrigger value="lots" className="data-[state=active]:bg-blue-500/20 data-[state=active]:text-blue-400 rounded-md py-2 px-4 shadow-none">
                            <Link href={`/materials/raw?tab=lots&page_lots=${pageLots}&page_catalog=${pageCatalog}`} className="flex items-center h-full w-full">
                                <Layers className="h-4 w-4 mr-2" />
                                Lista de Lotes
                            </Link>
                        </TabsTrigger>
                        <TabsTrigger value="catalog" className="data-[state=active]:bg-blue-500/20 data-[state=active]:text-blue-400 rounded-md py-2 px-4 shadow-none">
                            <Link href={`/materials/raw?tab=catalog&page_lots=${pageLots}&page_catalog=${pageCatalog}`} className="flex items-center h-full w-full">
                                <Package className="h-4 w-4 mr-2" />
                                Catálogo Técnico
                            </Link>
                        </TabsTrigger>
                    </TabsList>

                    <div className="flex items-center gap-2">
                        <div className="relative group hidden md:block">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
                            <input
                                placeholder="Filtrar..."
                                className="bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-4 py-2 text-sm text-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500/30 w-64"
                            />
                        </div>
                    </div>
                </div>

                {/* Lots Tab */}
                <TabsContent value="lots" className="space-y-4 outline-none">
                    <Card className="bg-slate-950/40 border-slate-800 shadow-xl overflow-hidden">
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="border-b border-slate-800 bg-slate-900/20">
                                            <th className="p-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Lote</th>
                                            <th className="p-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Matéria-Prima</th>
                                            <th className="p-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Fornecedor</th>
                                            <th className="p-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center">Data Receção</th>
                                            <th className="p-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center">Validade</th>
                                            <th className="p-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-right">Stock</th>
                                            <th className="p-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center">Status</th>
                                            <th className="p-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-right whitespace-nowrap">Ações</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-800/50">
                                        {lots.map((l: any) => {
                                            const isExpiring = l.expiry_date && differenceInDays(new Date(l.expiry_date), today) <= 30;
                                            const isExpired = l.expiry_date && new Date(l.expiry_date) < today;

                                            return (
                                                <tr key={l.id} className="hover:bg-slate-900/20 transition-colors group">
                                                    <td className="p-4">
                                                        <Link href={`/materials/raw/lots/${l.id}`} className="font-mono text-xs font-bold text-blue-400 hover:underline">
                                                            {l.lot_code}
                                                        </Link>
                                                    </td>
                                                    <td className="p-4">
                                                        <div className="flex flex-col">
                                                            <span className="text-sm font-bold text-slate-200">{l.raw_material?.name}</span>
                                                            <span className="text-[10px] text-slate-600 font-mono italic">{l.raw_material?.code}</span>
                                                        </div>
                                                    </td>
                                                    <td className="p-4 text-xs text-slate-400">{l.supplier?.name || "N/A"}</td>
                                                    <td className="p-4 text-xs text-slate-400 text-center uppercase">
                                                        {l.received_date ? format(new Date(l.received_date), "dd MMM yyyy", { locale: pt }) : "-"}
                                                    </td>
                                                    <td className="p-4 text-center">
                                                        {l.expiry_date ? (
                                                            <div className={`text-[10px] font-bold flex items-center justify-center gap-1 ${isExpired ? 'text-rose-500' : isExpiring ? 'text-amber-500' : 'text-slate-500'}`}>
                                                                <Calendar className="h-3 w-3" />
                                                                {format(new Date(l.expiry_date), "dd/MM/yyyy")}
                                                            </div>
                                                        ) : (
                                                            <span className="text-[10px] text-slate-700 font-bold uppercase">N/A</span>
                                                        )}
                                                    </td>
                                                    <td className="p-4 text-right">
                                                        <div className="flex flex-col items-end">
                                                            <span className="text-sm font-black text-white">{l.quantity_remaining}</span>
                                                            <span className="text-[10px] text-slate-600 uppercase font-black tracking-tighter">{l.unit} / {l.quantity_received} orig.</span>
                                                        </div>
                                                    </td>
                                                    <td className="p-4 text-center">
                                                        <Badge className={`text-[9px] uppercase tracking-tighter ${statusColors[l.status]}`}>
                                                            {l.status}
                                                        </Badge>
                                                    </td>
                                                    <td className="p-4 text-right">
                                                        <div className="flex items-center justify-end gap-2">
                                                            <Button variant="ghost" size="icon" title="Rastreabilidade Forward" className="h-8 w-8 text-emerald-600 hover:text-emerald-400 hover:bg-emerald-500/10" asChild>
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
                                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-600 hover:text-white" asChild>
                                                                <Link href={`/materials/raw/lots/${l.id}`}>
                                                                    <ArrowUpRight className="h-4 w-4" />
                                                                </Link>
                                                            </Button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                        {lots.length === 0 && (
                                            <tr>
                                                <td colSpan={8} className="p-12 text-center">
                                                    <div className="flex flex-col items-center gap-2 opacity-30">
                                                        <Layers className="h-10 w-10 text-slate-600" />
                                                        <p className="text-sm font-medium italic">Nenhum lote de matéria-prima encontrado no sistema.</p>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Pagination for Lots */}
                    <div className="flex items-center justify-between px-2 py-2">
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest italic">
                            A mostrar {lots.length} de {totalLots} lotes
                        </p>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                className="h-8 w-8 p-0 border-slate-800 bg-slate-900/50 text-slate-400 disabled:opacity-20"
                                disabled={pageLots <= 1}
                                asChild
                            >
                                <Link href={`/materials/raw?tab=lots&page_lots=${pageLots - 1}&page_catalog=${pageCatalog}`}>
                                    <ChevronLeft className="h-4 w-4" />
                                </Link>
                            </Button>
                            <span className="text-[10px] font-black text-white bg-blue-500/20 px-2 py-1 rounded border border-blue-500/30">
                                {pageLots} / {totalPagesLots || 1}
                            </span>
                            <Button
                                variant="outline"
                                size="sm"
                                className="h-8 w-8 p-0 border-slate-800 bg-slate-900/50 text-slate-400 disabled:opacity-20"
                                disabled={pageLots >= totalPagesLots}
                                asChild
                            >
                                <Link href={`/materials/raw?tab=lots&page_lots=${pageLots + 1}&page_catalog=${pageCatalog}`}>
                                    <ChevronRight className="h-4 w-4" />
                                </Link>
                            </Button>
                        </div>
                    </div>
                </TabsContent>

                {/* Catalog Tab */}
                <TabsContent value="catalog" className="space-y-4 outline-none">
                    <Card className="bg-slate-950/40 border-slate-800 shadow-xl overflow-hidden">
                        <CardContent className="p-0">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 divide-x divide-y divide-slate-800/40">
                                {materials.map((m: any) => (
                                    <Link key={m.id} href={`/materials/raw/${m.id}`} className="p-6 hover:bg-slate-900/40 transition-all group relative overflow-hidden">
                                        <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <ArrowUpRight className="h-5 w-5 text-blue-500" />
                                        </div>
                                        <div className="flex items-start gap-4">
                                            <div className="p-3 rounded-2xl bg-blue-500/10 text-blue-400 group-hover:scale-110 transition-transform">
                                                <Package className="h-6 w-6" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h4 className="font-bold text-white mb-1 truncate group-hover:text-blue-400 transition-colors uppercase tracking-tight">{m.name}</h4>
                                                <div className="flex items-center gap-3">
                                                    <Badge variant="outline" className="text-[9px] font-mono border-slate-700 bg-slate-900/50">
                                                        {m.code}
                                                    </Badge>
                                                    <span className="text-[10px] text-slate-500 uppercase font-black">{m.category || "Sem Categ."}</span>
                                                </div>
                                                <div className="mt-4 flex items-center justify-between text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                                                    <span>Unidade: {m.unit}</span>
                                                    {m.allergens && (
                                                        <div className="flex items-center gap-1 text-rose-500/70">
                                                            <AlertTriangle className="h-3 w-3" />
                                                            Alérgenos
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                                {materials.length === 0 && (
                                    <div className="col-span-full p-20 text-center">
                                        <p className="text-slate-600 italic">Catálogo de matérias-primas vazio.</p>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Pagination for Catalog */}
                    <div className="flex items-center justify-between px-2 py-2">
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest italic">
                            A mostrar {materials.length} de {totalMaterials} materiais
                        </p>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                className="h-8 w-8 p-0 border-slate-800 bg-slate-900/50 text-slate-400 disabled:opacity-20"
                                disabled={pageCatalog <= 1}
                                asChild
                            >
                                <Link href={`/materials/raw?tab=catalog&page_catalog=${pageCatalog - 1}&page_lots=${pageLots}`}>
                                    <ChevronLeft className="h-4 w-4" />
                                </Link>
                            </Button>
                            <span className="text-[10px] font-black text-white bg-blue-500/20 px-2 py-1 rounded border border-blue-500/30">
                                {pageCatalog} / {totalPagesCatalog || 1}
                            </span>
                            <Button
                                variant="outline"
                                size="sm"
                                className="h-8 w-8 p-0 border-slate-800 bg-slate-900/50 text-slate-400 disabled:opacity-20"
                                disabled={pageCatalog >= totalPagesCatalog}
                                asChild
                            >
                                <Link href={`/materials/raw?tab=catalog&page_catalog=${pageCatalog + 1}&page_lots=${pageLots}`}>
                                    <ChevronRight className="h-4 w-4" />
                                </Link>
                            </Button>
                        </div>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}

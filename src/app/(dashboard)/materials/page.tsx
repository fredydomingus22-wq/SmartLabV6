import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { differenceInDays, format } from "date-fns";
import { pt } from "date-fns/locale";
import { getCurrentUser } from "@/lib/auth";
import { PageHeader } from "@/components/layout/page-header";
import { cn } from "@/lib/utils";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
    CardFooter
} from "@/components/ui/card";
import { Search, Filter, Sparkles, CheckCircle, Warehouse, Package, Beaker, Truck, AlertTriangle, ArrowRight, TrendingUp, Calendar, Box, ShieldCheck, Activity } from "lucide-react";
import { KPISparkCard } from "@/components/ui/kpi-spark-card";

export const dynamic = "force-dynamic";

// Local helper for trend simulation (since we don't have real trend data yet for all)
const mockTrend = { value: 2.5, isPositive: true };
const mockSeries = Array.from({ length: 7 }, (_, i) => ({ date: `D${i}`, value: Math.floor(Math.random() * 100) }));

export default async function MaterialsDashboardPage() {
    const supabase = await createClient();
    // Use getCurrentUser from lib/auth
    const user = await getCurrentUser();
    const today = new Date();

    // === DATA FETCHING ===
    // Matérias-Primas
    const { count: rawMaterialsCount } = await supabase.from("raw_materials").select("*", { count: "exact", head: true });
    const { data: rawMaterialLots } = await supabase.from("raw_material_lots").select("id, expiry_date, status").in("status", ["approved", "in_use", "quarantine"]);
    const expiringRawLots = rawMaterialLots?.filter(l => l.expiry_date && differenceInDays(new Date(l.expiry_date), today) <= 30 && differenceInDays(new Date(l.expiry_date), today) >= 0).length || 0;

    // Embalagem
    const { count: packagingCount } = await supabase.from("packaging_materials").select("*", { count: "exact", head: true });
    const { data: packagingLots } = await supabase.from("packaging_lots").select("id").in("status", ["active"]);
    const activePackagingLots = packagingLots?.length || 0;

    // Reagentes
    const { data: reagents } = await supabase.from("reagents").select("id, name, min_stock_level");
    const { data: movements } = await supabase.from("reagent_movements").select("reagent_id, quantity, movement_type");

    // Simple stock calc
    const stockMap = new Map<string, number>();
    movements?.forEach(m => {
        const qty = Number(m.quantity);
        stockMap.set(m.reagent_id, (stockMap.get(m.reagent_id) || 0) + (m.movement_type === 'out' ? -qty : qty));
    });
    const lowStockReagents = reagents?.filter(r => (stockMap.get(r.id) || 0) < (r.min_stock_level || 0)).length || 0;

    // Fornecedores
    const { count: suppliersCount } = await supabase.from("suppliers").select("*", { count: "exact", head: true });

    // Fetch last 7 days data for trends
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(today.getDate() - 7);
    const dateStr = sevenDaysAgo.toISOString();

    const { data: rawLotTrend } = await supabase.from("raw_material_lots").select("created_at").gte("created_at", dateStr);
    const { data: packLotTrend } = await supabase.from("packaging_lots").select("created_at").gte("created_at", dateStr);
    const { data: reagentTrend } = await supabase.from("reagent_movements").select("created_at").gte("created_at", dateStr).eq('movement_type', 'in');

    const getLast7DaysData = (items: any[] | null) => {
        const days = Array.from({ length: 7 }, (_, i) => {
            const d = new Date();
            d.setDate(today.getDate() - (6 - i));
            return { date: format(d, 'dd/MM', { locale: pt }), value: 0, rawDate: d.toDateString() };
        });

        items?.forEach(item => {
            if (!item.created_at) return;
            const itemDate = new Date(item.created_at).toDateString();
            const day = days.find(d => d.rawDate === itemDate);
            if (day) day.value++;
        });

        return days.map(({ date, value }) => ({ date, value }));
    };

    const rawTrendData = getLast7DaysData(rawLotTrend);
    const packTrendData = getLast7DaysData(packLotTrend);
    const reagentTrendData = getLast7DaysData(reagentTrend);

    return (
        <div className="space-y-10 pb-20">
            <PageHeader
                variant="blue"
                icon={<Warehouse className="h-4 w-4" />}
                overline="Inventory Intelligence • MES Logistics"
                title="Materiais e Inventário"
                description="Gestão centralizada de insumos, stock e qualificação de fornecedores com rastreabilidade industrial."
                actions={
                    <div className="flex items-center gap-3">
                        <div className="relative hidden md:block">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                            <input
                                type="text"
                                placeholder="PESQUISAR LOTES..."
                                className="bg-slate-900/50 border border-slate-800 rounded-2xl py-2 pl-12 pr-6 text-[10px] font-black uppercase tracking-widest text-slate-200 focus:outline-none focus:border-blue-500/30 transition-all w-72 shadow-xl"
                            />
                        </div>
                        <Button className="bg-slate-900/50 hover:bg-slate-900/80 text-white border border-slate-800 rounded-xl h-9 px-4 font-black text-[10px] uppercase tracking-widest transition-all shadow-lg">
                            <Filter className="h-4 w-4 mr-2" />
                            Filtros
                        </Button>
                    </div>
                }
            />

            {/* KPI Grid */}
            <div className="space-y-6">
                <div className="flex items-center gap-2 px-1">
                    <Sparkles className="h-4 w-4 text-cyan-400" />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                        Indicadores de Stock • Real-time
                    </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <KPISparkCard
                        variant="blue"
                        title="Matérias-Primas"
                        value={String(rawMaterialsCount || 0).padStart(3, '0')}
                        description="Variação semanal de entradas"
                        icon={<Warehouse className="h-4 w-4" />}
                        data={rawTrendData}
                    />
                    <KPISparkCard
                        variant="emerald"
                        title="Embalagem"
                        value={String(packagingCount || 0).padStart(3, '0')}
                        description="Lotes ativos para produção"
                        icon={<Package className="h-4 w-4" />}
                        data={packTrendData}
                    />
                    <KPISparkCard
                        variant="purple"
                        title="Reagentes"
                        value={String(reagents?.length || 0).padStart(3, '0')}
                        description="Stock crítico detectado"
                        icon={<Beaker className="h-4 w-4" />}
                        data={reagentTrendData}
                    />
                    <KPISparkCard
                        variant="indigo"
                        title="Fornecedores"
                        value={String(suppliersCount || 0).padStart(3, '0')}
                        description="Qualificação operacional"
                        icon={<Truck className="h-4 w-4" />}
                        data={mockSeries.map(s => ({ value: s.value }))}
                    />
                </div>
            </div>

            {/* Main Content Area */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Actions Section */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="flex items-center gap-2 px-1">
                        <Activity className="h-4 w-4 text-cyan-400" />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                            Ações Rápidas • Operational
                        </span>
                    </div>
                    <div className="space-y-4">
                        {[
                            { title: "Receber Matéria-Prima", desc: "Registo de entrada e quarentena de novos lotes", href: "/materials/raw", icon: Package, color: "text-cyan-400" },
                            { title: "Registar Embalagem", desc: "Controlo e verificação de material de embalagem", href: "/materials/packaging", icon: Box, color: "text-emerald-400" },
                            { title: "Gestão de Stock", desc: "Consulta e ajuste de reagentes e consumíveis", href: "/materials/reagents", icon: Beaker, color: "text-purple-400" }
                        ].map((action, i) => (
                            <Link key={i} href={action.href}>
                                <Card className="bg-card border-slate-800 hover:border-slate-700 transition-all group p-4 mb-4 cursor-pointer shadow-lg overflow-hidden relative">
                                    <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-transparent via-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                    <div className="flex items-center gap-4">
                                        <div className={cn("p-2 rounded-xl bg-slate-950 border border-slate-800 shadow-inner group-hover:scale-110 transition-transform", action.color)}>
                                            <action.icon className="h-6 w-6" />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-white group-hover:text-blue-400 transition-colors">{action.title}</h4>
                                            <p className="text-[11px] text-slate-500 line-clamp-1">{action.desc}</p>
                                        </div>
                                    </div>
                                </Card>
                            </Link>
                        ))}
                    </div>
                </div>

                {/* Alerts Section */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex items-center gap-2 px-1">
                        <AlertTriangle className="h-4 w-4 text-amber-400" />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                            Painel de Monitorização • Alerts & Status
                        </span>
                    </div>

                    <Card className="bg-card border-slate-800 shadow-xl overflow-hidden relative">
                        <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent pointer-events-none" />
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                            <CardTitle className="text-lg font-bold">Desvios e Prazos</CardTitle>
                            <AlertTriangle className="h-5 w-5 text-amber-400" />
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {expiringRawLots > 0 && (
                                <Link href="/materials/raw/lots?filter=expiring">
                                    <div className="flex items-center justify-between p-3 rounded-lg border border-amber-500/10 bg-amber-500/5 hover:bg-amber-500/10 transition-colors group">
                                        <div className="flex items-center gap-3">
                                            <Calendar className="h-4 w-4 text-amber-400" />
                                            <div>
                                                <p className="text-sm font-bold text-white">Lotes a Expirar</p>
                                                <p className="text-[10px] text-slate-500 uppercase font-bold">{expiringRawLots} lotes expiram nos próximos 30 dias</p>
                                            </div>
                                        </div>
                                        <Badge variant="outline" className="text-amber-500 border-amber-500/20 bg-amber-500/10">WARNING</Badge>
                                    </div>
                                </Link>
                            )}
                            {lowStockReagents > 0 && (
                                <Link href="/materials/reagents?filter=low-stock">
                                    <div className="flex items-center justify-between p-3 rounded-lg border border-rose-500/10 bg-rose-500/5 hover:bg-rose-500/10 transition-colors group">
                                        <div className="flex items-center gap-3">
                                            <AlertTriangle className="h-4 w-4 text-rose-400" />
                                            <div>
                                                <p className="text-sm font-bold text-white">Stock Crítico</p>
                                                <p className="text-[10px] text-slate-500 uppercase font-bold">{lowStockReagents} reagentes abaixo do nível de segurança</p>
                                            </div>
                                        </div>
                                        <Badge variant="outline" className="text-rose-500 border-rose-500/20 bg-rose-500/10">CRITICAL</Badge>
                                    </div>
                                </Link>
                            )}
                            {expiringRawLots === 0 && lowStockReagents === 0 && (
                                <div className="py-20 flex flex-col items-center justify-center text-center">
                                    <ShieldCheck className="h-12 w-12 text-emerald-500/20 mb-4" />
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 italic">
                                        Sistema em Conformidade Total
                                    </p>
                                </div>
                            )}
                        </CardContent>
                        <CardFooter className="border-t border-slate-800/50 pt-4">
                            <Link href="/materials/alerts" className="text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-white transition-colors flex items-center gap-2">
                                Ver Todos os Alertas
                                <ArrowRight className="h-3 w-3" />
                            </Link>
                        </CardFooter>
                    </Card>

                    {/* Secondary Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                        <Card className="bg-slate-900/40 border-slate-800 p-4">
                            <div className="flex items-start justify-between">
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Active Logistics</p>
                                    <h4 className="text-2xl font-black text-white">4</h4>
                                    <p className="text-[10px] text-slate-600 font-bold italic">Open material requests</p>
                                </div>
                                <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400">
                                    <Warehouse className="h-6 w-6" />
                                </div>
                            </div>
                            <div className="mt-4">
                                <Badge className="text-[9px] font-black tracking-widest bg-slate-950 border-slate-800 text-slate-400">ON TRACK</Badge>
                            </div>
                        </Card>

                        <Card className="bg-slate-900/40 border-slate-800 p-4 border-l-4 border-l-emerald-500">
                            <div className="flex items-start justify-between">
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Supplier Quality</p>
                                    <h4 className="text-2xl font-black text-white">98.2%</h4>
                                    <p className="text-[10px] text-slate-600 font-bold italic">Average performance score</p>
                                </div>
                                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
                                    <Truck className="h-6 w-6" />
                                </div>
                            </div>
                            <div className="mt-4">
                                <Badge className="text-[9px] font-black tracking-widest bg-emerald-500/20 text-emerald-400 border-emerald-500/30">PREMIUM</Badge>
                            </div>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}

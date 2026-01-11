import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Warehouse, Package, Beaker, Truck, AlertTriangle,
    ArrowRight, TrendingUp, Calendar, Box, ShieldCheck,
    Search, Filter
} from "lucide-react";
import Link from "next/link";
import { differenceInDays, format } from "date-fns";
import { pt } from "date-fns/locale";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

import { PremiumAnalyticsCard } from "@/components/dashboard/premium-analytics-card";
import { PremiumActionCard } from "@/components/dashboard/premium-action-card";
import { Sparkles, CheckCircle } from "lucide-react";

// Local helper for trend simulation (since we don't have real trend data yet for all)
const mockTrend = { value: 2.5, isPositive: true };
const mockSeries = Array.from({ length: 7 }, (_, i) => ({ date: `D${i}`, value: Math.floor(Math.random() * 100) }));

export default async function MaterialsDashboardPage() {
    const supabase = await createClient();
    const user = await getCurrentUser();
    const today = new Date();
    const greeting = today.getHours() < 12 ? "Bom dia" : today.getHours() < 18 ? "Boa tarde" : "Boa noite";

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
    // Fetch last 7 days data for trends (lightweight)
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
        <div className="container max-w-[1600px] mx-auto py-8 space-y-10 pb-20">
            {/* Header Section - Industrial Premium */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-1">
                    <div className="flex items-center gap-2 text-cyan-400">
                        <Sparkles className="h-4 w-4" />
                        <span className="text-xs font-bold uppercase tracking-widest opacity-80">Inventory Intelligence</span>
                    </div>
                    <h1 className="text-4xl font-extrabold tracking-tight text-white">
                        Materiais e Inventário
                    </h1>
                    <p className="text-slate-400 text-lg">
                        Gestão centralizada de insumos, stock e qualificação de fornecedores.
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <div className="relative hidden md:block">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                        <input
                            type="text"
                            placeholder="Pesquisar lotes..."
                            className="bg-slate-950/50 border border-slate-800 rounded-xl py-2 pl-10 pr-4 text-sm text-slate-200 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 w-64 transition-all"
                        />
                    </div>
                    <Button className="bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl shadow-lg shadow-cyan-900/20 h-10 px-6 font-semibold tracking-wide">
                        <Filter className="h-4 w-4 mr-2" />
                        <span>Filtros</span>
                    </Button>
                </div>
            </div>

            {/* Main Stats Grid - Premium Analytics Card */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <PremiumAnalyticsCard
                    title="Matérias-Primas"
                    value={String(rawMaterialsCount || 0)}
                    description={`${rawMaterialLots?.length || 0} Lotes Ativos no sistema`}
                    trend={{ value: rawLotTrend?.length || 0, isPositive: true }}
                    data={rawTrendData}
                    dataKey="value"
                    color="#06b6d4" // cyan
                />
                <PremiumAnalyticsCard
                    title="Embalagem"
                    value={String(packagingCount || 0)}
                    description={`${activePackagingLots} Lotes Disponíveis para uso`}
                    trend={{ value: packLotTrend?.length || 0, isPositive: true }}
                    data={packTrendData}
                    dataKey="value"
                    color="#10b981" // emerald
                />
                <PremiumAnalyticsCard
                    title="Reagentes"
                    value={String(reagents?.length || 0)}
                    description={`${lowStockReagents} com stock abaixo do mínimo`}
                    trend={{ value: reagentTrend?.length || 0, isPositive: true }}
                    data={reagentTrendData}
                    dataKey="value"
                    color="#8b5cf6" // violet
                />
                <PremiumAnalyticsCard
                    title="Fornecedores"
                    value={String(suppliersCount || 0)}
                    description="Base de fornecedores qualificados"
                    trend={{ value: 0, isPositive: true }}
                    data={mockSeries}
                    dataKey="value"
                    color="#f59e0b" // amber
                />
            </div>

            {/* Quick Actions & Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Shortcuts */}
                {/* Shortcuts */}
                <div className="col-span-1">
                    <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-white">
                        <CheckCircle className="h-5 w-5 text-cyan-400" />
                        Acesso Rápido
                    </h2>
                    <div className="space-y-4">
                        <PremiumActionCard
                            title="Receber Matéria-Prima"
                            description="Registo de entrada de lotes"
                            href="/materials/raw"
                            icon={<Package className="h-5 w-5" />}
                            color="#06b6d4"
                        />
                        <PremiumActionCard
                            title="Registar Embalagem"
                            description="Controlo de material de embalagem"
                            href="/materials/packaging"
                            icon={<Box className="h-5 w-5" />}
                            color="#10b981"
                        />
                        <PremiumActionCard
                            title="Gestão de Stock"
                            description="Reagentes e consumíveis"
                            href="/materials/reagents"
                            icon={<Beaker className="h-5 w-5" />}
                            color="#8b5cf6"
                        />
                        <PremiumActionCard
                            title="Fornecedores"
                            description="Gestão da base de fornecedores"
                            href="/materials/suppliers"
                            icon={<Truck className="h-5 w-5" />}
                            color="#f59e0b"
                        />
                    </div>
                </div>

                {/* Alerts Panel */}
                <Card className="glass border-slate-800 col-span-1 lg:col-span-2">
                    <CardHeader>
                        <CardTitle className="text-lg text-white font-semibold flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5 text-amber-400" />
                            Painel de Alertas
                        </CardTitle>
                        <CardDescription>
                            Monitorização em tempo real de não-conformidades e prazos.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {expiringRawLots > 0 && (
                                <div className="flex items-center gap-4 p-4 rounded-xl bg-amber-950/20 border border-amber-900/30">
                                    <div className="h-10 w-10 rounded-full bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                                        <Calendar className="h-5 w-5 text-amber-400" />
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-semibold text-amber-100">Lotes a Expirar</h4>
                                        <p className="text-xs text-amber-400/80">{expiringRawLots} lotes de matéria-prima expiram nos próximos 30 dias.</p>
                                    </div>
                                    <Button size="sm" variant="ghost" className="ml-auto text-amber-400 hover:text-amber-300 hover:bg-amber-950/50">
                                        Ver <ArrowRight className="h-4 w-4 ml-1" />
                                    </Button>
                                </div>
                            )}

                            {lowStockReagents > 0 && (
                                <div className="flex items-center gap-4 p-4 rounded-xl bg-rose-950/20 border border-rose-900/30">
                                    <div className="h-10 w-10 rounded-full bg-rose-500/10 flex items-center justify-center flex-shrink-0">
                                        <Beaker className="h-5 w-5 text-rose-400" />
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-semibold text-rose-100">Stock Crítico de Reagentes</h4>
                                        <p className="text-xs text-rose-400/80">{lowStockReagents} reagentes abaixo do nível mínimo de segurança.</p>
                                    </div>
                                    <Button size="sm" variant="ghost" className="ml-auto text-rose-400 hover:text-rose-300 hover:bg-rose-950/50">
                                        Repor <ArrowRight className="h-4 w-4 ml-1" />
                                    </Button>
                                </div>
                            )}

                            {expiringRawLots === 0 && lowStockReagents === 0 && (
                                <div className="text-center py-8 text-slate-500">
                                    <ShieldCheck className="h-12 w-12 mx-auto mb-3 opacity-20" />
                                    <p>Tudo operacional. Sem alertas ativos.</p>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

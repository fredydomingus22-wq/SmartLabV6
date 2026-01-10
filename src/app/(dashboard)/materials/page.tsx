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

function StatCard({ title, value, subtitle, icon, color = "cyan", href }: any) {
    const colorClasses: Record<string, string> = {
        cyan: "text-cyan-400 bg-cyan-950/30 border-cyan-500/20",
        emerald: "text-emerald-400 bg-emerald-950/30 border-emerald-500/20",
        amber: "text-amber-400 bg-amber-950/30 border-amber-500/20",
        violet: "text-violet-400 bg-violet-950/30 border-violet-500/20",
    };

    const scheme = colorClasses[color] || colorClasses.cyan;

    return (
        <Link href={href || "#"}>
            <div className="glass hover:bg-slate-800/50 transition-all duration-300 p-6 rounded-2xl border border-slate-800 group relative overflow-hidden">
                <div className={`absolute top-0 right-0 p-3 rounded-bl-2xl border-b border-l ${scheme} transition-all`}>
                    {icon}
                </div>
                <div className="relative z-10">
                    <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">{title}</p>
                    <h3 className="text-3xl font-bold text-slate-100 group-hover:scale-105 transition-transform origin-left">
                        {value}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 font-mono">{subtitle}</p>
                </div>
            </div>
        </Link>
    );
}

function QuickActionCard({ title, icon, href, color }: any) {
    return (
        <Link href={href}>
            <div className="bg-slate-900/40 hover:bg-slate-800/60 border border-slate-800 hover:border-slate-700 p-4 rounded-xl flex items-center gap-4 transition-all group">
                <div className={`p-2 rounded-lg ${color === 'cyan' ? 'bg-cyan-500/10 text-cyan-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
                    {icon}
                </div>
                <div className="flex-1">
                    <h4 className="text-sm font-semibold text-slate-200 group-hover:text-white transition-colors">{title}</h4>
                </div>
                <ArrowRight className="h-4 w-4 text-slate-600 group-hover:text-cyan-400 transition-colors" />
            </div>
        </Link>
    );
}

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


    return (
        <div className="container max-w-7xl mx-auto py-8 space-y-8">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        Sistema Operacional
                    </div>
                    <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight">
                        {greeting}, {user?.full_name?.split(' ')[0] || 'Utilizador'}
                    </h1>
                    <p className="text-slate-400 mt-2 text-lg">
                        Visão Geral de Materiais & Inventário
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <div className="relative hidden md:block">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                        <input
                            type="text"
                            placeholder="Pesquisar lotes..."
                            className="bg-slate-900/50 border border-slate-800 rounded-xl py-2 pl-10 pr-4 text-sm text-slate-200 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 w-64"
                        />
                    </div>
                    <Button className="bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl shadow-lg shadow-cyan-900/20">
                        <Filter className="h-4 w-4 mr-2" />
                        <span>Filtros</span>
                    </Button>
                </div>
            </div>

            {/* Main Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    title="Matérias-Primas"
                    value={rawMaterialsCount || 0}
                    subtitle={`${rawMaterialLots?.length || 0} Lotes Ativos`}
                    icon={<Package className="h-5 w-5" />}
                    color="cyan"
                    href="/materials/raw"
                />
                <StatCard
                    title="Embalagem"
                    value={packagingCount || 0}
                    subtitle={`${activePackagingLots} Lotes Disponíveis`}
                    icon={<Box className="h-5 w-5" />}
                    color="emerald"
                    href="/materials/packaging"
                />
                <StatCard
                    title="Reagentes"
                    value={reagents?.length || 0}
                    subtitle={`${lowStockReagents} Stock Baixo`}
                    icon={<Beaker className="h-5 w-5" />}
                    color="violet"
                    href="/materials/reagents"
                />
                <StatCard
                    title="Fornecedores"
                    value={suppliersCount || 0}
                    subtitle="Base qualificada"
                    icon={<Truck className="h-5 w-5" />}
                    color="amber"
                    href="/materials/suppliers"
                />
            </div>

            {/* Quick Actions & Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Shortcuts */}
                <Card className="glass border-slate-800 col-span-1">
                    <CardHeader>
                        <CardTitle className="text-lg text-white font-semibold flex items-center gap-2">
                            <TrendingUp className="h-5 w-5 text-cyan-400" />
                            Acesso Rápido
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <QuickActionCard title="Receber Matéria-Prima" icon={<Package className="h-4 w-4" />} href="/materials/raw" color="cyan" />
                        <QuickActionCard title="Registar Embalagem" icon={<Box className="h-4 w-4" />} href="/materials/packaging" color="emerald" />
                        <QuickActionCard title="Gestão de Stock" icon={<Beaker className="h-4 w-4" />} href="/materials/reagents" color="violet" />
                    </CardContent>
                </Card>

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

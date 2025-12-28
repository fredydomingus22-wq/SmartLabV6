import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Warehouse, Package, Beaker, Truck, AlertTriangle,
    ArrowRight, TrendingUp, Calendar, Box, ShieldCheck
} from "lucide-react";
import Link from "next/link";
import { differenceInDays, format } from "date-fns";
import { pt } from "date-fns/locale";

export const dynamic = "force-dynamic";

interface KPICardProps {
    title: string;
    value: string | number;
    subtitle?: string;
    icon: React.ReactNode;
    trend?: "up" | "down" | "neutral";
    alert?: boolean;
    href?: string;
}

function KPICard({ title, value, subtitle, icon, alert, href }: KPICardProps) {
    const content = (
        <Card className={`glass border-slate-800/50 hover:border-slate-700/50 transition-all ${href ? 'cursor-pointer hover:scale-[1.02]' : ''} ${alert ? 'border-amber-500/30' : ''}`}>
            <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                    <div>
                        <p className="text-xs text-slate-500 uppercase tracking-wider font-medium">{title}</p>
                        <p className={`text-3xl font-bold mt-1 ${alert ? 'text-amber-400' : 'text-slate-100'}`}>{value}</p>
                        {subtitle && <p className="text-xs text-slate-500 mt-1">{subtitle}</p>}
                    </div>
                    <div className={`p-2 rounded-lg ${alert ? 'bg-amber-500/10 text-amber-400' : 'bg-slate-800 text-slate-400'}`}>
                        {icon}
                    </div>
                </div>
            </CardContent>
        </Card>
    );

    return href ? <Link href={href}>{content}</Link> : content;
}

interface ModuleCardProps {
    title: string;
    description: string;
    href: string;
    icon: React.ReactNode;
    color: string;
    stats: { label: string; value: string | number }[];
    alerts?: { message: string; type: "warning" | "error" }[];
}

function ModuleCard({ title, description, href, icon, color, stats, alerts }: ModuleCardProps) {
    return (
        <Card className="glass border-slate-800/50 overflow-hidden hover:border-slate-700/50 transition-all group">
            <div className={`h-1 w-full ${color}`} />
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                        {icon}
                        {title}
                    </CardTitle>
                    <Link href={href}>
                        <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">
                            <ArrowRight className="h-4 w-4" />
                        </Button>
                    </Link>
                </div>
                <CardDescription className="text-xs">{description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-3">
                    {stats.map((stat, i) => (
                        <div key={i} className="bg-slate-900/50 rounded-lg p-2 text-center">
                            <div className="text-lg font-bold text-slate-100">{stat.value}</div>
                            <div className="text-[10px] text-slate-500 uppercase tracking-wider">{stat.label}</div>
                        </div>
                    ))}
                </div>

                {/* Alerts */}
                {alerts && alerts.length > 0 && (
                    <div className="space-y-2">
                        {alerts.map((alert, i) => (
                            <div key={i} className={`p-2 rounded-lg text-xs flex items-center gap-2 ${alert.type === 'error' ? 'bg-rose-500/10 text-rose-400' : 'bg-amber-500/10 text-amber-400'
                                }`}>
                                <AlertTriangle className="h-3 w-3 flex-shrink-0" />
                                {alert.message}
                            </div>
                        ))}
                    </div>
                )}

                {/* Action */}
                <Link href={href}>
                    <Button variant="outline" size="sm" className="w-full glass border-slate-700 hover:bg-slate-800 text-xs">
                        Gerir {title}
                    </Button>
                </Link>
            </CardContent>
        </Card>
    );
}

export default async function MaterialsDashboardPage() {
    const supabase = await createClient();
    const today = new Date();

    // === MATÉRIAS-PRIMAS ===
    const { count: rawMaterialsCount } = await supabase.from("raw_materials").select("*", { count: "exact", head: true });
    const { data: rawMaterialLots } = await supabase
        .from("raw_material_lots")
        .select("id, expiry_date, status")
        .in("status", ["approved", "in_use", "quarantine"]);

    const expiringRawLots = rawMaterialLots?.filter(l => {
        if (!l.expiry_date) return false;
        const days = differenceInDays(new Date(l.expiry_date), today);
        return days <= 30 && days >= 0;
    }).length || 0;

    const expiredRawLots = rawMaterialLots?.filter(l => {
        if (!l.expiry_date) return false;
        return differenceInDays(new Date(l.expiry_date), today) < 0;
    }).length || 0;

    // === EMBALAGEM ===
    const { count: packagingCount } = await supabase.from("packaging_materials").select("*", { count: "exact", head: true });
    const { data: packagingLots } = await supabase
        .from("packaging_lots")
        .select("id, expiry_date, status")
        .in("status", ["approved", "in_use"]);

    const activePackagingLots = packagingLots?.length || 0;

    // === REAGENTES ===
    const { data: reagents } = await supabase.from("reagents").select("id, name, min_stock_level");
    const { data: movements } = await supabase
        .from("reagent_movements")
        .select("reagent_id, quantity, movement_type, expiry_date");

    // Calculate stock
    const stockMap = new Map<string, number>();
    movements?.forEach(m => {
        const qty = Number(m.quantity);
        const current = stockMap.get(m.reagent_id) || 0;
        stockMap.set(m.reagent_id, m.movement_type === 'out' ? current - qty : current + qty);
    });

    const lowStockReagents = reagents?.filter(r => {
        const stock = stockMap.get(r.id) || 0;
        return stock < (r.min_stock_level || 0);
    }).length || 0;

    const expiringReagents = movements?.filter(m => {
        if (!m.expiry_date || m.movement_type !== 'in') return false;
        const days = differenceInDays(new Date(m.expiry_date), today);
        return days <= 30 && days >= 0;
    }).length || 0;

    // === FORNECEDORES ===
    const { data: suppliers } = await supabase.from("suppliers").select("id, approval_status");
    const approvedSuppliers = suppliers?.filter(s => s.approval_status === 'approved').length || 0;
    const pendingSuppliers = suppliers?.filter(s => s.approval_status === 'pending').length || 0;

    // === TOTAL ALERTS ===
    const totalAlerts = expiredRawLots + lowStockReagents + pendingSuppliers;

    return (
        <div className="container py-8 space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-100 flex items-center gap-3">
                        <Warehouse className="h-8 w-8 text-purple-400" />
                        Gestão de Materiais
                    </h1>
                    <p className="text-slate-400 mt-1">
                        Vista centralizada de matérias-primas, embalagem, reagentes e fornecedores.
                    </p>
                </div>
                {totalAlerts > 0 && (
                    <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/20 text-sm px-3 py-1">
                        <AlertTriangle className="h-4 w-4 mr-2" />
                        {totalAlerts} alertas ativos
                    </Badge>
                )}
            </div>

            {/* Top KPIs */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <KPICard
                    title="Matérias-Primas"
                    value={rawMaterialsCount || 0}
                    subtitle={`${rawMaterialLots?.length || 0} lotes ativos`}
                    icon={<Package className="h-5 w-5" />}
                    href="/materials/raw"
                />
                <KPICard
                    title="Embalagem"
                    value={packagingCount || 0}
                    subtitle={`${activePackagingLots} lotes`}
                    icon={<Box className="h-5 w-5" />}
                    href="/materials/packaging"
                />
                <KPICard
                    title="Reagentes"
                    value={reagents?.length || 0}
                    subtitle={lowStockReagents > 0 ? `${lowStockReagents} stock baixo` : "Stock OK"}
                    icon={<Beaker className="h-5 w-5" />}
                    alert={lowStockReagents > 0}
                    href="/materials/reagents"
                />
                <KPICard
                    title="Fornecedores"
                    value={suppliers?.length || 0}
                    subtitle={`${approvedSuppliers} aprovados`}
                    icon={<Truck className="h-5 w-5" />}
                    alert={pendingSuppliers > 0}
                    href="/materials/suppliers"
                />
            </div>

            {/* Module Cards */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <ModuleCard
                    title="Matérias-Primas"
                    description="Catálogo e lotes de MP"
                    href="/materials/raw"
                    icon={<Package className="h-5 w-5 text-blue-400" />}
                    color="bg-gradient-to-r from-blue-500 to-blue-600"
                    stats={[
                        { label: "No Catálogo", value: rawMaterialsCount || 0 },
                        { label: "Lotes Ativos", value: rawMaterialLots?.length || 0 },
                    ]}
                    alerts={[
                        ...(expiringRawLots > 0 ? [{ message: `${expiringRawLots} lotes a expirar (<30d)`, type: "warning" as const }] : []),
                        ...(expiredRawLots > 0 ? [{ message: `${expiredRawLots} lotes expirados`, type: "error" as const }] : []),
                    ]}
                />
                <ModuleCard
                    title="Embalagem"
                    description="Materiais de embalagem"
                    href="/materials/packaging"
                    icon={<Box className="h-5 w-5 text-emerald-400" />}
                    color="bg-gradient-to-r from-emerald-500 to-emerald-600"
                    stats={[
                        { label: "Tipos", value: packagingCount || 0 },
                        { label: "Lotes Ativos", value: activePackagingLots },
                    ]}
                    alerts={[]}
                />
                <ModuleCard
                    title="Reagentes"
                    description="Stock químico do lab"
                    href="/materials/reagents"
                    icon={<Beaker className="h-5 w-5 text-purple-400" />}
                    color="bg-gradient-to-r from-purple-500 to-purple-600"
                    stats={[
                        { label: "Reagentes", value: reagents?.length || 0 },
                        { label: "Stock Baixo", value: lowStockReagents },
                    ]}
                    alerts={[
                        ...(lowStockReagents > 0 ? [{ message: `${lowStockReagents} abaixo do mínimo`, type: "warning" as const }] : []),
                        ...(expiringReagents > 0 ? [{ message: `${expiringReagents} a expirar`, type: "warning" as const }] : []),
                    ]}
                />
                <ModuleCard
                    title="Fornecedores"
                    description="Qualificação e avaliação"
                    href="/materials/suppliers"
                    icon={<Truck className="h-5 w-5 text-amber-400" />}
                    color="bg-gradient-to-r from-amber-500 to-amber-600"
                    stats={[
                        { label: "Total", value: suppliers?.length || 0 },
                        { label: "Aprovados", value: approvedSuppliers },
                    ]}
                    alerts={[
                        ...(pendingSuppliers > 0 ? [{ message: `${pendingSuppliers} aguardam aprovação`, type: "warning" as const }] : []),
                    ]}
                />
            </div>

            {/* Quality Compliance Section */}
            <Card className="glass border-slate-800/50">
                <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                        <ShieldCheck className="h-5 w-5 text-emerald-400" />
                        Conformidade de Qualidade
                    </CardTitle>
                    <CardDescription>Indicadores críticos para controlo de qualidade</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center p-4 bg-slate-900/50 rounded-xl">
                            <div className={`text-2xl font-bold ${expiredRawLots === 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                {expiredRawLots === 0 ? '✓' : expiredRawLots}
                            </div>
                            <div className="text-xs text-slate-500 mt-1">Lotes MP Expirados</div>
                        </div>
                        <div className="text-center p-4 bg-slate-900/50 rounded-xl">
                            <div className={`text-2xl font-bold ${lowStockReagents === 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
                                {lowStockReagents === 0 ? '✓' : lowStockReagents}
                            </div>
                            <div className="text-xs text-slate-500 mt-1">Reagentes Stock Baixo</div>
                        </div>
                        <div className="text-center p-4 bg-slate-900/50 rounded-xl">
                            <div className={`text-2xl font-bold ${pendingSuppliers === 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
                                {pendingSuppliers === 0 ? '✓' : pendingSuppliers}
                            </div>
                            <div className="text-xs text-slate-500 mt-1">Fornec. Pendentes</div>
                        </div>
                        <div className="text-center p-4 bg-slate-900/50 rounded-xl">
                            <div className="text-2xl font-bold text-blue-400">
                                {format(today, "dd MMM", { locale: pt })}
                            </div>
                            <div className="text-xs text-slate-500 mt-1">Última Atualização</div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

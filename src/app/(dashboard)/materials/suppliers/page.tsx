import { createClient } from "@/lib/supabase/server";
import { getSuppliers } from "@/lib/queries/raw-materials";
import { SuppliersPageClient } from "./suppliers-page-client";
import { SupplierDialog } from "./supplier-dialog";
import { PremiumAnalyticsCard } from "@/components/dashboard/premium-analytics-card";
import { Sparkles, Truck } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

// Local helper for trend simulation
const mockTrend = { value: 0, isPositive: true };
const mockSeries = Array.from({ length: 7 }, (_, i) => ({ date: `D${i}`, value: Math.floor(Math.random() * 10) }));

export default async function SuppliersPage() {
    const supabase = await createClient();

    // Fetch suppliers
    const suppliers = await getSuppliers();

    // Fetch plant ID
    const { data: plants } = await supabase.from("plants").select("id").limit(1);
    const plantId = plants?.[0]?.id || "";

    const activeSuppliers = suppliers?.filter(s => s.status === 'active').length || 0;
    const pendingSuppliers = suppliers?.filter(s => s.status === 'pending').length || 0;

    return (
        <div className="container max-w-[1600px] mx-auto py-8 space-y-10 pb-20">
            {/* Header Section - Industrial Premium */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-1">
                    <div className="flex items-center gap-2 text-amber-400">
                        <Sparkles className="h-4 w-4" />
                        <span className="text-xs font-bold uppercase tracking-widest opacity-80">Supply Chain</span>
                    </div>
                    <h1 className="text-4xl font-extrabold tracking-tight text-white flex items-center gap-3">
                        Gestão de Fornecedores
                    </h1>
                    <p className="text-slate-400 text-lg">
                        Qualificação, avaliação e controlo de performance de parceiros.
                    </p>
                </div>
                <SupplierDialog plantId={plantId} />
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <PremiumAnalyticsCard
                    title="Total Fornecedores"
                    value={String(suppliers?.length || 0)}
                    description="Registados na base de dados"
                    trend={mockTrend}
                    data={mockSeries}
                    dataKey="value"
                    color="#f59e0b" // amber
                />
                <PremiumAnalyticsCard
                    title="Ativos e Qualificados"
                    value={String(activeSuppliers)}
                    description="Fornecedores aprovados para compra"
                    trend={{ value: 5, isPositive: true }}
                    data={mockSeries}
                    dataKey="value"
                    color="#10b981" // emerald
                />
                <PremiumAnalyticsCard
                    title="Pendentes / Avaliação"
                    value={String(pendingSuppliers)}
                    description="Requerem atenção do CQ"
                    trend={{ value: 2, isPositive: false }}
                    data={mockSeries}
                    dataKey="value"
                    color="#f43f5e" // rose
                />
            </div>

            <div className="glass rounded-xl p-6 border border-slate-800">
                <SuppliersPageClient suppliers={suppliers || []} />
            </div>
        </div>
    );
}

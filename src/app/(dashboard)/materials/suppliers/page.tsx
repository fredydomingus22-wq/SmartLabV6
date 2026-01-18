import { createClient } from "@/lib/supabase/server";
import { getSuppliers } from "@/lib/queries/raw-materials";
import { SuppliersPageClient } from "./suppliers-page-client";
import { SupplierDialog } from "./supplier-dialog";
import { Truck } from "lucide-react";
import { PageShell } from "@/components/defaults/page-shell";
import { PageHeader } from "@/components/layout/page-header";
import { KPISparkCard } from "@/components/ui/kpi-spark-card";

export const dynamic = "force-dynamic";

// Local helper for trend simulation
const mockSeries = Array.from({ length: 7 }, (_, i) => ({ date: `D${i}`, value: Math.floor(Math.random() * 10) }));

export default async function SuppliersPage() {
    const supabase = await createClient();

    // Fetch suppliers
    const suppliers = await getSuppliers();

    // Fetch plant ID
    const { data: plants } = await supabase.from("plants").select("id").limit(1);
    const plantId = plants?.[0]?.id || "";

    const activeSuppliers = (suppliers as any[])?.filter(s => s.status === 'active').length || 0;
    const pendingSuppliers = (suppliers as any[])?.filter(s => s.status === 'pending').length || 0;

    return (
        <PageShell>
            <PageHeader
                variant="blue"
                icon={<Truck className="h-4 w-4 stroke-[1.5px]" />}
                overline="Supply Chain • Homologação & Qualificação"
                title="Gestão de Fornecedores"
                description="Controlo de homologação, avaliação técnica e performance de parceiros logísticos."
                backHref="/materials"
                actions={<SupplierDialog plantId={plantId} />}
            />

            <div className="p-6 space-y-6 pb-20">
                {/* KPIs */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <KPISparkCard
                        variant="blue"
                        title="Total Fornecedores"
                        value={String(suppliers?.length || 0).padStart(3, '0')}
                        description="Entidades homologadas"
                        icon={<Truck className="h-4 w-4 stroke-[1.5px]" />}
                        sparklineData={mockSeries}
                    />
                    <KPISparkCard
                        variant="emerald"
                        title="Ativos e Qualificados"
                        value={String(activeSuppliers).padStart(3, '0')}
                        description="Fluxo ativo de aprovisionamento"
                        icon={<Truck className="h-4 w-4 stroke-[1.5px]" />}
                        sparklineData={mockSeries}
                    />
                    <KPISparkCard
                        variant="rose"
                        title="Em Avaliação"
                        value={String(pendingSuppliers).padStart(3, '0')}
                        description="Pendentes de qualificação técnica"
                        icon={<Truck className="h-4 w-4 stroke-[1.5px]" />}
                        sparklineData={mockSeries}
                    />
                </div>

                <div className="bg-slate-900/30 border border-slate-800/60 rounded-2xl overflow-hidden shadow-xl">
                    <SuppliersPageClient suppliers={suppliers || []} />
                </div>
            </div>
        </PageShell>
    );
}

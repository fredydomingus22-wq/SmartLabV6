import { createClient } from "@/lib/supabase/server";
import { getSafeUser } from "@/lib/auth.server";
import { SPCDashboardShell } from "./_components/spc-dashboard-shell";
import { getActiveSPCAlerts } from "@/lib/queries/spc-alerts";
import { Sparkles } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";

export const dynamic = "force-dynamic";

function generateSeries(start: number, variance: number) {
    return Array.from({ length: 15 }, (_, i) => ({
        date: new Date(Date.now() - (14 - i) * 24 * 60 * 60 * 1000).toISOString(),
        value: start + (Math.random() * variance * 2 - variance)
    }));
}

export default async function SPCPage() {
    const supabase = await createClient();
    const user = await getSafeUser();

    // 1. Fetch QA Parameters available for the tenant
    const paramsQuery = supabase
        .from("qa_parameters")
        .select("id, name, code, unit")
        .eq("organization_id", user.organization_id);

    if (user.plant_id) {
        paramsQuery.eq("plant_id", user.plant_id);
    }
    const { data: parameters } = await paramsQuery;

    // 2. Fetch Products available for the tenant - Using SKU as per schema
    const productsQuery = supabase
        .from("products")
        .select("id, name, sku")
        .eq("organization_id", user.organization_id)
        .eq("status", "active");

    if (user.plant_id) {
        productsQuery.eq("plant_id", user.plant_id);
    }
    const { data: products } = await productsQuery;

    // 3. Fetch Sample Types
    const { data: sampleTypes } = await supabase
        .from("sample_types")
        .select("id, name")
        .order("name");

    // 4. Fetch Product Specifications to map Param <-> Product correlation
    const { data: allSpecs } = await supabase
        .from("product_specifications")
        .select("id, product_id, qa_parameter_id, sample_type_id")
        .eq("organization_id", user.organization_id);

    // 5. Fetch Active SPC Alerts
    let activeAlerts: any[] = [];
    try {
        activeAlerts = await getActiveSPCAlerts(10);
    } catch (err) {
        console.warn("Could not fetch SPC alerts:", err);
    }

    // 5. Fetch Initial Data (last 30 days for the first parameter found)
    let initialSPCResult: any = null;

    if (parameters && parameters.length > 0) {
        const { getSPCData } = await import("@/lib/queries/spc");
        initialSPCResult = await getSPCData(parameters[0].id, 30, {
            productId: products && products.length > 0 ? products[0].id : undefined
        });
    }

    return (
        <div className="space-y-6 px-6 pb-20 h-full">
            <PageHeader
                title="Controlo Estatístico de Processo (CEP/SPC)"
                overline="Analítica de Estabilidade e Capabilidade"
                size="compact"
                icon={<Sparkles className="h-4 w-4" />}
                variant="emerald"
            />

            <SPCDashboardShell
                initialProducts={products || []}
                initialParameters={parameters || []}
                sampleTypes={sampleTypes || []}
                allSpecifications={allSpecs || []}
            />
        </div>
    );
}

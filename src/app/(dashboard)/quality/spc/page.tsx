import { createClient } from "@/lib/supabase/server";
import { getSafeUser } from "@/lib/auth.server";
import { SPCClient } from "./spc-client";
import { getActiveSPCAlerts } from "@/lib/queries/spc-alerts";

export const dynamic = "force-dynamic";

export default async function SPCPage() {
    const supabase = await createClient();
    const user = await getSafeUser();

    // 1. Fetch QA Parameters available for the tenant
    const { data: parameters } = await supabase
        .from("qa_parameters")
        .select("id, name, code, unit")
        .eq("organization_id", user.organization_id)
        .eq("plant_id", user.plant_id);

    // 2. Fetch Products available for the tenant - Using SKU as per schema
    const { data: products } = await supabase
        .from("products")
        .select("id, name, sku")
        .eq("organization_id", user.organization_id)
        .eq("plant_id", user.plant_id);

    // 3. Fetch Sample Types
    const { data: sampleTypes } = await supabase
        .from("sample_types")
        .select("id, name")
        .eq("organization_id", user.organization_id);

    // 4. Fetch Active SPC Alerts
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
        <SPCClient
            user={user}
            parameters={parameters || []}
            products={products || []}
            sampleTypes={sampleTypes || []}
            initialSPCResult={initialSPCResult}
            alerts={activeAlerts}
        />
    );
}


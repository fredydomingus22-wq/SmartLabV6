import { createClient } from "@/lib/supabase/server";
import { getSafeUser } from "@/lib/auth";
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

    // 3. Fetch Active SPC Alerts
    let activeAlerts: any[] = [];
    try {
        activeAlerts = await getActiveSPCAlerts(10);
    } catch (err) {
        console.warn("Could not fetch SPC alerts:", err);
    }

    // 4. Fetch Initial Data (last 20 analysis for the first parameter found)
    let initialData: any[] = [];
    let initialSpecs: any = null;

    if (parameters && parameters.length > 0) {
        const paramId = parameters[0].id;

        // Fetch last 20 numeric analyses
        const { data: analyses } = await supabase
            .from("lab_analysis")
            .select(`
                id,
                value_numeric,
                created_at,
                samples (
                    code,
                    production_batches (
                        code
                    )
                )
            `)
            .eq("qa_parameter_id", paramId)
            .eq("organization_id", user.organization_id)
            .eq("plant_id", user.plant_id)
            .not("value_numeric", "is", null)
            .order("created_at", { ascending: false })
            .limit(50);

        if (analyses) {
            initialData = analyses.map(a => ({
                id: a.id,
                value: a.value_numeric,
                date: a.created_at,
                sampleCode: (a.samples as any)?.code,
                batchCode: (a.samples as any)?.production_batches?.code
            }));
        }

        // Fetch Specs for the first product and first parameter
        if (products && products.length > 0) {
            const { data: specs, error: specsError } = await supabase
                .from("product_specifications")
                .select("min_value, max_value, target_value")
                .eq("product_id", products[0].id)
                .eq("qa_parameter_id", paramId)
                .eq("organization_id", user.organization_id)
                .eq("plant_id", user.plant_id)
                .eq("is_current", true)
                .single();

            if (specsError && specsError.code !== 'PGRST116') {
                console.error("Error fetching initial specs:", specsError);
            }
            initialSpecs = specs;
        }
    } else {
        console.warn("No parameters found for tenant:", user.organization_id, user.plant_id);
    }

    return (
        <SPCClient
            user={user}
            parameters={parameters || []}
            products={products || []}
            initialData={initialData}
            initialSpecs={initialSpecs}
            alerts={activeAlerts}
        />
    );
}

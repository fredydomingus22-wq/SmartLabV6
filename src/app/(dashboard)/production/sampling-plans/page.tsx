import { createClient } from "@/lib/supabase/server";
import { SamplingPlansClient } from "./sampling-plans-client";
import { PageHeader } from "@/components/layout/page-header";
import { ClipboardList } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function SamplingPlansPage() {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return <div>Please log in</div>;

    const { data: profile } = await supabase
        .from("user_profiles")
        .select("organization_id, plant_id")
        .eq("id", user.id)
        .single();

    if (!profile) return <div>Profile not found</div>;

    // Fetch sampling plans
    const { data: plans } = await supabase
        .from("production_sampling_plans")
        .select(`
            *,
            product:products(id, name, sku),
            sample_type:sample_types(id, name, code)
        `)
        .eq("organization_id", profile.organization_id)
        .order("created_at", { ascending: false });

    // Fetch products for dialog
    const { data: products } = await supabase
        .from("products")
        .select("id, name, sku")
        .eq("plant_id", profile.plant_id)
        .eq("status", "active")
        .order("name");

    // Fetch sample types for dialog
    const { data: sampleTypes } = await supabase
        .from("sample_types")
        .select("id, name, code")
        .order("name");

    return (
        <div className="space-y-8">
            <PageHeader
                variant="indigo"
                icon={<ClipboardList className="h-4 w-4" />}
                overline="MES / Qualidade"
                title="Planos de Amostragem"
                description="Configuração de regras automáticas de coleta de amostras durante a produção"
                backHref="/production"
            />

            <SamplingPlansClient
                plans={plans || []}
                products={products || []}
                sampleTypes={sampleTypes || []}
            />
        </div>
    );
}

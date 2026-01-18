import { createClient } from "@/lib/supabase/server";
import { ReadingPageClient } from "./reading-page-client";
import { PageShell } from "@/components/defaults/page-shell";
import { PageHeader } from "@/components/layout/page-header";
import { Microscope } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ReadingPage() {
    const supabase = await createClient();

    // Fetch Incubating Results with sample product info for spec lookup
    const { data: results } = await supabase
        .from("micro_results")
        .select(`
            *,
            sample:samples(
                code,
                production_batch_id,
                batch:production_batches(
                    product_id,
                    product:products(name)
                )
            ),
            parameter:qa_parameters(id, name),
            session:micro_test_sessions(
                started_at,
                incubator:micro_incubators(name)
            ),
            media_lot:micro_media_lots(
                lot_code,
                media_type:micro_media_types(incubation_hours_min, name)
            )
        `)
        .eq("status", "incubating")
        .order("created_at", { ascending: true });

    // Extract unique product_id + parameter_id combinations to fetch specs
    const specQueries: { productId: string; parameterId: string }[] = [];
    results?.forEach(r => {
        const sample = Array.isArray(r.sample) ? r.sample[0] : r.sample;
        const batch = sample?.batch;
        const batchData = Array.isArray(batch) ? batch[0] : batch;
        const param = Array.isArray(r.parameter) ? r.parameter[0] : r.parameter;

        if (batchData?.product_id && param?.id) {
            specQueries.push({ productId: batchData.product_id, parameterId: param.id });
        }
    });

    // Fetch all relevant specs
    const specsMap: Record<string, number | null> = {};

    for (const q of specQueries) {
        const key = `${q.productId}_${q.parameterId}`;
        if (specsMap[key] === undefined) {
            const { data: spec } = await supabase
                .from("product_specifications")
                .select("max_colony_count")
                .eq("product_id", q.productId)
                .eq("qa_parameter_id", q.parameterId)
                .eq("status", "active")
                .single();
            specsMap[key] = spec?.max_colony_count ?? null;
        }
    }

    // Attach specs to results
    const enrichedResults = results?.map(r => {
        const sample = Array.isArray(r.sample) ? r.sample[0] : r.sample;
        const batch = sample?.batch;
        const batchData = Array.isArray(batch) ? batch[0] : batch;
        const param = Array.isArray(r.parameter) ? r.parameter[0] : r.parameter;

        const key = batchData?.product_id && param?.id
            ? `${batchData.product_id}_${param.id}`
            : "";

        return {
            ...r,
            max_colony_count: specsMap[key] ?? null
        };
    }) || [];

    return (
        <PageShell>
            <PageHeader
                variant="purple"
                icon={<Microscope className="h-6 w-6" />}
                title="Estação de Leitura"
                description="Registe resultados de sessões de incubação concluídas."
                backHref="/micro"
            />

            <div className="p-6 space-y-6">
                <ReadingPageClient results={enrichedResults} />
            </div>
        </PageShell>
    );
}

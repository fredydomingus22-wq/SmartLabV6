import { createClient } from "@/lib/supabase/server";
import { History as HistoryIcon, Gavel } from "lucide-react";
import { HistoryListClient } from "./history-list-client";
import { PageShell } from "@/components/defaults/page-shell";
import { PageHeader } from "@/components/layout/page-header";

export const dynamic = "force-dynamic";

export default async function LabHistoryPage() {
    const supabase = await createClient();

    // Fetch all analysis results ordered by date
    const { data: results, error } = await supabase
        .from("lab_analysis")
        .select(`
            id,
            value_numeric,
            value_text,
            is_conforming,
            is_valid,
            is_retest,
            analyzed_at,
            sample:samples(id, code, status, batch:production_batches(code, product:products(name))),
            parameter:qa_parameters(name, code, unit),
            signed_transaction_hash
        `)
        .order("analyzed_at", { ascending: false })
        .limit(100);

    if (error) {
        console.error("Error fetching history:", error);
    }

    return (
        <PageShell className="pb-20">
            <PageHeader
                variant="indigo"
                icon={<HistoryIcon className="h-4 w-4" />}
                overline="Controlo de Qualidade"
                title="Histórico de Análises"
                description="Arquivo completo de resultados analíticos com integridade de dados e validade técnica."
                backHref="/lab"
                collapsible
            />

            <main className="px-6 space-y-8 mt-6">
                <div className="glass rounded-[2rem] border-white/5 bg-slate-900/40 p-8">
                    <HistoryListClient results={results || []} />
                </div>
            </main>
        </PageShell>
    );
}


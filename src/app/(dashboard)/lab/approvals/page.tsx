import { createClient } from "@/lib/supabase/server";
import { getSafeUser } from "@/lib/auth.server";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ShieldCheck, ClipboardCheck, Truck, FlaskConical, Gavel } from "lucide-react";
import { ApprovalsList } from "./_components/approvals-list";
import { ApprovalFilters } from "./_components/approval-filters";
import { PageHeader } from "@/components/layout/page-header";

interface SearchParams {
    batchId?: string;
    shiftId?: string;
}

interface ApprovalsPageProps {
    searchParams: Promise<SearchParams>;
}

export default async function ApprovalsPage({ searchParams }: ApprovalsPageProps) {
    const user = await getSafeUser();
    const supabase = await createClient();
    const { batchId, shiftId } = await searchParams;

    // ... (rest of filtering logic remains same)
    // Fetch Metadata for Filters
    const { data: shifts } = await supabase
        .from("shifts")
        .select("id, name, start_time, end_time")
        .eq("plant_id", user.plant_id!);

    const { data: recentBatches } = await supabase
        .from("production_batches")
        .select("id, code")
        .eq("plant_id", user.plant_id!)
        .order("created_at", { ascending: false })
        .limit(20);

    // Common query builder function to avoid duplication
    const buildSampleQuery = (status: string, orderBy: string) => {
        let query = supabase
            .from("samples")
            .select(`
                *,
                type:sample_types(name, code),
                batch:production_batches(code, product:products(name)),
                lab_analysis(id, status, value_numeric, value_text, is_conforming, parameter:qa_parameters(name, unit))
            `)
            .eq("status", status)
            .eq("organization_id", user.organization_id!)
            .eq("plant_id", user.plant_id!);

        if (batchId) {
            query = query.eq("production_batch_id", batchId);
        }

        return query.order(orderBy, { ascending: false });
    };

    const { data: reviewSamples } = await buildSampleQuery("under_review", "created_at");
    const { data: approvalSamples } = await buildSampleQuery("approved", "reviewed_at");
    const { data: releasedSamples } = await buildSampleQuery("released", "released_at");

    // Client-side shift filtering (since we have the samples anyway)
    const filterByShift = (samples: any[]) => {
        if (!shiftId || !shifts) return samples;
        const shift = shifts.find(s => s.id === shiftId);
        if (!shift) return samples;

        return samples.filter(sample => {
            const collectedAt = new Date(sample.collected_at || sample.created_at);
            const time = `${String(collectedAt.getHours()).padStart(2, '0')}:${String(collectedAt.getMinutes()).padStart(2, '0')}:${String(collectedAt.getSeconds()).padStart(2, '0')}`;

            if (shift.start_time < shift.end_time) {
                return time >= shift.start_time && time <= shift.end_time;
            } else {
                // Shift crosses midnight
                return time >= shift.start_time || time <= shift.end_time;
            }
        });
    };

    const filteredReview = filterByShift(reviewSamples || []);
    const filteredApproval = filterByShift(approvalSamples || []);
    const filteredReleased = filterByShift(releasedSamples || []);

    return (
        <div className="space-y-10">
            <PageHeader
                variant="purple"
                icon={<Gavel className="h-4 w-4" />}
                overline="Quality Assurance Control"
                title="Centro de Aprovações"
                description="Fluxo de Validação ISO 9001:2015. Revisão técnica, aprovação final e libertação de mercado."
                backHref="/lab"
            />

            <main className="relative">
                <ApprovalFilters shifts={shifts || []} batches={recentBatches || []} />

                <Tabs defaultValue="review" className="w-full">
                    <TabsList className="grid w-full max-w-xl grid-cols-3 bg-white/[0.03] border border-white/5 p-1 h-10 rounded-xl mb-6">
                        <TabsTrigger value="review" className="rounded-lg text-[10px] font-black uppercase tracking-widest data-[state=active]:bg-purple-600/20 data-[state=active]:text-purple-400">
                            Revisão
                        </TabsTrigger>
                        <TabsTrigger value="approval" className="rounded-lg text-[10px] font-black uppercase tracking-widest data-[state=active]:bg-emerald-600/20 data-[state=active]:text-emerald-400">
                            Aprovação
                        </TabsTrigger>
                        <TabsTrigger value="release" className="rounded-lg text-[10px] font-black uppercase tracking-widest data-[state=active]:bg-blue-600/20 data-[state=active]:text-blue-400">
                            Libertação
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="review" className="mt-0">
                        <ApprovalsList
                            samples={filteredReview}
                            type="technical"
                            title="Amostras para Revisão Técnica"
                            description="Supervisor: Verifique os resultados analíticos antes da aprovação de qualidade."
                        />
                    </TabsContent>

                    <TabsContent value="approval" className="mt-0">
                        <ApprovalsList
                            samples={filteredApproval}
                            type="quality"
                            title="Aprovação de Qualidade (QA)"
                            description="QA Manager: Verifique a conformidade final para libertação de lote."
                        />
                    </TabsContent>

                    <TabsContent value="release" className="mt-0">
                        <ApprovalsList
                            samples={filteredReleased}
                            type="release"
                            title="Histórico de Libertação"
                            description="Amostras libertadas para o mercado ou produção."
                        />
                    </TabsContent>
                </Tabs>
            </main>
        </div>
    );
}

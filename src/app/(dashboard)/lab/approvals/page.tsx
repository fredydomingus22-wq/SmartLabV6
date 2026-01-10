"use server";

import { createClient } from "@/lib/supabase/server";
import { getSafeUser } from "@/lib/auth.server";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ShieldCheck, ClipboardCheck, Truck, FlaskConical } from "lucide-react";
import { ApprovalsList } from "./_components/approvals-list";
import { ApprovalFilters } from "./_components/approval-filters";

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

        // Shift filtering logic is complex in PostgREST without custom RPC or raw SQL
        // We might need to do some client-side or nested filtering if it gets too complex
        // But for now let's apply a status/order and handle shift logic if possible

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
        <div className="container py-8 space-y-8">
            <div className="flex flex-col gap-2">
                <h1 className="text-4xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400">
                    Centro de Aprovações
                </h1>
                <p className="text-slate-400 font-medium">Fluxo de Validação ISO 9001:2015</p>
            </div>

            <ApprovalFilters shifts={shifts || []} batches={recentBatches || []} />

            <Tabs defaultValue="review" className="w-full">
                <TabsList className="grid w-full max-w-2xl grid-cols-3 bg-slate-900/50 border border-slate-800 p-1 h-14 rounded-2xl mb-8">
                    <TabsTrigger value="review" className="rounded-xl data-[state=active]:bg-purple-600 data-[state=active]:text-white">
                        <ClipboardCheck className="h-4 w-4 mr-2" />
                        Revisão Técnica
                    </TabsTrigger>
                    <TabsTrigger value="approval" className="rounded-xl data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
                        <ShieldCheck className="h-4 w-4 mr-2" />
                        Aprovação QA
                    </TabsTrigger>
                    <TabsTrigger value="release" className="rounded-xl data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                        <Truck className="h-4 w-4 mr-2" />
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
        </div>
    );
}

import { createClient } from "@/lib/supabase/server";
import { getSafeUser } from "@/lib/auth.server";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Gavel } from "lucide-react";
import { ApprovalsList } from "./_components/approvals-list";
import { ApprovalFilters } from "./_components/approval-filters";
import { PageHeader } from "@/components/layout/page-header";
import { PageShell } from "@/components/defaults/page-shell";
import { cn } from "@/lib/utils";

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
    let shiftsQuery = supabase
        .from("shifts")
        .select("id, name, start_time, end_time")
        .eq("organization_id", user.organization_id!);

    if (user.plant_id) {
        shiftsQuery = shiftsQuery.eq("plant_id", user.plant_id);
    }
    const { data: shifts } = await shiftsQuery;

    let batchesQuery = supabase
        .from("production_batches")
        .select("id, code")
        .eq("organization_id", user.organization_id!)
        .order("created_at", { ascending: false })
        .limit(20);

    if (user.plant_id) {
        batchesQuery = batchesQuery.eq("plant_id", user.plant_id);
    }
    const { data: recentBatches } = await batchesQuery;

    // Common query builder function to avoid duplication
    const buildSampleQuery = (status: string | string[], orderBy: string) => {
        let query = supabase
            .from("samples")
            .select(`
                *,
                type:sample_types(name, code),
                batch:production_batches(code, product:products(name)),
                lab_analysis(id, status, value_numeric, value_text, is_conforming, parameter:qa_parameters(name, unit))
            `)
            .eq("organization_id", user.organization_id!);

        if (Array.isArray(status)) {
            query = query.in("status", status);
        } else {
            query = query.eq("status", status);
        }

        if (user.plant_id) {
            query = query.eq("plant_id", user.plant_id);
        }

        if (batchId) {
            query = query.eq("production_batch_id", batchId);
        }

        return query.order(orderBy, { ascending: false });
    };

    const { data: reviewSamples } = await buildSampleQuery("under_review", "created_at");
    const { data: approvalSamples } = await buildSampleQuery(["approved", "reviewed"], "reviewed_at");
    const { data: releasedSamples } = await buildSampleQuery("released", "released_at");

    // Client-side shift filtering
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
                return time >= shift.start_time || time <= shift.end_time;
            }
        });
    };

    const filteredReview = filterByShift(reviewSamples || []);
    const filteredApproval = filterByShift(approvalSamples || []);
    const filteredReleased = filterByShift(releasedSamples || []);

    return (
        <PageShell className="pb-20">
            <PageHeader
                variant="purple"
                icon={<Gavel className="h-4 w-4" />}
                overline="Qualidade & Garantia (QA/QC)"
                title="Centro de Aprovações"
                description="Validação final e libertação de mercado de acordo com os protocolos ISO 9001 e ISO 17025."
                backHref="/lab"
                collapsible
            />

            <main className="px-6 space-y-8 mt-6">
                <ApprovalFilters shifts={shifts || []} batches={recentBatches || []} />

                <Tabs defaultValue="review" className="w-full">
                    <TabsList className="bg-slate-950/60 p-1.5 rounded-3xl border border-white/5 shadow-inner h-14 w-fit">
                        {[
                            { id: 'review', label: 'Assinatura Técnica', color: 'data-[state=active]:bg-purple-500/10 data-[state=active]:text-purple-400' },
                            { id: 'approval', label: 'Libertação de Mercado', color: 'data-[state=active]:bg-emerald-500/10 data-[state=active]:text-emerald-400' },
                            { id: 'release', label: 'Meu Histórico', color: 'data-[state=active]:bg-blue-500/10 data-[state=active]:text-blue-400' }
                        ].map((tab) => (
                            <TabsTrigger
                                key={tab.id}
                                value={tab.id}
                                className={cn(
                                    "rounded-2xl text-[10px] px-8 h-full font-black uppercase tracking-widest transition-all data-[state=active]:shadow-lg border border-transparent data-[state=active]:border-white/5 italic",
                                    tab.color
                                )}
                            >
                                {tab.label}
                            </TabsTrigger>
                        ))}
                    </TabsList>

                    <TabsContent value="review" className="mt-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
                        <ApprovalsList
                            samples={filteredReview}
                            type="technical"
                            title="Amostras para Assinatura Técnica"
                            description="Verifique os resultados analíticos e valide a conformidade técnica dos parâmetros."
                            userRole={user.role}
                        />
                    </TabsContent>

                    <TabsContent value="approval" className="mt-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
                        <ApprovalsList
                            samples={filteredApproval}
                            type="quality"
                            title="Libertação de Mercado (QA)"
                            description="Aprovação final de lote para expedição e conformidade normativa."
                            userRole={user.role}
                        />
                    </TabsContent>

                    <TabsContent value="release" className="mt-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
                        <ApprovalsList
                            samples={filteredReleased}
                            type="release"
                            title="Certificação e Libertação"
                            description="Historial de amostras libertadas para o mercado ou consumo interno."
                            userRole={user.role}
                        />
                    </TabsContent>
                </Tabs>
            </main>
        </PageShell>
    );
}

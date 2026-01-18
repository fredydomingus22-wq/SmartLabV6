import Link from "next/link";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { FileText, GraduationCap, ShieldCheck, Clock, AlertTriangle, CheckCircle2 } from "lucide-react";
import { CreateDocumentDialog } from "./_components/create-document-dialog";
import { DocumentsClient } from "./_components/documents-client";
import { getDocuments, getDocCategories, getPlants } from "@/lib/queries/dms";
import { createClient } from "@/lib/supabase/server";
import { getSafeUser } from "@/lib/auth.server";
import { PageHeader } from "@/components/layout/page-header";
import { KPISparkCard } from "@/components/ui/kpi-spark-card";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function DocumentsPage() {
    const { data: documents = [] } = await getDocuments();
    let { data: categories } = await getDocCategories();
    const { data: plants } = await getPlants();

    // KPIs Calculation for Industrial Workstation
    const stats = {
        published: documents.filter(d => d.current_version?.status === 'published').length,
        pending: documents.filter(d => d.current_version?.status === 'review').length,
        drafts: documents.filter(d => d.current_version?.status === 'draft').length,
        upcomingReview: documents.filter(d => {
            const reviewDate = d.periodic_reviews?.[0]?.scheduled_date;
            if (!reviewDate) return false;
            const diffDays = Math.ceil((new Date(reviewDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
            return diffDays >= 0 && diffDays <= 30;
        }).length
    };

    // Auto-seed if empty (Rescue logic for new organizations)
    if (categories?.length === 0) {
        const supabase = await createClient();
        const user = await getSafeUser();

        const defaultCategories = [
            { name: 'Standard Operating Procedure', code: 'SOP', description: 'Procedimentos Operacionais Normatizados' },
            { name: 'Analytical Method', code: 'MTD', description: 'Métodos Analíticos de Laboratório' },
            { name: 'Product Specification', code: 'SPC', description: 'Especificações de Matéria-Prima e Produto Final' },
            { name: 'Quality Form', code: 'FRM', description: 'Formulários e Registos de Qualidade' }
        ];

        const { error: seedError } = await supabase.from("doc_categories").insert(
            defaultCategories.map(c => ({ ...c, organization_id: user.organization_id }))
        );

        if (!seedError) {
            const secondFetch = await getDocCategories();
            categories = secondFetch.data;
        }
    }

    return (
        <div className="space-y-6 px-6 pb-20">
            <PageHeader
                variant="emerald"
                icon={<ShieldCheck className="h-4 w-4" />}
                overline="GQ • Ciclo de Gestão Documental"
                title="Sistemas de Controlo Documental"
                description="Controlo centralizado de integridade e vigência normativa. Monitorização de SOPs e Especificações."
                backHref="/quality"
                actions={<CreateDocumentDialog categories={categories} plants={plants} />}
            />

            {/* Workstation KPI Ribbon */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <KPISparkCard
                    variant="emerald"
                    title="Vigência Ativa"
                    value={stats.published.toString().padStart(2, '0')}
                    description="Documentos publicados em vigor"
                    icon={<CheckCircle2 className="h-4 w-4" />}
                    data={[10, 12, 11, 13, 12, 14, 13].map(v => ({ value: v }))}
                    dataKey="value"
                />
                <KPISparkCard
                    variant="amber"
                    title="Controlo de Revisão"
                    value={stats.pending.toString().padStart(2, '0')}
                    description="Pendente de Revisão / Assinatura"
                    icon={<Clock className="h-4 w-4" />}
                    data={[2, 3, 2, 4, 3, 4, 4].map(v => ({ value: v }))}
                    dataKey="value"
                />
                <KPISparkCard
                    variant="indigo"
                    title="Produção Documental"
                    value={stats.drafts.toString().padStart(2, '0')}
                    description="Documentos em fase de elaboração"
                    icon={<FileText className="h-4 w-4" />}
                    data={[5, 4, 6, 5, 7, 6, 8].map(v => ({ value: v }))}
                    dataKey="value"
                />
                <KPISparkCard
                    variant="rose"
                    title="Revisão Periódica"
                    value={stats.upcomingReview.toString().padStart(2, '0')}
                    description="Prazos de revisão (Janela 30 dias)"
                    icon={<AlertTriangle className="h-4 w-4" />}
                    data={[1, 0, 1, 2, 1, 2, 2].map(v => ({ value: v }))}
                    dataKey="value"
                />
            </div>

            <Tabs defaultValue="documents" className="space-y-6">
                <div className="flex items-center justify-between border-b border-white/5 pb-1">
                    <TabsList className="bg-transparent border-none p-0 h-auto gap-8">
                        <TabsTrigger
                            value="documents"
                            className="bg-transparent border-none p-0 pb-4 h-auto data-[state=active]:bg-transparent data-[state=active]:text-emerald-400 border-b-2 border-transparent data-[state=active]:border-emerald-500 rounded-none gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500"
                        >
                            Repositório Industrial
                        </TabsTrigger>
                        <TabsTrigger
                            value="training"
                            className="bg-transparent border-none p-0 pb-4 h-auto data-[state=active]:bg-transparent data-[state=active]:text-indigo-400 border-b-2 border-transparent data-[state=active]:border-indigo-500 rounded-none gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500"
                        >
                            Matriz de Formação
                        </TabsTrigger>
                    </TabsList>
                </div>

                <TabsContent value="documents" className="mt-0 outline-none focus-visible:ring-0">
                    <DocumentsClient
                        documents={documents}
                        categories={categories}
                        plants={plants}
                    />
                </TabsContent>

                <TabsContent value="training" className="mt-0 outline-none focus-visible:ring-0">
                    <div className="glass-dark p-20 rounded-[2.5rem] border-white/5 shadow-2xl text-center space-y-6">
                        <div className="h-24 w-24 bg-indigo-500/10 rounded-[2rem] flex items-center justify-center mx-auto border border-indigo-500/20 shadow-indigo-500/10 shadow-2xl">
                            <GraduationCap className="h-12 w-12 text-indigo-400" />
                        </div>
                        <div className="space-y-2">
                            <h2 className="text-3xl font-black tracking-tight uppercase italic text-white">Consola de Qualificações</h2>
                            <p className="text-slate-500 max-w-lg mx-auto font-black uppercase text-[10px] tracking-widest leading-relaxed italic">
                                Gestão de competências críticas e evidências de formação (21 CFR Part 11). Garanta a qualificação técnica operacional.
                            </p>
                        </div>
                        <Link href="/quality/training">
                            <Button className="h-12 bg-indigo-600 hover:bg-indigo-500 text-white font-black uppercase tracking-[0.2em] text-[10px] px-10 rounded-xl shadow-lg shadow-indigo-500/20 italic">
                                Gestão de Competências
                            </Button>
                        </Link>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}


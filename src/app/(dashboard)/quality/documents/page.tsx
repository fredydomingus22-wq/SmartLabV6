import Link from "next/link";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { FileText, GraduationCap, ShieldCheck, Clock, AlertTriangle, CheckCircle2 } from "lucide-react";
import { CreateDocumentDialog } from "./_components/create-document-dialog";
import { DocumentsClient } from "./_components/documents-client";
import { getDocuments, getDocCategories, getPlants } from "@/lib/queries/dms";
import { createClient } from "@/lib/supabase/server";
import { getSafeUser } from "@/lib/auth.server";
import { Card, CardContent } from "@/components/ui/card";

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
        <div className="p-8 space-y-8 max-w-[1600px] mx-auto">
            {/* Industrial Workstation Header */}
            <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-6 border-b border-white/5 pb-8">
                <div className="space-y-2">
                    <div className="flex items-center gap-3 text-emerald-500 mb-1">
                        <ShieldCheck className="h-5 w-5" />
                        <span className="text-[10px] font-black uppercase tracking-[0.3em]">Industrial QMS / DMS Module</span>
                    </div>
                    <h1 className="text-5xl font-black tracking-tighter bg-gradient-to-b from-white to-slate-500 bg-clip-text text-transparent">
                        Document Station
                    </h1>
                    <p className="text-slate-500 font-medium max-w-xl text-sm leading-relaxed">
                        Controlo centralizado de integridade documental. Monitorize o ciclo de vida de SOPs, Métodos e Especificações em conformidade com normas ISO e GMP.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <CreateDocumentDialog categories={categories} plants={plants} />
                </div>
            </div>

            {/* Workstation KPI Ribbon */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: "Documentos Ativos", value: stats.published, icon: CheckCircle2, color: "text-emerald-400", bg: "bg-emerald-500/10" },
                    { label: "Pendente Aprovação", value: stats.pending, icon: Clock, color: "text-amber-400", bg: "bg-amber-500/10" },
                    { label: "Drafts / Revisão", value: stats.drafts, icon: FileText, color: "text-indigo-400", bg: "bg-indigo-500/10" },
                    { label: "Próximas Revisões (30d)", value: stats.upcomingReview, icon: AlertTriangle, color: "text-rose-400", bg: "bg-rose-500/10" }
                ].map((kpi, i) => (
                    <Card key={i} className="glass-dark border-white/5 shadow-2xl overflow-hidden group hover:border-white/10 transition-all">
                        <CardContent className="p-6 flex items-center justify-between relative">
                            <div className="space-y-1 relative z-10">
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">{kpi.label}</p>
                                <p className="text-3xl font-black text-white">{kpi.value.toString().padStart(2, '0')}</p>
                            </div>
                            <div className={cn("h-12 w-12 rounded-2xl flex items-center justify-center relative z-10 transition-transform group-hover:scale-110 shadow-lg", kpi.bg, kpi.color)}>
                                <kpi.icon className="h-6 w-6" />
                            </div>
                            {/* Decorative gauge line */}
                            <div className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-transparent via-current to-transparent opacity-20 w-full" style={{ color: `var(--${kpi.color.split('-')[1]}-400)` }} />
                        </CardContent>
                    </Card>
                ))}
            </div>

            <Tabs defaultValue="documents" className="space-y-8">
                <div className="flex items-center justify-between border-b border-white/5 pb-1">
                    <TabsList className="bg-transparent border-none p-0 h-auto gap-8">
                        <TabsTrigger
                            value="documents"
                            className="bg-transparent border-none p-0 pb-4 h-auto data-[state=active]:bg-transparent data-[state=active]:text-emerald-400 border-b-2 border-transparent data-[state=active]:border-emerald-500 rounded-none gap-2 text-xs font-black uppercase tracking-widest text-slate-500"
                        >
                            Industrial Repository
                        </TabsTrigger>
                        <TabsTrigger
                            value="training"
                            className="bg-transparent border-none p-0 pb-4 h-auto data-[state=active]:bg-transparent data-[state=active]:text-indigo-400 border-b-2 border-transparent data-[state=active]:border-indigo-500 rounded-none gap-2 text-xs font-black uppercase tracking-widest text-slate-500"
                        >
                            Training Matrix
                        </TabsTrigger>
                    </TabsList>
                </div>

                <TabsContent value="documents" className="mt-0 outline-none">
                    <DocumentsClient
                        documents={documents}
                        categories={categories}
                        plants={plants}
                    />
                </TabsContent>

                <TabsContent value="training" className="mt-0 outline-none">
                    <div className="glass-dark p-20 rounded-[2.5rem] border-white/5 shadow-2xl text-center space-y-6">
                        <div className="h-24 w-24 bg-indigo-500/10 rounded-[2rem] flex items-center justify-center mx-auto border border-indigo-500/20 shadow-indigo-500/10 shadow-2xl">
                            <GraduationCap className="h-12 w-12 text-indigo-400" />
                        </div>
                        <div className="space-y-2">
                            <h2 className="text-3xl font-black tracking-tight">Industrial Training Hub</h2>
                            <p className="text-slate-500 max-w-lg mx-auto font-medium text-sm leading-relaxed">
                                Faça a gestão de competências críticas e registos de formação 21 CFR Part 11. Garanta que apenas pessoal qualificado opera o sistema.
                            </p>
                        </div>
                        <Link href="/quality/training">
                            <Button className="h-12 bg-indigo-600 hover:bg-indigo-500 text-white font-black uppercase tracking-widest text-[10px] px-8 rounded-xl shadow-lg shadow-indigo-500/20">
                                Aceder à Consola de Formação
                            </Button>
                        </Link>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}

function cn(...inputs: any[]) {
    return inputs.filter(Boolean).join(" ");
}

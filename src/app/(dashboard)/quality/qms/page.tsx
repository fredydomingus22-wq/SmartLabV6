import { getNonconformities, getQMSKpis, getOrganizationUsers, getCAPAActions } from "@/lib/queries/qms";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileWarning, LayoutDashboard, ListFilter, Target, Zap } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { NCListClient } from "./nc-list-client";
import { CreateNCDialog } from "./create-nc-dialog";
import { NCFilters } from "./nc-filters";
import { Suspense } from "react";
import { QMSDashboard } from "./qms-dashboard";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CAPAView } from "./capa/capa-view";
import { EightDView } from "./8d/eight-d-view";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

interface PageProps {
    searchParams: Promise<{ status?: string; severity?: string; type?: string; tab?: string; priority?: string }>;
}

export default async function QMSPage({ searchParams }: PageProps) {
    const params = await searchParams;
    const supabase = await createClient();

    // Parallel Data Fetching
    const [kpisRes, usersRes, ncRes, capaRes, eightDRes] = await Promise.all([
        getQMSKpis(),
        getOrganizationUsers(),
        getNonconformities({
            status: params.status,
            severity: params.severity,
            ncType: params.type,
        }),
        getCAPAActions({
            status: params.status, // Reusing status param might need disambiguation if filters conflict, but generally ok for simple tabs
            type: params.type,
        }),
        supabase.from("eight_d_reports")
            .select(`*, nonconformity:nonconformities(nc_number, title)`)
            .order("created_at", { ascending: false })
    ]);

    const kpis = kpisRes;
    const users = usersRes.data || [];
    const nonconformities = ncRes.data;
    const capas = capaRes.data || [];
    const reports = eightDRes.data || [];

    // Recent NCs for the dashboard (top 5)
    const recentNCs = nonconformities.slice(0, 5);
    const defaultTab = params.tab || "dashboard";

    return (
        <div className="space-y-6 px-6 pb-20">
            <PageHeader
                title="Gestão da Qualidade (SGQ)"
                overline="Controlo Industrial / Compliance"
                icon={<FileWarning className="h-4 w-4" />}
                variant="rose"
                description="Gestão de Não Conformidades (NC), Ciclos CAPA e Relatórios 8D sob normas ISO/FSSC."
                actions={<CreateNCDialog users={users} />}
            />
            <Tabs defaultValue={defaultTab} className="space-y-6">
                <TabsList>
                    <TabsTrigger value="dashboard" className="gap-2">
                        <LayoutDashboard className="h-4 w-4" />
                        Painel Resumo
                    </TabsTrigger>
                    <TabsTrigger value="nc" className="gap-2">
                        <ListFilter className="h-4 w-4" />
                        Desvios (NC)
                    </TabsTrigger>
                    <TabsTrigger value="capa" className="gap-2">
                        <Target className="h-4 w-4" />
                        Ações CAPA
                    </TabsTrigger>
                    <TabsTrigger value="8d" className="gap-2">
                        <Zap className="h-4 w-4" />
                        Relatórios 8D
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="dashboard" className="m-0 outline-none">
                    <QMSDashboard kpis={kpis} recentNCs={recentNCs} />
                </TabsContent>

                <TabsContent value="nc" className="space-y-6 m-0 outline-none">
                    {/* Filters */}
                    <Suspense fallback={<div className="h-16 bg-muted/30 rounded-lg animate-pulse" />}>
                        <NCFilters />
                    </Suspense>

                    {/* Nonconformities List */}
                    <div className="bg-card border border-border shadow-sm rounded-xl overflow-hidden">
                        <div className="p-4 sm:p-6 border-b border-border flex items-center justify-between bg-muted/20">
                            <div>
                                <h3 className="text-base font-black uppercase tracking-tight italic text-white leading-none">Registo de Não Conformidades</h3>
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mt-1">
                                    {nonconformities.length} Registos Encontrados
                                    {(params.status || params.severity || params.type) && " (Filtrado)"}
                                </p>
                            </div>
                        </div>
                        <div className="p-0">
                            <NCListClient nonconformities={nonconformities} />
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="capa" className="m-0 outline-none">
                    <CAPAView capas={capas} searchParams={params} users={users} />
                </TabsContent>

                <TabsContent value="8d" className="m-0 outline-none">
                    <EightDView reports={reports} users={users} />
                </TabsContent>
            </Tabs>
        </div>
    );
}

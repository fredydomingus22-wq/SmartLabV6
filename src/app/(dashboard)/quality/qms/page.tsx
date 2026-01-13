import { getNonconformities, getQMSKpis, getOrganizationUsers } from "@/lib/queries/qms";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileWarning, LayoutDashboard, ListFilter, Target, Zap } from "lucide-react";
import { NCListClient } from "./nc-list-client";
import { CreateNCDialog } from "./create-nc-dialog";
import { NCFilters } from "./nc-filters";
import { Suspense } from "react";
import { QMSDashboard } from "./qms-dashboard";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

interface PageProps {
    searchParams: Promise<{ status?: string; severity?: string; type?: string; tab?: string }>;
}

export default async function QMSPage({ searchParams }: PageProps) {
    const params = await searchParams;
    const kpis = await getQMSKpis();
    const { data: users } = await getOrganizationUsers();

    // Fetch nonconformities for the list
    const { data: nonconformities } = await getNonconformities({
        status: params.status,
        severity: params.severity,
        ncType: params.type,
    });

    // Recent NCs for the dashboard (top 5)
    const recentNCs = nonconformities.slice(0, 5);

    const defaultTab = params.tab || "dashboard";

    return (
        <div className="space-y-8">
            <PageHeader
                variant="indigo"
                icon={<FileWarning className="h-4 w-4" />}
                overline="Quality Management System"
                title="Gestão da Qualidade (QMS)"
                description="Não Conformidades (NC), CAPA e Relatórios 8D para assegurar conformidade normativa."
                backHref="/quality"
                actions={<CreateNCDialog users={users || []} />}
            />

            <Tabs defaultValue={defaultTab} className="space-y-6">
                <TabsList className="bg-slate-900/50 border border-slate-800 p-1">
                    <TabsTrigger value="dashboard" className="data-[state=active]:bg-indigo-500/20 data-[state=active]:text-indigo-400 gap-2">
                        <LayoutDashboard className="h-4 w-4" />
                        Dashboard
                    </TabsTrigger>
                    <TabsTrigger value="nc" className="data-[state=active]:bg-indigo-500/20 data-[state=active]:text-indigo-400 gap-2">
                        <ListFilter className="h-4 w-4" />
                        Desvios (NC)
                    </TabsTrigger>
                    <TabsTrigger value="capa" className="data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-400 gap-2">
                        <Target className="h-4 w-4" />
                        Ações CAPA
                    </TabsTrigger>
                    <TabsTrigger value="8d" className="data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-400 gap-2">
                        <Zap className="h-4 w-4" />
                        Relatórios 8D
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="dashboard" className="animate-in fade-in duration-500 border-none p-0 outline-none">
                    <QMSDashboard kpis={kpis} recentNCs={recentNCs} />
                </TabsContent>

                <TabsContent value="nc" className="space-y-6 animate-in fade-in duration-500 border-none p-0 outline-none">
                    {/* Filters */}
                    <Suspense fallback={<div className="h-16 bg-muted/30 rounded-lg animate-pulse" />}>
                        <NCFilters />
                    </Suspense>

                    {/* Nonconformities List */}
                    <div className="bg-card border border-slate-800 shadow-xl rounded-2xl overflow-hidden">
                        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-bold">Lista de Não Conformidades</h3>
                                <p className="text-sm text-muted-foreground">
                                    {nonconformities.length} resultado(s) detetados
                                    {(params.status || params.severity || params.type) && " (filtrado)"}
                                </p>
                            </div>
                        </div>
                        <div className="p-0">
                            <NCListClient nonconformities={nonconformities} />
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="capa" className="animate-in fade-in duration-500 border-none p-0 outline-none">
                    <div className="bg-card p-12 rounded-3xl border border-slate-800 shadow-xl text-center space-y-4">
                        <div className="h-20 w-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto">
                            <Target className="h-10 w-10 text-emerald-400" />
                        </div>
                        <h2 className="text-2xl font-bold">Módulo de CAPA</h2>
                        <p className="text-muted-foreground max-w-md mx-auto">
                            Gira as suas Ações Corretivas e Preventivas de forma centralizada.
                        </p>
                        <Link href="/quality/qms/capa">
                            <Button className="bg-emerald-600 hover:bg-emerald-500 mt-4">
                                Abrir Gestão de CAPA
                            </Button>
                        </Link>
                    </div>
                </TabsContent>

                <TabsContent value="8d" className="animate-in fade-in duration-500 border-none p-0 outline-none">
                    <div className="bg-card p-12 rounded-3xl border border-slate-800 shadow-xl text-center space-y-4">
                        <div className="h-20 w-20 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto">
                            <Zap className="h-10 w-10 text-amber-400" />
                        </div>
                        <h2 className="text-2xl font-bold">Relatórios 8D</h2>
                        <p className="text-muted-foreground max-w-md mx-auto">
                            Metodologia 8D para resolução de problemas complexos e análise de causa raiz.
                        </p>
                        <Link href="/quality/qms/8d">
                            <Button className="bg-amber-600 hover:bg-amber-500 mt-4">
                                Abrir Relatórios 8D
                            </Button>
                        </Link>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}



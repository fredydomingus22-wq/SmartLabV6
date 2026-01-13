import { getCAPAActions, getOrganizationUsers } from "@/lib/queries/qms";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    ArrowLeft,
    CheckCircle,
    Clock,
    AlertTriangle,
    Target,
    ShieldCheck,
    Calendar,
    Search,
    Filter
} from "lucide-react";
import Link from "next/link";
import { CAPAListClient } from "./capa-list-client";
import { CAPAFilters } from "./capa-filters";
import { CreateCAPADialog } from "./create-capa-standalone-dialog";
import { Suspense } from "react";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/layout/page-header";
import { KPISparkCard } from "@/components/ui/kpi-spark-card";

export const dynamic = "force-dynamic";

interface PageProps {
    searchParams: Promise<{ status?: string; type?: string; priority?: string }>;
}

export default async function CAPAPage({ searchParams }: PageProps) {
    const params = await searchParams;
    const { data: capas } = await getCAPAActions({
        status: params.status,
        type: params.type,
    });
    const { data: users } = await getOrganizationUsers();

    // Calculate stats
    const openCapas = capas.filter((c: any) => ["planned", "in_progress"].includes(c.status)).length;
    const overdueCapas = capas.filter((c: any) => {
        if (c.status === "closed" || c.status === "completed") return false;
        if (!c.planned_date) return false;
        return new Date(c.planned_date) < new Date();
    }).length;
    const completedCapas = capas.filter((c: any) => ["completed", "verified", "closed"].includes(c.status)).length;

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            <PageHeader
                variant="emerald"
                icon={<Target className="h-4 w-4" />}
                overline="Quality Management System"
                title="Gestão de CAPA"
                description="Plano de Ações Corretivas e Preventivas para melhoria contínua e resolução de desvios."
                backHref="/quality/qms"
                actions={<CreateCAPADialog users={users} />}
            />

            {/* Stats Dashboard */}
            <div className="grid gap-4 md:grid-cols-3">
                <KPISparkCard
                    variant="indigo"
                    title="Ações Abertas"
                    value={openCapas.toString().padStart(2, '0')}
                    description="Investigation Pending"
                    icon={<Clock className="h-4 w-4" />}
                    data={[5, 8, 6, 7, 5].map(v => ({ value: v }))}
                />
                <KPISparkCard
                    variant={overdueCapas > 0 ? "rose" : "amber"}
                    title="Prazo Crítico"
                    value={overdueCapas.toString().padStart(2, '0')}
                    description="SLA Breached"
                    icon={<AlertTriangle className="h-4 w-4" />}
                    data={[1, 0, 2, 1, overdueCapas].map(v => ({ value: v }))}
                />
                <KPISparkCard
                    variant="emerald"
                    title="Concluídas"
                    value={completedCapas.toString().padStart(2, '0')}
                    description="Actions Verified"
                    icon={<ShieldCheck className="h-4 w-4" />}
                    data={[10, 12, 11, 13, 15].map(v => ({ value: v }))}
                />
            </div>

            {/* Filters Section */}
            <div className="bg-card p-4 rounded-2xl border border-slate-800 shadow-sm flex flex-col md:flex-row gap-4 items-center">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-500 min-w-fit">
                    <Filter className="h-3.5 w-3.5" />
                    Filtrar Por:
                </div>
                <Suspense fallback={<div className="h-10 w-full bg-slate-950/20 animate-pulse rounded-xl" />}>
                    <CAPAFilters />
                </Suspense>
            </div>

            {/* Main List */}
            <div className="bg-card border border-slate-800 shadow-xl rounded-2xl overflow-hidden">
                <div className="p-6 border-b border-slate-800 flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-bold">Plano de Atividades CAPA</h3>
                        <p className="text-sm text-slate-500">
                            {capas.length} ações registadas no sistema
                            {(params.status || params.type) && " (com filtros aplicados)"}
                        </p>
                    </div>
                </div>
                <div className="p-0">
                    <CAPAListClient capas={capas} />
                </div>
            </div>
        </div>
    );
}



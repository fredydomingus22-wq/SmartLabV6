import { getCAPAActions } from "@/lib/queries/qms";
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
            {/* Header Section */}
            <div className="glass p-6 rounded-3xl border-none shadow-xl bg-gradient-to-br from-emerald-500/5 to-transparent">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                        <Link href="/quality/qms">
                            <Button variant="ghost" size="icon" className="rounded-xl hover:bg-white/5">
                                <ArrowLeft className="h-5 w-5" />
                            </Button>
                        </Link>
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3 text-emerald-400">
                                <Target className="h-7 w-7" />
                                Gestão de CAPA
                            </h1>
                            <p className="text-sm text-muted-foreground">
                                Plano de Ações Corretivas e Preventivas para melhoria contínua
                            </p>
                        </div>
                    </div>
                    <CreateCAPADialog />
                </div>
            </div>

            {/* Stats Dashboard */}
            <div className="grid gap-4 md:grid-cols-3">
                <StatCard
                    title="Ações Abertas"
                    value={openCapas}
                    icon={Clock}
                    color="text-indigo-400"
                    bgColor="bg-indigo-500/10"
                />
                <StatCard
                    title="Prazo Crítico"
                    value={overdueCapas}
                    icon={AlertTriangle}
                    color="text-rose-400"
                    bgColor="bg-rose-500/10"
                    isCritical={overdueCapas > 0}
                />
                <StatCard
                    title="Concluídas"
                    value={completedCapas}
                    icon={ShieldCheck}
                    color="text-emerald-400"
                    bgColor="bg-emerald-500/10"
                />
            </div>

            {/* Filters Section */}
            <div className="glass p-4 rounded-2xl border-none shadow-sm flex flex-col md:flex-row gap-4 items-center">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground min-w-fit">
                    <Filter className="h-3.5 w-3.5" />
                    Filtrar Por:
                </div>
                <Suspense fallback={<div className="h-10 w-full bg-muted/20 animate-pulse rounded-xl" />}>
                    <CAPAFilters />
                </Suspense>
            </div>

            {/* Main List */}
            <div className="glass border-none shadow-xl rounded-2xl overflow-hidden">
                <div className="p-6 border-b border-border/50 flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-bold">Plano de Atividades CAPA</h3>
                        <p className="text-sm text-muted-foreground">
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

function StatCard({ title, value, icon: Icon, color, bgColor, isCritical }: any) {
    return (
        <Card className={cn("glass border-none shadow-md transition-all", isCritical && "ring-1 ring-rose-500/30 shadow-rose-500/5")}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{title}</CardTitle>
                <div className={cn("p-2 rounded-lg", bgColor)}>
                    <Icon className={cn("h-4 w-4", color)} />
                </div>
            </CardHeader>
            <CardContent>
                <div className={cn("text-3xl font-bold", isCritical && "text-rose-500")}>{value}</div>
            </CardContent>
        </Card>
    );
}


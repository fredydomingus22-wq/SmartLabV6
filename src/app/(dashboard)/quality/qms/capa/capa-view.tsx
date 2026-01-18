"use client";

import { Clock, AlertTriangle, ShieldCheck, Filter, Target } from "lucide-react";
import { KPICard } from "@/components/defaults/kpi-card";
import { CAPAListClient } from "./capa-list-client";
import { CAPAFilters } from "./capa-filters";
import { CreateCAPADialog } from "./create-capa-standalone-dialog";
import { Suspense } from "react";

interface CAPAViewProps {
    capas: any[];
    searchParams: { status?: string; type?: string; priority?: string };
    users: any[];
}

export function CAPAView({ capas, searchParams, users }: CAPAViewProps) {
    // Calculate stats
    const openCapas = capas.filter((c: any) => ["planned", "in_progress"].includes(c.status)).length;
    const overdueCapas = capas.filter((c: any) => {
        if (c.status === "closed" || c.status === "completed") return false;
        if (!c.planned_date) return false;
        return new Date(c.planned_date) < new Date();
    }).length;
    const completedCapas = capas.filter((c: any) => ["completed", "verified", "closed"].includes(c.status)).length;

    return (
        <div className="space-y-6 animate-in fade-in duration-700">
            {/* Stats Dashboard */}
            <div className="grid gap-4 md:grid-cols-3">
                <KPICard
                    title="Ações Abertas"
                    value={openCapas}
                    description="Investigation Pending"
                    icon={Clock}
                    trend="Active"
                    trendDirection="neutral"
                />
                <KPICard
                    title="Prazo Crítico"
                    value={overdueCapas}
                    description="SLA Breached"
                    icon={AlertTriangle}
                    trend={overdueCapas > 0 ? "Critical" : "On Track"}
                    trendDirection={overdueCapas > 0 ? "down" : "up"}
                />
                <KPICard
                    title="Concluídas"
                    value={completedCapas}
                    description="Actions Verified"
                    icon={ShieldCheck}
                    trend="Completed"
                    trendDirection="up"
                />
            </div>

            {/* Filters Section */}
            <div className="bg-card p-4 rounded-xl border border-border shadow-sm flex flex-col md:flex-row gap-4 items-center bg-muted/20">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground min-w-fit">
                    <Filter className="h-3.5 w-3.5" />
                    Filtrar Por:
                </div>
                <Suspense fallback={<div className="h-10 w-full bg-muted animate-pulse rounded-xl" />}>
                    <CAPAFilters />
                </Suspense>
            </div>

            {/* Main List */}
            <div className="bg-card border border-border shadow-sm rounded-xl overflow-hidden">
                <div className="p-4 sm:p-6 border-b border-border flex items-center justify-between">
                    <div>
                        <h3 className="text-base font-semibold">Plano de Atividades CAPA</h3>
                        <p className="text-sm text-muted-foreground">
                            {capas.length} ações registadas
                            {(searchParams.status || searchParams.type) && " (com filtros aplicados)"}
                        </p>
                    </div>
                    <CreateCAPADialog users={users} />
                </div>
                <div className="p-0">
                    <CAPAListClient capas={capas} />
                </div>
            </div>
        </div>
    );
}

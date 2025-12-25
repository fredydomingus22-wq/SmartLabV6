import { getCAPAActions } from "@/lib/queries/qms";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, CheckCircle, Clock, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { CAPAListClient } from "./capa-list-client";
import { CAPAFilters } from "./capa-filters";
import { CreateCAPADialog } from "./create-capa-standalone-dialog";
import { Suspense } from "react";

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
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/quality/qms">
                        <Button variant="ghost" size="icon">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                            <CheckCircle className="h-8 w-8 text-blue-500" />
                            Gestão de CAPA
                        </h1>
                        <p className="text-muted-foreground">
                            Ações Corretivas e Preventivas
                        </p>
                    </div>
                </div>
                <CreateCAPADialog />
            </div>

            {/* Stats */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card className="glass">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <Clock className="h-4 w-4 text-blue-500" />
                            Ações Abertas
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{openCapas}</div>
                    </CardContent>
                </Card>

                <Card className="glass border-red-500/30">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4 text-red-500" />
                            Atrasadas
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-500">{overdueCapas}</div>
                    </CardContent>
                </Card>

                <Card className="glass border-green-500/30">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            Concluídas
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-500">{completedCapas}</div>
                    </CardContent>
                </Card>
            </div>

            {/* Filters */}
            <Suspense fallback={<div className="h-16 bg-muted/30 rounded-lg animate-pulse" />}>
                <CAPAFilters />
            </Suspense>

            {/* CAPA List */}
            <Card className="glass">
                <CardHeader>
                    <CardTitle>Todas as Ações CAPA</CardTitle>
                    <CardDescription>
                        {capas.length} resultado(s)
                        {(params.status || params.type || params.priority) && " (filtrado)"}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <CAPAListClient capas={capas} />
                </CardContent>
            </Card>

        </div>
    );
}


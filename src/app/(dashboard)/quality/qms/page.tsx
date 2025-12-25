import { getNonconformities, getQMSKpis } from "@/lib/queries/qms";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, AlertCircle, Clock, CheckCircle, FileWarning } from "lucide-react";
import Link from "next/link";
import { NCListClient } from "./nc-list-client";
import { CreateNCDialog } from "./create-nc-dialog";
import { NCFilters } from "./nc-filters";
import { Suspense } from "react";

export const dynamic = "force-dynamic";

interface PageProps {
    searchParams: Promise<{ status?: string; severity?: string; type?: string }>;
}

export default async function QMSPage({ searchParams }: PageProps) {
    const params = await searchParams;
    const kpis = await getQMSKpis();
    const { data: nonconformities } = await getNonconformities({
        status: params.status,
        severity: params.severity,
        ncType: params.type,
    });

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                        <FileWarning className="h-8 w-8 text-primary" />
                        Gestão da Qualidade (QMS)
                    </h1>
                    <p className="text-muted-foreground">
                        Não Conformidades (NC), CAPA e Relatórios 8D
                    </p>
                </div>
                <CreateNCDialog />
            </div>

            {/* KPI Cards */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card className="glass">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">NCs Abertas</CardTitle>
                        <AlertCircle className="h-4 w-4 text-orange-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{kpis.openNCs}</div>
                        <p className="text-xs text-muted-foreground">
                            A requerer atenção
                        </p>
                    </CardContent>
                </Card>

                <Card className="glass border-red-500/30">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Atrasadas</CardTitle>
                        <Clock className="h-4 w-4 text-red-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-500">{kpis.overdueNCs}</div>
                        <p className="text-xs text-muted-foreground">
                            Data limite ultrapassada
                        </p>
                    </CardContent>
                </Card>

                <Card className="glass border-yellow-500/30">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Críticas</CardTitle>
                        <AlertTriangle className="h-4 w-4 text-yellow-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-yellow-500">{kpis.criticalNCs}</div>
                        <p className="text-xs text-muted-foreground">
                            Alta gravidade ativas
                        </p>
                    </CardContent>
                </Card>

                <Card className="glass">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">CAPAs Abertas</CardTitle>
                        <CheckCircle className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{kpis.openCAPAs}</div>
                        <p className="text-xs text-muted-foreground">
                            Ações pendentes
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Quick Actions */}
            <div className="flex gap-2">
                <Link href="/quality/qms/capa">
                    <Button variant="outline">Ver Todas as CAPAs</Button>
                </Link>
                <Link href="/quality/qms/8d">
                    <Button variant="outline">Relatórios 8D</Button>
                </Link>
            </div>

            {/* Filters */}
            <Suspense fallback={<div className="h-16 bg-muted/30 rounded-lg animate-pulse" />}>
                <NCFilters />
            </Suspense>

            {/* Nonconformities List */}
            <Card className="glass">
                <CardHeader>
                    <CardTitle>Não Conformidades</CardTitle>
                    <CardDescription>
                        {nonconformities.length} resultado(s)
                        {(params.status || params.severity || params.type) && " (filtrado)"}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <NCListClient nonconformities={nonconformities} />
                </CardContent>
            </Card>
        </div>
    );
}



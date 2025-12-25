import { Suspense } from "react";
import { getAudits, getAuditKpis, getAuditChecklists } from "@/lib/queries/audits";
import { getUsers } from "@/lib/queries/users";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ClipboardCheck, Calendar, Clock, AlertTriangle, CheckCircle } from "lucide-react";
import { CreateAuditDialog } from "./_components/create-audit-dialog";
import { AuditListClient } from "./_components/audit-list-client";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

interface PageProps {
    searchParams: Promise<{ status?: string }>;
}

export default async function AuditsPage({ searchParams }: PageProps) {
    const params = await searchParams;
    const kpis = await getAuditKpis();
    const { data: audits } = await getAudits({ status: params.status });
    const { data: checklists } = await getAuditChecklists();
    const { data: users } = await getUsers();

    return (
        <div className="p-6 space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                        <ClipboardCheck className="h-8 w-8 text-emerald-400" />
                        Auditorias Internas (Clause 9.2)
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Planeamento, execução e acompanhamento de auditorias do sistema de gestão.
                    </p>
                </div>
                <CreateAuditDialog checklists={checklists} users={users} />
            </div>

            {/* KPIs */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card className="glass border-slate-800/50">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Total de Auditorias</CardTitle>
                        <ClipboardCheck className="h-4 w-4 text-slate-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-slate-100">{kpis.total}</div>
                        <p className="text-xs text-muted-foreground">No ciclo atual</p>
                    </CardContent>
                </Card>

                <Card className="glass border-slate-800/50">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Planeadas</CardTitle>
                        <Calendar className="h-4 w-4 text-emerald-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-emerald-400">{kpis.planned}</div>
                        <p className="text-xs text-muted-foreground">A aguardar execução</p>
                    </CardContent>
                </Card>

                <Card className="glass border-slate-800/50">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Em Curso</CardTitle>
                        <Clock className="h-4 w-4 text-amber-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-amber-400">{kpis.ongoing}</div>
                        <p className="text-xs text-muted-foreground">Execução ativa</p>
                    </CardContent>
                </Card>

                <Card className="glass border-red-500/30">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Em Atraso</CardTitle>
                        <AlertTriangle className="h-4 w-4 text-red-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-500">{kpis.overdue}</div>
                        <p className="text-xs text-muted-foreground">Data limite ultrapassada</p>
                    </CardContent>
                </Card>
            </div>

            {/* Main Content */}
            <Card className="glass border-slate-800/50">
                <CardHeader>
                    <CardTitle>Plano Anual de Auditorias</CardTitle>
                    <CardDescription>
                        Acompanhe o estado de todas as auditorias planeadas e realizadas.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <AuditListClient audits={audits} />
                </CardContent>
            </Card>
        </div>
    );
}

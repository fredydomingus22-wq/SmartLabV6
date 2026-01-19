import { Suspense } from "react";
import { getReportHistory, getSamplesForCoA, getBatchesForReport, getReportsAnalytics } from "@/lib/queries/reports";
import ReportsDashboardClient from "./_components/reports-dashboard-client";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Sparkles, FileText } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default async function ReportsPage() {
    // Revert to pure SSR fetching
    const [recentReports, samples, batches, analytics] = await Promise.all([
        getReportHistory({ limit: 8 }),
        getSamplesForCoA(),
        getBatchesForReport(),
        getReportsAnalytics()
    ]);

    return (
        <div className="space-y-10 px-6 pb-20">
            <PageHeader
                title="Consola de Inteligência & Relatórios"
                overline="Operational Intelligence"
                description="Monitorização de KPIs críticos, emissão de certificados e extração de dados analíticos."
                icon={<Sparkles className="h-4 w-4" />}
                variant="blue"
                actions={
                    <Badge variant="outline" className="h-10 px-4 border-success/20 text-success bg-success/5 font-black uppercase tracking-[0.2em] text-[10px]">
                        <TrendingUp className="h-4 w-4 mr-2" />
                        Motor Analítico: Operacional
                    </Badge>
                }
            />

            <Suspense fallback={<div className="grid gap-6 md:grid-cols-3"><Skeleton className="h-40 bg-slate-900/50" /><Skeleton className="h-40 bg-slate-900/50" /><Skeleton className="h-40 bg-slate-900/50" /></div>}>
                <ReportsDashboardClient
                    recentReports={recentReports.data || []}
                    samples={samples.data || []}
                    batches={batches.data || []}
                    analytics={analytics}
                />
            </Suspense>
        </div>
    );
}

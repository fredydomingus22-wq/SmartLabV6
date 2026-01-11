import { Suspense } from "react";
import { getSupplierPerformanceMetrics } from "@/lib/queries/suppliers-performance";
import { SupplierPerformanceClient } from "./performance-client";
import { Skeleton } from "@/components/ui/skeleton";

export const dynamic = "force-dynamic";

export default async function SupplierPerformancePage() {
    const metrics = await getSupplierPerformanceMetrics();

    return (
        <div className="container py-8 space-y-8">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-black tracking-tighter text-white uppercase italic">
                    Performance de Fornecedores
                </h1>
                <p className="text-slate-400 font-medium max-w-2xl">
                    Análise técnica de conformidade, rejeições e incidentes de qualidade por parceiro comercial.
                </p>
            </div>

            <Suspense fallback={<DashboardSkeleton />}>
                <SupplierPerformanceClient initialData={metrics} />
            </Suspense>
        </div>
    );
}

function DashboardSkeleton() {
    return (
        <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[1, 2, 3].map(i => (
                    <div key={i} className="h-32 rounded-[2rem] bg-slate-900/50 border border-slate-800 animate-pulse" />
                ))}
            </div>
            <div className="h-[500px] rounded-[2rem] bg-slate-900/50 border border-slate-800 animate-pulse" />
        </div>
    );
}

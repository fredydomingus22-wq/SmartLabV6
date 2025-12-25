import { Suspense } from "react";
import { getDashboardSamples, getLabStats, getSampleTypes, getActiveTanks } from "@/lib/queries/lab";
import { DashboardClient } from "./dashboard-client";
import { Skeleton } from "@/components/ui/skeleton";
import type { Metadata } from 'next';
import { getSafeUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
    title: 'Gestão de Amostras | SmartLab',
    description: 'Sample Management and Lab Analysis Dashboard',
};

// Helper for sampling points (consider moving to lab.ts if reused)
async function getSamplingPoints(orgId: string) {
    const supabase = await createClient();
    const { data } = await supabase
        .from("sampling_points")
        .select("id, name, code, location")
        .eq("organization_id", orgId)
        .order("name");
    return data || [];
}

export default async function LabPage(props: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
    const searchParams = await props.searchParams;
    const user = await getSafeUser();

    // Parse filters
    const search = typeof searchParams.search === 'string' ? searchParams.search : undefined;
    const status = typeof searchParams.status === 'string' ? searchParams.status : undefined;
    const dateParam = typeof searchParams.date === 'string' ? searchParams.date : undefined;

    let from = typeof searchParams.from === 'string' ? searchParams.from : undefined;
    let to = typeof searchParams.to === 'string' ? searchParams.to : undefined;

    // If generic 'date' param is provided, use it for both from/to (single day filter)
    if (dateParam) {
        from = dateParam;
        to = dateParam;
    }

    // Fetch data in parallel
    const [samples, stats, sampleTypes, tanks, samplingPoints] = await Promise.all([
        getDashboardSamples({
            search,
            status,
            from,
            to,
        }),
        getLabStats(),
        getSampleTypes(),
        getActiveTanks(),
        getSamplingPoints(user.organization_id)
    ]);

    return (
        <div className="h-full flex-1 flex-col p-3 sm:p-4 md:p-8 space-y-4 md:space-y-8 md:flex">
            <Suspense fallback={<DashboardSkeleton />}>
                <DashboardClient
                    samples={samples || []}
                    stats={stats}
                    sampleTypes={sampleTypes || []}
                    tanks={tanks as any[] || []}
                    samplingPoints={samplingPoints || []}
                    plantId={user.plant_id}
                />
            </Suspense>
        </div>
    );
}

function DashboardSkeleton() {
    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="space-y-2">
                    <Skeleton className="h-8 w-64" />
                    <Skeleton className="h-4 w-96" />
                </div>
                <Skeleton className="h-10 w-32" />
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Skeleton className="h-24 rounded-xl" />
                <Skeleton className="h-24 rounded-xl" />
                <Skeleton className="h-24 rounded-xl" />
                <Skeleton className="h-24 rounded-xl" />
            </div>

            <div className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-4">
                    <Skeleton className="h-10 flex-1" />
                    <Skeleton className="h-10 w-[180px]" />
                    <Skeleton className="h-10 w-[240px]" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {Array.from({ length: 8 }).map((_, i) => (
                        <Skeleton key={i} className="h-[280px] rounded-xl" />
                    ))}
                </div>
            </div>
        </div>
    );
}

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
            <DashboardClient
                samples={samples || []}
                stats={stats}
                sampleTypes={sampleTypes || []}
                tanks={tanks as any[] || []}
                samplingPoints={samplingPoints || []}
                plantId={user.plant_id}
            />
        </div>
    );
}

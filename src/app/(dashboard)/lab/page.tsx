import { Suspense } from "react";
export const dynamic = "force-dynamic";
import { getDashboardSamples, getLabStats, getSampleTypes, getActiveTanks } from "@/lib/queries/lab";
import { DashboardClient } from "./dashboard-client";
import { Skeleton } from "@/components/ui/skeleton";
import type { Metadata } from 'next';
import { getSafeUser } from "@/lib/auth.server";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/layout/page-header";
import { PageShell } from "@/components/defaults/page-shell";
import { Beaker, FlaskConical, Microscope } from "lucide-react";

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
    const labType = (searchParams.labType as 'FQ' | 'MICRO' | 'all') || 'all';
    const dateParam = typeof searchParams.date === 'string' ? searchParams.date : undefined;

    let from = typeof searchParams.from === 'string' ? searchParams.from : undefined;
    let to = typeof searchParams.to === 'string' ? searchParams.to : undefined;

    // If generic 'date' param is provided, use it for both from/to (single day filter)
    if (dateParam) {
        from = dateParam;
        to = dateParam;
    }

    // Fetch data in parallel
    const [samples, stats, sampleTypes, tanks, samplingPoints, users] = await Promise.all([
        getDashboardSamples({
            search,
            status,
            labType,
            from,
            to,
        }),
        getLabStats(),
        getSampleTypes(),
        getActiveTanks(),
        getSamplingPoints(user.organization_id!),
        (async () => {
            try {
                const supabase = await createClient();
                const { data, error } = await supabase
                    .from("user_profiles")
                    .select("id, full_name, role")
                    .eq("organization_id", user.organization_id!)
                    .order("full_name");
                if (error) console.error("LabPage users fetch error:", error);
                return data || [];
            } catch (err) {
                console.error("LabPage users async error:", err);
                return [];
            }
        })()
    ]);

    const headerTitle = user.role === 'lab_analyst' ? 'Laboratório FQ' : user.role === 'micro_analyst' ? 'Laboratório Micro' : 'Controlo de Amostras';
    const headerIcon = user.role === 'lab_analyst' ? FlaskConical : user.role === 'micro_analyst' ? Microscope : Beaker;
    const headerDesc = user.role === 'lab_analyst'
        ? 'Gestão de Análises Físico-Químicas e Controlo de Processo'
        : user.role === 'micro_analyst'
            ? 'Gestão de Análises Microbiológicas e Incubação'
            : 'Gestão Integrada de Análises Físico-Químicas e Microbiológicas';

    return (
        <PageShell className="space-y-6 pb-10">
            <PageHeader
                variant="blue"
                icon={<headerIcon className="h-4 w-4" />}
                overline="Laboratory Operations"
                title={headerTitle}
                description={headerDesc}
            />

            <div className="px-4 md:px-6 pb-6 mt-[-1rem]">
                <main className="relative">
                    <Suspense fallback={<div className="p-8"><Skeleton className="h-96 w-full rounded-xl bg-slate-900/50" /></div>}>
                        <DashboardClient
                            samples={samples || []}
                            stats={stats}
                            sampleTypes={sampleTypes || []}
                            tanks={tanks as any[] || []}
                            samplingPoints={samplingPoints || []}
                            plantId={user.plant_id!}
                            userRole={user.role}
                            initialLabType={labType}
                            users={users as any[] || []}
                        />
                    </Suspense>
                </main>

                {/* Global Status Footer */}
                <footer className="flex items-center justify-between pt-10 border-t border-white/5 opacity-50">
                    <span className="text-[10px] font-mono tracking-widest uppercase">Lab Intelligence • ISO 17025 Compliant • 21 CFR Part 11</span>
                    <div className="flex items-center gap-2">
                        <div className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-blue-500">Analytics Engine Active</span>
                    </div>
                </footer>
            </div>
        </PageShell>
    );
}


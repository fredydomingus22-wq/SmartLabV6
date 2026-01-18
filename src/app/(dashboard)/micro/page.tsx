import { getMicroKPIs, getRecentMicroActivities } from "@/lib/queries/micro";
import { MicroDashboardClient } from "./_components/micro-client";
import { PageShell } from "@/components/defaults/page-shell";
import { PageHeader } from "@/components/layout/page-header";
import { Microscope, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default async function MicroDashboardPage() {
    const kpis = await getMicroKPIs();
    const activities = await getRecentMicroActivities();

    return (
        <PageShell>
            <PageHeader
                variant="purple"
                icon={<Microscope className="h-4 w-4" />}
                overline="Laboratório"
                title="Microbiologia"
                description="Controlo de incubação, leituras e conformidade microbiológica."
                actions={
                    <Button asChild className="h-9 bg-purple-600 hover:bg-purple-500 text-white font-black uppercase text-[10px] tracking-widest px-4 rounded-xl shadow-lg shadow-purple-500/20">
                        <Link href="/micro/samples">
                            <Plus className="h-4 w-4 mr-2" />
                            Registar Amostra
                        </Link>
                    </Button>
                }
            />
            <div className="px-4 md:px-6 pb-6 w-full">
                <MicroDashboardClient kpis={kpis} activities={activities} />
            </div>
        </PageShell>
    );
}

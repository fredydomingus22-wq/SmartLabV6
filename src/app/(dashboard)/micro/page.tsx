import { getMicroKPIs, getRecentMicroActivities } from "@/lib/queries/micro";
import { MicroDashboardClient } from "./_components/micro-client";

export default async function MicroDashboardPage() {
    const kpis = await getMicroKPIs();
    const activities = await getRecentMicroActivities();

    return <MicroDashboardClient kpis={kpis} activities={activities} />;
}

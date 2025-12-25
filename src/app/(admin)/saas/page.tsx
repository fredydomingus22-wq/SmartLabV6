import { getGlobalStats } from "@/app/actions/admin/stats";
import { DashboardClient } from "./dashboard-client";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
    const statsResponse = await getGlobalStats();
    const isServiceRoleConfigured = !!process.env.SUPABASE_SERVICE_ROLE_KEY;

    const stats = statsResponse.success && statsResponse.data ? statsResponse.data : {
        totalOrganizations: 0,
        totalUsers: 0,
        totalPlants: 0,
        systemStatus: 'Stable'
    };

    return <DashboardClient stats={stats} isServiceRoleConfigured={isServiceRoleConfigured} />;
}

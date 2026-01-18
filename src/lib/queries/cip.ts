import { createClient } from "@/lib/supabase/server";
import { getSafeUser } from "@/lib/auth.server";

/**
 * Get CIP stats and historical trends
 */
export async function getCIPStats() {
    const supabase = await createClient();
    const user = await getSafeUser();

    // 1. Fetch Summary Counts
    const { count: totalPrograms } = await supabase
        .from("cip_programs")
        .select("*", { count: 'exact', head: true })
        .eq("organization_id", user.organization_id);

    const { count: totalHistory } = await supabase
        .from("cip_logs")
        .select("*", { count: 'exact', head: true })
        .eq("organization_id", user.organization_id);

    // 2. Fetch Active CIPs
    const { data: activeCIPs } = await supabase
        .from("cip_logs")
        .select(`
            *,
            program:cip_programs(name),
            equipment:process_equipment(name)
        `)
        .eq("organization_id", user.organization_id)
        .eq("status", "in_progress")
        .limit(5);

    // 3. Generate Historical Trends (Last 7 Days) for Sparklines
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // CIP Executions trend
    const { data: trendLogs } = await supabase
        .from("cip_logs")
        .select("created_at")
        .eq("organization_id", user.organization_id)
        .gte("created_at", sevenDaysAgo.toISOString())
        .order("created_at", { ascending: true });

    const cipsTrend = Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (6 - i));
        const dateStr = d.toISOString().split('T')[0];
        const count = trendLogs?.filter(l => l.created_at.startsWith(dateStr)).length || 0;
        return { value: count };
    });

    return {
        totalPrograms: totalPrograms || 0,
        totalHistory: totalHistory || 0,
        activeCIPs: activeCIPs || [],
        trends: {
            executions: cipsTrend
        }
    };
}

/**
 * Get recent CIP logs
 */
export async function getRecentCIPLogs(limit: number = 20) {
    const supabase = await createClient();
    const user = await getSafeUser();

    const { data, error } = await supabase
        .from("cip_logs")
        .select(`
            *,
            program:cip_programs(name),
            equipment:process_equipment(name),
            operator:user_profiles!cip_logs_operator_id_fkey(full_name)
        `)
        .eq("organization_id", user.organization_id)
        .order("created_at", { ascending: false })
        .limit(limit);

    if (error) throw error;
    return data;
}

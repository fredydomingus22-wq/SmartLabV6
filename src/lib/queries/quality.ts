import { createClient } from "@/lib/supabase/server";
import { getSafeUser } from "@/lib/auth.server";

/**
 * Get Quality KPIs for dashboard
 */
export async function getQualityKPIs() {
    const supabase = await createClient();
    const user = await getSafeUser();

    // Get NC counts by status
    const { data: ncCounts } = await supabase
        .from("nonconformities")
        .select("status")
        .eq("organization_id", user.organization_id)
        .is("deleted_at", null)
        .throwOnError();

    const openNCs = ncCounts?.filter(nc => nc.status === "open").length || 0;
    const inProgressNCs = ncCounts?.filter(nc => nc.status === "in_progress").length || 0;
    const closedNCs = ncCounts?.filter(nc => nc.status === "closed").length || 0;
    const totalNCs = ncCounts?.length || 0;

    // Get CAPA counts
    const { data: capaCounts } = await supabase
        .from("capa_actions")
        .select("status")
        .eq("organization_id", user.organization_id)
        .is("deleted_at", null)
        .throwOnError();

    const openCAPAs = capaCounts?.filter(c => c.status === "open" || c.status === "in_progress").length || 0;
    const totalCAPAs = capaCounts?.length || 0;

    // Get analysis stats (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: recentAnalysis } = await supabase
        .from("lab_analysis")
        .select("is_conforming")
        .eq("organization_id", user.organization_id)
        .gte("analyzed_at", thirtyDaysAgo.toISOString())
        .is("deleted_at", null)
        .throwOnError();

    const totalAnalysis = recentAnalysis?.length || 0;
    const conformingCount = recentAnalysis?.filter(r => r.is_conforming === true).length || 0;
    const fpy = totalAnalysis > 0 ? Math.round((conformingCount / totalAnalysis) * 100) : 100;

    // NC Rate (NCs per 100 analyses)
    const ncRate = totalAnalysis > 0 ? ((totalNCs / totalAnalysis) * 100).toFixed(1) : "0.0";

    // Trending Data (Last 7 Days) for Sparklines
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // 1. FPY Trend (Daily conforming analyses vs total)
    const { data: trendAnalysis } = await supabase
        .from("lab_analysis")
        .select("is_conforming, analyzed_at")
        .eq("organization_id", user.organization_id)
        .gte("analyzed_at", sevenDaysAgo.toISOString())
        .order("analyzed_at", { ascending: true });

    const fpyTrend = Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (6 - i));
        const dateStr = d.toISOString().split('T')[0];
        const dayData = trendAnalysis?.filter(a => a.analyzed_at.startsWith(dateStr)) || [];
        const conforming = dayData.filter(a => a.is_conforming).length;
        return { value: dayData.length > 0 ? (conforming / dayData.length) * 100 : 100 };
    });

    // 2. NC Trend (Daily new NCs)
    const { data: trendNCs } = await supabase
        .from("nonconformities")
        .select("detected_date")
        .eq("organization_id", user.organization_id)
        .gte("detected_date", sevenDaysAgo.toISOString());

    const ncTrend = Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (6 - i));
        const dateStr = d.toISOString().split('T')[0];
        const count = trendNCs?.filter(nc => nc.detected_date?.startsWith(dateStr)).length || 0;
        return { value: count };
    });

    // 3. CAPA Trend (Daily new CAPAs)
    const { data: trendCAPAs } = await supabase
        .from("capa_actions")
        .select("created_at")
        .eq("organization_id", user.organization_id)
        .gte("created_at", sevenDaysAgo.toISOString());

    const capaTrend = Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (6 - i));
        const dateStr = d.toISOString().split('T')[0];
        const count = trendCAPAs?.filter(capa => capa.created_at?.startsWith(dateStr)).length || 0;
        return { value: count };
    });

    return {
        kpis: {
            openNCs,
            inProgressNCs,
            closedNCs,
            totalNCs,
            openCAPAs,
            totalCAPAs,
            fpy,
            ncRate,
            totalAnalysis,
            sparklines: {
                fpy: fpyTrend,
                nc: ncTrend,
                capa: capaTrend
            }
        },
        error: null,
    };
}

/**
 * Get NC trends over time
 */
export async function getNCTrends(days: number = 30) {
    const supabase = await createClient();
    const user = await getSafeUser();

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data: ncs, error } = await supabase
        .from("nonconformities")
        .select("detected_date, severity, nc_type")
        .eq("organization_id", user.organization_id)
        .gte("detected_date", startDate.toISOString())
        .is("deleted_at", null)
        .order("detected_date", { ascending: true });

    if (error) {
        return { trends: [], error: error.message };
    }

    // Group by date
    const byDate: Record<string, { date: string; count: number; critical: number }> = {};

    ncs?.forEach(nc => {
        const date = nc.detected_date?.split("T")[0] || "";
        if (!byDate[date]) {
            byDate[date] = { date, count: 0, critical: 0 };
        }
        byDate[date].count++;
        if (nc.severity === "critical") {
            byDate[date].critical++;
        }
    });

    return {
        trends: Object.values(byDate),
        error: null,
    };
}

/**
 * Get top defects (Pareto analysis)
 */
export async function getTopDefects(limit: number = 5) {
    const supabase = await createClient();
    const user = await getSafeUser();

    const { data: ncs, error } = await supabase
        .from("nonconformities")
        .select("nc_type")
        .eq("organization_id", user.organization_id)
        .is("deleted_at", null)
        .throwOnError();

    if (error) {
        return { defects: [], error: (error as any).message || String(error) };
    }

    // Count by type
    const byType: Record<string, number> = {};
    ncs?.forEach(nc => {
        const type = nc.nc_type || "other";
        byType[type] = (byType[type] || 0) + 1;
    });

    // Sort by count and take top N
    const sorted = Object.entries(byType)
        .map(([type, count]) => ({ type, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, limit);

    return {
        defects: sorted,
        error: null,
    };
}


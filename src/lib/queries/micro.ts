import { createClient } from "@/lib/supabase/server";
import { getSafeUser } from "@/lib/auth.server";

export async function getMicroKPIs() {
    const supabase = await createClient();
    const user = await getSafeUser();

    // 1. Incubating: Sessions with status 'in_progress'
    const { count: incubatingCount, error: err1 } = await supabase
        .from("micro_test_sessions")
        .select("*", { count: "exact", head: true })
        .eq("organization_id", user.organization_id)
        .eq("status", "in_progress");

    // 2. Pending Reading: Complex calculation
    // Sessions 'in_progress' where (started_at + media_type.incubation_hours_min) < now
    // We filter this in JS because of complexity
    const { data: activeSessions, error: err2 } = await supabase
        .from("micro_test_sessions")
        .select(`
            id, 
            started_at, 
            status,
            micro_results!inner (
                media_lot_id,
                micro_media_lots!inner (
                    media_type_id,
                    micro_media_types!inner (
                        incubation_hours_min
                    )
                )
            )
        `)
        .eq("organization_id", user.organization_id)
        .eq("status", "in_progress");

    let pendingReadingCount = 0;
    if (activeSessions) {
        const now = new Date();
        pendingReadingCount = activeSessions.filter((session: any) => {
            if (!session.started_at) return false;

            // Find max incubation time among all results in this session
            let maxHours = 0;
            // micro_results is an array
            const results = Array.isArray(session.micro_results) ? session.micro_results : [session.micro_results];

            results.forEach((res: any) => {
                const hours = res.micro_media_lots?.micro_media_types?.incubation_hours_min || 0;
                if (hours > maxHours) maxHours = hours;
            });

            if (maxHours === 0) return false; // Should not happen if configured correctly

            const startTime = new Date(session.started_at);
            const targetTime = new Date(startTime.getTime() + maxHours * 60 * 60 * 1000); // Add hours

            return now > targetTime; // Ready if Now is past Target
        }).length;
    }

    // 3. Completed Today: Results created today
    const { count: completedTodayCount, error: err3 } = await supabase
        .from("micro_results")
        .select("*", { count: "exact", head: true })
        .eq("organization_id", user.organization_id)
        .gte("created_at", new Date().toISOString().split('T')[0]);

    if (err1 || err2 || err3) {
        console.error("Error fetching Micro KPIs:", err1, err2, err3);
    }

    return {
        incubating: incubatingCount || 0,
        pendingReading: pendingReadingCount || 0,
        completedToday: completedTodayCount || 0,
    };
}

export async function getRecentMicroActivities() {
    const supabase = await createClient();
    const user = await getSafeUser();

    const { data } = await supabase
        .from("micro_test_sessions")
        .select(`
            id,
            created_at,
            status,
            incubator_id,
            micro_incubators (name),
            started_by
        `)
        .eq("organization_id", user.organization_id)
        .order("created_at", { ascending: false })
        .limit(5);

    return data || [];
}


import { createClient } from "@/lib/supabase/server";
import { getSafeUser } from "@/lib/auth";

/**
 * Get all quality objectives for the organization
 */
export async function getObjectives(filters?: { status?: string; category?: string }) {
    const supabase = await createClient();
    const user = await getSafeUser();

    let query = supabase
        .from("quality_objectives")
        .select(`
            *,
            owner:user_profiles!owner_id(full_name),
            plant:plants(name)
        `)
        .eq("organization_id", user.organization_id)
        .order("target_date", { ascending: true });

    if (filters?.status) {
        query = query.eq("status", filters.status);
    }
    if (filters?.category) {
        query = query.eq("category", filters.category);
    }

    const { data, error } = await query;
    return { data: data || [], error };
}

/**
 * Get a single objective by ID
 */
export async function getObjectiveById(id: string) {
    const supabase = await createClient();
    const user = await getSafeUser();

    const { data, error } = await supabase
        .from("quality_objectives")
        .select(`
            *,
            owner:user_profiles!owner_id(full_name),
            plant:plants(name)
        `)
        .eq("organization_id", user.organization_id)
        .eq("id", id)
        .single();

    return { data, error };
}

/**
 * Get KPI summary for objectives dashboard
 */
export async function getObjectiveKpis() {
    const supabase = await createClient();
    const user = await getSafeUser();

    const { data, error } = await supabase
        .from("quality_objectives")
        .select("id, status, current_value, target_value")
        .eq("organization_id", user.organization_id);

    if (error || !data) {
        return { total: 0, onTrack: 0, atRisk: 0, achieved: 0, missed: 0, avgProgress: 0 };
    }

    const total = data.length;
    const onTrack = data.filter(o => o.status === 'on_track').length;
    const atRisk = data.filter(o => o.status === 'at_risk').length;
    const achieved = data.filter(o => o.status === 'achieved').length;
    const missed = data.filter(o => o.status === 'missed').length;

    const avgProgress = total > 0
        ? Math.round(data.reduce((acc, o) => acc + (o.target_value > 0 ? (o.current_value / o.target_value) * 100 : 0), 0) / total)
        : 0;

    return { total, onTrack, atRisk, achieved, missed, avgProgress };
}

import { createClient } from "@/lib/supabase/server";
import { getSafeUser } from "@/lib/auth";

/**
 * Get all nonconformities with optional filters
 */
export async function getNonconformities(filters?: {
    status?: string;
    severity?: string;
    ncType?: string;
}) {
    const supabase = await createClient();
    const user = await getSafeUser();

    let query = supabase
        .from("nonconformities")
        .select("*")
        .eq("organization_id", user.organization_id)
        .order("detected_date", { ascending: false });

    if (filters?.status) {
        query = query.eq("status", filters.status);
    }
    if (filters?.severity) {
        query = query.eq("severity", filters.severity);
    }
    if (filters?.ncType) {
        query = query.eq("nc_type", filters.ncType);
    }

    const { data, error } = await query;

    if (error) {
        console.error("getNonconformities error:", error);
    }

    return { data: data || [], error };
}

/**
 * Get single nonconformity with related CAPAs and 8D
 */
export async function getNonconformityById(id: string) {
    const supabase = await createClient();
    const user = await getSafeUser();

    // Simplified query without user joins to avoid potential failures
    const { data: nc, error: ncError } = await supabase
        .from("nonconformities")
        .select("*")
        .eq("organization_id", user.organization_id)
        .eq("id", id)
        .single();

    if (ncError) {
        console.error("getNonconformityById error:", ncError);
        return { nc: null, capas: [], eightD: null, error: ncError.message };
    }

    // Get related CAPAs - simplified
    const { data: capas } = await supabase
        .from("capa_actions")
        .select("*")
        .eq("organization_id", user.organization_id)
        .eq("nonconformity_id", id)
        .order("created_at", { ascending: true });

    // Get related 8D report
    const { data: eightD } = await supabase
        .from("eight_d_reports")
        .select("*")
        .eq("organization_id", user.organization_id)
        .eq("nonconformity_id", id)
        .maybeSingle();

    return { nc, capas: capas || [], eightD, error: null };
}

/**
 * Get QMS KPIs
 */
export async function getQMSKpis() {
    const supabase = await createClient();
    const user = await getSafeUser();

    // Open NCs
    const { count: openNCs } = await supabase
        .from("nonconformities")
        .select("*", { count: "exact", head: true })
        .eq("organization_id", user.organization_id)
        .in("status", ["open", "under_investigation", "containment"]);

    // Overdue NCs
    const today = new Date().toISOString().split("T")[0];
    const { count: overdueNCs } = await supabase
        .from("nonconformities")
        .select("*", { count: "exact", head: true })
        .eq("organization_id", user.organization_id)
        .neq("status", "closed")
        .lt("due_date", today);

    // Open CAPAs
    const { count: openCAPAs } = await supabase
        .from("capa_actions")
        .select("*", { count: "exact", head: true })
        .eq("organization_id", user.organization_id)
        .in("status", ["planned", "in_progress"]);

    // Critical NCs
    const { count: criticalNCs } = await supabase
        .from("nonconformities")
        .select("*", { count: "exact", head: true })
        .eq("organization_id", user.organization_id)
        .eq("severity", "critical")
        .neq("status", "closed");

    return {
        openNCs: openNCs || 0,
        overdueNCs: overdueNCs || 0,
        openCAPAs: openCAPAs || 0,
        criticalNCs: criticalNCs || 0,
    };
}

/**
 * Get all CAPA actions with optional filters
 */
export async function getCAPAActions(filters?: {
    status?: string;
    type?: string;
    ncId?: string;
}) {
    const supabase = await createClient();
    const user = await getSafeUser();

    let query = supabase
        .from("capa_actions")
        .select(`
            *,
            nonconformity:nonconformities(nc_number, title),
            responsible_user:user_profiles!responsible_id(full_name)
        `)
        .eq("organization_id", user.organization_id)
        .order("created_at", { ascending: false });

    if (filters?.status) {
        query = query.eq("status", filters.status);
    }
    if (filters?.type) {
        query = query.eq("action_type", filters.type);
    }
    if (filters?.ncId) {
        query = query.eq("nonconformity_id", filters.ncId);
    }

    const { data, error } = await query;
    return { data: data || [], error };
}

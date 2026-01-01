import { createClient } from "@/lib/supabase/server";
import { getSafeUser } from "@/lib/auth.server";

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

    const { data: ncs, error } = await query;

    if (error) {
        console.error("getNonconformities error:", error);
        return { data: [], error };
    }

    if (!ncs || ncs.length === 0) {
        return { data: [], error: null };
    }

    // Fetch AI insights for these NCs
    const ncIds = ncs.map(n => n.id);
    const { data: insights } = await supabase
        .from("ai_insights")
        .select("entity_id, status, message, raw_response, confidence")
        .eq("entity_type", "non_conformity")
        .in("entity_id", ncIds);

    const insightsMap = new Map(insights?.map(i => [i.entity_id, i]) || []);

    const enrichedData = ncs.map(nc => ({
        ...nc,
        ai_insight: insightsMap.get(nc.id) || null
    }));

    return { data: enrichedData, error: null };
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

/**
 * Get all 8D reports with optional filters
 */
export async function getEightDReports(filters?: {
    status?: string;
    ncId?: string;
}) {
    const supabase = await createClient();
    const user = await getSafeUser();

    let query = supabase
        .from("eight_d_reports")
        .select(`
            *,
            nonconformity:nonconformities(nc_number, title)
        `)
        .eq("organization_id", user.organization_id)
        .order("created_at", { ascending: false });

    if (filters?.status) {
        query = query.eq("status", filters.status);
    }
    if (filters?.ncId) {
        query = query.eq("nonconformity_id", filters.ncId);
    }

    const { data, error } = await query;
    return { data: data || [], error };
}

/**
 * Get Pareto data for Non-Conformities
 */
export async function getParetoData(dimension: "category" | "nc_type" | "severity" = "category") {
    const supabase = await createClient();
    const user = await getSafeUser();

    const { data: ncs, error } = await supabase
        .from("nonconformities")
        .select(dimension)
        .eq("organization_id", user.organization_id);

    if (error || !ncs) return [];

    const counts: Record<string, number> = {};
    ncs.forEach(nc => {
        const key = (nc as any)[dimension] || "Indefinido";
        counts[key] = (counts[key] || 0) + 1;
    });

    const sortedData = Object.entries(counts)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count);

    const total = sortedData.reduce((sum, item) => sum + item.count, 0);
    let cumulativeSum = 0;

    return sortedData.map(item => {
        cumulativeSum += item.count;
        return {
            ...item,
            percentage: (item.count / total) * 100,
            cumulativePercentage: (cumulativeSum / total) * 100
        };
    });
}

/**
 * Get all users in the organization for assignment
 */
export async function getOrganizationUsers() {
    const supabase = await createClient();
    const user = await getSafeUser();

    const { data, error } = await supabase
        .from("user_profiles")
        .select("id, full_name, role")
        .eq("organization_id", user.organization_id)
        .order("full_name", { ascending: true });

    if (error) {
        console.error("getOrganizationUsers error:", error);
    }

    return { data: data || [], error };
}

/**
 * Get single CAPA Action with full details
 */
export async function getCAPAById(id: string) {
    const supabase = await createClient();
    const user = await getSafeUser();

    // 1. Fetch CAPA with joins
    const { data: capa, error: capaError } = await supabase
        .from("capa_actions")
        .select(`
            *,
            nonconformity:nonconformities(id, nc_number, title, severity),
            responsible_user:user_profiles!responsible_id(full_name),
            verifier_user:user_profiles!verified_by(full_name),
            training_module:training_modules(id, title)
        `)
        .eq("organization_id", user.organization_id)
        .eq("id", id)
        .single();

    if (capaError) {
        console.error("getCAPAById error:", capaError);
        return { capa: null, error: capaError.message };
    }

    // 2. Fetch Attachments
    const { data: attachments } = await supabase
        .from("capa_actions_attachments")
        .select("*")
        .eq("capa_action_id", id)
        .order("uploaded_at", { ascending: false });

    // 3. Fetch History (Audit Log)
    const { data: history } = await supabase
        .from("qms_audit_log")
        .select(`
            *,
            actor:user_profiles!changed_by(full_name)
        `)
        .eq("entity_id", id)
        .eq("entity_type", "capa_action")
        .order("changed_at", { ascending: false });

    return {
        capa: { ...capa, attachments, history: history || [] },
        error: null
    };
}

import { createClient } from "@/lib/supabase/server";
import { getSafeUser } from "@/lib/auth.server";

export async function getPRPTemplates() {
    const supabase = await createClient();
    const user = await getSafeUser();

    // Fetch templates and include the latest execution for status
    const { data: templates, error } = await supabase
        .from("haccp_prp_templates")
        .select(`
            *,
            haccp_prp_executions (
                id,
                completed_at,
                executed_by
            )
        `)
        .eq("organization_id", user.organization_id)
        .order("created_at", { ascending: false });

    if (error) {
        console.error("Error fetching PRP templates:", error);
        return [];
    }

    // Process to get only the LATEST execution for each
    return templates.map(t => ({
        ...t,
        latest_execution: t.haccp_prp_executions?.length > 0
            ? t.haccp_prp_executions.sort((a: any, b: any) =>
                new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime()
            )[0]
            : null
    }));
}

export async function getPRPTemplateItems(templateId: string) {
    const supabase = await createClient();
    const user = await getSafeUser();

    const { data, error } = await supabase
        .from("haccp_prp_items")
        .select("*")
        .eq("organization_id", user.organization_id)
        .eq("template_id", templateId)
        .order("sort_order", { ascending: true });

    if (error) {
        console.error("Error fetching PRP items:", error);
        return [];
    }

    return data;
}

/**
 * Get active HACCP plan version
 */
export async function getActiveHACCPPlan() {
    const supabase = await createClient();
    const user = await getSafeUser();

    const { data } = await supabase
        .from("haccp_plan_versions")
        .select("*")
        .eq("organization_id", user.organization_id)
        .eq("status", "approved")
        .order("effective_date", { ascending: false })
        .limit(1)
        .maybeSingle();

    return data;
}

/**
 * Get PCC logs with optional filters
 */
export async function getPCCLogs(options?: {
    days?: number;
    hazardId?: string;
    limit?: number;
}) {
    const supabase = await createClient();
    const user = await getSafeUser();

    let query = supabase
        .from("pcc_logs")
        .select("*, hazard:haccp_hazards(process_step, hazard_description)")
        .eq("organization_id", user.organization_id);

    if (options?.days) {
        const date = new Date();
        date.setDate(date.getDate() - options.days);
        query = query.gte("checked_at", date.toISOString());
    }

    if (options?.hazardId) {
        query = query.eq("hazard_id", options.hazardId);
    }

    query = query.order("checked_at", { ascending: false });

    if (options?.limit) {
        query = query.limit(options.limit);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data;
}

/**
 * Get HACCP Performance Stats for Dashboard
 */
export async function getHACCPPerformanceStats() {
    const logs = await getPCCLogs({ days: 30 });
    const plan = await getActiveHACCPPlan();

    const totalChecks = logs?.length || 0;
    const compliantChecks = logs?.filter(l => l.is_compliant).length || 0;
    const complianceRate = totalChecks > 0 ? (compliantChecks / totalChecks) * 100 : 100;
    const openDeviations = logs?.filter(l => !l.is_compliant).length || 0;

    return {
        complianceRate,
        totalChecks,
        compliantChecks,
        openDeviations,
        activeVersion: plan,
    };
}

/**
 * Get Monitoring Points (PCCs & OPRPs)
 */
export async function getMonitoringPoints() {
    const supabase = await createClient();
    const user = await getSafeUser();

    const { data, error } = await supabase
        .from("haccp_hazards")
        .select("*")
        .eq("organization_id", user.organization_id)
        .or("is_pcc.eq.true,is_oprp.eq.true")
        .order("process_step");

    if (error) throw error;
    return data;
}

/**
 * Get active batches for PCC checks
 */
export async function getActiveBatchesForPCC() {
    const supabase = await createClient();
    const user = await getSafeUser();

    // Fixing the relation: 'product' likely points to 'products' table, matching production.ts
    const { data, error } = await supabase
        .from("production_batches")
        .select("id, code, product:products(name)")
        .eq("organization_id", user.organization_id)
        .eq("status", "in_progress")
        .order("created_at", { ascending: false });

    if (error) throw error;
    return data;
}

/**
 * Get AI Insights for HACCP
 */
export async function getHACCPInsights(limit: number = 5) {
    const supabase = await createClient();
    const user = await getSafeUser();

    const { data } = await supabase
        .from("ai_insights")
        .select("*")
        .eq("organization_id", user.organization_id)
        .in("entity_type", ["pcc", "haccp"])
        .order("created_at", { ascending: false })
        .limit(limit);

    return data;
}

/**
 * Get Equipments for PCC Checks
 */
export async function getEquipments() {
    const supabase = await createClient();
    const user = await getSafeUser();

    const { data, error } = await supabase
        .from("equipments")
        .select("id, name, code")
        .eq("organization_id", user.organization_id)
        .order("name");

    if (error) throw error;
    return data;
}


import { createClient } from "@/lib/supabase/server";
import { getSafeUser } from "@/lib/auth.server";

/**
 * Get all audits in the organization
 */
export async function getAudits(filters?: { status?: string }) {
    const supabase = await createClient();
    const user = await getSafeUser();

    let query = supabase
        .from("audits")
        .select(`
            *,
            checklist:audit_checklists(name),
            auditor:user_profiles!auditor_id(full_name),
            auditee:user_profiles!auditee_id(full_name)
        `)
        .eq("organization_id", user.organization_id)
        .order("audit_number", { ascending: false });

    if (filters?.status) {
        query = query.eq("status", filters.status);
    }

    const { data, error } = await query;
    return { data: data || [], error };
}

/**
 * Get a single audit with its responses
 */
export async function getAuditById(id: string) {
    const supabase = await createClient();
    const user = await getSafeUser();

    const { data: audit, error } = await supabase
        .from("audits")
        .select(`
            *,
            checklist:audit_checklists(
                id, name, description,
                sections:audit_checklist_sections(
                    id, name, order_index,
                    questions:audit_checklist_questions(
                        id, question_text, requirement_reference, order_index
                    )
                )
            ),
            auditor:user_profiles!auditor_id(full_name),
            auditee:user_profiles!auditee_id(full_name),
            responses:audit_responses(*)
        `)
        .eq("organization_id", user.organization_id)
        .eq("id", id)
        .order('order_index', { referencedTable: 'audit_checklists.audit_checklist_sections', ascending: true })
        .order('order_index', { referencedTable: 'audit_checklists.audit_checklist_sections.audit_checklist_questions', ascending: true })
        .single();

    return { audit, error };
}

/**
 * Get all active audit checklists
 */
export async function getAuditChecklists() {
    const supabase = await createClient();
    const user = await getSafeUser();

    const { data, error } = await supabase
        .from("audit_checklists")
        .select("*")
        .eq("organization_id", user.organization_id)
        .eq("is_active", true)
        .order("name");

    return { data: data || [], error };
}

/**
 * Get QMS Audit KPIs
 */
export async function getAuditKpis() {
    const supabase = await createClient();
    const user = await getSafeUser();

    const { data: audits } = await supabase
        .from("audits")
        .select("status, planned_date")
        .eq("organization_id", user.organization_id);

    const now = new Date();

    const kpis = {
        total: audits?.length || 0,
        planned: audits?.filter(a => a.status === 'planned').length || 0,
        ongoing: audits?.filter(a => a.status === 'in_progress').length || 0,
        completed: audits?.filter(a => a.status === 'completed').length || 0,
        overdue: audits?.filter(a => a.status === 'planned' && new Date(a.planned_date) < now).length || 0,
    };

    return kpis;
}

/**
 * Get audit findings for an audit
 */
export async function getAuditFindings(auditId: string) {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from("audit_findings")
        .select("*, linked_nc:nonconformities(nc_number, status)")
        .eq("audit_id", auditId);

    return { data: data || [], error };
}


import { createClient } from "@/lib/supabase/server";
import { getSafeUser } from "@/lib/auth.server";

/**
 * Get Dashboard KPIs for Audit Module
 */
export async function getAuditDashboardKpis(filters?: {
    year?: number;
    month?: number;
    audit_type?: string;
    standard?: string;
    plant_id?: string;
}) {
    const supabase = await createClient();
    const user = await getSafeUser();

    // Base query for audits
    let auditQuery = supabase
        .from("audits")
        .select("id, status, audit_type, standard, planned_date")
        .eq("organization_id", user.organization_id);

    // Apply filters
    if (filters?.plant_id) auditQuery = auditQuery.eq("plant_id", filters.plant_id);
    if (filters?.audit_type) auditQuery = auditQuery.eq("audit_type", filters.audit_type);
    if (filters?.standard) auditQuery = auditQuery.eq("standard", filters.standard);

    const { data: audits } = await auditQuery;

    // Filter by year/month in JS (Supabase date filtering is less flexible)
    const filteredAudits = audits?.filter(a => {
        if (!a.planned_date) return true;
        const date = new Date(a.planned_date);
        if (filters?.year && date.getFullYear() !== filters.year) return false;
        if (filters?.month && date.getMonth() + 1 !== filters.month) return false;
        return true;
    }) || [];

    // Get all responses for these audits
    const auditIds = filteredAudits.map(a => a.id);
    const { data: responses } = await supabase
        .from("audit_responses")
        .select("result")
        .in("audit_id", auditIds);

    const total = responses?.length || 0;
    const compliant = responses?.filter(r => r.result === 'compliant').length || 0;
    const nonConformities = responses?.filter(r => ['minor_nc', 'major_nc'].includes(r.result)).length || 0;
    const improvements = responses?.filter(r => r.result === 'ofi').length || 0;
    const observations = responses?.filter(r => r.result === 'observation').length || 0;

    return {
        totalAudits: filteredAudits.length,
        completedAudits: filteredAudits.filter(a => a.status === 'completed').length,
        totalItems: total,
        compliantItems: compliant,
        nonConformities,
        improvements,
        observations,
        complianceRate: total > 0 ? Math.round((compliant / total) * 100) : 0,
    };
}

/**
 * Get Audit Trend by Month (for Line Chart)
 */
export async function getAuditTrendByMonth(year?: number) {
    const supabase = await createClient();
    const user = await getSafeUser();
    const targetYear = year || new Date().getFullYear();

    const { data: audits } = await supabase
        .from("audits")
        .select("id, planned_date, status")
        .eq("organization_id", user.organization_id)
        .eq("status", "completed");

    // Get all responses
    const auditIds = audits?.map(a => a.id) || [];
    const { data: responses } = await supabase
        .from("audit_responses")
        .select("audit_id, result")
        .in("audit_id", auditIds);

    // Group by month
    const monthlyData: Record<number, { total: number; compliant: number }> = {};
    for (let i = 1; i <= 12; i++) {
        monthlyData[i] = { total: 0, compliant: 0 };
    }

    audits?.forEach(audit => {
        if (!audit.planned_date) return;
        const date = new Date(audit.planned_date);
        if (date.getFullYear() !== targetYear) return;
        const month = date.getMonth() + 1;

        const auditResponses = responses?.filter(r => r.audit_id === audit.id) || [];
        monthlyData[month].total += auditResponses.length;
        monthlyData[month].compliant += auditResponses.filter(r => r.result === 'compliant').length;
    });

    return Object.entries(monthlyData).map(([month, data]) => ({
        month: parseInt(month),
        monthName: new Date(2024, parseInt(month) - 1).toLocaleString('pt-PT', { month: 'short' }),
        total: data.total,
        compliant: data.compliant,
        complianceRate: data.total > 0 ? Math.round((data.compliant / data.total) * 100) : 0,
    }));
}

/**
 * Get NCs by Process/Section (for Pareto Chart)
 */
export async function getNCsByProcess() {
    const supabase = await createClient();
    const user = await getSafeUser();

    const { data } = await supabase
        .from("audit_responses")
        .select(`
            result,
            question:audit_checklist_questions(
                section:audit_checklist_sections(name)
            ),
            audit:audits!inner(organization_id)
        `)
        .eq("audit.organization_id", user.organization_id)
        .in("result", ["minor_nc", "major_nc"]);

    // Group by section name
    const grouped: Record<string, number> = {};
    data?.forEach(r => {
        const sectionName = r.question?.section?.name || "Sem Secção";
        grouped[sectionName] = (grouped[sectionName] || 0) + 1;
    });

    return Object.entries(grouped)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10); // Top 10
}

/**
 * Get Audits by Type (for Pie Chart)
 */
export async function getAuditsByType() {
    const supabase = await createClient();
    const user = await getSafeUser();

    const { data } = await supabase
        .from("audits")
        .select("audit_type")
        .eq("organization_id", user.organization_id);

    const grouped: Record<string, number> = {
        internal: 0,
        external: 0,
        supplier: 0,
        client: 0,
    };

    data?.forEach(a => {
        const type = a.audit_type || 'internal';
        grouped[type] = (grouped[type] || 0) + 1;
    });

    const labels: Record<string, string> = {
        internal: 'Interna',
        external: 'Externa',
        supplier: 'Fornecedor',
        client: 'Cliente',
    };

    return Object.entries(grouped)
        .filter(([, count]) => count > 0)
        .map(([type, count]) => ({ name: labels[type] || type, value: count }));
}

/**
 * Get Compliance by Standard (for Bar Chart)
 */
export async function getComplianceByStandard() {
    const supabase = await createClient();
    const user = await getSafeUser();

    const { data: audits } = await supabase
        .from("audits")
        .select("id, standard")
        .eq("organization_id", user.organization_id)
        .eq("status", "completed");

    const auditIds = audits?.map(a => a.id) || [];
    const { data: responses } = await supabase
        .from("audit_responses")
        .select("audit_id, result")
        .in("audit_id", auditIds);

    // Group audits by standard
    const grouped: Record<string, { total: number; compliant: number }> = {};

    audits?.forEach(audit => {
        const std = audit.standard || "Não definido";
        if (!grouped[std]) grouped[std] = { total: 0, compliant: 0 };

        const auditResponses = responses?.filter(r => r.audit_id === audit.id) || [];
        grouped[std].total += auditResponses.length;
        grouped[std].compliant += auditResponses.filter(r => r.result === 'compliant').length;
    });

    return Object.entries(grouped).map(([standard, data]) => ({
        standard,
        complianceRate: data.total > 0 ? Math.round((data.compliant / data.total) * 100) : 0,
        total: data.total,
    }));
}

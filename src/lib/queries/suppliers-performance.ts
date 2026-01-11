import { createClient } from "@/lib/supabase/server";
import { getSafeUser } from "@/lib/auth.server";

export interface SupplierMetric {
    id: string;
    name: string;
    code: string;
    totalLots: number;
    approvedLots: number;
    rejectedLots: number;
    quarantineLots: number;
    complianceRate: number;
    totalNCs: number;
}

/**
 * Fetches aggregated performance metrics for all suppliers.
 * Used for the Supplier Performance Dashboard.
 */
export async function getSupplierPerformanceMetrics() {
    const supabase = await createClient();
    const user = await getSafeUser();

    // 1. Fetch all lots with supplier details
    const { data: lots, error: lotsError } = await supabase
        .from("raw_material_lots")
        .select(`
            id,
            status,
            supplier_id,
            supplier:suppliers(id, name, code)
        `)
        .eq("organization_id", user.organization_id);

    if (lotsError) throw lotsError;

    // 2. Fetch all non-conformities (NCs) to see if they link to suppliers
    // Some NCs might be linked to batches, some to lots.
    const { data: ncs, error: ncsError } = await supabase
        .from("nonconformities")
        .select(`
            id,
            status,
            metadata
        `)
        .eq("organization_id", user.organization_id)
        .is("deleted_at", null);

    if (ncsError) throw ncsError;

    // 3. Aggregate metrics per supplier
    const metrics: Record<string, SupplierMetric> = {};

    // Get all active suppliers first to ensure we show them even without lots
    const { data: activeSuppliers } = await supabase
        .from("suppliers")
        .select("id, name, code")
        .eq("organization_id", user.organization_id)
        .eq("status", "active");

    activeSuppliers?.forEach(s => {
        metrics[s.id] = {
            id: s.id,
            name: s.name,
            code: s.code,
            totalLots: 0,
            approvedLots: 0,
            rejectedLots: 0,
            quarantineLots: 0,
            complianceRate: 0,
            totalNCs: 0
        };
    });

    // Process Lots
    lots?.forEach(lot => {
        if (!lot.supplier_id) return;
        const sId = lot.supplier_id;

        if (!metrics[sId]) {
            const supplier = lot.supplier as any;
            metrics[sId] = {
                id: sId,
                name: supplier?.name || "Unknown",
                code: supplier?.code || "N/A",
                totalLots: 0,
                approvedLots: 0,
                rejectedLots: 0,
                quarantineLots: 0,
                complianceRate: 0,
                totalNCs: 0
            };
        }

        const m = metrics[sId];
        m.totalLots++;
        if (lot.status === 'approved') m.approvedLots++;
        else if (lot.status === 'rejected') m.rejectedLots++;
        else if (lot.status === 'quarantine') m.quarantineLots++;
    });

    // Process NCs (Check metadata for supplier_id or lot_id)
    ncs?.forEach(nc => {
        const metadata = nc.metadata as any;
        const supplierId = metadata?.supplier_id;

        if (supplierId && metrics[supplierId]) {
            metrics[supplierId].totalNCs++;
        }
    });

    // 4. Finalize calculations & sorting
    const result = Object.values(metrics).map(m => ({
        ...m,
        complianceRate: m.totalLots > 0 ? (m.approvedLots / m.totalLots) * 100 : 100
    })).sort((a, b) => b.totalLots - a.totalLots);

    return result;
}

/**
 * Fetches detailed performance data for a single supplier.
 */
export async function getSupplierDetailMetrics(supplierId: string) {
    const supabase = await createClient();
    const user = await getSafeUser();

    const { data: supplier, error: sError } = await supabase
        .from("suppliers")
        .select("*")
        .eq("id", supplierId)
        .single();

    if (sError) throw sError;

    const { data: lots, error: lError } = await supabase
        .from("raw_material_lots")
        .select(`
            *,
            raw_material:raw_materials(name, code)
        `)
        .eq("supplier_id", supplierId)
        .order("received_date", { ascending: false });

    if (lError) throw lError;

    return { supplier, lots };
}

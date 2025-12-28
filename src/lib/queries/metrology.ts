import { createClient } from "@/lib/supabase/server";
import { getSafeUser } from "@/lib/auth.server";

/**
 * Get equipment with full metrological history
 */
export async function getEquipmentWithMetrology(id: string) {
    const supabase = await createClient();
    const user = await getSafeUser();

    const { data: equipment, error } = await supabase
        .from("equipments")
        .select(`
      *,
      maintenance_plans(*),
      maintenance_logs(*, performed_by_profile:user_profiles!performed_by(full_name)),
      calibration_certificates(*),
      lab_analysis(*, qa_parameters(name, unit), samples(sample_number))
    `)
        .eq("organization_id", user.organization_id)
        .eq("id", id)
        .single();

    if (error) return { equipment: null, error };

    // Sort logs by date descending
    const sortedLogs = (equipment.maintenance_logs || []).sort((a: any, b: any) =>
        new Date(b.performed_at).getTime() - new Date(a.performed_at).getTime()
    );

    return { equipment: { ...equipment, maintenance_logs: sortedLogs }, error: null };
}

/**
 * Get maintenance plans for an equipment
 */
export async function getMaintenancePlans(equipmentId: string) {
    const supabase = await createClient();
    const user = await getSafeUser();

    const { data, error } = await supabase
        .from("maintenance_plans")
        .select("*")
        .eq("organization_id", user.organization_id)
        .eq("equipment_id", equipmentId)
        .eq("is_active", true);

    return { data: data || [], error };
}

/**
 * Get pending maintenance/calibration alerts
 */
export async function getMetrologyAlerts() {
    const supabase = await createClient();
    const user = await getSafeUser();
    const today = new Date().toISOString().split('T')[0];

    // Equipment with upcoming or overdue calibration/maintenance
    const { data, error } = await supabase
        .from("equipments")
        .select("id, name, code, next_calibration_date, next_maintenance_date, status")
        .eq("organization_id", user.organization_id)
        .or(`next_calibration_date.lte.${today},next_maintenance_date.lte.${today}`)
        .neq("status", "decommissioned");

    return { data: data || [], error };
}

/**
 * Get calibration certificates for an equipment
 */
export async function getCalibrationCertificates(equipmentId: string) {
    const supabase = await createClient();
    const user = await getSafeUser();

    const { data, error } = await supabase
        .from("calibration_certificates")
        .select("*")
        .eq("organization_id", user.organization_id)
        .eq("equipment_id", equipmentId)
        .order("issued_at", { ascending: false });

    return { data: data || [], error };
}


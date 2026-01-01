"use server";

import { createClient } from "@/lib/supabase/server";
import { getSafeUser } from "@/lib/auth.server";

export type LabAssetDetail = {
    id: string;
    organization_id: string;
    plant_id: string | null;
    name: string;
    code: string;
    serial_number: string | null;
    manufacturer: string | null;
    model: string | null;
    asset_category: string | null;
    calibration_frequency_months: number | null;
    criticality: "low" | "medium" | "high";
    status: "active" | "maintenance" | "decommissioned";
    last_calibration_date: string | null;
    next_calibration_date: string | null;
    created_at: string;
    updated_at: string;
    plants?: {
        id: string;
        name: string;
    } | null;
};

export type CalibrationCert = {
    id: string;
    certificate_number: string;
    issued_at: string;
    expires_at: string;
    issued_by: string;
    status: string;
    file_path: string | null;
};

export type MaintenanceLog = {
    id: string;
    performed_at: string;
    maintenance_type: string;
    description: string;
    result: string;
    performed_by: string; // User ID, might need join if we want name
    notes: string | null;
};

export async function getLabAssetById(id: string): Promise<LabAssetDetail | null> {
    const supabase = await createClient();
    const user = await getSafeUser();

    // We assume there's a foreign key relation from lab_assets.plant_id to plants.id
    // If explicit FK is not set up in Supabase for automatic joins, this might return plants as null 
    // or error. We'll try the standard join syntax.
    const { data, error } = await supabase
        .from("lab_assets")
        .select(`
            *,
            plants (
                id,
                name
            )
        `)
        .eq("id", id)
        .eq("organization_id", user.organization_id)
        .single();

    if (error) {
        console.error("Error fetching asset details:", error);
        return null;
    }

    return data as LabAssetDetail;
}

export async function getAssetHistory(id: string) {
    const supabase = await createClient();
    const user = await getSafeUser();

    // Parallel fetch for history items
    const [calibrationsResult, maintenanceResult] = await Promise.all([
        supabase
            .from("calibration_certificates")
            .select("*")
            .eq("equipment_id", id)
            .eq("organization_id", user.organization_id)
            .order("issued_at", { ascending: false }),
        supabase
            .from("maintenance_logs")
            .select("*")
            .eq("equipment_id", id)
            .eq("organization_id", user.organization_id)
            .order("performed_at", { ascending: false })
    ]);

    if (calibrationsResult.error) {
        console.error("Error fetching calibrations:", calibrationsResult.error);
    }

    if (maintenanceResult.error) {
        console.error("Error fetching maintenance:", maintenanceResult.error);
    }

    return {
        calibrations: (calibrationsResult.data || []) as CalibrationCert[],
        maintenance: (maintenanceResult.data || []) as MaintenanceLog[]
    };
}

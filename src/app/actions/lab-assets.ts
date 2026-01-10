"use server";

import { createClient } from "@/lib/supabase/server";
import { getSafeUser } from "@/lib/auth.server";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const LabAssetSchema = z.object({
    name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
    code: z.string().min(1, "Código é obrigatório").toUpperCase(),
    asset_category: z.enum(["balance", "ph_meter", "refractometer", "thermometer", "spectrophotometer", "viscometer", "general"]).default("general"),
    serial_number: z.string().optional().nullable(),
    manufacturer: z.string().optional().nullable(),
    model: z.string().optional().nullable(),
    last_calibration_date: z.string().optional().nullable(),
    next_calibration_date: z.string().optional().nullable(),
    calibration_frequency_months: z.coerce.number().default(12),
    criticality: z.enum(["low", "medium", "high"]).default("medium"),
    status: z.enum(["active", "out_of_calibration", "maintenance", "decommissioned"]).default("active"),
});

/**
 * Get all lab assets for the current tenant
 */
export async function getLabAssetsAction(category?: string) {
    const supabase = await createClient();

    let query = supabase.from("lab_assets").select("*").order("code");

    if (category) {
        query = query.eq("asset_category", category);
    }

    const { data, error } = await query;

    if (error) return { success: false, message: error.message, data: [] };
    return { success: true, data };
}

/**
 * Get active lab assets for selection dropdowns
 */
export async function getActiveLabAssetsAction() {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from("lab_assets")
        .select("id, name, code, asset_category, status, next_calibration_date")
        .eq("status", "active")
        .order("name");

    if (error) return { success: false, message: error.message, data: [] };
    return { success: true, data };
}

/**
 * Get a single lab asset with maintenance history
 */
export async function getLabAssetWithHistoryAction(id: string) {
    const supabase = await createClient();

    const { data: asset, error } = await supabase
        .from("lab_assets")
        .select("*")
        .eq("id", id)
        .single();

    if (error) return { success: false, message: error.message, data: null };

    // Get maintenance logs
    const { data: logs } = await supabase
        .from("maintenance_logs")
        .select("*, performed_by_profile:user_profiles!performed_by(full_name)")
        .eq("asset_type", "lab_asset")
        .eq("asset_id", id)
        .order("performed_at", { ascending: false });

    // Get calibration certificates
    const { data: certificates } = await supabase
        .from("calibration_certificates")
        .select("*")
        .eq("equipment_id", id)
        .order("issued_at", { ascending: false });

    // Get linked analyses
    const { data: analyses } = await supabase
        .from("lab_analysis")
        .select("id, analyzed_at, is_conforming, qa_parameters(name), samples(code)")
        .eq("lab_asset_id", id)
        .order("analyzed_at", { ascending: false })
        .limit(20);

    return {
        success: true,
        data: {
            ...asset,
            maintenance_logs: logs || [],
            calibration_certificates: certificates || [],
            lab_analyses: analyses || []
        }
    };
}

/**
 * Create a new lab asset
 */
export async function createLabAssetAction(formData: FormData) {
    try {
        const user = await getSafeUser();
        const supabase = await createClient();

        const rawData = {
            name: formData.get("name"),
            code: formData.get("code"),
            asset_category: formData.get("asset_category") || "general",
            serial_number: formData.get("serial_number") || null,
            manufacturer: formData.get("manufacturer") || null,
            model: formData.get("model") || null,
            last_calibration_date: formData.get("last_calibration_date") || null,
            next_calibration_date: formData.get("next_calibration_date") || null,
            calibration_frequency_months: formData.get("calibration_frequency_months") || 12,
            criticality: formData.get("criticality") || "medium",
            status: formData.get("status") || "active",
        };

        const validation = LabAssetSchema.safeParse(rawData);
        if (!validation.success) {
            return { success: false, message: validation.error.issues[0].message };
        }

        const { error } = await supabase.from("lab_assets").insert({
            organization_id: user.organization_id,
            plant_id: user.plant_id,
            ...validation.data
        });

        if (error) throw error;

        revalidatePath("/lab/assets");
        revalidatePath("/lab/equipment/routine-checks");
        return { success: true, message: "Instrumento criado com sucesso" };
    } catch (error: any) {
        return { success: false, message: error.message || "Erro ao criar instrumento" };
    }
}

/**
 * Update a lab asset
 */
export async function updateLabAssetAction(formData: FormData) {
    try {
        const supabase = await createClient();
        const id = formData.get("id") as string;
        if (!id) return { success: false, message: "ID obrigatório" };

        const rawData = {
            name: formData.get("name"),
            code: formData.get("code"),
            asset_category: formData.get("asset_category") || "general",
            serial_number: formData.get("serial_number") || null,
            manufacturer: formData.get("manufacturer") || null,
            model: formData.get("model") || null,
            last_calibration_date: formData.get("last_calibration_date") || null,
            next_calibration_date: formData.get("next_calibration_date") || null,
            calibration_frequency_months: formData.get("calibration_frequency_months") || 12,
            criticality: formData.get("criticality") || "medium",
            status: formData.get("status") || "active",
        };

        const validation = LabAssetSchema.safeParse(rawData);
        if (!validation.success) {
            return { success: false, message: validation.error.issues[0].message };
        }

        const { error } = await supabase
            .from("lab_assets")
            .update({ ...validation.data, updated_at: new Date().toISOString() })
            .eq("id", id);

        if (error) throw error;

        revalidatePath("/lab/assets");
        return { success: true, message: "Instrumento atualizado" };
    } catch (error: any) {
        return { success: false, message: error.message || "Erro ao atualizar" };
    }
}

/**
 * Log a maintenance/verification activity for a lab asset
 */
export async function logLabAssetActivityAction(formData: FormData) {
    try {
        const user = await getSafeUser();
        const supabase = await createClient();

        const assetId = formData.get("asset_id") as string;
        const maintenanceType = formData.get("maintenance_type") as string;
        const result = formData.get("result") as string;
        const description = formData.get("description") as string;
        const notes = formData.get("notes") as string | null;
        const performedAt = formData.get("performed_at") as string || new Date().toISOString();

        const { error: logError } = await supabase.from("maintenance_logs").insert({
            organization_id: user.organization_id,
            asset_type: "lab_asset",
            asset_id: assetId,
            equipment_id: null, // Explicitly NULL as we are using asset_id + asset_type polymorphically
            maintenance_type: maintenanceType,
            description,
            result,
            notes,
            performed_at: performedAt,
            performed_by: user.id,
        });

        if (logError) throw logError;

        // Update asset status based on result
        if (result === "pass") {
            await supabase.from("lab_assets").update({
                status: "active",
                last_verification_at: performedAt,
                last_verification_result: "pass"
            }).eq("id", assetId);
        } else if (result === "fail") {
            await supabase.from("lab_assets").update({
                status: "out_of_calibration",
                last_verification_at: performedAt,
                last_verification_result: "fail"
            }).eq("id", assetId);
        }

        revalidatePath("/lab/assets");
        revalidatePath("/lab/equipment/routine-checks");
        return { success: true, message: "Atividade registada com sucesso" };
    } catch (error: any) {
        return { success: false, message: error.message || "Erro ao registar atividade" };
    }
}

/**
 * Register a new document execution for a lab asset
 */
export async function createLabAssetDocumentAction(data: {
    asset_id: string;
    name: string;
    path: string;
    file_type: string;
    size: number;
}) {
    try {
        const user = await getSafeUser();
        const supabase = await createClient();

        const { error } = await supabase.from("lab_asset_documents").insert({
            asset_id: data.asset_id,
            name: data.name,
            path: data.path,
            file_type: data.file_type,
            size: data.size,
            uploaded_by: user.id,
        });

        if (error) throw error;

        revalidatePath(`/lab/assets/${data.asset_id}`);
        return { success: true, message: "Documento registado com sucesso" };
    } catch (error: any) {
        return { success: false, message: error.message || "Erro ao salvar documento" };
    }
}

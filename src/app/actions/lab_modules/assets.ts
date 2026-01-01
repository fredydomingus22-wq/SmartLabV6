"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { CreateLabAssetSchema, CreateLabAssetFormValues } from "@/schemas/lab";
import { getSafeUser } from "@/lib/auth.server";

export async function createLabAssetAction(data: CreateLabAssetFormValues) {
    const user = await getSafeUser();
    const supabase = await createClient();

    // Validate Input
    const validated = CreateLabAssetSchema.safeParse(data);
    if (!validated.success) {
        return { success: false, message: "Dados inválidos", errors: validated.error.flatten() };
    }

    const assetData = validated.data;

    // Determine Plant ID
    const finalPlantId = assetData.plant_id || user.plant_id;
    if (!finalPlantId) {
        return { success: false, message: "Erro: Planta não identificada. Selecione uma planta." };
    }

    // Insert Asset
    const { error } = await supabase.from("lab_assets").insert({
        name: assetData.name,
        code: assetData.code,
        asset_category: assetData.asset_category,
        manufacturer: assetData.manufacturer,
        model: assetData.model,
        serial_number: assetData.serial_number,
        criticality: assetData.criticality,
        status: assetData.status,
        last_calibration_date: assetData.calibration_date ? new Date(assetData.calibration_date).toISOString() : null,
        next_calibration_date: assetData.next_calibration_date ? new Date(assetData.next_calibration_date).toISOString() : null,
        organization_id: user.organization_id,
        plant_id: finalPlantId
    });

    if (error) {
        console.error("Error creating asset:", error);
        return { success: false, message: "Erro ao criar instrumento: " + error.message };
    }

    revalidatePath("/lab/assets");
    return { success: true, message: "Instrumento criado com sucesso" };
}

export async function updateLabAssetAction(id: string, data: CreateLabAssetFormValues) {
    const user = await getSafeUser();
    const supabase = await createClient();

    // Validate Input
    const validated = CreateLabAssetSchema.safeParse(data);
    if (!validated.success) {
        return { success: false, message: "Dados inválidos", errors: validated.error.flatten() };
    }

    const assetData = validated.data;

    const { error } = await supabase.from("lab_assets")
        .update({
            name: assetData.name,
            code: assetData.code,
            asset_category: assetData.asset_category,
            manufacturer: assetData.manufacturer,
            model: assetData.model,
            serial_number: assetData.serial_number,
            criticality: assetData.criticality,
            status: assetData.status,
            last_calibration_date: assetData.calibration_date ? new Date(assetData.calibration_date).toISOString() : null,
            next_calibration_date: assetData.next_calibration_date ? new Date(assetData.next_calibration_date).toISOString() : null,
            // plant_id updates: usually we might allow moving assets, so let's allow it if provided
            ...(assetData.plant_id ? { plant_id: assetData.plant_id } : {})
        })
        .eq("id", id)
        .eq("organization_id", user.organization_id);

    if (error) {
        console.error("Error updating asset:", error);
        return { success: false, message: "Erro ao atualizar instrumento: " + error.message };
    }

    revalidatePath("/lab/assets");
    revalidatePath(`/lab/assets/${id}`); // also revalidate the detail page
    return { success: true, message: "Instrumento atualizado com sucesso" };
}

export async function deleteLabAssetAction(id: string) {
    const user = await getSafeUser();
    const supabase = await createClient();

    const { error } = await supabase
        .from("lab_assets")
        .delete()
        .eq("id", id)
        .eq("organization_id", user.organization_id);

    if (error) {
        console.error("Error deleting asset:", error);
        return { success: false, message: "Erro ao eliminar instrumento: " + error.message };
    }

    revalidatePath("/lab/assets");
    return { success: true, message: "Instrumento eliminado com sucesso" };
}

export async function registerLabCalibrationAction(data: any) {
    const user = await getSafeUser();
    const supabase = await createClient();

    const {
        asset_id,
        performed_at,
        certificate_number,
        issued_by,
        result,
        next_calibration_date,
        notes
    } = data;

    // 1. Mark existing certificates for this equipment as superseded
    await supabase
        .from("calibration_certificates")
        .update({ status: 'superseded' })
        .eq("equipment_id", asset_id)
        .eq("status", 'valid');

    // 2. Insert new certificate
    const { error: certError } = await supabase
        .from("calibration_certificates")
        .insert({
            organization_id: user.organization_id,
            equipment_id: asset_id,
            certificate_number,
            issued_at: performed_at,
            expires_at: next_calibration_date,
            issued_by,
            status: 'valid'
        });

    if (certError) {
        console.error("Error creating certificate:", certError);
        return { success: false, message: "Erro ao registar certificado: " + certError.message };
    }

    // 3. Log into maintenance_logs for history
    await supabase.from("maintenance_logs").insert({
        organization_id: user.organization_id,
        equipment_id: asset_id,
        asset_type: "lab_asset",
        asset_id: asset_id,
        maintenance_type: "calibration",
        description: `Calibração realizada - Certificado ${certificate_number}`,
        result: result === 'pass' ? 'pass' : result === 'fail' ? 'fail' : 'conditional',
        performed_at,
        performed_by: user.id,
        notes
    });

    // 4. Update lab_assets table
    const { error: assetError } = await supabase
        .from("lab_assets")
        .update({
            last_calibration_date: new Date(performed_at).toISOString(),
            next_calibration_date: new Date(next_calibration_date).toISOString(),
            status: result === 'fail' ? 'out_of_calibration' : 'active',
            updated_at: new Date().toISOString()
        })
        .eq("id", asset_id)
        .eq("organization_id", user.organization_id);

    if (assetError) {
        console.error("Error updating asset:", assetError);
        return { success: false, message: "Erro ao atualizar instrumento: " + assetError.message };
    }

    revalidatePath("/lab/assets");
    revalidatePath(`/lab/assets/${asset_id}`);
    revalidatePath("/assets/calibrations");
    return { success: true, message: "Calibração registada com sucesso" };
}

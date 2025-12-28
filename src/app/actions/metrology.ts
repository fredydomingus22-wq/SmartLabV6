"use server";

import { createClient } from "@/lib/supabase/server";
import { getSafeUser } from "@/lib/auth.server";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const MaintenancePlanSchema = z.object({
    equipment_id: z.string().uuid(),
    task_name: z.string().min(3),
    description: z.string().optional(),
    frequency_days: z.coerce.number().positive(),
});

const MaintenanceLogSchema = z.object({
    equipment_id: z.string().uuid(),
    maintenance_type: z.enum(['preventive', 'corrective', 'calibration', 'verification']),
    description: z.string().min(3),
    result: z.enum(['pass', 'fail', 'conditional']),
    performed_at: z.string().datetime(),
    notes: z.string().optional(),
    cost: z.coerce.number().optional(),
    attachment_url: z.string().optional(),
});

/**
 * Create a new maintenance plan
 */
export async function createMaintenancePlanAction(formData: FormData) {
    try {
        const user = await getSafeUser();
        const supabase = await createClient();

        const validatedFields = MaintenancePlanSchema.safeParse({
            equipment_id: formData.get("equipment_id"),
            task_name: formData.get("task_name"),
            description: formData.get("description"),
            frequency_days: formData.get("frequency_days"),
        });

        if (!validatedFields.success) {
            return { success: false, error: "Campos inválidos", details: validatedFields.error.flatten().fieldErrors };
        }

        const { error } = await supabase
            .from("maintenance_plans")
            .insert({
                ...validatedFields.data,
                organization_id: user.organization_id,
            });

        if (error) throw error;

        revalidatePath("/(dashboard)/production/equipment", "layout");
        return { success: true, message: "Plano de manutenção criado com sucesso" };
    } catch (error: any) {
        console.error("createMaintenancePlanAction error:", error);
        return { success: false, error: error.message || "Erro ao criar plano" };
    }
}

/**
 * Log a maintenance or calibration activity
 */
export async function logMetrologyActivityAction(formData: FormData) {
    try {
        const user = await getSafeUser();
        const supabase = await createClient();

        const rawData = {
            equipment_id: formData.get("equipment_id"),
            maintenance_type: formData.get("maintenance_type"),
            description: formData.get("description"),
            result: formData.get("result"),
            performed_at: formData.get("performed_at") || new Date().toISOString(),
            notes: formData.get("notes"),
            cost: formData.get("cost") || undefined,
            attachment_url: formData.get("attachment_url"),
        };

        const validatedFields = MaintenanceLogSchema.safeParse(rawData);
        if (!validatedFields.success) {
            return { success: false, error: "Campos inválidos", details: validatedFields.error.flatten().fieldErrors };
        }

        // 1. Insert log
        const { error: logError } = await supabase
            .from("maintenance_logs")
            .insert({
                ...validatedFields.data,
                organization_id: user.organization_id,
                performed_by: user.id,
            });

        if (logError) throw logError;

        // 2. Update equipment status and next dates
        const equipmentId = validatedFields.data.equipment_id;
        const updateData: any = {};

        if (validatedFields.data.result === 'fail') {
            updateData.status = 'maintenance';
        } else if (validatedFields.data.result === 'pass') {
            updateData.status = 'active';

            // Calculate next dates based on type
            if (validatedFields.data.maintenance_type === 'preventive') {
                // Fetch frequency from plans if exists, or default to 90 days
                const { data: plans } = await supabase
                    .from("maintenance_plans")
                    .select("frequency_days")
                    .eq("equipment_id", equipmentId)
                    .eq("is_active", true)
                    .limit(1);

                const days = plans?.[0]?.frequency_days || 90;
                const nextDate = new Date(validatedFields.data.performed_at);
                nextDate.setDate(nextDate.getDate() + days);
                updateData.next_maintenance_date = nextDate.toISOString().split('T')[0];
            } else if (validatedFields.data.maintenance_type === 'calibration') {
                // Default calibration is often 365 days unless specified
                const nextDate = new Date(validatedFields.data.performed_at);
                nextDate.setDate(nextDate.getDate() + 365);
                updateData.next_calibration_date = nextDate.toISOString().split('T')[0];
            }
        }

        if (Object.keys(updateData).length > 0) {
            await supabase
                .from("equipments")
                .update(updateData)
                .eq("id", equipmentId);
        }

        revalidatePath("/(dashboard)/production/equipment", "layout");
        return { success: true, message: "Atividade registada com sucesso" };
    } catch (error: any) {
        console.error("logMetrologyActivityAction error:", error);
        return { success: false, error: error.message || "Erro ao registar atividade" };
    }
}

/**
 * Register a calibration certificate
 */
export async function registerCalibrationCertificateAction(formData: FormData) {
    try {
        const user = await getSafeUser();
        const supabase = await createClient();

        const equipment_id = formData.get("equipment_id") as string;
        const certificate_number = formData.get("certificate_number") as string;
        const issued_at = formData.get("issued_at") as string;
        const expires_at = formData.get("expires_at") as string;
        const issued_by = formData.get("issued_by") as string;
        const file_path = formData.get("file_path") as string;

        // 1. Mark existing certificates for this equipment as superseded
        await supabase
            .from("calibration_certificates")
            .update({ status: 'superseded' })
            .eq("equipment_id", equipment_id)
            .eq("status", 'valid');

        // 2. Insert new certificate
        const { error: certError } = await supabase
            .from("calibration_certificates")
            .insert({
                organization_id: user.organization_id,
                equipment_id,
                certificate_number,
                issued_at,
                expires_at,
                issued_by,
                file_path,
                status: 'valid'
            });

        if (certError) throw certError;

        // 3. Update equipment next calibration date
        await supabase
            .from("equipments")
            .update({
                next_calibration_date: expires_at,
                status: 'active' // Ensure it's active if calibrated
            })
            .eq("id", equipment_id);

        revalidatePath("/(dashboard)/production/equipment", "layout");
        return { success: true, message: "Certificado registado com sucesso" };
    } catch (error: any) {
        console.error("registerCalibrationCertificateAction error:", error);
        return { success: false, error: error.message || "Erro ao registar certificado" };
    }
}


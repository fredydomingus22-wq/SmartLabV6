"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { format } from "date-fns";
import { z } from "zod";
import { SAMPLE_TYPE_CATEGORIES, isMicroCategory } from "@/lib/constants/lab";
import { requirePermission } from "@/lib/permissions.server";
import { MicroDomainService } from "@/domain/micro/micro.service";

async function getMicroService() {
    const userData = await requirePermission('micro', 'write');
    const supabase = await createClient();
    return {
        service: new MicroDomainService(supabase, {
            organization_id: userData.organization_id!,
            user_id: userData.id,
            role: userData.role,
            plant_id: userData.plant_id!,
            correlation_id: crypto.randomUUID(), // Mandatory for industrial audit tracing
        }),
        userData,
        supabase
    };
}

// --- Schemas ---

const CreateMediaLotSchema = z.object({
    media_type_id: z.string().uuid(),
    lot_code: z.string().min(3),
    expiry_date: z.string(), // ISO Date
    quantity: z.coerce.number().min(1),
    plant_id: z.string().uuid(),
});

const RegisterIncubatorSchema = z.object({
    name: z.string().min(2),
    temperature: z.coerce.number(),
    capacity: z.coerce.number().min(1),
    plant_id: z.string().uuid(),
});

const StartIncubationSchema = z.object({
    incubator_id: z.string().uuid(),
    sample_code: z.string().min(3), // User scans/types sample code
    media_lot_id: z.string().uuid(),
});

const RegisterMicroResultSchema = z.object({
    result_id: z.string().uuid(),
    colony_count: z.coerce.number().optional(),
    is_tntc: z.boolean().optional(),
    is_presence_absence: z.boolean().optional(),
    presence_detected: z.boolean().optional(),
    result_text: z.string().optional(),
    sample_weight_g: z.coerce.number().optional(),
    sample_volume_ml: z.coerce.number().optional(),
    dilution_factor: z.coerce.number().optional(),
    buffer_name: z.string().optional(),
    password: z.string().optional(),
});

const CreateMicroSampleSchema = z.object({
    code: z.string().optional(),
    sample_type_id: z.string().uuid("Invalid sample type"),
    production_batch_id: z.string().uuid("Invalid batch").optional(),
    intermediate_product_id: z.string().uuid("Invalid tank").optional(),
    sampling_point_id: z.string().uuid("Invalid sampling point").optional(),
    collected_at: z.string().optional(),
    plant_id: z.string().uuid("Plant ID required"),
});

// --- Actions ---

/**
 * Create a microbiological sample
 * Redirects user to incubators page after creation
 */
export async function createMicroSampleAction(formData: FormData) {
    const userData = await requirePermission('micro', 'write');
    const supabase = await createClient();

    const rawData = {
        code: formData.get("code") || undefined,
        sample_type_id: formData.get("sample_type_id"),
        production_batch_id: formData.get("production_batch_id") || undefined,
        intermediate_product_id: formData.get("intermediate_product_id") || undefined,
        sampling_point_id: formData.get("sampling_point_id") || undefined,
        collected_at: formData.get("collected_at") || undefined,
        plant_id: formData.get("plant_id") || userData.plant_id,
    };

    const validation = CreateMicroSampleSchema.safeParse(rawData);
    if (!validation.success) {
        return { success: false, message: validation.error.issues[0].message };
    }

    // 1. Resolve Metadata (Sample Type, Product ID, SKU) BEFORE Insert
    let finalCode = validation.data.code;
    const collectedAt = validation.data.collected_at || new Date().toISOString();
    let productId = null;

    try {
        // Fetch Sample Type
        const { data: sampleType } = await supabase
            .from("sample_types")
            .select("test_category, code")
            .eq("id", validation.data.sample_type_id)
            .single();

        if (!sampleType) {
            return {
                success: false,
                message: "Tipo de amostra inválido ou expirado. Por favor, atualize a página (F5) e tente novamente."
            };
        }

        if (!isMicroCategory(sampleType.test_category) && sampleType.test_category !== "both") {
            return { success: false, message: "O tipo de amostra deve ser microbiológico" };
        }

        const sampleTypeCode = sampleType.code || "MICRO";

        // Fetch Product ID
        if (validation.data.production_batch_id) {
            const { data: batch } = await supabase
                .from("production_batches")
                .select("product_id")
                .eq("id", validation.data.production_batch_id)
                .single();
            productId = batch?.product_id;
        } else if (validation.data.intermediate_product_id) {
            const { data: ip } = await supabase
                .from("intermediate_products")
                .select("production_batches(product_id)")
                .eq("id", validation.data.intermediate_product_id)
                .single();
            const batchData = Array.isArray(ip?.production_batches) ? ip.production_batches[0] : ip?.production_batches;
            productId = batchData?.product_id;
        }

        // Generate Automatic Code: [SKU]-[TYPE_CODE]-[YYYYMMDD]-[HHMM]
        if (productId) {
            const { data: product } = await supabase.from("products").select("sku").eq("id", productId).single();
            const sku = product?.sku || "NOSKU";
            const dateObj = new Date(collectedAt);
            finalCode = `${sku}-${sampleTypeCode}-${format(dateObj, "yyyyMMdd")}-${format(dateObj, "HHmm")}`;
        }
    } catch (e) {
        console.error("Error resolving micro metadata for naming:", e);
    }

    // Check for duplicate code if a code was generated or provided
    if (finalCode) {
        const { data: existing } = await supabase
            .from("samples")
            .select("id")
            .eq("code", finalCode)
            .maybeSingle();

        if (existing) {
            return { success: false, message: "Generated sample code already exists. Please try again or provide a unique code." };
        }
    }


    // 2. Create the sample with finalized code
    const { data: newSample, error } = await supabase
        .from("samples")
        .insert({
            organization_id: userData.organization_id!,
            plant_id: validation.data.plant_id,
            sample_type_id: validation.data.sample_type_id,
            production_batch_id: validation.data.production_batch_id || null,
            intermediate_product_id: validation.data.intermediate_product_id || null,
            sampling_point_id: validation.data.sampling_point_id || null,
            code: finalCode || `AMS-MICRO-${format(new Date(), "yyyyMMdd-HHmm")}`,
            collected_at: collectedAt,
            collected_by: userData.id,
            status: "pending",
        })
        .select("id")
        .single();

    if (error) {
        return { success: false, message: error.message };
    }

    // [DEC-01] Decoupled from lab_analysis. 
    // We no longer auto-load specs into lab_analysis here.
    // Quality reports for micro will iterate over micro_results.

    revalidatePath("/micro/samples");
    revalidatePath("/micro/incubators");
    return {
        success: true,
        message: "Amostra microbiológica criada com sucesso.",
        sampleId: newSample?.id
    };
}

export async function createMediaLotAction(formData: FormData) {
    const userData = await requirePermission('micro', 'write');
    const supabase = await createClient();

    const rawData = {
        media_type_id: formData.get("media_type_id"),
        lot_code: formData.get("lot_code"),
        expiry_date: formData.get("expiry_date"),
        quantity: formData.get("quantity"),
        plant_id: formData.get("plant_id"),
    };

    const validation = CreateMediaLotSchema.safeParse(rawData);
    if (!validation.success) {
        return { success: false, message: validation.error.issues[0].message };
    }

    const payload = {
        ...validation.data,
        organization_id: userData.organization_id!,
        quantity_initial: validation.data.quantity,
        quantity_current: validation.data.quantity,
    };

    const { error } = await supabase.from("micro_media_lots").insert(payload);

    if (error) {
        return { success: false, message: error.message };
    }

    revalidatePath("/micro/media");
    return { success: true, message: "Media Lot Created" };
}

export async function createIncubatorAction(formData: FormData) {
    const userData = await requirePermission('micro', 'write');
    const supabase = await createClient();

    const rawData = {
        name: formData.get("name"),
        temperature: formData.get("temperature"),
        capacity: formData.get("capacity"),
        plant_id: formData.get("plant_id"),
    };

    const validation = RegisterIncubatorSchema.safeParse(rawData);
    if (!validation.success) return { success: false, message: validation.error.issues[0].message };

    const { error } = await supabase.from("micro_incubators").insert({
        name: validation.data.name,
        plant_id: validation.data.plant_id,
        organization_id: userData.organization_id!,
        setpoint_temp_c: validation.data.temperature,
        capacity_plates: validation.data.capacity,
    });

    if (error) return { success: false, message: error.message };

    revalidatePath("/micro/incubators");
    return { success: true, message: "Incubator Registered" };
}

export async function startIncubationAction(formData: FormData) {
    const { service } = await getMicroService();

    const rawData = {
        incubator_id: formData.get("incubator_id") as string,
        sample_id: formData.get("sample_id") as string,
        media_lot_id: formData.get("media_lot_id") as string,
        result_ids: formData.getAll("result_ids") as string[] // Support for multiple analytical parameters
    };

    if (!rawData.incubator_id || !rawData.sample_id || !rawData.media_lot_id) {
        return { success: false, message: "Missing required fields" };
    }

    try {
        const result = await service.startIncubationBatch({
            incubatorId: rawData.incubator_id,
            sampleId: rawData.sample_id,
            mediaLotId: rawData.media_lot_id,
            resultIds: rawData.result_ids.length > 0 ? rawData.result_ids : [] // Service will handle fetching if empty in future improvement
        });

        if (!result.success) return { success: false, message: "Erro ao iniciar incubação." };

        revalidatePath("/micro/incubators");
        revalidatePath("/micro/reading");
        return { success: true, message: "Incubação Iniciada com Sucesso" };
    } catch (e: any) {
        return { success: false, message: e.message || "Falha no processo de incubação." };
    }
}

export async function registerMicroResultAction(formData: FormData) {
    const { service } = await getMicroService();

    const rawData = {
        result_id: formData.get("result_id"),
        colony_count: formData.get("colony_count"),
        is_tntc: formData.get("is_tntc") === 'on',
        result_text: formData.get("result_text"),
        password: formData.get("password") || undefined,
    };

    const validation = RegisterMicroResultSchema.safeParse(rawData);
    if (!validation.success) return { success: false, message: "DADOS INVÁLIDOS: Verifique os campos." };

    try {
        const result = await service.registerResult({
            resultId: validation.data.result_id,
            colonyCount: validation.data.colony_count,
            isTntc: validation.data.is_tntc,
            isPresenceAbsence: validation.data.is_presence_absence,
            presenceDetected: validation.data.presence_detected,
            resultText: validation.data.result_text,
            sampleWeightG: validation.data.sample_weight_g,
            sampleVolumeMl: validation.data.sample_volume_ml,
            dilutionFactor: validation.data.dilution_factor,
            bufferName: validation.data.buffer_name,
            password: validation.data.password
        });

        if (!result.success) return { success: false, message: result.message || "Erro ao registar resultado." };

        revalidatePath("/micro/reading");
        return { success: true, message: "Resultado Microbiológico Registado" };
    } catch (e: any) {
        return { success: false, message: e.message || "Falha na segurança: Verificação interrompida." };
    }
}

export async function deleteIncubatorAction(formData: FormData) {
    const { service } = await getMicroService();
    const id = formData.get("id") as string;
    const reason = formData.get("reason") as string || "Eliminação por erro de registo";

    if (!id) return { success: false, message: "ID is required" };

    try {
        const result = await service.softDeleteEquipment('incubator', id, reason);
        if (!result.success) return { success: false, message: "Erro ao desativar incubadora." };

        revalidatePath("/micro/incubators");
        return { success: true, message: "Incubadora desativada com sucesso (Soft Delete)" };
    } catch (e: any) {
        return { success: false, message: e.message || "Falha na desativação." };
    }
}

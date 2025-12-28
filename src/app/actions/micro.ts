"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { format } from "date-fns";
import { z } from "zod";
import { SAMPLE_TYPE_CATEGORIES, isMicroCategory } from "@/lib/constants/lab";
import { requirePermission } from "@/lib/permissions.server";

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
    result_text: z.string().optional(),
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
            organization_id: userData.organization_id,
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

    // 3. Auto-load microbiological specifications and create pending lab_analysis records
    // This ensures consistency between Lab and Micro modules for reports and dashboards
    if (newSample?.id && productId) {
        try {
            const { data: specs } = await supabase
                .from("product_specifications")
                .select("qa_parameter_id, sample_type_id, qa_parameters!inner(category, status)")
                .eq("product_id", productId)
                .eq("qa_parameters.status", "active")
                .eq("qa_parameters.category", SAMPLE_TYPE_CATEGORIES.MICROBIOLOGICAL)
                .eq("sample_type_id", validation.data.sample_type_id);

            if (specs && specs.length > 0) {
                const uniqueParamIds = Array.from(new Set(specs.map(s => s.qa_parameter_id)));
                const analysisRecords = uniqueParamIds.map(paramId => ({
                    organization_id: userData.organization_id,
                    plant_id: validation.data.plant_id,
                    sample_id: newSample.id,
                    qa_parameter_id: paramId,
                }));
                await supabase.from("lab_analysis").insert(analysisRecords);
            }
        } catch (e) {
            console.error("Failed to auto-load micro specs for lab_analysis:", e);
        }
    }

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
        organization_id: userData.organization_id,
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
        organization_id: userData.organization_id,
        setpoint_temp_c: validation.data.temperature,
        capacity_plates: validation.data.capacity,
    });

    if (error) return { success: false, message: error.message };

    revalidatePath("/micro/incubators");
    return { success: true, message: "Incubator Registered" };
}

export async function startIncubationAction(formData: FormData) {
    const userData = await requirePermission('micro', 'write');
    const supabase = await createClient();

    const rawData = {
        incubator_id: formData.get("incubator_id"),
        sample_id: formData.get("sample_id"),
        media_lot_id: formData.get("media_lot_id"),
    };

    if (!rawData.incubator_id || !rawData.sample_id || !rawData.media_lot_id) {
        return { success: false, message: "Missing required fields" };
    }

    // 2. Get sample and its linked product (via batch)
    const { data: sample } = await supabase
        .from("samples")
        .select(`
            id,
            production_batch_id,
            sample_type_id,
            batch:production_batches(product_id)
        `)
        .eq("id", rawData.sample_id)
        .single();

    if (!sample) return { success: false, message: "Sample not found" };

    // 3. Get microbiological parameters from product specifications
    const batch = Array.isArray(sample.batch) ? sample.batch[0] : sample.batch;
    const productId = batch?.product_id;

    let microParams: { id: string; qa_parameter_id: string; max_colony_count: number | null }[] = [];

    if (productId) {
        const { data: specs } = await supabase
            .from("product_specifications")
            .select(`
                id,
                qa_parameter_id,
                max_colony_count,
                sample_type_id,
                parameter:qa_parameters!inner(id, category)
            `)
            .eq("product_id", productId)
            .eq("status", "active")
            .in("parameter.category", [SAMPLE_TYPE_CATEGORIES.MICROBIOLOGICAL])
            .eq("sample_type_id", sample.sample_type_id);

        microParams = specs || [];
    }

    // Fallback: If no micro specs defined, get any microbiological parameter
    if (microParams.length === 0) {
        const { data: fallbackParams } = await supabase
            .from("qa_parameters")
            .select("id")
            .in("category", [SAMPLE_TYPE_CATEGORIES.MICROBIOLOGICAL])
            .limit(5);

        if (fallbackParams && fallbackParams.length > 0) {
            microParams = fallbackParams.map(p => ({
                id: "",
                qa_parameter_id: p.id,
                max_colony_count: null
            }));
        }
    }

    // Still no params? Use first available
    if (microParams.length === 0) {
        const { data: anyParam } = await supabase
            .from("qa_parameters")
            .select("id")
            .limit(1)
            .single();
        if (anyParam) {
            microParams = [{ id: "", qa_parameter_id: anyParam.id, max_colony_count: null }];
        }
    }

    if (microParams.length === 0) {
        return { success: false, message: "No QA Parameters defined" };
    }

    // 4. Create Test Session
    const { data: session, error: sessionError } = await supabase
        .from("micro_test_sessions")
        .insert({
            organization_id: userData.organization_id,
            plant_id: userData.plant_id,
            incubator_id: rawData.incubator_id,
            started_by: userData.id,
            status: "incubating"
        })
        .select()
        .single();

    if (sessionError) return { success: false, message: "Failed to start session: " + sessionError.message };

    // 5. Create Micro Results for ALL microbiological parameters
    const resultsToInsert = microParams.map(spec => ({
        organization_id: userData.organization_id,
        plant_id: userData.plant_id,
        sample_id: rawData.sample_id,
        qa_parameter_id: spec.qa_parameter_id,
        media_lot_id: rawData.media_lot_id,
        test_session_id: session.id,
        status: "incubating"
    }));

    const { error: resultError } = await supabase
        .from("micro_results")
        .insert(resultsToInsert);

    if (resultError) return { success: false, message: "Failed to create results: " + resultError.message };

    // 6. Update sample status
    await supabase
        .from("samples")
        .update({ status: "in_analysis" })
        .eq("id", rawData.sample_id)
        .eq("organization_id", userData.organization_id)
        .eq("plant_id", userData.plant_id);

    revalidatePath("/micro/incubators");
    revalidatePath("/micro/reading");
    return { success: true, message: `Incubation started with ${microParams.length} parameter(s)` };
}

export async function registerMicroResultAction(formData: FormData) {
    const userData = await requirePermission('micro', 'write');
    const supabase = await createClient();

    const rawData = {
        result_id: formData.get("result_id"),
        colony_count: formData.get("colony_count"),
        is_tntc: formData.get("is_tntc") === 'on',
        result_text: formData.get("result_text"),
    };

    const validation = RegisterMicroResultSchema.safeParse(rawData);
    if (!validation.success) return { success: false, message: "Invalid Data" };

    // Get the micro result with sample and parameter info
    const { data: result } = await supabase
        .from("micro_results")
        .select(`
            id,
            sample_id,
            qa_parameter_id,
            sample:samples(
                production_batch_id,
                sample_type_id,
                batch:production_batches(product_id)
            )
        `)
        .eq("id", validation.data.result_id)
        .single();

    if (!result) return { success: false, message: "Result not found" };

    // Use userData from requirePermission
    const profile = userData;

    // Get spec limit for conformity check
    const sample = Array.isArray(result.sample) ? result.sample[0] : result.sample;
    const batch = sample?.batch;
    const batchData = Array.isArray(batch) ? batch[0] : batch;
    const productId = batchData?.product_id;

    let maxColonyCount: number | null = null;

    if (productId) {
        const { data: specs } = await supabase
            .from("product_specifications")
            .select("max_colony_count, sample_type_id")
            .eq("product_id", productId)
            .eq("qa_parameter_id", result.qa_parameter_id)
            .eq("status", "active")
            .eq("sample_type_id", sample.sample_type_id)
            .single();

        maxColonyCount = specs?.max_colony_count ?? null;
    }

    // Determine conformity
    let isConforming: boolean | null = null;
    const colonyCount = validation.data.colony_count;
    const isTntc = validation.data.is_tntc;

    if (isTntc) {
        // TNTC is always non-conforming if there's a limit
        isConforming = maxColonyCount === null ? null : false;
    } else if (colonyCount !== undefined && colonyCount !== null) {
        if (maxColonyCount !== null) {
            isConforming = colonyCount <= maxColonyCount;
        }
    }

    // Update the micro result
    const { error } = await supabase
        .from("micro_results")
        .update({
            colony_count: isTntc ? null : colonyCount,
            is_tntc: isTntc,
            result_text: validation.data.result_text || null,
            is_conforming: isConforming,
            read_by: userData.id,
            read_at: new Date().toISOString(),
            status: "completed",
        })
        .eq("id", validation.data.result_id)
        .eq("organization_id", userData.organization_id)
        .eq("plant_id", userData.plant_id);

    if (error) return { success: false, message: error.message };

    revalidatePath("/micro/reading");
    return {
        success: true,
        message: isConforming === true
            ? "Result: CONFORMING ✓"
            : isConforming === false
                ? "Result: NON-CONFORMING ✗"
                : "Result Registered"
    };
}


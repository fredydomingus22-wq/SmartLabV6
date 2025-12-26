"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { format } from "date-fns";
import { z } from "zod";
import { SAMPLE_TYPE_CATEGORIES, isFinishedProduct, isIntermediateProduct } from "@/lib/constants/lab";

// --- Schemas ---

const CreateSampleSchema = z.object({
    sample_type_id: z.string().uuid(),
    code: z.string().optional(),
    production_batch_id: z.string().uuid().optional(),
    intermediate_product_id: z.string().uuid().optional(),
    sampling_point_id: z.string().uuid().optional(),
    plant_id: z.string().uuid(),
});

const RegisterResultSchema = z.object({
    sample_id: z.string().uuid(),
    qa_parameter_id: z.string().uuid(),
    value_numeric: z.coerce.number().optional(),
    value_text: z.string().optional(),
    is_conforming: z.coerce.boolean().optional(),
    notes: z.string().optional(),
});

const ApproveSampleSchema = z.object({
    sample_id: z.string().uuid(),
    status: z.enum(["approved", "rejected"]),
    reason: z.string().optional(),
});

// --- Actions ---

/**
 * Create a new Sample for analysis
 * URS: Auto-loads product specifications and creates pending lab_analysis records
 */
export async function createSampleAction(formData: FormData) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, message: "Unauthorized" };

    const { data: userData } = await supabase
        .from('user_profiles')
        .select('organization_id')
        .eq('id', user.id)
        .single();
    if (!userData) return { success: false, message: "Profile not found" };

    const rawData = {
        sample_type_id: formData.get("sample_type_id"),
        code: formData.get("code"),
        production_batch_id: formData.get("production_batch_id") || undefined,
        intermediate_product_id: formData.get("intermediate_product_id") || undefined,
        sampling_point_id: formData.get("sampling_point_id") || undefined,
        plant_id: formData.get("plant_id"),
    };

    const validation = CreateSampleSchema.safeParse(rawData);
    if (!validation.success) {
        console.error("CreateSample validation failed:", validation.error.format());
        return { success: false, message: validation.error.issues[0].message };
    }

    // NC-001: CIP Validation Guard - DISABLED per user request
    /*
    if (validation.data.sampling_point_id || validation.data.intermediate_product_id) {
        const { getEquipmentCIPStatus } = await import("@/lib/queries/production");
        const equipmentId = validation.data.sampling_point_id || validation.data.intermediate_product_id;
        const cipStatus = await getEquipmentCIPStatus(equipmentId!);

        if (!cipStatus.isClean) {
            return {
                success: false,
                message: `SOP Violation: Equipment/Sampling Point must be cleaned (CIP Valid) before sampling. Status: ${cipStatus.status || 'No CIP'}`
            };
        }
    }
    */

    let collectedAt = formData.get("collected_at") as string || new Date().toISOString();

    // 1. Resolve Metadata (Sample Type, Product ID, SKU) BEFORE Insert
    let finalCode = validation.data.code;
    let categoryFilter: string[] = [];
    let productId = null;
    let sampleTypeCode = "NOSKU";

    try {
        // Fetch Sample Type and verify existence
        const { data: sampleType } = await supabase
            .from("sample_types")
            .select("id, test_category, code")
            .eq("id", validation.data.sample_type_id)
            .single();

        if (!sampleType) {
            return {
                success: false,
                message: "Tipo de amostra inválido ou expirado. Por favor, atualize a página (F5) e tente novamente."
            };
        }

        sampleTypeCode = sampleType?.code || "NOTYPE";
        const testCategory = sampleType?.test_category || "physico_chemical";

        // Business Rule Validation: FP and IP require Batch/Tank
        const isProductSample = isFinishedProduct(sampleTypeCode) || isIntermediateProduct(sampleTypeCode);
        if (isProductSample) {
            if (!validation.data.production_batch_id && !validation.data.intermediate_product_id) {
                return {
                    success: false,
                    message: "This sample type (Product/Intermediate) requires a Tank or Batch selection."
                };
            }
        }

        if (testCategory === SAMPLE_TYPE_CATEGORIES.PHYSICO_CHEMICAL) {
            categoryFilter = [SAMPLE_TYPE_CATEGORIES.PHYSICO_CHEMICAL];
        } else if (testCategory === SAMPLE_TYPE_CATEGORIES.MICROBIOLOGICAL) {
            categoryFilter = [SAMPLE_TYPE_CATEGORIES.MICROBIOLOGICAL];
        } else if (testCategory === "both") {
            categoryFilter = [SAMPLE_TYPE_CATEGORIES.PHYSICO_CHEMICAL, SAMPLE_TYPE_CATEGORIES.MICROBIOLOGICAL];
        }

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
        // Generate Automatic Code: [PREFIX]-[TYPE_CODE]-[YYYYMMDD]-[HHMM]
        // Prefix = SKU (for PA/IP) OR SamplingPointCode (for WAT/ENV/CIP)
        let sampleCodePrefix = "NOSKU";

        if (productId) {
            const { data: product } = await supabase.from("products").select("sku").eq("id", productId).single();
            sampleCodePrefix = product?.sku || "NOSKU";
        } else if (validation.data.sampling_point_id) {
            const { data: sp } = await supabase.from("sampling_points").select("code").eq("id", validation.data.sampling_point_id).single();
            sampleCodePrefix = sp?.code || "NOSP";
        }

        // Timezone Handling (Universal for all sample types)
        // 1. Parse collectedAt to a Date object, handling Local (Input) vs UTC (Auto)
        // 2. Use 'Africa/Luanda' for the Sample Code
        let dateObj: Date;
        if (collectedAt && !collectedAt.endsWith("Z")) {
            // Input from form (YYYY-MM-DDTHH:mm) -> Treat as Luanda Time (UTC+1)
            // Append seconds and offset.
            dateObj = new Date(`${collectedAt}:00+01:00`);
        } else {
            // Auto-generated (new Date().toISOString()) or ISO string with 'Z' -> Treat as UTC
            dateObj = new Date(collectedAt);
        }

        // Update collectedAt to be the normalized ISO string for DB insert (fixing re-assignment)
        collectedAt = dateObj.toISOString();

        // Format to Luanda time for the sample code
        const formatter = new Intl.DateTimeFormat('pt-PT', {
            timeZone: 'Africa/Luanda',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        });

        const parts = formatter.formatToParts(dateObj);
        const getPart = (type: string) => parts.find(p => p.type === type)?.value || "";

        const datePart = `${getPart('year')}${getPart('month')}${getPart('day')}`;
        const timePart = `${getPart('hour')}${getPart('minute')}`;

        finalCode = `${sampleCodePrefix}-${sampleTypeCode}-${datePart}-${timePart}`;
    } catch (e) {
        console.error("Error resolving metadata for sample naming:", e);
    }

    // 2. Insert the sample with the finalized code
    const { data: newSample, error } = await supabase.from("samples").insert({
        organization_id: userData.organization_id,
        plant_id: validation.data.plant_id,
        sample_type_id: validation.data.sample_type_id,
        code: finalCode || `AMS-${format(new Date(), "yyyyMMdd-HHmm")}`, // Fallback if auto-gen fails
        production_batch_id: validation.data.production_batch_id || null,
        intermediate_product_id: validation.data.intermediate_product_id || null,
        sampling_point_id: validation.data.sampling_point_id || null,
        collected_by: user.id,
        collected_at: collectedAt,
        status: "collected",
    }).select("id").single();

    if (error) return { success: false, message: error.message };

    // 3. Auto-load specifications and create pending lab_analysis records
    if (newSample?.id && productId && categoryFilter.length > 0) {
        try {
            const { data: specs } = await supabase
                .from("product_specifications")
                .select("qa_parameter_id, sample_type_id, qa_parameters!inner(category, status)")
                .eq("product_id", productId)
                .eq("qa_parameters.status", "active")
                .in("qa_parameters.category", categoryFilter)
                .eq("sample_type_id", validation.data.sample_type_id);

            if (specs && specs.length > 0) {
                // Deduplicate: If both specific and generic exist, we just need the parameter ID once.
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
            console.error("Failed to auto-load specs:", e);
        }
    }

    revalidatePath("/lab");
    return { success: true, message: "Sample Created" };
}

/**
 * Update Sample Status (collected, in_analysis, etc.)
 * Supports both FormData (for forms) and direct arguments (for Kanban)
 */
export async function updateSampleStatusAction(data: FormData | { id: string, status: string }) {
    const supabase = await createClient();

    let sample_id: string;
    let status: string;

    if (data instanceof FormData) {
        sample_id = data.get("sample_id") as string;
        status = data.get("status") as string;
    } else {
        sample_id = data.id;
        status = data.status;
    }

    const validStatuses = ["pending", "collected", "in_analysis", "reviewed", "approved", "rejected", "validated"];
    if (!sample_id || !validStatuses.includes(status)) {
        return { success: false, message: "Invalid data" };
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, message: "Unauthorized" };

    const { data: profile } = await supabase
        .from("user_profiles")
        .select("organization_id, plant_id")
        .eq("id", user.id)
        .single();

    if (!profile) return { success: false, message: "Profile not found" };

    const { error } = await supabase
        .from("samples")
        .update({ status })
        .eq("id", sample_id)
        .eq("organization_id", profile.organization_id)
        .eq("plant_id", profile.plant_id);

    if (error) return { success: false, message: error.message };

    revalidatePath("/lab");
    revalidatePath("/lab/kanban");
    return { success: true, message: `Sample status updated to ${status}` };
}

/**
 * Automatically advance sample status based on analysis completion
 */
export async function advanceSampleAction(sampleId: string) {
    const supabase = await createClient();

    // 1. Get sample and its analysis results
    const { data: sample, error: sampleError } = await supabase
        .from("samples")
        .select(`
            id,
            status,
            production_batch_id,
            batch:production_batches(product_id),
            lab_analysis(id, value_numeric, value_text, is_valid)
        `)
        .eq("lab_analysis.is_valid", true)
        .eq("id", sampleId)
        .single();

    if (sampleError || !sample) return { success: false, message: "Sample not found" };

    const analyses = sample.lab_analysis || [];
    const completedCount = analyses.filter(a => a.value_numeric !== null || a.value_text !== null).length;
    const totalCount = analyses.length;

    let nextStatus = sample.status;

    if (totalCount > 0) {
        if (completedCount === 0 && sample.status === "collected") {
            // Keep as collected or move to in_analysis if first result is about to be entered
        } else if (completedCount > 0 && completedCount < totalCount) {
            nextStatus = "in_analysis";
        } else if (completedCount === totalCount && totalCount > 0) {
            nextStatus = "reviewed";
        }
    }

    if (nextStatus !== sample.status) {
        // Fetch user profile for tenant isolation (Defense in depth)
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { success: false, message: "Unauthorized" };

        const { data: profile } = await supabase
            .from("user_profiles")
            .select("organization_id, plant_id")
            .eq("id", user.id)
            .single();

        if (!profile) return { success: false, message: "Profile not found" };

        const { error } = await supabase
            .from("samples")
            .update({ status: nextStatus })
            .eq("id", sampleId)
            .eq("organization_id", profile.organization_id)
            .eq("plant_id", profile.plant_id);

        if (error) return { success: false, message: error.message };

        revalidatePath("/lab");
        revalidatePath("/lab/kanban");
        return { success: true, message: `Sample advanced to ${nextStatus}`, status: nextStatus };
    }

    return { success: true, message: "No status change needed", status: sample.status };
}

/**
 * Register an analysis result for a sample
 */
export async function registerResultAction(formData: FormData) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, message: "Unauthorized" };

    const rawData = {
        sample_id: formData.get("sample_id"),
        qa_parameter_id: formData.get("qa_parameter_id"),
        value_numeric: formData.get("value_numeric") || undefined,
        value_text: formData.get("value_text") || undefined,
        is_conforming: formData.get("is_conforming") === "true" || formData.get("is_conforming") === "on",
        notes: formData.get("notes") || undefined,
    };

    const validation = RegisterResultSchema.safeParse(rawData);
    if (!validation.success) {
        return { success: false, message: validation.error.issues[0].message };
    }

    // --- QUALIFICATION CHECK ---
    const { checkAnalystQualification } = await import("@/lib/queries/training");
    const qualCheck = await checkAnalystQualification(user.id, validation.data.qa_parameter_id);
    if (!qualCheck.qualified) {
        return { success: false, message: `ACESSO NEGADO: ${qualCheck.reason}` };
    }

    // 1. Get sample context and SPEC early
    const { data: sampleContext } = await supabase
        .from("samples")
        .select(`
            organization_id, 
            plant_id, 
            sample_type_id, 
            production_batch_id,
            intermediate_product_id,
            batch:production_batches(product_id), 
            intermediate:intermediate_products(batch:production_batches(product_id))
        `)
        .eq("id", validation.data.sample_id)
        .single();

    if (!sampleContext) return { success: false, message: "Amostra não encontrada" };

    // Resolve Product ID
    let pId: string | undefined;
    if (sampleContext.batch) {
        const pb = Array.isArray(sampleContext.batch) ? sampleContext.batch[0] : sampleContext.batch;
        pId = pb?.product_id;
    } else if (sampleContext.intermediate) {
        const ip = Array.isArray(sampleContext.intermediate) ? sampleContext.intermediate[0] : sampleContext.intermediate;
        const pb = Array.isArray(ip?.batch) ? ip.batch[0] : ip?.batch;
        pId = pb?.product_id;
    }

    // --- AUTOMATIC COMPLIANCE CHECK ---
    let autoConforming = validation.data.is_conforming;
    let spec: any = null;

    if (pId && validation.data.value_numeric !== undefined) {
        const { data: specs } = await supabase
            .from("product_specifications")
            .select("is_critical, min_value, max_value, qa_parameter:qa_parameters(name)")
            .eq("qa_parameter_id", validation.data.qa_parameter_id)
            .eq("product_id", pId)
            .eq("sample_type_id", sampleContext.sample_type_id);

        spec = specs?.[0];

        if (spec) {
            const val = validation.data.value_numeric;
            const min = spec.min_value;
            const max = spec.max_value;

            let isPass = true;
            if (min !== null && val < min) isPass = false;
            if (max !== null && val > max) isPass = false;

            autoConforming = isPass;
        }
    }

    // Check for duplicate
    const { data: existingResult } = await supabase
        .from("lab_analysis")
        .select("id")
        .eq("sample_id", validation.data.sample_id)
        .eq("qa_parameter_id", validation.data.qa_parameter_id)
        .maybeSingle();

    if (existingResult) {
        return { success: false, message: "Resultado já existe para este parâmetro." };
    }

    const { data: newResult, error } = await supabase.from("lab_analysis").insert({
        organization_id: sampleContext.organization_id,
        plant_id: sampleContext.plant_id,
        sample_id: validation.data.sample_id,
        qa_parameter_id: validation.data.qa_parameter_id,
        value_numeric: validation.data.value_numeric || null,
        value_text: validation.data.value_text || null,
        is_conforming: autoConforming,
        notes: validation.data.notes || null,
        analyzed_by: user.id,
    }).select("id").single();

    if (error) return { success: false, message: error.message };

    // --- AUTOMATIC BATCH BLOCKING ---
    let ncCreated = false;
    let ncNumber = "";
    let batchBlocked = false;

    if (autoConforming === false && spec) {
        // Create NC if critical
        if (spec.is_critical) {
            const paramName = Array.isArray(spec.qa_parameter)
                ? (spec.qa_parameter[0] as any)?.name
                : (spec.qa_parameter as any)?.name;

            const { createNCFromFailedResult } = await import("@/app/actions/qms");
            const ncResult = await createNCFromFailedResult({
                sampleId: validation.data.sample_id,
                parameterId: validation.data.qa_parameter_id,
                parameterName: paramName || "Unknown",
                value: validation.data.value_numeric ?? validation.data.value_text ?? "N/A",
                specMin: spec.min_value,
                specMax: spec.max_value,
                isCritical: true,
                organizationId: sampleContext.organization_id,
                plantId: sampleContext.plant_id,
                userId: user.id,
            });
            ncCreated = ncResult.ncCreated || false;
            ncNumber = ncResult.ncNumber || "";

            // BLOCK THE BATCH
            const batchId = sampleContext.production_batch_id ||
                (sampleContext.intermediate_products as any)?.production_batch_id;

            if (batchId) {
                const { error: blockError } = await supabase
                    .from("production_batches")
                    .update({ status: "blocked" })
                    .eq("id", batchId)
                    .eq("organization_id", sampleContext.organization_id)
                    .eq("plant_id", sampleContext.plant_id);

                if (!blockError) batchBlocked = true;
            }
        }
    }

    // Trigger AI Validation
    if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY && newResult) {
        try {
            fetch(`${process.env.SUPABASE_URL}/functions/v1/ai-validator`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    record: {
                        id: newResult.id,
                        sample_id: validation.data.sample_id,
                        qa_parameter_id: validation.data.qa_parameter_id
                    }
                })
            });
        } catch (aiError) {
            console.warn("AI trigger failed:", aiError);
        }
    }

    // Auto-advance sample status
    let newStatus = "in_analysis";
    if (pId) {
        const { count: uniqueSpecParams } = await supabase
            .from("product_specifications")
            .select("qa_parameter_id", { count: "exact", head: true })
            .eq("product_id", pId)
            .eq("sample_type_id", sampleContext.sample_type_id);

        const { count: resultCount } = await supabase
            .from("lab_analysis")
            .select("*", { count: "exact", head: true })
            .eq("sample_id", validation.data.sample_id);

        if (uniqueSpecParams !== null && resultCount !== null && resultCount >= uniqueSpecParams) {
            newStatus = "reviewed";
        }
    }

    await supabase.from("samples").update({ status: newStatus }).eq("id", validation.data.sample_id);

    revalidatePath("/lab");
    revalidatePath("/production");

    let message = "Resultado Registado";
    if (newStatus === "reviewed") message = "Todos os parâmetros concluídos! Amostra pronta para revisão.";
    if (ncCreated) message += ` ⚠️ NC ${ncNumber} criada (Falha Crítica).`;
    if (batchBlocked) message += ` 🛡️ Lote BLOQUEADO automaticamente.`;

    return {
        success: true,
        message,
        ncCreated,
        ncNumber: ncNumber || undefined,
        batchBlocked
    };
}

/**
 * Approve or Reject a Sample (QA Manager action)
 */
export async function approveSampleAction(formData: FormData) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, message: "Unauthorized" };

    const rawData = {
        sample_id: formData.get("sample_id"),
        status: formData.get("status"),
        reason: formData.get("reason") || undefined,
    };

    const validation = ApproveSampleSchema.safeParse(rawData);
    if (!validation.success) {
        return { success: false, message: validation.error.issues[0].message };
    }

    // Generate signature hash (MVP: just UUID, production would use crypto)
    const signatureHash = crypto.randomUUID();

    const { data: profile } = await supabase
        .from("user_profiles")
        .select("organization_id, plant_id")
        .eq("id", user.id)
        .single();
    if (!profile) return { success: false, message: "Profile not found" };

    const { error } = await supabase
        .from("samples")
        .update({
            status: validation.data.status,
        })
        .eq("id", validation.data.sample_id)
        .eq("organization_id", profile.organization_id)
        .eq("plant_id", profile.plant_id);

    if (error) return { success: false, message: error.message };

    // Also update all lab_analysis results with signature
    await supabase
        .from("lab_analysis")
        .update({ signed_transaction_hash: signatureHash })
        .eq("sample_id", validation.data.sample_id)
        .eq("organization_id", profile.organization_id)
        .eq("plant_id", profile.plant_id);

    revalidatePath("/lab");
    return {
        success: true,
        message: validation.data.status === "approved"
            ? "Sample Approved"
            : "Sample Rejected"
    };
}

/**
 * Get pending samples for the current user's plant
 */
export async function getPendingSamplesAction() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, message: "Unauthorized", data: [] };

    const { data: profile } = await supabase
        .from("user_profiles")
        .select("organization_id, plant_id")
        .eq("id", user.id)
        .single();

    if (!profile) return { success: false, message: "Profile not found", data: [] };

    const { data: samples, error } = await supabase
        .from("samples")
        .select(`
            id,
            code,
            status,
            collected_at,
            sample_type:sample_types(name),
            batch:production_batches(code, product:products(name))
        `)
        .eq("organization_id", profile.organization_id)
        .eq("plant_id", profile.plant_id)
        .in("status", ["pending", "collected", "in_analysis"])
        .order("collected_at", { ascending: true });

    if (error) return { success: false, message: error.message, data: [] };

    return { success: true, data: samples };
}

/**
 * Approve or Reject a Sample with Password Verification (21 CFR Part 11)
 */
export async function approveSampleWithPasswordAction(formData: FormData) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, message: "Unauthorized" };

    const password = formData.get("password") as string;
    if (!password) {
        return { success: false, message: "Password required for electronic signature" };
    }

    // Verify password by attempting to reauthenticate
    const { error: authError } = await supabase.auth.signInWithPassword({
        email: user.email!,
        password: password,
    });

    if (authError) {
        return { success: false, message: "Invalid password. Authentication failed." };
    }

    const rawData = {
        sample_id: formData.get("sample_id"),
        status: formData.get("status"),
        reason: formData.get("reason") || undefined,
    };

    const validation = ApproveSampleSchema.safeParse(rawData);
    if (!validation.success) {
        return { success: false, message: validation.error.issues[0].message };
    }

    // Generate signature hash with timestamp and user info
    const signatureData = {
        userId: user.id,
        email: user.email,
        timestamp: new Date().toISOString(),
        action: validation.data.status,
        sampleId: validation.data.sample_id,
    };
    const signatureHash = btoa(JSON.stringify(signatureData));

    const { data: profile } = await supabase
        .from("user_profiles")
        .select("organization_id, plant_id")
        .eq("id", user.id)
        .single();
    if (!profile) return { success: false, message: "Profile not found" };

    const { error } = await supabase
        .from("samples")
        .update({
            status: validation.data.status,
        })
        .eq("id", validation.data.sample_id)
        .eq("organization_id", profile.organization_id)
        .eq("plant_id", profile.plant_id);

    if (error) return { success: false, message: error.message };

    // Update all lab_analysis results with signature
    await supabase
        .from("lab_analysis")
        .update({ signed_transaction_hash: signatureHash })
        .eq("sample_id", validation.data.sample_id)
        .eq("organization_id", profile.organization_id)
        .eq("plant_id", profile.plant_id);

    revalidatePath("/lab");
    return {
        success: true,
        message: validation.data.status === "approved"
            ? "Sample Approved with Electronic Signature"
            : "Sample Rejected"
    };
}

// --- Retest Workflow ---

const RequestRetestSchema = z.object({
    original_result_id: z.string().uuid(),
    reason: z.string().min(5, "Reason must be at least 5 characters"),
});

/**
 * Request a retest for a failed/non-conforming result
 * Invalidates the original result and allows a new one
 */
export async function requestRetestAction(formData: FormData) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, message: "Unauthorized" };

    const rawData = {
        original_result_id: formData.get("original_result_id"),
        reason: formData.get("reason"),
    };

    const validation = RequestRetestSchema.safeParse(rawData);
    if (!validation.success) {
        return { success: false, message: validation.error.issues[0].message };
    }

    // Get original result
    const { data: original, error: fetchError } = await supabase
        .from("lab_analysis")
        .select("id, sample_id, qa_parameter_id, is_valid")
        .eq("id", validation.data.original_result_id)
        .single();

    if (fetchError || !original) {
        return { success: false, message: "Original result not found" };
    }

    if (!original.is_valid) {
        return { success: false, message: "Result has already been retested" };
    }

    // Invalidate the original result
    const { error: updateError } = await supabase
        .from("lab_analysis")
        .update({
            is_valid: false,
            retest_reason: validation.data.reason
        })
        .eq("id", validation.data.original_result_id);

    if (updateError) {
        return { success: false, message: updateError.message };
    }

    // Update sample status back to in_analysis to allow new result
    await supabase
        .from("samples")
        .update({ status: "in_analysis" })
        .eq("id", original.sample_id);

    // Create audit log entry for retest request
    const { data: userData } = await supabase
        .from("user_profiles")
        .select("organization_id, plant_id")
        .eq("id", user.id)
        .single();

    if (userData) {
        await supabase.from("audit_logs").insert({
            organization_id: userData.organization_id,
            plant_id: userData.plant_id,
            table_name: "lab_analysis",
            record_id: original.id,
            action: "retest_requested",
            user_id: user.id,
            old_data: { is_valid: true },
            new_data: {
                is_valid: false,
                retest_reason: validation.data.reason
            },
            ip_address: null,
            user_agent: null,
        });
    }

    revalidatePath("/lab");
    revalidatePath("/lab/history");
    return {
        success: true,
        message: "Retest requested. Original result invalidated.",
        originalResultId: original.id,
        sampleId: original.sample_id,
        parameterId: original.qa_parameter_id
    };
}

/**
 * Register a retest result (links to original via supersedes_id)
 */
export async function registerRetestResultAction(formData: FormData) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, message: "Unauthorized" };

    const rawData = {
        sample_id: formData.get("sample_id"),
        qa_parameter_id: formData.get("qa_parameter_id"),
        value_numeric: formData.get("value_numeric") || undefined,
        value_text: formData.get("value_text") || undefined,
        is_conforming: formData.get("is_conforming") === "true",
        supersedes_id: formData.get("supersedes_id"),
    };

    const validation = RegisterResultSchema.safeParse(rawData);
    if (!validation.success) {
        return { success: false, message: validation.error.issues[0].message };
    }

    const supersedesId = rawData.supersedes_id as string;

    // Get sample for org/plant
    const { data: sample } = await supabase
        .from("samples")
        .select("organization_id, plant_id")
        .eq("id", validation.data.sample_id)
        .single();

    if (!sample) return { success: false, message: "Sample not found" };

    // Insert retest result
    const { error } = await supabase.from("lab_analysis").insert({
        organization_id: sample.organization_id,
        plant_id: sample.plant_id,
        sample_id: validation.data.sample_id,
        qa_parameter_id: validation.data.qa_parameter_id,
        value_numeric: validation.data.value_numeric || null,
        value_text: validation.data.value_text || null,
        is_conforming: validation.data.is_conforming ?? null,
        analyzed_by: user.id,
        is_retest: true,
        supersedes_id: supersedesId,
        is_valid: true,
    });

    if (error) return { success: false, message: error.message };

    revalidatePath("/lab");
    return {
        success: true,
        message: "Retest result registered",
        is_conforming: validation.data.is_conforming
    };
}

/**
 * Save and Sign all results for a sample (21 CFR Part 11 compliant)
 */
export async function signAndSaveResultsAction(
    sampleId: string,
    results: { analysisId: string; value: string | null; notes?: string }[],
    password?: string
) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, message: "Unauthorized" };

    if (!password) {
        return { success: false, message: "A senha é obrigatória para a assinatura eletrónica." };
    }

    // 1. Verify password by attempting to reauthenticate
    const { error: authError } = await supabase.auth.signInWithPassword({
        email: user.email!,
        password: password,
    });

    if (authError) {
        return { success: false, message: "Senha inválida. Falha na autenticação da assinatura." };
    }

    const { data: sample } = await supabase
        .from("samples")
        .select(`
            status, organization_id, plant_id, code, sample_type_id,
            production_batches(id, product_id),
            intermediate_products(production_batches(id, product_id))
        `)
        .eq("id", sampleId)
        .single();

    if (!sample) return { success: false, message: "Amostra não encontrada" };
    if (["validated", "approved", "rejected"].includes(sample.status)) {
        return { success: false, message: `Amostra já está finalizada (${sample.status})` };
    }

    const { data: currentAnalyses } = await supabase
        .from("lab_analysis")
        .select("id, qa_parameter_id")
        .eq("sample_id", sampleId);

    const analysisMap = new Map(currentAnalyses?.map(a => [a.id, a.qa_parameter_id]));

    let productId = null;
    const batchData = Array.isArray(sample?.production_batches) ? sample?.production_batches[0] : sample?.production_batches;
    productId = batchData?.product_id;
    if (!productId && sample?.intermediate_products) {
        const ip = Array.isArray(sample.intermediate_products) ? sample.intermediate_products[0] : sample.intermediate_products;
        const ipBatch = Array.isArray(ip?.production_batches) ? ip.production_batches[0] : ip?.production_batches;
        productId = ipBatch?.product_id;
    }

    let specs: Record<string, any> = {};
    if (productId) {
        const { data: specData } = await supabase
            .from("product_specifications")
            .select("qa_parameter_id, min_value, max_value, is_critical, sample_type_id, qa_parameters(name)")
            .eq("product_id", productId)
            .or(`sample_type_id.eq.${sample.sample_type_id},sample_type_id.is.null`);

        specData?.forEach(s => {
            // Prioritize specific (same sample_type_id)
            const existing = specs[s.qa_parameter_id];
            if (!existing || (existing.sample_type_id === null && s.sample_type_id !== null)) {
                const paramName = Array.isArray(s.qa_parameters) ? (s.qa_parameters[0] as any)?.name : (s.qa_parameters as any)?.name;
                specs[s.qa_parameter_id] = { ...s, param_name: paramName || "Unknown" };
            }
        });
    }

    const signatureHash = btoa(JSON.stringify({
        userId: user.id,
        timestamp: new Date().toISOString(),
        sampleId
    }));

    const { checkAnalystQualification } = await import("@/lib/queries/training");

    let hasOOS = false;
    for (const result of results) {
        const paramId = analysisMap.get(result.analysisId);
        if (!paramId) continue;

        // Qualification Check
        const qualCheck = await checkAnalystQualification(user.id, paramId);
        if (!qualCheck.qualified) {
            return { success: false, message: `ACESSO NEGADO (${result.analysisId}): ${qualCheck.reason}` };
        }

        const rawValue = result.value ? result.value.trim().replace(',', '.') : "";
        const isNumeric = rawValue !== "" && /^-?\d*(\.\d+)?$/.test(rawValue);
        const numValue = isNumeric ? parseFloat(rawValue) : null;

        let isConforming = null;
        if (isNumeric && specs[paramId]) {
            const spec = specs[paramId];
            isConforming = true;
            if (spec.min_value !== null && numValue! < spec.min_value) isConforming = false;
            if (spec.max_value !== null && numValue! > spec.max_value) isConforming = false;
            if (isConforming === false) hasOOS = true;
        }

        const { error: updateError } = await supabase
            .from("lab_analysis")
            .update({
                value_numeric: isNumeric ? numValue : null,
                value_text: !isNumeric && result.value ? result.value : null,
                is_conforming: isConforming,
                notes: result.notes || null,
                analyzed_by: user.id,
                analyzed_at: new Date().toISOString(),
                signed_transaction_hash: signatureHash
            })
            .eq("id", result.analysisId);

        if (updateError) {
            console.error(`Error updating analysis ${result.analysisId}:`, updateError);
            return { success: false, message: `Erro ao gravar resultado: ${updateError.message}` };
        }

        // SPC Alert Check: Detect statistical violations
        if (isNumeric && numValue !== null) {
            try {
                const { checkAndCreateSPCAlerts } = await import("@/lib/queries/spc-alerts");
                const batchId = (Array.isArray(sample?.production_batches)
                    ? sample?.production_batches[0]
                    : sample?.production_batches)?.id || null;

                await checkAndCreateSPCAlerts(
                    paramId,
                    result.analysisId,
                    sampleId,
                    batchId,
                    numValue
                );
            } catch (spcError) {
                console.warn("SPC alert check failed (non-blocking):", spcError);
            }
        }

        // AI Validation Trigger
        if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
            try {
                await fetch(`${process.env.SUPABASE_URL}/functions/v1/ai-validator`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        record: {
                            id: result.analysisId,
                            sample_id: sampleId,
                            qa_parameter_id: paramId,
                        }
                    })
                });
            } catch (aiError) {
                console.warn(`AI validation trigger failed for ${result.analysisId}:`, aiError);
            }
        }
    }

    const resultsCount = results.filter(r => r.value !== null && r.value !== "").length;
    const totalCount = currentAnalyses?.length || 0;

    let nextStatus = "in_analysis";
    if (resultsCount === totalCount && totalCount > 0) {
        nextStatus = "reviewed";
    }

    const { error: sampleUpdateError } = await supabase.from("samples").update({ status: nextStatus }).eq("id", sampleId);

    if (sampleUpdateError) {
        console.error("Error updating sample status:", sampleUpdateError);
        return { success: false, message: "Resultados gravados, mas houve um erro ao atualizar o status da amostra." };
    }

    revalidatePath(`/lab/samples/${sampleId}`);
    revalidatePath("/lab");

    return {
        success: true,
        message: hasOOS
            ? "Assinado com sucesso. ATENÇÃO: Contém resultados fora de especificação!"
            : "Assinado e guardado com sucesso.",
        status: nextStatus
    };
}

/**
 * Save all results for a sample at once (multi-parameter entry)
 */
export async function saveAllResultsAction(
    sampleId: string,
    results: { analysisId: string; value: string | null; notes?: string; attachmentUrl?: string }[],
    sampleNotes?: string
) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, message: "Unauthorized" };

    let successCount = 0;
    let errorCount = 0;

    // Get specs and current status for conformity check and guards
    const { data: sample } = await supabase
        .from("samples")
        .select(`
            status,
            organization_id,
            plant_id,
            production_batch_id,
            intermediate_product_id,
            batch:production_batches(product_id),
            intermediate:intermediate_products(batch:production_batches(product_id))
        `)
        .eq("id", sampleId)
        .single();

    if (!sample) return { success: false, message: "Amostra não encontrada" };

    // Status Guard: Prevent editing validated or approved samples
    if (["validated", "approved", "rejected"].includes(sample.status)) {
        return { success: false, message: `Não é possível editar amostra com status ${sample.status}` };
    }

    // 1. Fetch ALL current analyses for this sample upfront
    const { data: currentAnalyses } = await supabase
        .from("lab_analysis")
        .select("id, qa_parameter_id")
        .eq("sample_id", sampleId);

    const analysisMap = new Map(currentAnalyses?.map(a => [a.id, a.qa_parameter_id]));

    // 2. Fetch ALL relevant specifications for this product upfront
    // Resilient product lookup: check both production_batches and intermediate_products
    let productId = null;
    const batchData = Array.isArray(sample?.batch) ? sample?.batch[0] : sample?.batch;
    productId = batchData?.product_id;

    if (!productId && sample?.intermediate) {
        const ip = Array.isArray(sample.intermediate) ? sample.intermediate[0] : sample.intermediate;
        const ipBatch = Array.isArray(ip?.batch) ? ip.batch[0] : ip?.batch;
        productId = ipBatch?.product_id;
    }

    let specs: Record<string, { min_value?: number; max_value?: number; is_critical?: boolean; param_name?: string }> = {};
    if (productId) {
        const { data: specData } = await supabase
            .from("product_specifications")
            .select("qa_parameter_id, min_value, max_value, is_critical, qa_parameters(name)")
            .eq("product_id", productId);

        specData?.forEach(s => {
            const paramName = Array.isArray(s.qa_parameters)
                ? (s.qa_parameters[0] as any)?.name
                : (s.qa_parameters as any)?.name;

            specs[s.qa_parameter_id] = {
                ...s,
                param_name: paramName || "Unknown"
            };
        });
    }

    let ncCreatedCount = 0;

    for (const result of results) {
        const paramId = analysisMap.get(result.analysisId);
        if (!paramId) {
            errorCount++;
            continue;
        }

        const rawValue = result.value ? result.value.trim().replace(',', '.') : "";

        // Check if actually numeric
        const isNumeric = rawValue !== "" && /^-?\d*(\.\d+)?$/.test(rawValue);
        const numValue = isNumeric ? parseFloat(rawValue) : null;

        let isConforming = null;
        if (isNumeric && specs[paramId]) {
            const spec = specs[paramId];
            isConforming = true;
            if (spec.min_value !== null && spec.min_value !== undefined && numValue! < (spec.min_value as number)) isConforming = false;
            if (spec.max_value !== null && spec.max_value !== undefined && numValue! > (spec.max_value as number)) isConforming = false;
        }

        const { error } = await supabase
            .from("lab_analysis")
            .update({
                value_numeric: isNumeric ? numValue : null,
                value_text: !isNumeric && result.value ? result.value : null,
                is_conforming: isConforming,
                notes: result.notes || null,
                analyzed_by: user.id,
                analyzed_at: new Date().toISOString(),
            })
            .eq("id", result.analysisId);

        if (error) {
            errorCount++;
        } else {
            successCount++;

            // Auto-create NC for critical parameter failures
            if (isConforming === false && specs[paramId]?.is_critical) {
                try {
                    const spec = specs[paramId];
                    const { createNCFromFailedResult } = await import("@/app/actions/qms");
                    await createNCFromFailedResult({
                        sampleId,
                        parameterId: paramId,
                        parameterName: spec.param_name || "Unknown",
                        value: isNumeric ? numValue! : result.value!,
                        specMin: spec.min_value,
                        specMax: spec.max_value,
                        isCritical: true,
                        organizationId: sample.organization_id,
                        plantId: sample.plant_id,
                        userId: user.id,
                    });
                    ncCreatedCount++;

                    // BLOCK THE BATCH automatically
                    const batchId = sample.production_batch_id ||
                        (sample.intermediate as any)?.production_batch_id;

                    if (batchId) {
                        await supabase
                            .from("production_batches")
                            .update({ status: "blocked" })
                            .eq("id", batchId)
                            .eq("organization_id", sample.organization_id)
                            .eq("plant_id", sample.plant_id);
                    }
                } catch (e) {
                    console.error("Failed to auto-create NC or block batch in bulk save:", e);
                }
            }
        }
    }

    // Save Sample Notes if provided
    if (sampleNotes !== undefined) {
        await supabase
            .from("samples")
            .update({ notes: sampleNotes })
            .eq("id", sampleId);
    }

    // Auto-advance sample status if not already validated
    const { data: analyses } = await supabase
        .from("lab_analysis")
        .select("id, value_numeric, value_text, is_valid")
        .eq("sample_id", sampleId)
        .neq("is_valid", false);

    const completeCount = analyses?.filter(a => a.value_numeric !== null || a.value_text !== null).length || 0;
    const totalCount = analyses?.length || 0;

    let newStatus = sample.status;
    if (totalCount > 0) {
        if (completeCount === 0) {
            newStatus = "collected";
        } else if (completeCount < totalCount) {
            newStatus = "in_analysis";
        } else {
            newStatus = "reviewed";
        }
    }

    // Only update if status is progressing or staying in editable range
    if (newStatus !== sample.status && !["validated", "approved"].includes(sample.status)) {
        await supabase
            .from("samples")
            .update({ status: newStatus })
            .eq("id", sampleId);
    }


    revalidatePath("/lab");
    revalidatePath(`/lab/samples/${sampleId}`);

    if (errorCount > 0) {
        return { success: false, message: `Guardados ${successCount}, falharam ${errorCount}` };
    }

    let finalMessage = `Guardados ${successCount} resultados.`;
    if (ncCreatedCount > 0) {
        finalMessage += ` ⚠️ ${ncCreatedCount} NC(s) criadas automaticamente por falha crítica.`;
    }

    return { success: true, message: finalMessage };
}

/**
 * Validate a sample (technician signature) with optional password verification (21 CFR Part 11)
 */
export async function validateSampleAction(sampleId: string, password?: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, message: "Unauthorized" };

    if (password) {
        // Verify password
        const { error: authError } = await supabase.auth.signInWithPassword({
            email: user.email!,
            password: password,
        });
        if (authError) return { success: false, message: "Invalid password for signature" };
    }

    // Check all analyses have results
    const { data: analyses } = await supabase
        .from("lab_analysis")
        .select("id, qa_parameter_id, value_numeric, value_text")
        .eq("sample_id", sampleId);

    const incomplete = analyses?.filter(
        a => a.value_numeric === null && a.value_text === null
    );

    if (incomplete && incomplete.length > 0) {
        return {
            success: false,
            message: `${incomplete.length} parameter(s) still need results`
        };
    }

    const timestamp = new Date().toISOString();

    // Update analyses with CRYPTOGRAPHIC hash
    if (analyses) {
        for (const a of analyses) {
            const hash = generateAnalysisHash({
                analysisId: a.id,
                sampleId: sampleId,
                parameterId: a.qa_parameter_id,
                value: String(a.value_numeric ?? a.value_text ?? ""),
                userId: user.id,
                timestamp
            });

            await supabase
                .from("lab_analysis")
                .update({ signed_transaction_hash: hash, analyzed_by: user.id, analyzed_at: timestamp })
                .eq("id", a.id);
        }
    }

    // Start updating sample
    const { error: sampleError } = await supabase
        .from("samples")
        .update({
            status: "validated",
            validated_by: user.id,
            validated_at: timestamp,
        })
        .eq("id", sampleId);

    if (sampleError) return { success: false, message: "Erro ao atualizar amostra: " + sampleError.message };

    revalidatePath("/lab");
    revalidatePath("/lab/worksheets");
    revalidatePath("/lab/history");

    return {
        success: true,
        message: "Amostra validada e assinada com sucesso"
    };
}

import { generateAnalysisHash } from "@/lib/utils/crypto";

/**
 * Bulk save results for multiple analyses across different samples (Master Worksheet)
 */
export async function saveMasterWorksheetAction(
    payload: {
        sampleId: string;
        analyses: { analysisId: string; value: string | null; notes?: string; attachmentUrl?: string }[]
    }[]
) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, message: "Unauthorized" };

    let totalSuccess = 0;
    let totalErrors = 0;

    for (const group of payload) {
        const { sampleId, analyses } = group;
        const res = await saveAllResultsAction(sampleId, analyses, undefined);
        if (res.success) {
            totalSuccess += analyses.length;
        } else {
            totalErrors += analyses.length;
        }
    }

    revalidatePath("/lab/worksheets");
    return {
        success: totalErrors === 0,
        message: `Salvos ${totalSuccess} resultados. Erros: ${totalErrors}.`
    };
}

/**
 * Bulk validate multiple samples with one signature (21 CFR Part 11)
 */
export async function bulkValidateSamplesAction(sampleIds: string[], password?: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, message: "Unauthorized" };

    if (password) {
        const { error: authError } = await supabase.auth.signInWithPassword({
            email: user.email!,
            password: password,
        });
        if (authError) return { success: false, message: "Senha inválida para assinatura" };
    }

    const results = [];
    let skipped = 0;

    for (const sampleId of sampleIds) {
        const { data: analyses } = await supabase
            .from("lab_analysis")
            .select("id, qa_parameter_id, value_numeric, value_text, is_valid")
            .eq("sample_id", sampleId)
            .neq("is_valid", false);

        if (!analyses || analyses.length === 0) continue;

        // GUARD: Ensure all parameters are filled
        const incomplete = analyses.filter(a => a.value_numeric === null && a.value_text === null);
        if (incomplete.length > 0) {
            skipped++;
            continue; // Skip signing this sample, it's not ready
        }

        const timestamp = new Date().toISOString();

        // Update each analysis with a CRYPTOGRAPHIC hash
        for (const a of analyses) {
            const hash = generateAnalysisHash({
                analysisId: a.id,
                sampleId: sampleId,
                parameterId: a.qa_parameter_id,
                value: String(a.value_numeric ?? a.value_text ?? ""),
                userId: user.id,
                timestamp
            });

            await supabase
                .from("lab_analysis")
                .update({
                    signed_transaction_hash: hash,
                    analyzed_at: timestamp,
                    analyzed_by: user.id
                })
                .eq("id", a.id);
        }

        // Update sample status
        await supabase
            .from("samples")
            .update({
                status: "validated",
                validated_by: user.id,
                validated_at: timestamp,
            })
            .eq("id", sampleId);

        results.push(sampleId);
    }

    revalidatePath("/lab");
    revalidatePath("/lab/worksheets");

    if (skipped > 0 && results.length === 0) {
        return { success: false, message: "Nenhuma amostra pronta para validar. Verifique os resultados." };
    }

    return {
        success: true,
        message: `${results.length} amostras validadas` + (skipped > 0 ? ` (${skipped} ignoradas por estarem incompletas)` : ".")
    };
}

/**
 * Save sample-level metadata (notes)
 */
export async function saveSampleMetaAction(sampleId: string, notes: string | null) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, message: "Unauthorized" };

    const { error } = await supabase
        .from("samples")
        .update({
            notes: notes
        })
        .eq("id", sampleId);

    if (error) {
        return { success: false, message: error.message };
    }

    revalidatePath("/lab");
    return { success: true, message: "Sample metadata updated" };
}

/**
 * Fetch sample details and results for the Result Entry Modal (Client Component)
 */
export async function getSampleDetailsAction(sampleId: string) {
    const { getSampleWithResults } = await import("@/lib/queries/lab");
    try {
        const data = await getSampleWithResults(sampleId);
        return { success: true, data };
    } catch (error) {
        console.error("Error fetching sample details:", error);
        return { success: false, message: "Failed to load sample details" };
    }
}

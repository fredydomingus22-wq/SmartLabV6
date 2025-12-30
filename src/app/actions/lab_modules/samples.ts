"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { createNotificationAction } from "../notifications";
import { format } from "date-fns";
import { z } from "zod";
import { SAMPLE_TYPE_CATEGORIES, isFinishedProduct, isIntermediateProduct } from "@/lib/constants/lab";
import { getSafeUser } from "@/lib/auth.server";

const CreateSampleSchema = z.object({
    sample_type_id: z.string().uuid(),
    code: z.string().optional(),
    production_batch_id: z.string().uuid().optional(),
    intermediate_product_id: z.string().uuid().optional(),
    sampling_point_id: z.string().uuid().optional(),
    plant_id: z.string().uuid(),
});

/**
 * Create a new Sample for analysis
 */
export async function createSampleAction(formData: FormData) {
    const user = await getSafeUser();
    const supabase = await createClient();

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
        return { success: false, message: validation.error.issues[0].message };
    }

    let collectedAt = formData.get("collected_at") as string || new Date().toISOString();
    let finalCode = validation.data.code;
    let categoryFilter: string[] = [];
    let productId = null;
    let sampleTypeCode = "NOSKU";

    const { data: sampleType } = await supabase
        .from("sample_types")
        .select("id, test_category, code")
        .eq("id", validation.data.sample_type_id)
        .single();

    if (!sampleType) return { success: false, message: "Tipo de amostra inválido." };

    sampleTypeCode = sampleType.code || "NOTYPE";
    const testCategory = sampleType.test_category || "physico_chemical";

    if (testCategory === SAMPLE_TYPE_CATEGORIES.PHYSICO_CHEMICAL) {
        categoryFilter = [SAMPLE_TYPE_CATEGORIES.PHYSICO_CHEMICAL];
    } else if (testCategory === SAMPLE_TYPE_CATEGORIES.MICROBIOLOGICAL) {
        categoryFilter = [SAMPLE_TYPE_CATEGORIES.MICROBIOLOGICAL];
    } else if (testCategory === "both") {
        categoryFilter = [SAMPLE_TYPE_CATEGORIES.PHYSICO_CHEMICAL, SAMPLE_TYPE_CATEGORIES.MICROBIOLOGICAL];
    }

    if (validation.data.production_batch_id) {
        const { data: batch } = await supabase.from("production_batches").select("product_id").eq("id", validation.data.production_batch_id).single();
        productId = batch?.product_id;
    } else if (validation.data.intermediate_product_id) {
        const { data: ip } = await supabase.from("intermediate_products").select("production_batches(product_id)").eq("id", validation.data.intermediate_product_id).single();
        const batchData = Array.isArray(ip?.production_batches) ? ip.production_batches[0] : ip?.production_batches;
        productId = batchData?.product_id;
    }

    let sampleCodePrefix = "NOSKU";
    if (productId) {
        const { data: product } = await supabase.from("products").select("sku").eq("id", productId).single();
        sampleCodePrefix = product?.sku || "NOSKU";
    } else if (validation.data.sampling_point_id) {
        const { data: sp } = await supabase.from("sampling_points").select("code").eq("id", validation.data.sampling_point_id).single();
        sampleCodePrefix = sp?.code || "NOSP";
    }

    let dateObj = collectedAt && !collectedAt.endsWith("Z") ? new Date(`${collectedAt}:00+01:00`) : new Date(collectedAt);
    collectedAt = dateObj.toISOString();

    const formatter = new Intl.DateTimeFormat('pt-PT', { timeZone: 'Africa/Luanda', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false });
    const parts = formatter.formatToParts(dateObj);
    const getPart = (type: string) => parts.find(p => p.type === type)?.value || "";
    finalCode = `${sampleCodePrefix}-${sampleTypeCode}-${getPart('year')}${getPart('month')}${getPart('day')}-${getPart('hour')}${getPart('minute')}`;

    const { data: newSample, error } = await supabase.from("samples").insert({
        organization_id: user.organization_id,
        plant_id: validation.data.plant_id,
        sample_type_id: validation.data.sample_type_id,
        code: finalCode,
        production_batch_id: validation.data.production_batch_id || null,
        intermediate_product_id: validation.data.intermediate_product_id || null,
        sampling_point_id: validation.data.sampling_point_id || null,
        collected_by: user.id,
        collected_at: collectedAt,
        status: "collected",
    }).select("id").single();

    if (error) return { success: false, message: error.message };

    if (newSample?.id && productId && categoryFilter.length > 0) {
        const { data: specs } = await supabase.from("product_specifications").select("qa_parameter_id, qa_parameters!inner(category, status)").eq("product_id", productId).eq("qa_parameters.status", "active").in("qa_parameters.category", categoryFilter).eq("sample_type_id", validation.data.sample_type_id);
        if (specs && specs.length > 0) {
            const uniqueParamIds = Array.from(new Set(specs.map(s => s.qa_parameter_id)));
            await supabase.from("lab_analysis").insert(uniqueParamIds.map(paramId => ({ organization_id: user.organization_id, plant_id: validation.data.plant_id, sample_id: newSample.id, qa_parameter_id: paramId })));
        }
    }

    const assigneeId = formData.get("assignee_id") as string;
    if (newSample?.id && assigneeId) {
        await supabase.from("app_tasks").insert({
            organization_id: user.organization_id,
            plant_id: validation.data.plant_id,
            title: `Análise: ${finalCode}`,
            description: `Executar análises laboratoriais para a amostra ${finalCode}.`,
            status: 'todo',
            priority: 'medium',
            assignee_id: assigneeId,
            module_context: (sampleTypeCode === 'MICRO' || sampleTypeCode === 'ENV') ? 'micro_sample' : 'lab_sample',
            entity_id: newSample.id,
            entity_reference: finalCode,
            created_by: user.id
        });
    }

    revalidatePath("/lab");
    return { success: true, message: "Sample Created", sampleId: newSample?.id };
}

export async function updateSampleStatusAction(data: FormData | { id: string, status: string }) {
    const user = await getSafeUser();
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
    if (!sample_id || !validStatuses.includes(status)) return { success: false, message: "Invalid data" };

    const { error } = await supabase.from("samples").update({ status }).eq("id", sample_id).eq("organization_id", user.organization_id).eq("plant_id", user.plant_id);
    if (error) return { success: false, message: error.message };

    revalidatePath("/lab");
    revalidatePath("/lab/kanban");
    return { success: true, message: `Sample status updated to ${status}` };
}

export async function advanceSampleAction(sampleId: string) {
    const user = await getSafeUser();
    const supabase = await createClient();

    const { data: sample } = await supabase.from("samples").select(`id, status, lab_analysis(id, value_numeric, value_text, is_valid)`).eq("lab_analysis.is_valid", true).eq("id", sampleId).single();
    if (!sample) return { success: false, message: "Sample not found" };

    const analyses = sample.lab_analysis || [];
    const completedCount = analyses.filter(a => a.value_numeric !== null || a.value_text !== null).length;
    const totalCount = analyses.length;

    let nextStatus = sample.status;
    if (totalCount > 0) {
        if (completedCount > 0 && completedCount < totalCount) nextStatus = "in_analysis";
        else if (completedCount === totalCount && totalCount > 0) nextStatus = "reviewed";
    }

    if (nextStatus !== sample.status) {
        await supabase.from("samples").update({ status: nextStatus }).eq("id", sampleId).eq("organization_id", user.organization_id).eq("plant_id", user.plant_id);
        revalidatePath("/lab");
        revalidatePath("/lab/kanban");
    }
    return { success: true, status: nextStatus };
}

export async function getPendingSamplesAction() {
    const user = await getSafeUser();
    const supabase = await createClient();

    const { data: samples, error } = await supabase.from("samples").select(`id, code, status, collected_at, sample_type:sample_types(name), batch:production_batches(code, product:products(name))`).eq("organization_id", user.organization_id).eq("plant_id", user.plant_id).in("status", ["pending", "collected", "in_analysis"]).order("collected_at", { ascending: true });
    if (error) return { success: false, message: error.message, data: [] };
    return { success: true, data: samples };
}

export async function saveSampleMetaAction(sampleId: string, notes: string | null) {
    const user = await getSafeUser();
    const supabase = await createClient();
    const { error } = await supabase.from("samples").update({ notes }).eq("id", sampleId).eq("organization_id", user.organization_id);
    if (error) return { success: false, message: error.message };
    revalidatePath(`/lab/samples/${sampleId}`);
    return { success: true, message: "Metadados guardados" };
}

export async function getSampleDetailsAction(sampleId: string) {
    const user = await getSafeUser();
    const supabase = await createClient();
    const { data: sample, error: sampleError } = await supabase.from("samples").select(`*, sample_type:sample_types(*)`).eq("id", sampleId).eq("organization_id", user.organization_id).single();
    if (sampleError) return { success: false, message: sampleError.message };

    const { data: results, error: resultsError } = await supabase.from("lab_analysis").select(`*, parameter:qa_parameters(*)`).eq("sample_id", sampleId);
    if (resultsError) return { success: false, message: resultsError.message };

    return {
        success: true,
        data: {
            sample,
            results
        }
    };
}

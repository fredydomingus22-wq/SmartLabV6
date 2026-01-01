"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { createNotificationAction } from "../notifications";
import { format } from "date-fns";
import { z } from "zod";
import { SAMPLE_TYPE_CATEGORIES, isFinishedProduct, isIntermediateProduct } from "@/lib/constants/lab";
import { getSafeUser } from "@/lib/auth.server";
import { createAuditEvent } from "@/domain/audit/audit.service";
import { SampleFSM, SampleStatus } from "@/domain/lab/sample.fsm";
import { SampleDomainService } from "@/domain/lab/sample.service";

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
    try {
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

        const service = new SampleDomainService(supabase, {
            organization_id: user.organization_id,
            user_id: user.id,
            correlation_id: crypto.randomUUID()
        });

        const result = await service.registerSample({
            sample_type_id: validation.data.sample_type_id,
            plant_id: validation.data.plant_id,
            code: validation.data.code,
            production_batch_id: validation.data.production_batch_id,
            intermediate_product_id: validation.data.intermediate_product_id,
            sampling_point_id: validation.data.sampling_point_id,
            collected_at: formData.get("collected_at") as string || undefined,
            assignee_id: formData.get("assignee_id") as string || undefined
        });

        if (!result.success) return { success: false, message: result.message };

        revalidatePath("/lab");
        return {
            success: true,
            message: "Sample Registered (Industrial Core)",
            sampleId: result.data.id,
            code: result.data.code
        };
    } catch (error: any) {
        console.error("createSampleAction error:", error);
        return { success: false, message: error.message };
    }
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

    const validStatuses = ["draft", "registered", "collected", "in_analysis", "under_review", "approved", "rejected", "released", "archived"];
    if (!sample_id || !validStatuses.includes(status)) return { success: false, message: "Invalid data" };

    // FSM Validation
    const { data: currentSample } = await supabase.from("samples").select("status").eq("id", sample_id).single();
    if (currentSample) {
        if (!SampleFSM.isValidTransition(currentSample.status as SampleStatus, status as SampleStatus)) {
            return { success: false, message: `Transição de estado inválida: ${currentSample.status} -> ${status}` };
        }
    }

    const { error } = await supabase.from("samples").update({ status }).eq("id", sample_id).eq("organization_id", user.organization_id).eq("plant_id", user.plant_id);
    if (error) return { success: false, message: error.message };

    // Industrial Audit Trail: Manual Status Update
    await createAuditEvent({
        eventType: 'SAMPLE_STATUS_UPDATED',
        entityType: 'samples',
        entityId: sample_id,
        payload: { new_status: status }
    });

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
        if (completedCount > 0 && completedCount < totalCount) {
            nextStatus = "in_analysis";
        } else if (SampleFSM.isReadyForReview(completedCount, totalCount)) {
            nextStatus = "under_review";
        }
    }

    if (nextStatus !== sample.status) {
        await supabase.from("samples").update({ status: nextStatus }).eq("id", sampleId).eq("organization_id", user.organization_id).eq("plant_id", user.plant_id);

        // Industrial Audit Trail: Automatic Progression
        await createAuditEvent({
            eventType: 'SAMPLE_STATUS_PROGRESSED',
            entityType: 'samples',
            entityId: sampleId,
            payload: { old_status: sample.status, new_status: nextStatus }
        });

        revalidatePath("/lab");
        revalidatePath("/lab/kanban");
    }
    return { success: true, status: nextStatus };
}

export async function getPendingSamplesAction() {
    const user = await getSafeUser();
    const supabase = await createClient();

    const { data: samples, error } = await supabase.from("samples").select(`id, code, status, collected_at, sample_type:sample_types(name), batch:production_batches(code, product:products(name))`).eq("organization_id", user.organization_id).eq("plant_id", user.plant_id).in("status", ["registered", "collected", "in_analysis", "under_review"]).order("collected_at", { ascending: true });
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

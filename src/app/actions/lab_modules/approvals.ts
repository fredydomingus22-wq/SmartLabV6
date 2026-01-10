"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getSafeUser } from "@/lib/auth.server";
import { createNotificationAction } from "../notifications";
import { createAuditEvent } from "@/domain/audit/audit.service";
import { SampleFSM, SampleStatus } from "@/domain/lab/sample.fsm";
import { SampleDomainService } from "@/domain/lab/sample.service";

const ReviewSampleSchema = z.object({
    sample_id: z.string().uuid(),
});

export async function reviewSampleAction(sampleId: string) {
    const user = await getSafeUser();
    const supabase = await createClient();

    // 1. Get current status and analysis counts
    const { data: sample, error } = await supabase
        .from("samples")
        .select(`
            status,
            lab_analysis (id, status, value_numeric, value_text)
        `)
        .eq("id", sampleId)
        .single();

    if (error || !sample) throw new Error("Sample not found");

    // 2. Validate FSM Transition
    if (!SampleFSM.isValidTransition(sample.status as SampleStatus, 'under_review')) {
        return { success: false, message: `Invalid transition from ${sample.status} to under_review` };
    }

    // 3. Validate Data Completeness (All analyses must have a value)
    const analyses = sample.lab_analysis || [];
    const isComplete = analyses.every((a: any) => a.value_numeric !== null || a.value_text !== null);

    if (!isComplete) {
        return { success: false, message: "Todas as análises devem ter resultados registados antes da revisão." };
    }

    // 4. Update Status using Service for audit
    const service = new SampleDomainService(supabase, {
        organization_id: user.organization_id!,
        user_id: user.id,
        role: user.role,
        correlation_id: crypto.randomUUID()
    });

    const result = await service.updateSampleStatus(sampleId, 'under_review');
    if (!result.success) return result;

    revalidatePath("/lab");

    return { success: true, message: "Amostra enviada para revisão técnica." };
}

export async function technicalReviewAction(params: {
    sampleId: string;
    decision: 'approved' | 'rejected';
    reason?: string;
    password?: string;
}) {
    const user = await getSafeUser();
    const supabase = await createClient();

    const service = new SampleDomainService(supabase, {
        organization_id: user.organization_id!,
        user_id: user.id,
        role: user.role,
        correlation_id: crypto.randomUUID()
    });

    const result = await service.technicalReview(params);
    if (result.success) {
        revalidatePath("/lab");
        revalidatePath(`/lab/samples/${params.sampleId}`);
        revalidatePath("/lab/approvals");
    }
    return result;
}

export async function bulkTechnicalReviewAction(params: {
    sampleIds: string[];
    decision: 'approved' | 'rejected';
    reason?: string;
    password?: string;
}) {
    const results = [];
    for (const id of params.sampleIds) {
        results.push(await technicalReviewAction({ ...params, sampleId: id }));
    }
    return { success: true, results };
}

export async function finalReleaseAction(params: {
    sampleId: string;
    decision: 'released' | 'rejected';
    notes?: string;
    password?: string;
}) {
    const user = await getSafeUser();
    const supabase = await createClient();

    const service = new SampleDomainService(supabase, {
        organization_id: user.organization_id!,
        user_id: user.id,
        role: user.role,
        correlation_id: crypto.randomUUID()
    });

    const result = await service.finalRelease(params);
    if (result.success) {
        revalidatePath("/lab");
        revalidatePath(`/lab/samples/${params.sampleId}`);
        revalidatePath("/lab/approvals");
    }
    return result;
}

export async function bulkFinalReleaseAction(params: {
    sampleIds: string[];
    decision: 'released' | 'rejected';
    notes?: string;
    password?: string;
}) {
    const results = [];
    for (const id of params.sampleIds) {
        results.push(await finalReleaseAction({ ...params, sampleId: id }));
    }
    return { success: true, results };
}

export async function approveSampleWithPasswordAction(formData: FormData) {
    const sampleId = formData.get("sample_id") as string;
    const status = formData.get("status") as 'approved' | 'rejected';
    const password = formData.get("password") as string;
    const reason = formData.get("reason") as string | undefined;

    return technicalReviewAction({
        sampleId,
        decision: status,
        reason,
        password
    });
}

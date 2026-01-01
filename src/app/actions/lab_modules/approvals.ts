"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getSafeUser } from "@/lib/auth.server";
import { createNotificationAction } from "../notifications";
import { createAuditEvent } from "@/domain/audit/audit.service";
import { SampleFSM, SampleStatus } from "@/domain/lab/sample.fsm";
import { SampleDomainService } from "@/domain/lab/sample.service";

const ApproveSampleSchema = z.object({
    sample_id: z.string().uuid(),
    status: z.enum(["approved", "rejected"]),
    reason: z.string().optional(),
    password: z.string().optional(),
});

export async function approveSampleAction(formData: FormData) {
    const user = await getSafeUser();
    const supabase = await createClient();

    const rawData = {
        sample_id: formData.get("sample_id"),
        status: formData.get("status"),
        reason: formData.get("reason") || undefined,
        password: formData.get("password") || undefined,
    };

    const validation = ApproveSampleSchema.safeParse(rawData);
    if (!validation.success) return { success: false, message: validation.error.issues[0].message };

    const service = new SampleDomainService(supabase, {
        organization_id: user.organization_id,
        user_id: user.id,
        correlation_id: crypto.randomUUID()
    });

    const result = await service.approveSample({
        sampleId: validation.data.sample_id,
        status: validation.data.status,
        reason: validation.data.reason,
        password: validation.data.password
    });

    if (!result.success) return { success: false, message: result.message };

    // Post-approval Side Effects (Notifications)
    await createNotificationAction({
        title: `Amostra ${validation.data.status === 'approved' ? 'Aprovada' : 'Rejeitada'}: ${validation.data.sample_id.substring(0, 8)}`,
        content: validation.data.status === 'rejected' ? `A amostra foi rejeitada. Motivo: ${validation.data.reason || 'Não especificado'}.` : `A amostra foi aprovada.`,
        type: validation.data.status === 'approved' ? 'info' : 'alert',
        severity: validation.data.status === 'approved' ? 'low' : 'high',
        plantId: user.plant_id,
        targetRole: 'admin'
    });

    revalidatePath("/lab");
    return { success: true, message: validation.data.status === "approved" ? "Sample Approved" : "Sample Rejected" };
}

export async function approveSampleWithPasswordAction(formData: FormData) {
    const user = await getSafeUser();
    const supabase = await createClient();
    const password = formData.get("password") as string;

    const { error: authError } = await supabase.auth.signInWithPassword({ email: user.email, password });
    if (authError) return { success: false, message: "Senha inválida." };

    return approveSampleAction(formData);
}

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
        organization_id: user.organization_id,
        user_id: user.id,
        correlation_id: crypto.randomUUID()
    });

    const result = await service.updateSampleStatus(sampleId, 'under_review');
    if (!result.success) return result;

    revalidatePath("/lab");

    return { success: true, message: "Amostra enviada para revisão técnica." };
}

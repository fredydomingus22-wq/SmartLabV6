"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getSafeUser } from "@/lib/auth.server";
import { generateAnalysisHash } from "@/lib/utils/crypto";
import { createAuditEvent } from "@/domain/audit/audit.service";
import { AnalysisDomainService, SaveResultDTO } from "@/domain/lab/analysis.service";
import { SampleDomainService } from "@/domain/lab/sample.service";
import { SampleStatus } from "@/domain/lab/sample.fsm";

interface AnalysisResultEntry {
    analysisId: string;
    value: string | number | null;
    is_conforming?: boolean;
    notes?: string;
    equipmentId?: string;
}

const RegisterResultSchema = z.object({
    sample_id: z.string().uuid(),
    qa_parameter_id: z.string().uuid(),
    value_numeric: z.coerce.number().optional(),
    value_text: z.string().optional(),
    is_conforming: z.coerce.boolean().optional(),
    notes: z.string().optional(),
    equipment_id: z.string().uuid().optional(),
    password: z.string().optional(),
});

export async function registerResultAction(formData: FormData) {
    const user = await getSafeUser();
    const supabase = await createClient();

    const rawData = {
        sample_id: formData.get("sample_id"),
        qa_parameter_id: formData.get("qa_parameter_id"),
        value_numeric: formData.get("value_numeric") || undefined,
        value_text: formData.get("value_text") || undefined,
        is_conforming: formData.get("is_conforming") === "true",
        notes: formData.get("notes") || undefined,
        equipment_id: formData.get("equipment_id") || undefined,
        password: formData.get("password") || undefined,
    };

    const validation = RegisterResultSchema.safeParse(rawData);
    if (!validation.success) return { success: false, message: validation.error.issues[0].message };

    // 1. We need the analysis ID to use the new AnalysisService
    // Usually, in the frontend, we have the analysis ID. 
    // If not provided (legacy), we fetch it.
    const analysisId = formData.get("analysis_id") as string;

    if (analysisId) {
        const service = new AnalysisDomainService(supabase, {
            organization_id: user.organization_id!,
            user_id: user.id,
            role: user.role,
            correlation_id: crypto.randomUUID()
        });

        const result = await service.completeAnalysis(analysisId, {
            value_numeric: validation.data.value_numeric,
            value_text: validation.data.value_text,
            is_conforming: validation.data.is_conforming,
            notes: validation.data.notes,
            equipment_id: validation.data.equipment_id,
            password: validation.data.password,
        });

        if (!result.success) return { success: false, message: result.message };
    } else {
        // Fallback for legacy calls WITHOUT analysis_id
        const service = new AnalysisDomainService(supabase, {
            organization_id: user.organization_id!,
            user_id: user.id,
            role: user.role,
            correlation_id: crypto.randomUUID()
        });
        const result = await service.saveResultsBatch({
            sampleId: validation.data.sample_id,
            results: [{
                parameterId: validation.data.qa_parameter_id,
                sampleId: validation.data.sample_id,
                value: validation.data.value_numeric ?? validation.data.value_text ?? null,
                is_conforming: validation.data.is_conforming,
                notes: validation.data.notes,
                equipmentId: validation.data.equipment_id,
                password: validation.data.password
            }]
        });
        if (!result.success) return { success: false, message: result.message };
    }

    revalidatePath("/lab");
    revalidatePath(`/lab/samples/${validation.data.sample_id}`);
    return { success: true, message: "Resultado Registado (Move 2 Lifecycle)" };
}

export async function startAnalysisAction(analysisId: string) {
    const user = await getSafeUser();
    const supabase = await createClient();
    const service = new AnalysisDomainService(supabase, {
        organization_id: user.organization_id!,
        user_id: user.id,
        role: user.role,
        correlation_id: crypto.randomUUID()
    });

    const result = await service.startAnalysis(analysisId);
    if (!result.success) return result;

    // Get sampleId for revalidation
    const { data: analysis } = await supabase.from("lab_analysis").select("sample_id").eq("id", analysisId).single();

    revalidatePath("/lab");
    if (analysis?.sample_id) {
        revalidatePath(`/lab/samples/${analysis.sample_id}`);
    }

    return { success: true, message: "Análise iniciada." };
}

export async function signAndSaveResultsAction(
    sampleId: string,
    results: AnalysisResultEntry[],
    password?: string,
    notes?: string,
    attachmentUrl?: string
) {
    const user = await getSafeUser();
    const supabase = await createClient();

    const service = new AnalysisDomainService(supabase, {
        organization_id: user.organization_id!,
        user_id: user.id,
        role: user.role,
        correlation_id: crypto.randomUUID()
    });

    const result = await service.saveResultsBatch({
        sampleId,
        results: results.map(r => ({ ...r, sampleId })),
        notes,
        password,
        attachmentUrl
    });

    if (!result.success) return { success: false, message: result.message };

    // Automatic progression
    const sampleService = new SampleDomainService(supabase, {
        organization_id: user.organization_id!,
        user_id: user.id,
        role: user.role,
        correlation_id: crypto.randomUUID()
    });
    await sampleService.refreshStatus(sampleId);

    revalidatePath("/lab");
    revalidatePath(`/lab/samples/${sampleId}`);

    return { success: true, message: "Resultados guardados com sucesso." };
}

export async function saveAllResultsAction(
    sampleId: string,
    results: AnalysisResultEntry[],
    notes?: string,
    password?: string,
    attachmentUrl?: string
) {
    return signAndSaveResultsAction(sampleId, results, notes, password, attachmentUrl);
}

export async function validateSampleAction(sampleId: string, password?: string) {
    const user = await getSafeUser();
    const supabase = await createClient();

    const service = new SampleDomainService(supabase, {
        organization_id: user.organization_id!,
        user_id: user.id,
        role: user.role,
        correlation_id: crypto.randomUUID()
    });

    const result = await service.technicalReview({
        sampleId,
        decision: 'approved',
        password
    });

    if (!result.success) return { success: false, message: result.message };

    revalidatePath("/lab");
    revalidatePath(`/lab/samples/${sampleId}`);
    return { success: true, message: "Amostra aprovada com sucesso" };
}

export async function requestRetestAction(analysisId: string, reason: string, password?: string) {
    const user = await getSafeUser();
    const supabase = await createClient();
    const service = new AnalysisDomainService(supabase, {
        organization_id: user.organization_id!,
        user_id: user.id,
        role: user.role,
        correlation_id: crypto.randomUUID()
    });

    const result = await service.invalidateAnalysis(analysisId, reason, password);
    if (!result.success) return result;

    revalidatePath("/lab");
    revalidatePath("/lab/samples/[id]", "page");
    return { success: true, message: "Análise invalidada. Reteste agendado." };
}

// Simplified versions for the sprint. Full integration in final lab.ts
export async function registerRetestResultAction(formData: FormData) {
    const res = await registerResultAction(formData);
    if (res.success) res.message = "Resultado de Reteste Registado";
    return res;
}
export async function saveMasterWorksheetAction(payload: { sampleId: string; results: AnalysisResultEntry[] }[]) {
    const user = await getSafeUser();
    const supabase = await createClient();

    const service = new AnalysisDomainService(supabase, {
        organization_id: user.organization_id!,
        user_id: user.id,
        role: user.role,
        correlation_id: crypto.randomUUID()
    });

    for (const group of payload) {
        await service.saveResultsBatch({
            sampleId: group.sampleId,
            results: group.results.map(r => ({ ...r, sampleId: group.sampleId }))
        });
    }

    revalidatePath("/lab");
    return { success: true, message: "Folha de obra guardada (Secure Unified Path)" };
}
export async function bulkValidateSamplesAction(sampleIds: string[], password?: string) {
    const user = await getSafeUser();
    const supabase = await createClient();

    const service = new SampleDomainService(supabase, {
        organization_id: user.organization_id!,
        user_id: user.id,
        role: user.role,
        correlation_id: crypto.randomUUID()
    });

    const results = [];
    for (const id of sampleIds) {
        const res = await service.technicalReview({
            sampleId: id,
            decision: 'approved',
            password
        });
        results.push(res);
    }

    const failures = results.filter(r => !r.success);
    if (failures.length > 0) {
        return { success: false, message: `Erro ao aprovar ${failures.length} amostras.` };
    }

    revalidatePath("/lab");
    return { success: true, message: `${sampleIds.length} amostras aprovadas com sucesso` };
}

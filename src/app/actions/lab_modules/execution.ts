"use strict";
"use server";

import { createClient } from "@/lib/supabase/server";
import { getSafeUser } from "@/lib/auth.server";
import { AnalysisExecutionService } from "@/domain/lab/execution.service";
import { revalidatePath } from "next/cache";

export async function submitAnalysisAction(analysisId: string, payload: {
    value: number | string;
    equipmentId?: string;
    notes?: string;
    deviationType?: string;
    password?: string;
}) {
    const user = await getSafeUser();
    const supabase = await createClient();

    const service = new AnalysisExecutionService(supabase, {
        organization_id: user.organization_id,
        plant_id: user.plant_id,
        user_id: user.id,
        role: user.role,
        correlation_id: crypto.randomUUID()
    });

    const result = await service.submitResults(analysisId, payload);

    if (result.success) {
        revalidatePath("/lab");
        revalidatePath(`/lab/samples/${analysisId}`); // Broad revalidate if needed
    }

    return result;
}

export async function getExecutionContextAction(analysisId: string) {
    const user = await getSafeUser();
    const supabase = await createClient();

    const service = new AnalysisExecutionService(supabase, {
        organization_id: user.organization_id,
        plant_id: user.plant_id,
        user_id: user.id,
        role: user.role,
        correlation_id: crypto.randomUUID()
    });

    return await service.getExecutionBadge(analysisId);
}

export async function finalizeBatchAnalysisAction(
    sampleId: string,
    password: string,
    results: Array<{
        analysisId: string;
        value: string | number;
        notes?: string;
        deviationType?: string;
        equipmentId?: string;
    }>
) {
    const user = await getSafeUser();
    const supabase = await createClient();

    const service = new AnalysisExecutionService(supabase, {
        organization_id: user.organization_id,
        plant_id: user.plant_id,
        user_id: user.id,
        role: user.role,
        correlation_id: crypto.randomUUID()
    });

    const result = await service.finalizeBatchResults(sampleId, password, results);

    if (result.success) {
        revalidatePath("/lab");
        revalidatePath(`/lab/samples/${sampleId}`);
    }

    return result;
}

"use server";

import { createClient } from "@/lib/supabase/server";
import { getSafeUser } from "@/lib/auth.server";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const PlanSchema = z.object({
    id: z.string().uuid().optional(),
    name: z.string().min(3),
    description: z.string().optional(),
    product_id: z.string().uuid().optional().nullable(),
    sample_type_id: z.string().uuid(),
    trigger_type: z.enum(['time_based', 'event_based', 'manual']),
    frequency_minutes: z.number().optional().nullable(),
    event_anchor: z.enum(['batch_start', 'batch_end', 'shift_change', 'process_step']).optional().nullable(),
    is_active: z.boolean().default(true)
});

export async function saveSamplingPlanAction(formData: any) {
    try {
        const user = await getSafeUser();
        const supabase = await createClient();

        const validated = PlanSchema.parse(formData);

        const payload = {
            organization_id: user.organization_id!,
            plant_id: user.plant_id!,
            ...validated,
            updated_at: new Date().toISOString()
        };

        let result;
        if (payload.id) {
            result = await supabase
                .from("production_sampling_plans")
                .update(payload)
                .eq("id", payload.id)
                .eq("organization_id", user.organization_id);
        } else {
            const { id, ...newPayload } = payload;
            result = await supabase
                .from("production_sampling_plans")
                .insert(newPayload);
        }

        if (result.error) throw result.error;

        revalidatePath("/quality/sampling-plans");
        return { success: true, message: "Plano de amostragem guardado com sucesso." };
    } catch (error: any) {
        console.error("saveSamplingPlanAction error:", error);
        return { success: false, message: error.message };
    }
}

export async function togglePlanStatusAction(id: string, currentStatus: boolean) {
    const user = await getSafeUser();
    const supabase = await createClient();

    const { error } = await supabase
        .from("production_sampling_plans")
        .update({ is_active: !currentStatus, updated_at: new Date().toISOString() })
        .eq("id", id)
        .eq("organization_id", user.organization_id);

    if (error) return { success: false, message: error.message };

    revalidatePath("/quality/sampling-plans");
    return { success: true, message: `Plano ${!currentStatus ? 'activado' : 'desactivado'}.` };
}

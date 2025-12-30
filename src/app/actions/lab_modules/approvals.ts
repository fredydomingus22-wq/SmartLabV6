"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getSafeUser } from "@/lib/auth.server";
import { createNotificationAction } from "../notifications";

const ApproveSampleSchema = z.object({
    sample_id: z.string().uuid(),
    status: z.enum(["approved", "rejected"]),
    reason: z.string().optional(),
});

export async function approveSampleAction(formData: FormData) {
    const user = await getSafeUser();
    const supabase = await createClient();

    const rawData = {
        sample_id: formData.get("sample_id"),
        status: formData.get("status"),
        reason: formData.get("reason") || undefined,
    };

    const validation = ApproveSampleSchema.safeParse(rawData);
    if (!validation.success) return { success: false, message: validation.error.issues[0].message };

    const { error } = await supabase.from("samples").update({ status: validation.data.status }).eq("id", validation.data.sample_id).eq("organization_id", user.organization_id);
    if (error) return { success: false, message: error.message };

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

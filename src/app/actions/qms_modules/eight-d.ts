"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { ActionState } from "@/lib/types";
import { getSafeUser } from "@/lib/auth.server";
import { createNotificationAction } from "../notifications";

export async function create8DAction(formData: FormData): Promise<ActionState<{ reportId: string }>> {
    try {
        const user = await getSafeUser();
        const supabase = await createClient();

        const title = formData.get("title") as string;
        const ncId = formData.get("nonconformity_id") as string;
        const championId = formData.get("champion_id") as string;
        const plantId = formData.get("plant_id") as string;

        const { data: new8D, error } = await supabase.from("eight_d_reports").insert({
            title,
            nonconformity_id: ncId || null,
            champion_id: championId || null,
            plant_id: plantId,
            organization_id: user.organization_id,
            status: 'd0_preparation',
            created_by: user.id
        }).select("id, title").single();

        if (error) return { success: false, message: error.message };

        if (championId) {
            await createNotificationAction({
                title: `Atribuído ao 8D: ${new8D.title}`,
                content: `Você foi nomeado Champion do Relatório 8D: ${new8D.title}`,
                type: 'info',
                severity: 'medium',
                plantId,
                targetUserId: championId
            });
        }

        revalidatePath("/quality/qms/8d");
        return { success: true, message: "Relatório 8D criado com sucesso", data: { reportId: new8D.id } };
    } catch (err: any) {
        return { success: false, message: err.message || "Erro inesperado ao criar relatório 8D" };
    }
}

export async function update8DStepAction(formData: FormData): Promise<ActionState> {
    try {
        const user = await getSafeUser();
        const supabase = await createClient();
        const id = formData.get("id") as string;
        const step = formData.get("step") as string;
        const dataStr = formData.get("data") as string;

        // Validate allowed steps
        const allowedSteps = ['d0_preparation', 'd1_team', 'd2_description', 'd3_containment', 'd4_root_cause', 'd5_corrective_actions', 'd6_implementation', 'd7_prevention', 'd8_recognition'];
        if (!allowedSteps.includes(step)) {
            return { success: false, message: "Passo 8D inválido." };
        }

        let data;
        try {
            data = dataStr ? JSON.parse(dataStr) : {};
        } catch (e) {
            return { success: false, message: "Formato de dados inválido (JSON)." };
        }

        const { error } = await supabase.from("eight_d_reports").update({ [step]: data }).eq("id", id).eq("organization_id", user.organization_id);
        if (error) return { success: false, message: error.message };

        revalidatePath(`/quality/qms/8d/${id}`);
        return { success: true, message: `Passo ${step.toUpperCase().substring(0, 2)} atualizado com sucesso` };
    } catch (err: any) {
        return { success: false, message: err.message || "Erro ao atualizar passo 8D" };
    }
}

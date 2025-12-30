"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getSafeUser } from "@/lib/auth.server";
import { ActionState } from "@/lib/types";

const CreateCAPASchema = z.object({
    nonconformity_id: z.string().uuid().optional(),
    action_type: z.enum(["corrective", "preventive", "containment"]),
    description: z.string().min(1, "A descrição é obrigatória"),
    root_cause: z.string().optional(),
    priority: z.enum(["low", "medium", "high", "critical"]),
    planned_date: z.string().optional(),
    responsible_id: z.string().uuid().optional(),
    plant_id: z.string().uuid(),
});

import { createNotificationAction } from "../notifications";

const UpdateCAPASchema = z.object({
    action_type: z.enum(["corrective", "preventive", "containment"]).optional(),
    description: z.string().min(1, "A descrição é obrigatória").optional(),
    root_cause: z.string().optional(),
    priority: z.enum(["low", "medium", "high", "critical"]).optional(),
    planned_date: z.string().optional(),
    responsible_id: z.string().uuid().optional(),
    status: z.enum(["open", "in_progress", "closed", "voided"]).optional()
});

const VerifyEffectivenessSchema = z.object({
    id: z.string().uuid(),
    is_effective: z.enum(["true", "false"]), // FormData passing boolean as string
    notes: z.string().min(10, "Justificação da eficácia obrigatória")
});

export async function createCAPAAction(formData: FormData): Promise<ActionState> {
    try {
        const user = await getSafeUser();
        const supabase = await createClient();

        const rawData = {
            nonconformity_id: formData.get("nonconformity_id") || undefined,
            action_type: formData.get("action_type"),
            description: formData.get("description"),
            root_cause: formData.get("root_cause"),
            priority: formData.get("priority"),
            planned_date: formData.get("planned_date"),
            responsible_id: formData.get("responsible_id") || undefined,
            plant_id: formData.get("plant_id"),
        };

        const validation = CreateCAPASchema.safeParse(rawData);
        if (!validation.success) {
            return {
                success: false,
                message: "Dados de validação incorretos",
                errors: validation.error.flatten().fieldErrors as Record<string, string[]>
            };
        }

        const { error } = await supabase.from("capa_actions").insert({
            ...validation.data,
            organization_id: user.organization_id,
            status: 'open',
            created_by: user.id
        });

        if (error) return { success: false, message: error.message };

        revalidatePath("/quality/qms");
        return { success: true, message: "Ação CAPA criada com sucesso" };
    } catch (err: any) {
        return { success: false, message: err.message || "Erro inesperado ao criar CAPA" };
    }
}

export async function updateCAPAStatusAction(formData: FormData): Promise<ActionState> {
    try {
        const user = await getSafeUser();
        const supabase = await createClient();
        const id = formData.get("id") as string;
        const status = formData.get("status") as string;

        // Validate status enum
        if (!["open", "in_progress", "closed", "voided"].includes(status)) {
            return { success: false, message: "Estado da ação inválido." };
        }

        const { error } = await supabase.from("capa_actions").update({ status }).eq("id", id).eq("organization_id", user.organization_id);
        if (error) return { success: false, message: error.message };

        revalidatePath("/quality/qms");
        return { success: true, message: "Status da ação CAPA atualizado" };
    } catch (err: any) {
        return { success: false, message: err.message || "Erro ao atualizar status CAPA" };
    }
}

export async function updateCAPAAction(formData: FormData): Promise<ActionState> {
    try {
        const user = await getSafeUser();
        const supabase = await createClient();
        const id = formData.get("id") as string;

        const rawData = Object.fromEntries(formData.entries());
        delete rawData.id;

        const validation = UpdateCAPASchema.safeParse(rawData);
        if (!validation.success) {
            return {
                success: false,
                message: "Dados inválidos para atualização",
                errors: validation.error.flatten().fieldErrors as Record<string, string[]>
            };
        }

        const { error } = await supabase.from("capa_actions").update(validation.data).eq("id", id).eq("organization_id", user.organization_id);
        if (error) return { success: false, message: error.message };

        revalidatePath("/quality/qms/capa");
        return { success: true, message: "Ação CAPA atualizada com sucesso" };
    } catch (err: any) {
        return { success: false, message: err.message || "Erro ao atualizar CAPA" };
    }
}

export async function verifyCAPAEffectivenessAction(formData: FormData): Promise<ActionState> {
    try {
        const user = await getSafeUser();
        const supabase = await createClient();

        const rawData = {
            id: formData.get("id"),
            is_effective: formData.get("is_effective"),
            notes: formData.get("notes")
        };

        const validation = VerifyEffectivenessSchema.safeParse(rawData);
        if (!validation.success) {
            return {
                success: false,
                message: "Dados de verificação incompletos",
                errors: validation.error.flatten().fieldErrors as Record<string, string[]>
            };
        }

        const { id, is_effective, notes } = validation.data;
        const isSuccessful = is_effective === 'true';

        // Update Logic based on effectiveness
        const updates = {
            status: isSuccessful ? 'closed' : 'open',
            effectiveness_review_notes: notes,
            effectiveness_check_date: new Date().toISOString(),
            effectiveness_reviewer_id: user.id,
            // If ineffective, maybe trigger a flag or reopen, here we keep it open but logged
        };

        const { error } = await supabase.from("capa_actions")
            .update(updates)
            .eq("id", id)
            .eq("organization_id", user.organization_id);

        if (error) return { success: false, message: error.message };

        // Notification if ineffective
        if (!isSuccessful) {
            await createNotificationAction({
                title: `Falha na Eficácia CAPA`,
                content: `A verificação de eficácia falhou para a ação. Motivo: ${notes}`,
                type: 'alert',
                severity: 'high',
                targetRole: 'manager',
                link: `/quality/qms/capa/${id}`
            });
        }

        revalidatePath("/quality/qms");
        revalidatePath(`/quality/qms/capa/${id}`);

        return {
            success: true,
            message: isSuccessful ? "Eficácia verificada e ação fechada." : "Eficácia rejeitada. Ação mantida aberta."
        };

    } catch (err: any) {
        return { success: false, message: "Erro ao verificar eficácia." };
    }
}


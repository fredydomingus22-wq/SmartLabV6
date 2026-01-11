"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getSafeUser } from "@/lib/auth.server";
import { createNotificationAction } from "../notifications";
import { ActionState } from "@/lib/types";

const CreateNCSchema = z.object({
    title: z.string().min(5, "Título muito curto"),
    description: z.string().min(10, "Descrição detalhada necessária"),
    detected_date: z.string(),
    severity: z.enum(["low", "medium", "high", "critical"]),
    type: z.enum(["internal", "supplier", "customer", "audit"]), // Fixed enum to match DB/Dialog
    plant_id: z.string().uuid().optional(), // Make optional in schema as we override it
    category: z.string().optional(),
    source_reference: z.string().optional(),
    detected_by_id: z.string().uuid().optional(),
    responsible_id: z.string().uuid().optional(),
    notes: z.string().optional(),
});

export async function createNCAction(formData: FormData): Promise<ActionState<{ id: string, code: string }>> { // Added code to return type
    try {
        const user = await getSafeUser();
        const supabase = await createClient();

        const rawData = {
            title: formData.get("title"),
            description: formData.get("description"),
            detected_date: formData.get("detected_date"), // Changed from occurrence_date
            severity: formData.get("severity"),
            type: formData.get("type") || "internal", // Default to internal
            category: formData.get("category"),
            source_reference: formData.get("source_reference"),
            // Use user.plant_id if available, otherwise form data
            plant_id: user.plant_id || formData.get("plant_id"),
            detected_by_id: formData.get("detected_by_id") || user.id, // Default to current user
            responsible_id: formData.get("responsible_id"),
            notes: formData.get("notes"),
        };

        const validation = CreateNCSchema.safeParse(rawData);
        if (!validation.success) {
            return {
                success: false,
                message: "Dados de validação incorretos",
                errors: validation.error.flatten().fieldErrors as Record<string, string[]>
            };
        }

        // Generate NC Number (NC-YYYY-XXXX)
        const year = new Date().getFullYear();
        const { count, error: countError } = await supabase
            .from("nonconformities")
            .select("*", { count: 'exact', head: true })
            .eq("organization_id", user.organization_id)
            .gte("created_at", `${year}-01-01`);

        if (countError) throw countError;

        const sequence = (count || 0) + 1;
        const nc_number = `NC-${year}-${sequence.toString().padStart(4, "0")}`;

        const { data: newNC, error } = await supabase.from("nonconformities").insert({
            organization_id: user.organization_id,
            plant_id: user.plant_id || validation.data.plant_id, // Ensure plant_id
            nc_number: nc_number,
            title: validation.data.title,
            description: validation.data.description,
            detected_date: validation.data.detected_date,
            severity: validation.data.severity,
            nc_type: validation.data.type, // DB column is nc_type
            category: validation.data.category,
            source_reference: validation.data.source_reference,
            status: "open",
            detected_by: validation.data.detected_by_id || user.id,
            responsible_id: validation.data.responsible_id || undefined,
            notes: validation.data.notes,
            created_by: user.id,
        }).select("id, nc_number").single();

        if (error) return { success: false, message: error.message };

        await createNotificationAction({
            title: `Nova Não Conformidade: ${newNC.nc_number}`,
            content: validation.data.title,
            type: 'alert',
            severity: validation.data.severity,
            plantId: user.plant_id || validation.data.plant_id || "",
            targetRole: 'admin'
        });

        revalidatePath("/quality/qms");
        return { success: true, message: "NC criada com sucesso.", data: { id: newNC.id, code: newNC.nc_number } };
    } catch (err: any) {
        return { success: false, message: err.message || "Erro inesperado ao criar NC" };
    }
}

import { NonConformityDomainService } from "@/domain/quality/nc.service";

export async function createNCFromFailedResult(params: {
    parameterName: string;
    value: string | number;
    sampleId: string;
    analysisId?: string; // NEW: Direct link
    organizationId: string;
    plantId: string;
    userId: string;
}): Promise<ActionState<{ code: string }>> {
    try {
        const supabase = await createClient();
        const service = new NonConformityDomainService(supabase, {
            organization_id: params.organizationId,
            user_id: params.userId,
            role: 'system', // Action context
            plant_id: params.plantId,
            correlation_id: crypto.randomUUID()
        });

        const result = await service.createFromAnalysisFailure({
            analysisId: params.analysisId || '',
            sampleId: params.sampleId,
            parameterName: params.parameterName,
            value: params.value
        });

        if (!result.success) return { success: false, message: result.message || "Falha ao processar NC no domínio." };

        return {
            success: true,
            message: "NC gerada automaticamente via Domain Service.",
            data: { code: (result.data as any).code }
        };
    } catch (err: any) {
        return { success: false, message: err.message || "Erro ao gerar NC automática" };
    }
}

export async function updateNCAction(formData: FormData): Promise<ActionState> {
    try {
        const user = await getSafeUser();
        const supabase = await createClient();
        const id = formData.get("id") as string;
        const data = Object.fromEntries(formData.entries());
        delete data.id;

        const { error } = await supabase.from("nonconformities").update(data).eq("id", id).eq("organization_id", user.organization_id);
        if (error) return { success: false, message: error.message };

        revalidatePath(`/quality/qms/${id}`);
        return { success: true, message: "NC atualizada com sucesso." };
    } catch (err: any) {
        return { success: false, message: err.message || "Erro ao atualizar NC" };
    }
}

export async function closeNCWithSignatureAction(formData: FormData): Promise<ActionState> {
    try {
        const user = await getSafeUser();
        const supabase = await createClient();
        const id = formData.get("id") as string;
        const password = formData.get("password") as string;
        const notes = formData.get("closure_notes") as string;

        const { error: authError } = await supabase.auth.signInWithPassword({ email: user.email, password });
        if (authError) return { success: false, message: "Credenciais de assinatura inválidas." };

        const { error } = await supabase.from("nonconformities").update({
            status: "closed",
            closure_notes: notes,
            closed_at: new Date().toISOString(),
            closed_by: user.id
        }).eq("id", id).eq("organization_id", user.organization_id);

        if (error) return { success: false, message: error.message };

        revalidatePath(`/quality/qms/${id}`);
        revalidatePath("/quality/qms");
        return { success: true, message: "NC fechada com assinatura digital." };
    } catch (err: any) {
        return { success: false, message: err.message || "Erro no processo de fecho" };
    }
}

import { analyzeRootCause, generateGlobalQualityAdvice, openai } from "@/lib/openai";

export async function getNCAnalysisAIAction(ncId: string) {
    try {
        const supabase = await createClient();

        // 1. Check for valid cached insight (less than 24h old to allow refreshes)
        // We use 'non_conformity' as the entity type
        const { data: existingInsight } = await supabase
            .from('ai_insights')
            .select('*')
            .eq('entity_type', 'non_conformity')
            .eq('entity_id', ncId)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

        if (existingInsight) {
            // Check if parsing is needed
            const analysis = typeof existingInsight.raw_response === 'string'
                ? JSON.parse(existingInsight.raw_response)
                : existingInsight.raw_response;

            return {
                success: true,
                analysis,
                cached: true,
                insightId: existingInsight.id
            };
        }

        // 2. Fetch NC details if no cache
        const { data: nc, error: ncError } = await supabase
            .from('nonconformities')
            .select('title, description, severity, type, created_at')
            .eq('id', ncId)
            .single();

        if (ncError || !nc) return { success: false, message: "NC não encontrada." };

        // 3. Call OpenAI for RCA
        const analysis = await analyzeRootCause({
            title: nc.title,
            description: nc.description || "Sem descrição detalhada.",
            ncType: nc.type,
            severity: nc.severity,
        });

        // 4. Save to ai_insights
        await supabase.from('ai_insights').insert({
            entity_type: 'non_conformity',
            entity_id: ncId,
            insight: analysis.riskAnalysis, // Short summary
            raw_response: analysis,         // Full JSON
            confidence: 0.85,               // Estimated/Static for this prompt
            action_status: 'pending_review'
        });

        revalidatePath(`/quality/qms/${ncId}`);
        return { success: true, analysis, cached: false };

    } catch (err: any) {
        console.error("AI Analysis Failed:", err);
        return { success: false, message: "Falha na análise inteligente. Tente novamente mais tarde." };
    }
}

export async function getGlobalQualityInsightAction() {
    try {
        const supabase = await createClient();

        // 1. Fetch recent open NCs (last 30 days) to identify trends
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const { data: recentNCs } = await supabase
            .from('nonconformities')
            .select('type, title')
            .gte('created_at', thirtyDaysAgo.toISOString())
            .limit(50); // Analyze sample of last 50

        if (!recentNCs || recentNCs.length === 0) {
            return { success: true, insight: "Dados insuficientes para análise de tendências." };
        }

        // 2. Aggregate data for the prompt
        const trendsUserMap = recentNCs.reduce((acc, curr) => {
            if (!acc[curr.type]) acc[curr.type] = { count: 0, titles: [] };
            acc[curr.type].count++;
            if (acc[curr.type].titles.length < 3) acc[curr.type].titles.push(curr.title);
            return acc;
        }, {} as Record<string, { count: number; titles: string[] }>);

        const trendsArray = Object.entries(trendsUserMap).map(([category, data]) => ({
            category,
            count: data.count,
            titles: data.titles
        }));

        // 3. Call OpenAI
        const insight = await generateGlobalQualityAdvice(trendsArray);

        return { success: true, insight };

    } catch (err: any) {
        return { success: false, message: "Indisponível no momento." };
    }
}

export async function updateNCStatusAction(formData: FormData) {
    const user = await getSafeUser();
    const supabase = await createClient();
    const id = formData.get("id") as string;
    const status = formData.get("status") as string;

    const { error } = await supabase.from("nonconformities").update({ status }).eq("id", id).eq("organization_id", user.organization_id);
    if (error) return { success: false, message: error.message };

    revalidatePath("/quality/qms");
    return { success: true, message: "Status da NC atualizado" };
}

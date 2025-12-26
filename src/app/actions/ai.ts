"use server";

import { createClient } from "@/lib/supabase/server";
import { getSafeUser } from "@/lib/auth";
import { validateLabResult, ValidationResult } from "@/lib/openai";
import { revalidatePath } from "next/cache";

export type AIValidationActionState = {
    success: boolean;
    message: string;
    data?: ValidationResult;
};

/**
 * Validates a lab analysis result using OpenAI and stores the insight.
 */
/**
 * Triggers AI validation via Edge Function (re-run).
 */
export async function revalidateAI(analysisId: string): Promise<AIValidationActionState> {
    try {
        const supabase = await createClient();

        if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
            const response = await fetch(`${process.env.SUPABASE_URL}/functions/v1/ai-validator`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    record: {
                        id: analysisId,
                        // Edge function will fetch details using ID
                    }
                })
            });

            if (!response.ok) {
                const err = await response.text();
                throw new Error(`Edge Function failed: ${err}`);
            }

            const data = await response.json();

            revalidatePath('/lab');
            return {
                success: true,
                message: "AI Validation Triggered",
                data: data
            };
        }

        return { success: false, message: "Missing Supabase Config" };

    } catch (error: any) {
        console.error('AI Re-validation Error:', error);
        return {
            success: false,
            message: error.message || 'Error triggering AI',
        };
    }
}

/**
 * Gets the AI validation insight for a specific analysis.
 */
export async function getAnalysisAIInsight(analysisId: string) {
    try {
        const supabase = await createClient();

        const { data, error } = await supabase
            .from('ai_insights')
            .select('*')
            .eq('entity_type', 'lab_analysis')
            .eq('entity_id', analysisId)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

        if (error && error.code !== 'PGRST116') throw error;

        return { success: true, data };
    } catch (error: any) {
        return { success: false, message: error.message };
    }
}

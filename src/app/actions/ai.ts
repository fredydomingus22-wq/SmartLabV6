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
export async function validateAnalysisWithAI(
    analysisId: string,
    parameterName: string,
    value: number,
    unit: string,
    specMin: number | null,
    specMax: number | null,
    productName?: string
): Promise<AIValidationActionState> {
    try {
        const user = await getSafeUser();
        const supabase = await createClient();

        // Get historical values for this parameter (last 10)
        const { data: historicalData } = await supabase
            .from('lab_analysis')
            .select('result_value')
            .eq('parameter_id', analysisId)
            .order('created_at', { ascending: false })
            .limit(10);

        const historicalValues = historicalData
            ?.map(d => parseFloat(d.result_value))
            .filter(v => !isNaN(v)) || [];

        // Call OpenAI for validation
        const startTime = Date.now();
        const result = await validateLabResult({
            parameterName,
            value,
            unit,
            specMin,
            specMax,
            historicalValues,
            productName,
        });
        const processingTime = Date.now() - startTime;

        // Store the AI insight
        const { error: insertError } = await supabase
            .from('ai_insights')
            .insert({
                entity_type: 'lab_analysis',
                entity_id: analysisId,
                insight_type: 'validation',
                status: result.status,
                message: result.message,
                confidence: result.confidence,
                raw_response: result,
                model_used: 'gpt-4o-mini',
                processing_time_ms: processingTime,
                organization_id: user.organizationId,
                plant_id: user.plantId,
            });

        if (insertError) {
            console.error('Failed to store AI insight:', insertError);
            // Don't fail the action, just log the error
        }

        revalidatePath('/lab');

        return {
            success: true,
            message: result.message,
            data: result,
        };
    } catch (error: any) {
        console.error('AI Validation Error:', error);
        return {
            success: false,
            message: error.message || 'Erro na validação com IA',
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

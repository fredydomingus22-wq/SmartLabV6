import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import OpenAI from "https://deno.land/x/openai@v4.20.1/mod.ts";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        );

        const openai = new OpenAI({
            apiKey: Deno.env.get('OPENAI_API_KEY'),
        });

        const body = await req.json();
        const record = body.record || body; // Support direct call or webhook

        if (!record || !record.id) {
            throw new Error("No record provided");
        }

        const startTime = Date.now();

        // 1. Fetch analysis details
        const { data: analysis, error: fetchError } = await supabaseClient
            .from('lab_analysis')
            .select(`
            *,
            parameter:qa_parameters(name, code, unit),
            sample:samples(
                *,
                product:products(name),
                batch:batches(batch_code)
            )
        `)
            .eq('id', record.id)
            .single();

        if (fetchError || !analysis) {
            throw new Error(`Analysis fetch error: ${fetchError?.message || 'Not found'}`);
        }

        const { parameter, sample, value_numeric, value_text } = analysis;
        const productName = sample?.product?.name || 'Unknown';
        const batchCode = sample?.batch?.batch_code || 'Fictional';

        if (value_numeric === null && value_text === null) {
            return new Response(JSON.stringify({ message: "No value to validate" }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            });
        }

        // 2. Prepare Prompt
        const systemPrompt = `You are an expert Senior Quality Control Analyst for an industrial LIMS.
Your responsibility is to validate laboratory test results with high precision.
Analyze the provided product, parameter, and value. Detect anomalies, typos (e.g. wrong decimal), or impossible values.
Consider the unit of measurement and typical industrial ranges.
Provide insights in Portuguese (PT-PT).
Respond ONLY in valid JSON format:
{
    "status": "approved" | "warning" | "blocked",
    "message": "Concise, professional analysis in Portuguese",
    "confidence": 0.0 to 1.0 (1.0 = certain, <0.7 = unsure)
}`;

        const userPrompt = `Analyze:
Product: ${productName} (Batch: ${batchCode})
Parameter: ${parameter?.name} (${parameter?.unit})
Value: ${value_numeric !== null ? value_numeric : value_text}

Is this result reasonable?`;

        // 3. Call OpenAI
        const completion = await openai.chat.completions.create({
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userPrompt },
            ],
            model: "gpt-4o-mini",
            response_format: { type: "json_object" },
            temperature: 0.2,
        });

        const content = completion.choices[0]?.message?.content;
        const result = content ? JSON.parse(content) : { status: 'warning', message: 'No response', confidence: 0 };
        const processingTime = Date.now() - startTime;

        // 4. Save Insight
        const { error: insertError } = await supabaseClient
            .from('ai_insights')
            .upsert({
                entity_type: 'lab_analysis',
                entity_id: analysis.id,
                organization_id: sample.organization_id,
                plant_id: sample.plant_id,
                insight_type: 'validation',
                status: result.status,
                message: result.message,
                confidence: result.confidence,
                raw_response: result,
                model_used: 'gpt-4o-mini',
                processing_time_ms: processingTime
            }, { onConflict: 'entity_type, entity_id, insight_type' });

        if (insertError) throw insertError;

        return new Response(JSON.stringify(result), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        });

    } catch (error: any) {
        return new Response(JSON.stringify({ error: error.message || String(error) }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        });
    }
});

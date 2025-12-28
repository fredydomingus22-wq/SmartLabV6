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
        const { record_id, action_type } = body;

        if (!record_id) {
            throw new Error("No record_id provided");
        }

        const startTime = Date.now();

        // 1. Fetch NC Data
        const { data: nc, error: fetchError } = await supabaseClient
            .from('nonconformities')
            .select('*')
            .eq('id', record_id)
            .single();

        if (fetchError || !nc) {
            throw new Error(`NC fetch error: ${fetchError?.message || 'Not found'}`);
        }

        let systemPrompt = "";
        let userPrompt = "";

        // 2. Determine Prompt based on Action
        if (action_type === 'analyze_risk') {
            systemPrompt = `You are an expert QMS Risk Analyst (ISO 9001:2015).
Analyze the Non-Conformity provided.
Outputs required in JSON:
- severity_score (1-100)
- risk_level (Low, Medium, High, Critical)
- validation_comment (Brief rationale in plain Portuguese)
- suggested_immediate_action (Tactical fix)
- requires_capa (Boolean: true ONLY if severity > 80 AND risk_level = Critical)`;

            userPrompt = `Title: ${nc.title}
Description: ${nc.description}
Type: ${nc.nc_type}
Detected Date: ${nc.detected_date}`;

        } else if (action_type === 'suggest_root_cause') {
            systemPrompt = `You are a Root Cause Analysis Expert (5 Whys / Ishikawa).
Suggest 3 potential root causes for this issue in Portuguese.
Return JSON: { "root_causes": ["Cause 1...", "Cause 2...", "Cause 3..."] }`;
            userPrompt = `Issue: ${nc.title}\nDetails: ${nc.description}`;
        } else {
            // Default to generic analysis
            systemPrompt = "Analyze this QMS issue.";
            userPrompt = nc.description;
        }

        // 3. Call OpenAI (using gpt-4o-mini as requested)
        const completion = await openai.chat.completions.create({
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userPrompt },
            ],
            model: "gpt-4o-mini",
            response_format: { type: "json_object" },
            temperature: 0.2, // Low temp for consistency
        });

        const content = completion.choices[0]?.message?.content;
        const result = content ? JSON.parse(content) : { error: "No response" };
        const processingTime = Date.now() - startTime;

        // 4. Save Insight to Database
        await supabaseClient.from('ai_insights').upsert({
            entity_type: 'non_conformity',
            entity_id: nc.id,
            organization_id: nc.organization_id,
            plant_id: nc.plant_id,
            insight_type: action_type || 'analysis',
            status: result.risk_level || 'processed',
            message: result.validation_comment || result.root_causes?.[0] || 'Processed',
            confidence: 0.9,
            raw_response: result,
            model_used: 'gpt-4o-mini',
            processing_time_ms: processingTime
        }, { onConflict: 'entity_type, entity_id, insight_type' });

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

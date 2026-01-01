import { openai, ValidationResult } from "@/lib/openai";

export interface AuditAnalysisContext {
    eventType: string;
    entityType: string;
    entityId: string;
    userId: string;
    payload: any;
    historicalEvents?: any[];
}

/**
 * AI Audit Analyzer
 * Detects risky patterns in the Audit Trail for industrial compliance.
 */
export async function analyzeAuditChain(context: AuditAnalysisContext): Promise<ValidationResult> {
    const systemPrompt = `You are a Senior Data Integrity Auditor specializing in 21 CFR Part 11 and GAMP 5 standards.
Your goal is to analyze audit events and detect "Data Integrity Risks" or "Process Compliance Deviations".

Respond ONLY in valid JSON format:
{
    "status": "approved" | "warning" | "blocked",
    "message": "Brief Portuguese explanation of the risk or lack thereof",
    "confidence": 0.0 to 1.0
}

Risk Categories to Detect:
1. "Data Volatility": Rapid multiple edits to the same value by the same user.
2. "Post-Review Manipulation": Editing a result after the sample has been moved to 'reviewed' status.
3. "Training Blindness": Actions performed by users who have historically low compliance with training signatures. (If history provided)
4. "Procedural Shortcuts": Sample state transitions that skip logical steps (e.g., from 'pending' to 'reviewed' too fast).`;

    const userPrompt = `Analyse this Audit Event:
- Event: ${context.eventType}
- Entity: ${context.entityType} (${context.entityId})
- UserID: ${context.userId}
- Payload: ${JSON.stringify(context.payload)}
- Recent History for this Entity: ${JSON.stringify(context.historicalEvents?.slice(0, 5) || "Nenhum histórico disponível.")}

Determine if this action represents a Data Integrity risk.`;

    try {
        const response = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt },
            ],
            response_format: { type: 'json_object' },
            temperature: 0.1,
            max_tokens: 300,
        });

        const content = response.choices[0]?.message?.content;
        if (!content) throw new Error('Empty response from OpenAI');

        return JSON.parse(content) as ValidationResult;
    } catch (error) {
        console.error('[AI-Audit] Analysis failed:', error);
        return {
            status: 'approved',
            message: 'Análise de integridade AI indisponível.',
            confidence: 0
        };
    }
}

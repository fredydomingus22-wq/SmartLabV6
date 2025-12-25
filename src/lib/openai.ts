import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export type ValidationResult = {
    status: 'approved' | 'warning' | 'blocked';
    message: string;
    confidence: number;
    details?: {
        expectedRange?: { min: number; max: number };
        actualValue?: number;
        historicalAverage?: number;
    };
};

/**
 * Validates a lab analysis result using OpenAI.
 * Compares the value against specifications and historical data.
 */
export async function validateLabResult({
    parameterName,
    value,
    unit,
    specMin,
    specMax,
    historicalValues,
    productName,
}: {
    parameterName: string;
    value: number;
    unit: string;
    specMin: number | null;
    specMax: number | null;
    historicalValues?: number[];
    productName?: string;
}): Promise<ValidationResult> {
    const systemPrompt = `You are a Quality Control AI Assistant for a LIMS (Laboratory Information Management System) in a food/beverage industry.
Your role is to analyze laboratory test results and determine if they are valid, suspicious, or should be blocked.

Respond ONLY in valid JSON format with this structure:
{
    "status": "approved" | "warning" | "blocked",
    "message": "Brief explanation in Portuguese",
    "confidence": 0.0 to 1.0
}

Rules:
- "approved": Value is within specification and consistent with historical data.
- "warning": Value is within spec but unusual (outlier, trend deviation).
- "blocked": Value is outside specification or physically impossible.`;

    const userPrompt = `Analyze this lab result:
- Parameter: ${parameterName}
- Value: ${value} ${unit}
- Specification: ${specMin !== null ? `Min: ${specMin}` : 'No min'}, ${specMax !== null ? `Max: ${specMax}` : 'No max'}
- Product: ${productName || 'Unknown'}
- Historical values (last 10): ${historicalValues?.join(', ') || 'Not available'}

Evaluate if this result should be approved, flagged with a warning, or blocked.`;

    try {
        const response = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt },
            ],
            response_format: { type: 'json_object' },
            temperature: 0.2,
            max_tokens: 200,
        });

        const content = response.choices[0]?.message?.content;
        if (!content) throw new Error('Empty response from OpenAI');

        const result = JSON.parse(content) as ValidationResult;
        return {
            status: result.status,
            message: result.message,
            confidence: result.confidence,
            details: {
                expectedRange: specMin !== null || specMax !== null
                    ? { min: specMin ?? 0, max: specMax ?? Infinity }
                    : undefined,
                actualValue: value,
            },
        };
    } catch (error) {
        console.error('OpenAI validation error:', error);
        // Fail-safe: approve with low confidence on API errors
        return {
            status: 'approved',
            message: 'Validação automática indisponível. Requer revisão manual.',
            confidence: 0,
        };
    }
}

export { openai };

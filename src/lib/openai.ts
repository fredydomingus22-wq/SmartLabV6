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

/**
 * Generates an observation for a production batch based on its performance during a shift.
 */
export async function generateBatchObservation({
    productName,
    batchCode,
    stats
}: {
    productName: string;
    batchCode: string;
    stats: {
        samplesAnalyzed: number;
        oosCount: number;
        conformityRate: number;
        tanksPrepared: number;
        linesActive: number;
        activeTimeCheck: boolean;
        oosBreakdown?: { parameter: string; count: number }[];
        ncsRaised?: number;
        blockedCount?: number;
    };
}): Promise<string> {
    const oosText = stats.oosBreakdown?.map(o => `${o.parameter}: ${o.count}`).join(', ') || "Nenhum";

    const systemPrompt = `You are a Senior Shift Supervisor AI for a manufacturing plant.
Your goal is to write a short, professional narrative paragraph (in Portuguese) summarizing a batch's performance.

Data points provided:
- Analyses (Total parameters tested)
- Samples (Total distinct samples)
- OOS (Out of Spec findings with breakdown)
- Corrective Actions (Based on NCs raised)
- Blocks (Pallets or Batch blocked)

Structure the response exactly like this natural narrative (replace variables):
"Durante o turno foram realizadas ${stats.samplesAnalyzed} análises em amostras distintas. Houve ${stats.oosCount} resultados OOS (${oosText}). ${stats.ncsRaised ? 'Foram tomadas ações corretivas para mitigar os desvios.' : 'O processo correu dentro da normalidade.'} Total de ${stats.blockedCount || 0} paletes/lotes foram bloqueados."

Rules:
- Keep it professional and factual.
- If 0 OOS, say "Todo o processo decorreu dentro das especificações."
- If blocked > 0, mention the block.
- Max 2 sentences if possible, but cover all points.`;

    const userPrompt = `Analyze Batch ${batchCode} (${productName}):
- Samples Analyzed: ${stats.samplesAnalyzed}
- Total OOS: ${stats.oosCount}
- OOS Breakdown: ${oosText}
- NCs Raised: ${stats.ncsRaised || 0}
- Blocked Units: ${stats.blockedCount || 0}

Write the narrative observation.`;

    try {
        const response = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt },
            ],
            temperature: 0.3,
            max_tokens: 150,
        });

        return response.choices[0]?.message?.content || "Sem observações geradas.";
    } catch (error) {
        console.error('OpenAI batch observation error:', error);
        return "Análise AI indisponível no momento.";
    }
}

/**
 * Analyzes a Nonconformity description to suggest Root Causes and CAPA actions.
 */
export async function analyzeRootCause({
    title,
    description,
    ncType,
    severity,
}: {
    title: string;
    description: string;
    ncType: string;
    severity: string;
}): Promise<{
    rootCauses: string[];
    suggestedActions: string[];
    riskAnalysis: string;
}> {
    const systemPrompt = `You are an ISO 9001 and IATF 16949 Quality Expert Assistant.
Your goal is to perform a preliminary Root Cause Analysis (RCA) and suggest corrective/preventive actions.
Use the "5 Whys" methodology implicitly to find deeper causes.

Respond ONLY in valid JSON format:
{
    "rootCauses": ["cause 1", "cause 2"],
    "suggestedActions": ["action 1", "action 2"],
    "riskAnalysis": "Short assessment of organizational risk"
}

Language: Portuguese (PT).`;

    const userPrompt = `Análise de Não Conformidade:
- Título: ${title}
- Descrição: ${description}
- Tipo: ${ncType}
- Severidade: ${severity}

Por favor, sugira possíveis causas raiz e ações imediatas/corretivas.`;

    try {
        const response = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt },
            ],
            response_format: { type: 'json_object' },
            temperature: 0.4,
            max_tokens: 500,
        });

        const content = response.choices[0]?.message?.content;
        if (!content) throw new Error('Empty response from OpenAI');

        return JSON.parse(content);
    } catch (error) {
        console.error('OpenAI RCA error:', error);
        return {
            rootCauses: ["Falha na análise automática. Requer investigação manual."],
            suggestedActions: ["Realizar reunião de equipa para análise de causa.", "Implementar contenção imediata."],
            riskAnalysis: "Indisponível no momento."
        };
    }
}

/**
 * Generates global quality advice based on recent Nonconformity trends.
 */
export async function generateGlobalQualityAdvice(ncTrends: {
    category: string;
    count: number;
    titles: string[];
}[]): Promise<string> {
    const systemPrompt = `You are a Senior Quality Director (ISO 9001/IATF).
Your goal is to analyze recent nonconformity trends and provide a single, concise, high-impact tactical advice (max 2 sentences).
Focus on patterns, systemic risks, and preventive actions.

Language: Portuguese (PT).`;

    const userPrompt = `Tendências recentes de Não Conformidades:
${ncTrends.map(t => `- Categoria: ${t.category} (${t.count} ocorrências). Exemplos: ${t.titles.join(', ')}`).join('\n')}

Por favor, forneça um insight executivo.`;

    try {
        const response = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt },
            ],
            temperature: 0.5,
            max_tokens: 150,
        });

        return response.choices[0]?.message?.content || "Continue a monitorizar as tendências de qualidade para identificar riscos sistémicos.";
    } catch (error) {
        console.error('OpenAI Global Insight error:', error);
        return "IA temporariamente indisponível para análise de tendências.";
    }
}

/**
 * Analyzes SPC data trends, violations, and capability to provide deep quality insights.
 */
export async function analyzeSPCTrends({
    parameterName,
    unit,
    data,
    statistics,
    specLimits
}: {
    parameterName: string;
    unit: string;
    data: { value: number; date: string; batchCode?: string }[];
    statistics: {
        mean: number;
        ucl: number;
        lcl: number;
        sigmaShort: number;
        cpk?: number;
        violations?: { rule: number; description: string; pointIndexes: number[] }[];
    };
    specLimits?: { usl: number | null; lsl: number | null; target: number | null };
}): Promise<{
    summary: string;
    trends: string[];
    risks: string[];
    recommendations: string[];
    status: 'stable' | 'unstable' | 'critical';
}> {
    const systemPrompt = `You are a Six Sigma Black Belt and Senior Quality Engineer.
Your goal is to audit Statistical Process Control (SPC) data and provide a high-level executive summary.
Identify patterns (shifts, drifts, cycles), assess process stability/capability, and predict risks.

Respond ONLY in valid JSON format:
{
    "summary": "Executive summary in Portuguese",
    "trends": ["trend 1", "trend 2"],
    "risks": ["risk 1", "risk 2"],
    "recommendations": ["rec 1", "rec 2"],
    "status": "stable" | "unstable" | "critical"
}

Language: Portuguese (PT).`;

    const userPrompt = `Análise SPC:
- Parâmetro: ${parameterName} (${unit})
- Dados (últimos 30 pontos): ${JSON.stringify(data.slice(-30))}
- Estatísticas: Média=${statistics.mean}, LSE=${statistics.ucl}, LIE=${statistics.lcl}, Sigma=${statistics.sigmaShort}, Cpk=${statistics.cpk || 'N/A'}
- Especificações: USL=${specLimits?.usl || 'N/A'}, Target=${specLimits?.target || 'N/A'}, LSL=${specLimits?.lsl || 'N/A'}
- Violações Nelson Rules: ${JSON.stringify(statistics.violations || [])}

Por favor, forneça uma auditoria técnica detalhada.`;

    try {
        const response = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt },
            ],
            response_format: { type: 'json_object' },
            temperature: 0.3,
            max_tokens: 800,
        });

        const content = response.choices[0]?.message?.content;
        if (!content) throw new Error('Empty response from OpenAI');

        return JSON.parse(content);
    } catch (error) {
        console.error('OpenAI SPC analysis error:', error);
        return {
            summary: "A análise automática por IA está temporariamente indisponível.",
            trends: ["Não foi possível identificar tendências."],
            risks: ["Risco operacional não avaliado."],
            recommendations: ["Proceder com revisão técnica manual dos gráficos."],
            status: 'stable'
        };
    }
}

export { openai };

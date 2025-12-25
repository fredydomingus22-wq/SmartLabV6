import { createHash } from 'crypto';

/**
 * Generates a SHA-256 hash for a laboratory analysis result to ensure 21 CFR Part 11 compliant integrity.
 * The hash includes the value, analyst, and a timestamp.
 */
export function generateAnalysisHash(data: {
    analysisId: string;
    sampleId: string;
    parameterId: string;
    value: string | number | null;
    userId: string;
    timestamp: string;
}): string {
    const payload = JSON.stringify({
        ...data,
        // Ensure values are standardized for hashing
        value: data.value === null ? "" : String(data.value),
    });

    return createHash('sha256').update(payload).digest('hex');
}

/**
 * Generates a SHA-256 hash for a batch of analysis results (a Worksheet session).
 */
export function generateWorksheetSessionHash(data: {
    sampleIds: string[];
    analystId: string;
    timestamp: string;
    resultsSnapshot: any[];
}): string {
    const payload = JSON.stringify(data);
    return createHash('sha256').update(payload).digest('hex');
}

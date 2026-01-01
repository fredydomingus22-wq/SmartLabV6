import { SAMPLE_TYPES } from "@/lib/constants/lab";

export interface Spec {
    min_value?: number;
    max_value?: number;
    target_value?: number;
    is_critical?: boolean;
}

export interface EvaluationResult {
    is_conforming: boolean;
    deviation: number | null;
    message: string;
}

/**
 * ResultEvaluationService
 * Pure logic engine for evaluating analytical results against specifications.
 * PepsiCo/Nestlé Standards: No manual override of conformity.
 */
export class ResultEvaluationService {
    static evaluate(value: number | string, spec: Spec): EvaluationResult {
        // Handle numeric parsing for strings
        const numValue = typeof value === 'string' ? parseFloat(value) : value;
        const isNumeric = !isNaN(numValue as number) && isFinite(numValue as number);

        if (!isNumeric && typeof value === 'string') {
            // Qualitative evaluation (Text-based)
            if (spec.target_value !== undefined && spec.target_value.toString() !== value) {
                return { is_conforming: false, deviation: null, message: "Resultado não coincide com o alvo qualitativo." };
            }
            return { is_conforming: true, deviation: null, message: "OK (Qualitativo)" };
        }

        // Quantitative evaluation
        const num = numValue as number;
        let is_conforming = true;
        let msg = "OK";

        if (spec.min_value !== undefined && spec.min_value !== null && num < spec.min_value) {
            is_conforming = false;
            msg = `Valor abaixo do mínimo (${spec.min_value})`;
        }

        if (spec.max_value !== undefined && spec.max_value !== null && num > spec.max_value) {
            is_conforming = false;
            msg = `Valor acima do máximo (${spec.max_value})`;
        }

        return {
            is_conforming,
            deviation: spec.target_value !== undefined ? num - spec.target_value : null,
            message: msg
        };
    }
}

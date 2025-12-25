import { createClient } from "@/lib/supabase/server";
import { getSafeUser } from "@/lib/auth";

export interface SPCDataPoint {
    id: string;
    date: string;
    value: number;
    isConforming: boolean;
}

export interface SPCResult {
    parameter: { id: string; name: string; unit: string };
    data: SPCDataPoint[];
    mean: number;
    stdDev: number;
    ucl: number; // Upper Control Limit = Mean + 3σ
    lcl: number; // Lower Control Limit = Mean - 3σ
    specLimits?: { usl: number | null; lsl: number | null; target: number | null };
    processCapability?: {
        cp: number | null;   // Process Capability
        cpk: number | null;  // Process Capability Index
        ppk: number | null;  // Process Performance Index
    };
}

/**
 * Fetches analysis results for a parameter and calculates SPC statistics.
 * Now includes process capability metrics (Cp, Cpk) and filtering options.
 */
export interface SPCFilterOptions {
    productId?: string;
    batchId?: string;
    sampleTypeId?: string;
    dateFrom?: string;
    dateTo?: string;
}

export async function getSPCData(
    parameterId: string,
    days: number = 30,
    filters?: SPCFilterOptions
): Promise<SPCResult | null> {
    const supabase = await createClient();
    const user = await getSafeUser();

    // 1. Fetch Parameter Info
    const { data: param } = await supabase
        .from("qa_parameters")
        .select("id, name, unit")
        .eq("organization_id", user.organization_id)
        .eq("id", parameterId)
        .single();

    if (!param) return null;

    // 2. Fetch Spec Limits from product_specifications
    let specQuery = supabase
        .from("product_specifications")
        .select("min_value, max_value, target_value")
        .eq("organization_id", user.organization_id)
        .eq("qa_parameter_id", parameterId);

    if (filters?.productId) {
        specQuery = specQuery.eq("product_id", filters.productId);
    }

    // Filter by sample type if provided, otherwise default to NULL (Final Product) if strictly filtering by product, 
    // OR if not product filtering, just take first (legacy behavior).
    // Better: If filters.sampleTypeId is defined, use it.
    if (filters?.sampleTypeId !== undefined) {
        if (filters.sampleTypeId === null || filters.sampleTypeId === "null") {
            specQuery = specQuery.is("sample_type_id", null);
        } else {
            specQuery = specQuery.eq("sample_type_id", filters.sampleTypeId);
        }
    } else if (filters?.productId) {
        // If product is selected but no sample type, prioritize Finished Product (null)
        // But we can't force it easily without potentially missing data if they only have intermediate specs.
        // Let's order by sample_type_id nulls first?
        specQuery = specQuery.order("sample_type_id", { ascending: true }); // nulls last usually?
        // Actually, just let it be. The user should provide sampleTypeId for precision.
    }

    const { data: specs } = await specQuery.limit(1).maybeSingle();

    const specLimits = specs ? {
        lsl: specs.min_value,
        usl: specs.max_value,
        target: specs.target_value
    } : undefined;

    // 3. Fetch Results for the Parameter with filters
    let dateFromStr: string;
    let dateToStr: string | null = null;

    if (filters?.dateFrom) {
        dateFromStr = new Date(filters.dateFrom).toISOString();
    } else {
        const dateFrom = new Date();
        dateFrom.setDate(dateFrom.getDate() - days);
        dateFromStr = dateFrom.toISOString();
    }

    if (filters?.dateTo) {
        dateToStr = new Date(filters.dateTo + "T23:59:59").toISOString();
    }

    // Build base query with sample join for product/batch filtering
    let query = supabase
        .from("lab_analysis")
        .select(`
            id, 
            analyzed_at, 
            value_numeric, 
            is_conforming,
            sample:samples!inner(id, production_batch_id, sample_type_id, batch:production_batches(id, product_id))
        `)
        .eq("organization_id", user.organization_id)
        .eq("qa_parameter_id", parameterId)
        .gte("analyzed_at", dateFromStr)
        .order("analyzed_at", { ascending: true });

    if (dateToStr) {
        query = query.lte("analyzed_at", dateToStr);
    }

    if (filters?.productId) {
        query = query.eq("sample.batch.product_id", filters.productId);
    }

    if (filters?.sampleTypeId) {
        query = query.eq("sample.sample_type_id", filters.sampleTypeId);
    }

    const { data: results } = await query;

    if (!results || results.length === 0) {
        return {
            parameter: { id: param.id, name: param.name, unit: param.unit || "" },
            data: [],
            mean: 0,
            stdDev: 0,
            ucl: 0,
            lcl: 0,
            specLimits,
            processCapability: { cp: null, cpk: null, ppk: null }
        };
    }

    // 4. Transform Data
    const data: SPCDataPoint[] = results
        .filter(r => r.value_numeric !== null)
        .map(r => ({
            id: r.id,
            date: r.analyzed_at,
            value: Number(r.value_numeric),
            isConforming: r.is_conforming ?? true
        }));

    // 5. Calculate Statistics
    const values = data.map(d => d.value);
    const mean = values.reduce((sum, v) => sum + v, 0) / values.length;

    const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);

    const ucl = mean + 3 * stdDev;
    const lcl = mean - 3 * stdDev;

    // 6. Calculate Process Capability (Cp, Cpk)
    let processCapability: SPCResult["processCapability"] = { cp: null, cpk: null, ppk: null };

    if (specLimits && specLimits.usl !== null && specLimits.lsl !== null && stdDev > 0) {
        const usl = specLimits.usl;
        const lsl = specLimits.lsl;

        // Cp = (USL - LSL) / (6 * σ)
        const cp = (usl - lsl) / (6 * stdDev);

        // Cpk = min(Cpu, Cpl) where Cpu = (USL - μ)/(3σ), Cpl = (μ - LSL)/(3σ)
        const cpu = (usl - mean) / (3 * stdDev);
        const cpl = (mean - lsl) / (3 * stdDev);
        const cpk = Math.min(cpu, cpl);

        // Ppk is similar but uses overall standard deviation (same for small samples)
        const ppk = cpk;

        processCapability = {
            cp: parseFloat(cp.toFixed(2)),
            cpk: parseFloat(cpk.toFixed(2)),
            ppk: parseFloat(ppk.toFixed(2))
        };
    }

    return {
        parameter: { id: param.id, name: param.name, unit: param.unit || "" },
        data,
        mean: parseFloat(mean.toFixed(3)),
        stdDev: parseFloat(stdDev.toFixed(3)),
        ucl: parseFloat(ucl.toFixed(3)),
        lcl: parseFloat(lcl.toFixed(3)),
        specLimits,
        processCapability
    };
}

/**
 * Get SPC summary for multiple parameters
 */
export async function getSPCSummary() {
    const supabase = await createClient();
    const user = await getSafeUser();

    // Get parameters with recent data
    const { data: params } = await supabase
        .from("qa_parameters")
        .select("id, name, code, unit")
        .eq("organization_id", user.organization_id)
        .eq("status", "active")
        .limit(20);

    if (!params) return [];

    const summaries = await Promise.all(
        params.map(async (p) => {
            const spcData = await getSPCData(p.id, 30);
            return {
                parameterId: p.id,
                parameterName: p.name,
                code: p.code,
                unit: p.unit,
                dataPoints: spcData?.data.length || 0,
                mean: spcData?.mean || 0,
                cpk: spcData?.processCapability?.cpk || null,
                outOfControl: spcData?.data.filter(d =>
                    d.value > (spcData?.ucl || 0) || d.value < (spcData?.lcl || 0)
                ).length || 0
            };
        })
    );

    return summaries.filter(s => s.dataPoints > 0);
}

/**
 * Western Electric SPC Run Rules
 * Detects patterns that indicate process is out of statistical control
 */
export interface RunRuleViolation {
    rule: number;
    description: string;
    pointIndexes: number[];
}

export function detectRunRuleViolations(
    data: SPCDataPoint[],
    mean: number,
    ucl: number,
    lcl: number
): RunRuleViolation[] {
    if (data.length < 2) return [];

    const violations: RunRuleViolation[] = [];
    const sigma = (ucl - mean) / 3;
    const sigma2Upper = mean + 2 * sigma;
    const sigma2Lower = mean - 2 * sigma;
    const sigma1Upper = mean + sigma;
    const sigma1Lower = mean - sigma;

    // Rule 1: Any single point beyond 3σ (UCL/LCL)
    data.forEach((point, i) => {
        if (point.value > ucl || point.value < lcl) {
            violations.push({
                rule: 1,
                description: "Point beyond 3σ control limit",
                pointIndexes: [i]
            });
        }
    });

    // Rule 2: 9 consecutive points on same side of mean
    for (let i = 0; i <= data.length - 9; i++) {
        const slice = data.slice(i, i + 9);
        const allAbove = slice.every(p => p.value > mean);
        const allBelow = slice.every(p => p.value < mean);
        if (allAbove || allBelow) {
            violations.push({
                rule: 2,
                description: "9 consecutive points on same side of centerline",
                pointIndexes: Array.from({ length: 9 }, (_, j) => i + j)
            });
            break; // Only report first occurrence
        }
    }

    // Rule 3: 6 consecutive points steadily increasing or decreasing
    for (let i = 0; i <= data.length - 6; i++) {
        const slice = data.slice(i, i + 6);
        let increasing = true;
        let decreasing = true;
        for (let j = 1; j < slice.length; j++) {
            if (slice[j].value <= slice[j - 1].value) increasing = false;
            if (slice[j].value >= slice[j - 1].value) decreasing = false;
        }
        if (increasing || decreasing) {
            violations.push({
                rule: 3,
                description: `6 consecutive points steadily ${increasing ? 'increasing' : 'decreasing'}`,
                pointIndexes: Array.from({ length: 6 }, (_, j) => i + j)
            });
            break;
        }
    }

    // Rule 4: 2 out of 3 consecutive points beyond 2σ
    for (let i = 0; i <= data.length - 3; i++) {
        const slice = data.slice(i, i + 3);
        const beyond2Sigma = slice.filter(p =>
            p.value > sigma2Upper || p.value < sigma2Lower
        );
        if (beyond2Sigma.length >= 2) {
            violations.push({
                rule: 4,
                description: "2 of 3 consecutive points beyond 2σ",
                pointIndexes: Array.from({ length: 3 }, (_, j) => i + j)
            });
            break;
        }
    }

    // Rule 5: 4 out of 5 consecutive points beyond 1σ
    for (let i = 0; i <= data.length - 5; i++) {
        const slice = data.slice(i, i + 5);
        const beyond1Sigma = slice.filter(p =>
            p.value > sigma1Upper || p.value < sigma1Lower
        );
        if (beyond1Sigma.length >= 4) {
            violations.push({
                rule: 5,
                description: "4 of 5 consecutive points beyond 1σ",
                pointIndexes: Array.from({ length: 5 }, (_, j) => i + j)
            });
            break;
        }
    }

    return violations;
}

/**
 * Get SPC data with run rule analysis
 */
export async function getSPCDataWithRules(
    parameterId: string,
    days: number = 30,
    filters?: SPCFilterOptions
) {
    const spcData = await getSPCData(parameterId, days, filters);
    if (!spcData || spcData.data.length === 0) return null;

    const runRuleViolations = detectRunRuleViolations(
        spcData.data,
        spcData.mean,
        spcData.ucl,
        spcData.lcl
    );

    return {
        ...spcData,
        runRuleViolations,
        hasViolations: runRuleViolations.length > 0
    };
}


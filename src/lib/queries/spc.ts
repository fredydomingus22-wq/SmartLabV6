import { createClient } from "@/lib/supabase/server";
import { getSafeUser } from "@/lib/auth.server";
import { format } from "date-fns";

export interface SPCDataPoint {
    id: string;
    date: string;
    value: number;
    isConforming: boolean;
    batchCode?: string;
}

export interface SPCSubgroup {
    id: string;
    label: string;
    values: number[];
    mean: number;
    range: number;
    stdDev: number;
}

export interface SPCResult {
    parameter: { id: string; name: string; unit: string };
    data: SPCDataPoint[];
    subgroups: SPCSubgroup[];
    mean: number;
    sigmaShort: number;
    sigmaLong: number;
    ucl: number;
    lcl: number;
    uclR?: number;
    lclR?: number;
    uclS?: number;
    lclS?: number;
    avgRange?: number;
    avgStdDev?: number;
    specLimits?: { usl: number | null; lsl: number | null; target: number | null };
    processCapability?: {
        cp: number | null;
        cpk: number | null;
        ppk: number | null;
    };
    violations?: RunRuleViolation[];
}

export interface SPCFilterOptions {
    productId?: string;
    batchId?: string;
    sampleTypeId?: string;
    dateFrom?: string;
    dateTo?: string;
    subgroupSize?: number; // If provided, groups data into N points
}

/**
 * Fetches analysis results for a parameter and calculates SPC statistics.
 */
export async function getSPCData(
    parameterId: string,
    days: number = 30,
    filters?: SPCFilterOptions
): Promise<SPCResult | null> {
    const supabase = await createClient();
    const user = await getSafeUser();

    // 1. Fetch Parameter Info - Don't filter by org_id since parameter ID is unique
    const { data: param, error: paramError } = await supabase
        .from("qa_parameters")
        .select("id, name, unit")
        .eq("id", parameterId)
        .single();

    if (!param) return null;

    // 2. Fetch Spec Limits - Prioritize explicit filter or "Produto Final"
    let specQuery = supabase
        .from("product_specifications")
        .select(`
            min_value, 
            max_value, 
            target_value
        `)
        .eq("organization_id", user.organization_id)
        .eq("qa_parameter_id", parameterId)
        .eq("product_id", filters?.productId || "");

    if (filters?.sampleTypeId) {
        specQuery = specQuery.eq("sample_type_id", filters.sampleTypeId);
    }

    const { data: specList } = await specQuery;

    // Selection Logic:
    // With current schema, product_specifications doesn't link to sample_type_id.
    // We pick the spec for the product/parameter.
    const specs = specList?.[0];

    const specLimits = specs ? {
        lsl: specs.min_value,
        usl: specs.max_value,
        target: specs.target_value
    } : undefined;

    // 3. Date Filtering (unchanged)
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
        const dt = filters.dateTo.includes("T") ? filters.dateTo : filters.dateTo + "T23:59:59";
        dateToStr = new Date(dt).toISOString();
    }

    // 4. Load Analysis Data - Use inner join for samples to ensure data integrity
    let query = supabase
        .from("lab_analysis")
        .select(`
            id, 
            analyzed_at, 
            value_numeric, 
            is_conforming,
            sample_id,
            sample:samples!inner(
                id, 
                production_batch_id, 
                sample_type_id, 
                sample_type:sample_types(name, code),
                batch:production_batches(id, product_id, code)
            )
        `)
        .eq("qa_parameter_id", parameterId)
        .gte("analyzed_at", dateFromStr)
        .not("value_numeric", "is", null)
        .order("analyzed_at", { ascending: true });

    if (dateToStr) {
        query = query.lte("analyzed_at", dateToStr);
    }

    // Note: Supabase nested filtering can be unreliable.
    // We fetch all matching data and filter in-memory for reliability.
    const { data: rawResults, error } = await query;

    if (error) {
        console.error("SPC Query Error:", error);
        return null;
    }

    // Apply filters in-memory for maximum reliability
    let results = rawResults || [];

    if (filters?.sampleTypeId) {
        results = results.filter((r: any) => {
            const sample = Array.isArray(r.sample) ? r.sample[0] : r.sample;
            return sample?.sample_type_id === filters.sampleTypeId;
        });
    }

    if (filters?.productId) {
        results = results.filter((r: any) => {
            const sample = Array.isArray(r.sample) ? r.sample[0] : r.sample;
            const batch = Array.isArray(sample?.batch) ? sample.batch[0] : sample?.batch;
            return batch?.product_id === filters.productId;
        });
    }

    if (filters?.batchId) {
        results = results.filter((r: any) => {
            const sample = Array.isArray(r.sample) ? r.sample[0] : r.sample;
            return sample?.production_batch_id === filters.batchId;
        });
    }

    if (!results || results.length === 0) {
        return {
            parameter: { id: param.id, name: param.name, unit: param.unit || "" },
            data: [],
            subgroups: [],
            mean: 0,
            sigmaShort: 0,
            sigmaLong: 0,
            ucl: 0,
            lcl: 0,
            specLimits,
            processCapability: { cp: null, cpk: null, ppk: null }
        };
    }

    // 5. Transform & Group
    const data: SPCDataPoint[] = results.map(r => ({
        id: r.id,
        date: r.analyzed_at,
        value: Number(r.value_numeric),
        isConforming: r.is_conforming ?? true,
        batchCode: (r.sample as any)?.batch?.code
    }));

    const subgroupSize = filters?.subgroupSize || 1;
    const subgroups: SPCSubgroup[] = [];

    if (subgroupSize > 1) {
        for (let i = 0; i < data.length; i += subgroupSize) {
            const chunk = data.slice(i, i + subgroupSize);
            const vals = chunk.map(d => d.value);
            const meanVal = vals.reduce((a, b) => a + b, 0) / vals.length;
            const maxVal = Math.max(...vals);
            const minVal = Math.min(...vals);
            const rangeVal = maxVal - minVal;

            // Subgroup StdDev
            const subVariance = vals.reduce((a, b) => a + Math.pow(b - meanVal, 2), 0) / (vals.length - 1 || 1);
            const subStdDev = Math.sqrt(subVariance);

            subgroups.push({
                id: `SG-${i}`,
                label: chunk[0].batchCode || format(new Date(chunk[0].date), "dd/MM"),
                values: vals,
                mean: meanVal,
                range: rangeVal,
                stdDev: subStdDev
            });
        }
    }

    const values = subgroupSize > 1 ? subgroups.map(s => s.mean) : data.map(d => d.value);
    const n = values.length;
    const mean = values.reduce((sum, v) => sum + v, 0) / n;

    // Long-term Variation (StdDev of all points)
    const allValues = data.map(d => d.value);
    const globalVariance = allValues.reduce((sum, v) => sum + Math.pow(v - (allValues.reduce((a, b) => a + b, 0) / allValues.length), 2), 0) / (allValues.length - 1 || 1);
    const sigmaLong = Math.sqrt(globalVariance);

    // Short-term Variation (Moving Range or Pooled depending on subgroup size)
    let sigmaShort = 0;
    let avgRange = 0;
    let avgStdDev = 0;
    let ucl = 0;
    let lcl = 0;
    let uclR: number | undefined;
    let lclR: number | undefined;
    let uclS: number | undefined;
    let lclS: number | undefined;

    if (subgroupSize === 1) {
        let totalMR = 0;
        for (let i = 1; i < values.length; i++) {
            totalMR += Math.abs(values[i] - values[i - 1]);
        }
        const avgMR = n > 1 ? totalMR / (n - 1) : 0;
        sigmaShort = avgMR / 1.128;
        ucl = mean + 3 * sigmaShort;
        lcl = Math.max(0, mean - 3 * sigmaShort);
    } else {
        avgRange = subgroups.reduce((a, b) => a + b.range, 0) / subgroups.length;
        avgStdDev = subgroups.reduce((a, b) => a + b.stdDev, 0) / subgroups.length;

        // Constants for subgrouping
        const d2Values: Record<number, number> = { 2: 1.128, 3: 1.693, 4: 2.059, 5: 2.326, 6: 2.534, 7: 2.704, 8: 2.847, 9: 2.970, 10: 3.078 };
        const D4Values: Record<number, number> = { 2: 3.267, 3: 2.574, 4: 2.282, 5: 2.114, 6: 2.004, 7: 1.924, 8: 1.864, 9: 1.816, 10: 1.777 };
        const D3Values: Record<number, number> = { 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0.076, 8: 0.136, 9: 0.184, 10: 0.223 };
        const B4Values: Record<number, number> = { 2: 3.267, 3: 2.568, 4: 2.266, 5: 2.089, 6: 1.970, 7: 1.882, 8: 1.815, 9: 1.761, 10: 1.716 };
        const B3Values: Record<number, number> = { 2: 0, 3: 0, 4: 0, 5: 0, 6: 0.030, 7: 0.118, 8: 0.185, 9: 0.239, 10: 0.284 };
        const A2Values: Record<number, number> = { 2: 1.880, 3: 1.023, 4: 0.729, 5: 0.577, 6: 0.483, 7: 0.419, 8: 0.373, 9: 0.337, 10: 0.308 };

        const d2 = d2Values[subgroupSize] || 3;
        const D4 = D4Values[subgroupSize] || 2;
        const D3 = D3Values[subgroupSize] || 0;
        const B4 = B4Values[subgroupSize] || 2;
        const B3 = B3Values[subgroupSize] || 0;
        const A2 = A2Values[subgroupSize] || 0.3;

        sigmaShort = avgRange / d2;

        // X-Bar limits
        ucl = mean + A2 * avgRange;
        lcl = Math.max(0, mean - A2 * avgRange);

        // R-Chart limits
        uclR = avgRange * D4;
        lclR = Math.max(0, avgRange * D3);

        // S-Chart limits
        uclS = avgStdDev * B4;
        lclS = Math.max(0, avgStdDev * B3);
    }

    // 6. Capability Indices
    let processCapability: SPCResult["processCapability"] = { cp: null, cpk: null, ppk: null };

    if (specLimits && specLimits.usl !== null && specLimits.lsl !== null && sigmaShort > 0) {
        const cp = (specLimits.usl - specLimits.lsl) / (6 * sigmaShort);
        const cpu = (specLimits.usl - mean) / (3 * sigmaShort);
        const cpl = (mean - specLimits.lsl) / (3 * sigmaShort);
        const cpk = Math.min(cpu, cpl);

        processCapability = {
            cp: Number(cp.toFixed(2)),
            cpk: Number(cpk.toFixed(2)),
            ppk: Number(cpk.toFixed(2)) // Simplified for I-Chart
        };
    }

    // 7. Nelson Rules (Detect on whatever the chart is showing - individual vs means)
    const violations = detectRunRuleViolations(values, mean, ucl, lcl);

    return {
        parameter: { id: param.id, name: param.name, unit: param.unit || "" },
        data,
        subgroups,
        mean: parseFloat(mean.toFixed(3)),
        sigmaShort: parseFloat(sigmaShort.toFixed(3)),
        sigmaLong: parseFloat(sigmaLong.toFixed(3)),
        ucl: parseFloat(ucl.toFixed(3)),
        lcl: parseFloat(lcl.toFixed(3)),
        uclR: uclR !== undefined ? parseFloat(uclR.toFixed(3)) : undefined,
        lclR: lclR !== undefined ? parseFloat(lclR.toFixed(3)) : undefined,
        uclS: uclS !== undefined ? parseFloat(uclS.toFixed(3)) : undefined,
        lclS: lclS !== undefined ? parseFloat(lclS.toFixed(3)) : undefined,
        avgRange: avgRange !== undefined ? parseFloat(avgRange.toFixed(3)) : undefined,
        avgStdDev: avgStdDev !== undefined ? parseFloat(avgStdDev.toFixed(3)) : undefined,
        specLimits,
        processCapability,
        violations
    };
}

/**
 * Enhanced Western Electric / Nelson Rules
 */
export interface RunRuleViolation {
    rule: number;
    description: string;
    pointIndexes: number[];
}

export function detectRunRuleViolations(
    values: number[],
    mean: number,
    ucl: number,
    lcl: number
): RunRuleViolation[] {
    if (values.length < 2) return [];

    const violations: RunRuleViolation[] = [];
    const sigma = (ucl - mean) / 3;

    // Rule 1: Point beyond 3σ
    values.forEach((v, i) => {
        if (v > ucl || v < lcl) {
            violations.push({ rule: 1, description: "Ponto fora dos limites de 3σ", pointIndexes: [i] });
        }
    });

    // Rule 2: 9 points on same side of mean
    for (let i = 0; i <= values.length - 9; i++) {
        const slice = values.slice(i, i + 9);
        if (slice.every(v => v > mean) || slice.every(v => v < mean)) {
            violations.push({ rule: 2, description: "9 pontos consecutivos do mesmo lado da média", pointIndexes: Array.from({ length: 9 }, (_, j) => i + j) });
        }
    }

    // Rule 3: 6 points increasing/decreasing
    for (let i = 0; i <= values.length - 6; i++) {
        const slice = values.slice(i, i + 6);
        let inc = true, dec = true;
        for (let j = 1; j < 6; j++) {
            if (slice[j] <= slice[j - 1]) inc = false;
            if (slice[j] >= slice[j - 1]) dec = false;
        }
        if (inc || dec) {
            violations.push({ rule: 3, description: `6 pontos em tendência ${inc ? 'ascendente' : 'descendente'}`, pointIndexes: Array.from({ length: 6 }, (_, j) => i + j) });
        }
    }

    // Rule 4: 14 points alternating
    for (let i = 0; i <= values.length - 14; i++) {
        const slice = values.slice(i, i + 14);
        let alt = true;
        for (let j = 1; j < 14; j++) {
            if ((slice[j] > slice[j - 1] && j > 1 && slice[j - 1] > slice[j - 2]) ||
                (slice[j] < slice[j - 1] && j > 1 && slice[j - 1] < slice[j - 2])) {
                alt = false; break;
            }
        }
        if (alt) violations.push({ rule: 4, description: "14 pontos alternando para cima e para baixo", pointIndexes: Array.from({ length: 14 }, (_, j) => i + j) });
    }

    return violations;
}

/**
 * Get data for Scatter Diagram (Correlation between two parameters)
 */
export async function getCorrelationData(
    param1Id: string,
    param2Id: string,
    filters: SPCFilterOptions
) {
    const supabase = await createClient();
    const user = await getSafeUser();

    // Fetch data for both parameters
    const [p1, p2] = await Promise.all([
        getSPCData(param1Id, 100, filters),
        getSPCData(param2Id, 100, filters)
    ]);

    if (!p1 || !p2) {
        return {
            data: [],
            correlation: 0,
            param1: { name: "N/A", unit: "" },
            param2: { name: "N/A", unit: "" }
        };
    }

    // Align data by sample/batch
    const dataMap = new Map();

    p1.data.forEach(d => {
        const key = d.batchCode || d.id;
        dataMap.set(key, { x: d.value, xLabel: d.batchCode || format(new Date(d.date), "dd/MM") });
    });

    const combinedData: any[] = [];
    p2.data.forEach(d => {
        const key = d.batchCode || d.id;
        if (dataMap.has(key)) {
            const entry = dataMap.get(key);
            combinedData.push({
                ...entry,
                y: d.value,
                yLabel: d.batchCode || format(new Date(d.date), "dd/MM"),
                name: key
            });
        }
    });

    // Calculate Pearson Correlation
    const n = combinedData.length;
    if (n < 2) return { data: combinedData, correlation: 0 };

    const sumX = combinedData.reduce((s, d) => s + d.x, 0);
    const sumY = combinedData.reduce((s, d) => s + d.y, 0);
    const sumXY = combinedData.reduce((s, d) => s + d.x * d.y, 0);
    const sumX2 = combinedData.reduce((s, d) => s + d.x * d.x, 0);
    const sumY2 = combinedData.reduce((s, d) => s + d.y * d.y, 0);

    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
    const correlation = denominator === 0 ? 0 : numerator / denominator;

    return {
        data: combinedData,
        correlation: parseFloat(correlation.toFixed(3)),
        param1: p1.parameter,
        param2: p2.parameter
    };
}

/**
 * Summary and Rules wrapper kept for backward compatibility if needed
 */
export async function getSPCSummary() {
    const supabase = await createClient();
    const user = await getSafeUser();
    const { data: params } = await supabase.from("qa_parameters").select("id, name, code, unit").eq("organization_id", user.organization_id).eq("status", "active").limit(20);
    if (!params) return [];
    return Promise.all(params.map(async (p) => {
        const spcData = await getSPCData(p.id, 30);
        return {
            parameterId: p.id, parameterName: p.name, code: p.code, unit: p.unit,
            dataPoints: spcData?.data.length || 0,
            mean: spcData?.mean || 0,
            cpk: spcData?.processCapability?.cpk || null,
            outOfControl: spcData?.violations?.length || 0
        };
    })).then(res => res.filter(s => s.dataPoints > 0));
}

export async function getSPCDataWithRules(parameterId: string, days: number = 30, filters?: SPCFilterOptions) {
    return getSPCData(parameterId, days, filters);
}



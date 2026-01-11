"use server";

import { createClient } from "@/lib/supabase/server";
import { getSafeUser } from "@/lib/auth.server";
import { getSPCData, SPCFilterOptions } from "@/lib/queries/spc";

export async function getSPCDataAction(filters: {
    productId: string;
    parameterId: string;
    batchId?: string;
    sampleTypeId?: string;
    startDate?: string;
    endDate?: string;
    subgroupSize?: number;
}) {
    const spcFilters: SPCFilterOptions = {
        productId: filters.productId,
        batchId: filters.batchId === "all" ? undefined : filters.batchId,
        sampleTypeId: filters.sampleTypeId === "all" ? undefined : filters.sampleTypeId,
        dateFrom: filters.startDate,
        dateTo: filters.endDate,
        subgroupSize: filters.subgroupSize
    };

    const spcResult = await getSPCData(filters.parameterId, 30, spcFilters);

    if (!spcResult) {
        return { data: [], subgroups: [], specs: null, error: "Falha ao carregar dados SPC" };
    }

    return {
        data: spcResult.data,
        subgroups: spcResult.subgroups || [],
        specs: {
            min_value: spcResult.specLimits?.lsl,
            max_value: spcResult.specLimits?.usl,
            target_value: spcResult.specLimits?.target
        },
        statistics: {
            mean: spcResult.mean,
            sigmaShort: spcResult.sigmaShort,
            sigmaLong: spcResult.sigmaLong,
            ucl: spcResult.ucl,
            lcl: spcResult.lcl,
            uclR: spcResult.uclR,
            lclR: spcResult.lclR,
            uclS: spcResult.uclS,
            lclS: spcResult.lclS,
            avgRange: spcResult.avgRange,
            avgStdDev: spcResult.avgStdDev,
            cpk: spcResult.processCapability?.cpk,
            cp: spcResult.processCapability?.cp,
            ppk: spcResult.processCapability?.ppk,
            violations: spcResult.violations
        }
    };
}

export async function getProductBatchesAction(productId: string) {
    const supabase = await createClient();
    const user = await getSafeUser();

    const query = supabase
        .from("production_batches")
        .select("id, code, start_date")
        .eq("product_id", productId)
        .eq("organization_id", user.organization_id)
        .order("start_date", { ascending: false })
        .limit(50);

    if (user.plant_id) {
        query.eq("plant_id", user.plant_id);
    }

    const { data: batches } = await query;

    return batches || [];
}

export async function getParetoDataAction(dimension: "category" | "nc_type" | "severity" = "category") {
    const { getParetoData } = await import("@/lib/queries/qms");
    return getParetoData(dimension);
}

export async function getCorrelationDataAction(
    param1Id: string,
    param2Id: string,
    filters: {
        productId: string;
        batchId?: string;
        sampleTypeId?: string;
        startDate?: string;
        endDate?: string;
    }
) {
    const { getCorrelationData } = await import("@/lib/queries/spc");
    return getCorrelationData(param1Id, param2Id, {
        productId: filters.productId,
        batchId: filters.batchId === "all" ? undefined : filters.batchId,
        sampleTypeId: filters.sampleTypeId === "all" ? undefined : filters.sampleTypeId,
        dateFrom: filters.startDate,
        dateTo: filters.endDate
    });
}

export async function analyzeSPCTrendsAction(params: {
    parameterName: string;
    unit: string;
    data: any[];
    statistics: any;
    specLimits?: any;
}) {
    const { analyzeSPCTrends } = await import("@/lib/openai");
    return analyzeSPCTrends(params);
}

export async function saveQualityAnalysisAction(params: {
    productId?: string;
    parameterId?: string;
    batchId?: string;
    analysisType: 'ishikawa' | '5why' | 'check_sheet' | 'flowchart';
    data: any;
}) {
    const supabase = await createClient();
    const user = await getSafeUser();

    const { data, error } = await supabase
        .from("quality_analysis")
        .upsert({
            organization_id: user.organization_id,
            plant_id: user.plant_id,
            product_id: params.productId,
            parameter_id: params.parameterId,
            batch_id: params.batchId === "all" ? undefined : params.batchId,
            analysis_type: params.analysisType,
            data: params.data,
            created_by: user.id,
            updated_at: new Date().toISOString()
        }, {
            onConflict: 'organization_id, plant_id, product_id, parameter_id, batch_id, analysis_type'
        })
        .select()
        .single();

    if (error) throw error;
    return data;
}

export async function getQualityAnalysisAction(params: {
    productId?: string;
    parameterId?: string;
    batchId?: string;
    analysisType: 'ishikawa' | '5why' | 'check_sheet' | 'flowchart';
}) {
    const supabase = await createClient();
    const user = await getSafeUser();

    const query = supabase
        .from("quality_analysis")
        .select("*")
        .eq("organization_id", user.organization_id)
        .eq("analysis_type", params.analysisType);

    if (params.productId) query.eq("product_id", params.productId);
    if (params.parameterId) query.eq("parameter_id", params.parameterId);
    if (params.batchId && params.batchId !== "all") query.eq("batch_id", params.batchId);

    const { data, error } = await query.maybeSingle();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
}


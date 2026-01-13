"use server";

/**
 * 📊 Dashboard Analytics Actions
 * 
 * Server actions for fetching pre-calculated KPIs and metrics
 * to feed the Premium component library.
 */

import { calculateModuleKPIs, KPIData } from "@/lib/services/calculation-engine";
import { getSafeUser } from "@/lib/auth.server";

export interface DashboardKPIsResult {
    success: boolean;
    kpis: KPIData[];
    error?: string;
    calculatedAt: Date;
}

/**
 * Fetch Lab Dashboard KPIs
 */
export async function getLabDashboardKPIs(): Promise<DashboardKPIsResult> {
    try {
        const user = await getSafeUser();
        const orgId = user.organization_id || "";
        const plantId = user.plant_id || "";
        const result = await calculateModuleKPIs("lab", orgId, plantId);

        return {
            success: result.success,
            kpis: result.data || [],
            error: result.error,
            calculatedAt: result.calculatedAt
        };
    } catch (error: any) {
        return {
            success: false,
            kpis: [],
            error: error.message,
            calculatedAt: new Date()
        };
    }
}

/**
 * Fetch Quality Dashboard KPIs
 */
export async function getQualityDashboardKPIs(): Promise<DashboardKPIsResult> {
    try {
        const user = await getSafeUser();
        const orgId = user.organization_id || "";
        const plantId = user.plant_id || "";
        const result = await calculateModuleKPIs("quality", orgId, plantId);

        return {
            success: result.success,
            kpis: result.data || [],
            error: result.error,
            calculatedAt: result.calculatedAt
        };
    } catch (error: any) {
        return {
            success: false,
            kpis: [],
            error: error.message,
            calculatedAt: new Date()
        };
    }
}

/**
 * Fetch Production Dashboard KPIs
 */
export async function getProductionDashboardKPIs(): Promise<DashboardKPIsResult> {
    try {
        const user = await getSafeUser();
        const orgId = user.organization_id || "";
        const plantId = user.plant_id || "";
        const result = await calculateModuleKPIs("production", orgId, plantId);

        return {
            success: result.success,
            kpis: result.data || [],
            error: result.error,
            calculatedAt: result.calculatedAt
        };
    } catch (error: any) {
        return {
            success: false,
            kpis: [],
            error: error.message,
            calculatedAt: new Date()
        };
    }
}

/**
 * Fetch Materials Dashboard KPIs
 */
export async function getMaterialsDashboardKPIs(): Promise<DashboardKPIsResult> {
    try {
        const user = await getSafeUser();
        const orgId = user.organization_id || "";
        const plantId = user.plant_id || "";
        const result = await calculateModuleKPIs("materials", orgId, plantId);

        return {
            success: result.success,
            kpis: result.data || [],
            error: result.error,
            calculatedAt: result.calculatedAt
        };
    } catch (error: any) {
        return {
            success: false,
            kpis: [],
            error: error.message,
            calculatedAt: new Date()
        };
    }
}

"use server";

import { createClient } from "@/lib/supabase/server";
import { getSafeUser } from "@/lib/auth.server";
import { getSPCDataWithRules } from "./spc";

export interface SPCAlert {
    id: string;
    alert_type: "run_rule_violation" | "cpk_warning" | "cpk_critical" | "out_of_spec";
    rule_number?: number;
    qa_parameter_id: string;
    sample_id?: string;
    lab_analysis_id?: string;
    production_batch_id?: string;
    description: string;
    value_recorded?: number;
    threshold_value?: number;
    cpk_value?: number;
    status: "active" | "acknowledged" | "resolved" | "dismissed";
    nonconformity_id?: string;
    created_at: string;
    parameter?: { name: string; code: string };
    sample?: { code: string };
    batch?: { code: string };
}

/**
 * Get active SPC alerts
 */
export async function getActiveSPCAlerts(limit: number = 20): Promise<SPCAlert[]> {
    const supabase = await createClient();
    const user = await getSafeUser();

    const { data, error } = await supabase
        .from("spc_alerts")
        .select(`
            *,
            parameter:qa_parameters(name, code),
            sample:samples(code),
            batch:production_batches(code)
        `)
        .eq("organization_id", user.organization_id)
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(limit);

    if (error) {
        console.error("Error fetching SPC alerts:", error);
        return [];
    }

    return (data || []).map(d => ({
        ...d,
        parameter: Array.isArray(d.parameter) ? d.parameter[0] : d.parameter,
        sample: Array.isArray(d.sample) ? d.sample[0] : d.sample,
        batch: Array.isArray(d.batch) ? d.batch[0] : d.batch,
    }));
}

/**
 * Get all SPC alerts with pagination
 */
export async function getSPCAlerts(options?: {
    status?: string;
    parameterId?: string;
    limit?: number;
    offset?: number;
}) {
    const supabase = await createClient();
    const user = await getSafeUser();

    let query = supabase
        .from("spc_alerts")
        .select(`
            *,
            parameter:qa_parameters(name, code),
            sample:samples(code),
            batch:production_batches(code),
            acknowledged_by_user:user_profiles!acknowledged_by(full_name),
            resolved_by_user:user_profiles!resolved_by(full_name)
        `, { count: "exact" })
        .eq("organization_id", user.organization_id)
        .order("created_at", { ascending: false });

    if (options?.status) {
        query = query.eq("status", options.status);
    }

    if (options?.parameterId) {
        query = query.eq("qa_parameter_id", options.parameterId);
    }

    if (options?.limit) {
        query = query.limit(options.limit);
    }

    if (options?.offset) {
        query = query.range(options.offset, options.offset + (options.limit || 20) - 1);
    }

    const { data, count, error } = await query;

    if (error) {
        console.error("Error fetching SPC alerts:", error);
        return { alerts: [], count: 0 };
    }

    return { alerts: data || [], count: count || 0 };
}

/**
 * Create an SPC alert
 */
export async function createSPCAlert(alert: {
    alertType: "run_rule_violation" | "cpk_warning" | "cpk_critical" | "out_of_spec";
    ruleNumber?: number;
    parameterId: string;
    sampleId?: string;
    analysisId?: string;
    batchId?: string;
    description: string;
    valueRecorded?: number;
    thresholdValue?: number;
    cpkValue?: number;
}) {
    const supabase = await createClient();
    const user = await getSafeUser();

    const { error } = await supabase.from("spc_alerts").insert({
        organization_id: user.organization_id,
        plant_id: user.plant_id,
        alert_type: alert.alertType,
        rule_number: alert.ruleNumber,
        qa_parameter_id: alert.parameterId,
        sample_id: alert.sampleId,
        lab_analysis_id: alert.analysisId,
        production_batch_id: alert.batchId,
        description: alert.description,
        value_recorded: alert.valueRecorded,
        threshold_value: alert.thresholdValue,
        cpk_value: alert.cpkValue,
        status: "active",
    });

    return { success: !error, error: error?.message };
}

/**
 * Check for SPC violations after a result is registered
 * This should be called after saving a lab_analysis result
 */
export async function checkAndCreateSPCAlerts(
    parameterId: string,
    analysisId: string,
    sampleId: string,
    batchId: string | null,
    valueRecorded: number
) {
    // Get SPC data with run rules for this parameter
    const spcData = await getSPCDataWithRules(parameterId, 30);

    if (!spcData || spcData.data.length < 5) {
        // Not enough data for statistical analysis
        return { alertsCreated: 0 };
    }

    let alertsCreated = 0;

    // Check for run rule violations on the latest point
    if (spcData.violations && spcData.violations.length > 0) {
        const latestViolations = spcData.violations.filter(v =>
            v.pointIndexes.includes(spcData.data.length - 1)
        );

        for (const violation of latestViolations) {
            await createSPCAlert({
                alertType: "run_rule_violation",
                ruleNumber: violation.rule,
                parameterId,
                sampleId,
                analysisId,
                batchId: batchId || undefined,
                description: `Regra ${violation.rule}: ${violation.description}`,
                valueRecorded,
                thresholdValue: violation.rule === 1 ? spcData.ucl : undefined,
            });
            alertsCreated++;
        }
    }

    // Check for out of spec (beyond UCL/LCL)
    if (valueRecorded > spcData.ucl || valueRecorded < spcData.lcl) {
        await createSPCAlert({
            alertType: "out_of_spec",
            parameterId,
            sampleId,
            analysisId,
            batchId: batchId || undefined,
            description: valueRecorded > spcData.ucl
                ? `Valor ${valueRecorded} acima do UCL (${spcData.ucl})`
                : `Valor ${valueRecorded} abaixo do LCL (${spcData.lcl})`,
            valueRecorded,
            thresholdValue: valueRecorded > spcData.ucl ? spcData.ucl : spcData.lcl,
        });
        alertsCreated++;
    }

    // Check for Cpk thresholds
    const cpk = spcData.processCapability?.cpk;
    if (cpk !== null && cpk !== undefined) {
        if (cpk < 0.67) {
            await createSPCAlert({
                alertType: "cpk_critical",
                parameterId,
                sampleId,
                analysisId,
                batchId: batchId || undefined,
                description: `Cpk crítico: ${cpk} (< 0.67) - Processo incapaz`,
                cpkValue: cpk,
            });
            alertsCreated++;
        } else if (cpk < 1.0) {
            await createSPCAlert({
                alertType: "cpk_warning",
                parameterId,
                sampleId,
                analysisId,
                batchId: batchId || undefined,
                description: `Cpk de advertência: ${cpk} (< 1.0) - Processo marginal`,
                cpkValue: cpk,
            });
            alertsCreated++;
        }
    }

    return { alertsCreated };
}

/**
 * Acknowledge an SPC alert
 */
export async function acknowledgeSPCAlert(alertId: string) {
    const supabase = await createClient();
    const user = await getSafeUser();

    const { error } = await supabase
        .from("spc_alerts")
        .update({
            status: "acknowledged",
            acknowledged_by: user.id,
            acknowledged_at: new Date().toISOString(),
        })
        .eq("id", alertId)
        .eq("organization_id", user.organization_id);

    return { success: !error, error: error?.message };
}

/**
 * Resolve an SPC alert
 */
export async function resolveSPCAlert(alertId: string, notes: string, ncId?: string) {
    const supabase = await createClient();
    const user = await getSafeUser();

    const { error } = await supabase
        .from("spc_alerts")
        .update({
            status: "resolved",
            resolved_by: user.id,
            resolved_at: new Date().toISOString(),
            resolution_notes: notes,
            nonconformity_id: ncId || null,
        })
        .eq("id", alertId)
        .eq("organization_id", user.organization_id);

    return { success: !error, error: error?.message };
}

/**
 * Get SPC alert statistics
 */
export async function getSPCAlertStats() {
    const supabase = await createClient();
    const user = await getSafeUser();

    const { data, error } = await supabase
        .from("spc_alerts")
        .select("id, status, alert_type")
        .eq("organization_id", user.organization_id);

    if (error || !data) return { active: 0, acknowledged: 0, resolved: 0, total: 0 };

    return {
        active: data.filter(a => a.status === "active").length,
        acknowledged: data.filter(a => a.status === "acknowledged").length,
        resolved: data.filter(a => a.status === "resolved").length,
        critical: data.filter(a => a.alert_type === "cpk_critical" && a.status === "active").length,
        total: data.length,
    };
}


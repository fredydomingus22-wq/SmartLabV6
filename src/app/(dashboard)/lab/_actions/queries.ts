"use server";

import * as queries from "@/lib/queries/lab";
import { createClient } from "@/lib/supabase/server";

export async function getDashboardSamplesAction(options?: any) {
    return queries.getDashboardSamples(options);
}

export async function getLabStatsAction() {
    return queries.getLabStats();
}

export async function getSampleTypesAction() {
    return queries.getSampleTypes();
}

export async function getActiveTanksAction() {
    return queries.getActiveTanks();
}

export async function getSamplingPointsAction(orgId: string) {
    const supabase = await createClient();
    const { data } = await supabase
        .from("sampling_points")
        .select("id, name, code, location")
        .eq("organization_id", orgId)
        .order("name");
    return data || [];
}

export async function getUsersAction(orgId: string) {
    try {
        const supabase = await createClient();
        const { data, error } = await supabase
            .from("user_profiles")
            .select("id, full_name, role")
            .eq("organization_id", orgId)
            .order("full_name");
        if (error) console.error("getUsersAction error:", error);
        return data || [];
    } catch (err) {
        console.error("getUsersAction async error:", err);
        return [];
    }
}

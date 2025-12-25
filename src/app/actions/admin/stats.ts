"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { ensureSystemOwner } from "./utils";

export async function getGlobalStats() {
    try {
        await ensureSystemOwner();
        const supabase = createAdminClient();

        // Count Organizations
        const { count: orgCount, error: orgError } = await supabase
            .from('organizations')
            .select('*', { count: 'exact', head: true });

        if (orgError) throw orgError;

        // Count Users
        const { count: userCount, error: userError } = await supabase
            .from('user_profiles')
            .select('*', { count: 'exact', head: true });

        if (userError) throw userError;

        // Count Plants (Optional but good)
        const { count: plantCount, error: plantError } = await supabase
            .from('plants')
            .select('*', { count: 'exact', head: true });

        if (plantError) throw plantError;

        return {
            success: true,
            data: {
                totalOrganizations: orgCount || 0,
                totalUsers: userCount || 0,
                totalPlants: plantCount || 0,
                systemStatus: 'Stable'
            }
        };
    } catch (error: any) {
        return { success: false, message: error.message };
    }
}

export async function getGlobalAuditLogs() {
    try {
        await ensureSystemOwner();
        const supabase = createAdminClient();

        const { data, error } = await supabase
            .from('system_audit_logs')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(100);

        if (error) throw error;
        return { success: true, data };
    } catch (error: any) {
        return { success: false, message: error.message };
    }
}

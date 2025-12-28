"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { ensureSystemOwner } from "./utils";

export async function getGlobalStats() {
    try {
        await ensureSystemOwner();
        const supabase = createAdminClient();

        // 1. Core Entity Counts
        const { count: orgCount } = await supabase.from('organizations').select('*', { count: 'exact', head: true });
        const { count: userCount } = await supabase.from('user_profiles').select('*', { count: 'exact', head: true });
        const { count: plantCount } = await supabase.from('plants').select('*', { count: 'exact', head: true });

        // 2. Data Infrastructure Weight (Samples, Audit, Inventory)
        const { count: sampleCount } = await supabase.from('samples').select('*', { count: 'exact', head: true });
        const { count: ncCount } = await supabase.from('qms_nc').select('*', { count: 'exact', head: true });
        const { count: inventoryCount } = await supabase.from('inventory_items').select('*', { count: 'exact', head: true });

        // 3. Fetch Organizations for Resource Mapping
        const { data: orgs } = await supabase
            .from('organizations')
            .select(`
                id,
                name,
                user_profiles(count),
                plants(count),
                samples(count)
            `);

        // Calculate simulated "Infrastructure Weight" based on data density
        const resourceUsage = (orgs || []).map(org => {
            const users = (org.user_profiles as any)?.[0]?.count || 0;
            const plants = (org.plants as any)?.[0]?.count || 0;
            const samples = (org.samples as any)?.[0]?.count || 0;

            // Weight calculation: Users(10) + Plants(50) + Samples(1) = Point units
            const weight = (users * 10) + (plants * 50) + (samples * 1);

            return {
                id: org.id,
                name: org.name,
                weight,
                users,
                plants,
                samples
            };
        }).sort((a, b) => b.weight - a.weight);

        // 4. Fetch Recent Audit Logs
        const { data: logs } = await supabase
            .from('system_audit_logs')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(10);

        // 5. System Health Determination (Based on recent errors in logs)
        const hasErrors = logs?.some(l => l.action.includes('ERROR') || l.metadata?.status === 'error');

        return {
            success: true,
            data: {
                totalOrganizations: orgCount || 0,
                totalUsers: userCount || 0,
                totalPlants: plantCount || 0,
                totalSamples: sampleCount || 0,
                totalNCs: ncCount || 0,
                totalInventory: inventoryCount || 0,
                systemStatus: hasErrors ? 'Warning' : 'Stable',
                healthScore: hasErrors ? 85 : 99,
                resourceUsage,
                recentLogs: logs || []
            }
        };
    } catch (error: any) {
        console.error("Global Stats Error:", error);
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

export async function getGlobalSettings() {
    try {
        await ensureSystemOwner();

        // Mocking function stats as they require CLI/Management API access
        // but listing known active modules
        return {
            success: true,
            data: {
                activeFunctions: [
                    { name: 'AI QMS Analyst', slug: 'ai-qms-analyst', status: 'ACTIVE', triggers: 'On NC Create' },
                    { name: 'AI Audit Suggester', slug: 'ai-audit-report-suggest', status: 'ACTIVE', triggers: 'On Audit Start' }
                ],
                globalToggles: {
                    maintenanceMode: false,
                    allowSelfRegistration: false,
                    enforceMFA: true
                }
            }
        };
    } catch (error: any) {
        return { success: false, message: error.message };
    }
}

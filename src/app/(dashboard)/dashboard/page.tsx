import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
    FlaskConical,
    Factory,
    Package,
    AlertTriangle,
    CheckCircle,
    Clock,
    TrendingUp,
    Beaker,
    ClipboardCheck,
    ArrowUpRight,
    ArrowDownRight,
    Zap,
    FileText,
    GraduationCap,
    Warehouse,
    RefreshCw,
    Plus,
    Microscope,
    Globe
} from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { DashboardTrendsClient } from "@/components/dashboard/dashboard-trends-client";
import { DashboardToolbar } from "@/components/dashboard/dashboard-toolbar";
import { getSafeUser } from "@/lib/auth.server"; import { SafeUser } from "@/lib/auth";
import { ManagerOverview } from "@/components/dashboard/role-views/manager-overview";
import { AnalystView } from "@/components/dashboard/role-views/analyst-view";
import { OperatorView } from "@/components/dashboard/role-views/operator-view";
import { MicroView } from "@/components/dashboard/role-views/micro-view";
import { HACCPView } from "@/components/dashboard/role-views/haccp-view";
import { RMPMView } from "@/components/dashboard/role-views/rmpm-view";
import { SystemOwnerView } from "@/components/dashboard/role-views/system-owner-view";
import { AdminView } from "@/components/dashboard/role-views/admin-view";
import { Suspense } from "react";
import { Sparkles, Activity as ActivityIcon, LayoutDashboard } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";

export const dynamic = "force-dynamic";

interface DashboardFilters {
    from?: Date;
    to?: Date;
    scope?: string;
}

async function getStats(supabase: any, user: SafeUser, filters: DashboardFilters) {
    const fromDate = filters.from || new Date(new Date().setDate(new Date().getDate() - 7));
    const toDate = filters.to || new Date();

    const previousFromDate = new Date(fromDate);
    previousFromDate.setDate(previousFromDate.getDate() - 7);
    const previousToDate = new Date(fromDate);

    const isMicro = user.role === 'micro_analyst';
    const isLab = user.role === 'lab_analyst';
    const isHaccp = user.role === 'haccp_analyst' || user.role === 'haccp';
    const isAdmin = user.role === 'admin';
    const isQaManager = user.role === 'qa_manager';

    // 1. Active Batches (Global Context)
    const { count: activeBatches } = await supabase.from("production_batches")
        .select("*", { count: "exact", head: true })
        .eq("status", "open")
        .eq("organization_id", user.organization_id);

    // 2. Pending Samples (Strict Segregation)
    let pendingQuery = supabase.from("samples")
        .select("*, type:sample_types!inner(test_category)", { count: "exact", head: true })
        .eq("status", "pending")
        .eq("organization_id", user.organization_id);

    if (isLab) pendingQuery = pendingQuery.neq("type.test_category", "microbiological");
    if (isMicro) pendingQuery = pendingQuery.eq("type.test_category", "microbiological");

    const { count: pendingSamples } = await pendingQuery;

    // 3. In Analysis (Strict Segregation)
    let inAnalysisQuery = supabase.from("samples")
        .select("*, type:sample_types!inner(test_category)", { count: "exact", head: true })
        .eq("status", "in_analysis")
        .eq("organization_id", user.organization_id);

    if (isLab) inAnalysisQuery = inAnalysisQuery.neq("type.test_category", "microbiological");
    if (isMicro) inAnalysisQuery = inAnalysisQuery.eq("type.test_category", "microbiological");

    const { count: inAnalysis } = await inAnalysisQuery;

    // 4. Compliance Rate (Dynamic Window)
    let complianceQuery = supabase.from("samples")
        .select("status, type:sample_types!inner(test_category)")
        .gte("created_at", fromDate.toISOString())
        .lte("created_at", toDate.toISOString())
        .eq("organization_id", user.organization_id);

    if (isLab) complianceQuery = complianceQuery.neq("type.test_category", "microbiological");
    if (isMicro) complianceQuery = complianceQuery.eq("type.test_category", "microbiological");

    const { data: recentSamples } = await complianceQuery;

    const totalRecent = recentSamples?.length || 0;
    const approvedRecent = recentSamples?.filter((s: any) => s.status === 'approved').length || 0;
    const complianceRate = totalRecent > 0 ? (approvedRecent / totalRecent) * 100 : 100;

    // 6. Expiring Soon (Moved up for dependencies)
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    const { count: expiringSoon } = await supabase.from("raw_material_lots")
        .select("*", { count: "exact", head: true })
        .lte("expiry_date", thirtyDaysFromNow.toISOString())
        .eq("status", "approved")
        .eq("organization_id", user.organization_id);

    // 7. CIP Pending
    const { count: cipActive } = await supabase.from("cip_executions")
        .select("*", { count: "exact", head: true })
        .eq("status", "pending")
        .eq("organization_id", user.organization_id);

    // 8. Recent Deviations (HACCP / CCP) - FIXED: Use pcc_logs
    const { count: recentDeviations } = await supabase.from("pcc_logs")
        .select("*", { count: "exact", head: true })
        .eq("is_compliant", false)
        .gte("checked_at", fromDate.toISOString())
        .lte("checked_at", toDate.toISOString())
        .eq("organization_id", user.organization_id);

    // 9. HACCP Compliance Rate
    const { data: haccpReadings } = await supabase.from("pcc_logs")
        .select("is_compliant")
        .gte("checked_at", fromDate.toISOString())
        .lte("checked_at", toDate.toISOString())
        .eq("organization_id", user.organization_id);

    const totalHaccp = haccpReadings?.length || 0;
    const compliantHaccp = haccpReadings?.filter((r: any) => r.is_compliant).length || 0;
    const haccpComplianceRate = totalHaccp > 0 ? (compliantHaccp / totalHaccp) * 100 : 100;

    // 10. Problematic CCP
    const { data: problematicData } = await supabase.from("pcc_logs")
        .select(`
            hazard:haccp_hazards(process_step)
        `)
        .eq("is_compliant", false)
        .gte("checked_at", fromDate.toISOString())
        .lte("checked_at", toDate.toISOString())
        .eq("organization_id", user.organization_id)
        .limit(20);

    const ccpFailureCounts: Record<string, number> = {};
    problematicData?.forEach((d: any) => {
        const step = d.hazard?.process_step || "Desconhecido";
        ccpFailureCounts[step] = (ccpFailureCounts[step] || 0) + 1;
    });
    const problematicCCP = Object.entries(ccpFailureCounts)
        .sort((a, b) => b[1] - a[1])[0]?.[0] || "Nenhum";

    // 11. Production Lines Status
    const { data: linesData } = await supabase.from("production_lines")
        .select(`
            id,
            name,
            code,
            status,
            production_batches(
                id,
                pcc_logs(is_compliant, checked_at)
            )
        `)
        .eq("organization_id", user.organization_id)
        .order("name", { ascending: true });

    const lines = linesData?.map((l: any) => {
        // Flatten logs from all batches of this line
        const allLogs = l.production_batches?.flatMap((b: any) => b.pcc_logs || []) || [];
        const sortedLogs = allLogs.sort((a: any, b: any) =>
            new Date(b.checked_at).getTime() - new Date(a.checked_at).getTime()
        );
        const lastReadings = sortedLogs.slice(0, 3).map((log: any) => log.is_compliant);
        const hasDeviation = lastReadings.some((r: boolean | null) => r === false);
        const lastCheck = sortedLogs[0]?.checked_at;

        return {
            id: l.id,
            name: l.name,
            code: l.code,
            status: l.status,
            isProtected: !hasDeviation,
            lastReadings,
            lastCheck
        };
    }) || [];

    // 5. Role Specific Alerts (Calculated LAST)
    let roleAlerts = 0;
    let recentHaccpLogs: any[] = [];

    if (isHaccp) {
        const { data: haccpLogs } = await supabase.from("pcc_logs")
            .select(`
                id,
                actual_value,
                actual_value_text,
                critical_limit_min,
                critical_limit_max,
                is_compliant,
                checked_at,
                action_taken,
                hazard:haccp_hazards(process_step),
                equipment:equipments(name, code)
            `)
            .gte("checked_at", fromDate.toISOString())
            .lte("checked_at", toDate.toISOString())
            .eq("organization_id", user.organization_id)
            .order("checked_at", { ascending: false })
            .limit(10);
        recentHaccpLogs = haccpLogs || [];
    }

    if (isMicro) {
        const { count: microPending } = await supabase.from("micro_results")
            .select("*", { count: "exact", head: true })
            .eq("status", "pending")
            .eq("organization_id", user.organization_id);
        roleAlerts = microPending || 0;
    } else if (isLab) {
        roleAlerts = pendingSamples || 0;
    } else if (isAdmin || isQaManager) {
        roleAlerts = (recentDeviations || 0) + (expiringSoon || 0);
    } else if (isHaccp) {
        roleAlerts = recentDeviations || 0;
    }


    // --- New KPIs: OTD & Sampling Compliance ---

    // OTD (48h SLA)
    const { data: closedBatches } = await supabase.from("production_batches")
        .select("start_date, end_date")
        .eq("status", "closed")
        .not("end_date", "is", null)
        .gte("end_date", fromDate.toISOString())
        .lte("end_date", toDate.toISOString())
        .eq("organization_id", user.organization_id);

    const totalClosed = closedBatches?.length || 0;
    const onTimeBatches = closedBatches?.filter((b: any) => {
        const start = new Date(b.start_date).getTime();
        const end = new Date(b.end_date).getTime();
        return (end - start) <= (48 * 60 * 60 * 1000);
    }).length || 0;
    const otdRate = totalClosed > 0 ? (onTimeBatches / totalClosed) * 100 : 100;

    // Sampling Compliance (Execution Rate)
    const { count: totalSamplesPeriod } = await supabase.from("samples")
        .select("*", { count: 'exact', head: true })
        .gte("created_at", fromDate.toISOString())
        .lte("created_at", toDate.toISOString())
        .eq("organization_id", user.organization_id);

    const { count: completedSamples } = await supabase.from("samples")
        .select("*", { count: 'exact', head: true })
        .neq("status", "pending")
        .gte("created_at", fromDate.toISOString())
        .lte("created_at", toDate.toISOString())
        .eq("organization_id", user.organization_id);

    const samplingCompliance = totalSamplesPeriod ? (completedSamples! / totalSamplesPeriod!) * 100 : 100;

    // --- Trend Calculations ---

    // Compliance Trend
    let prevComplianceQuery = supabase.from("samples")
        .select("status, type:sample_types!inner(test_category)")
        .gte("created_at", previousFromDate.toISOString())
        .lte("created_at", previousToDate.toISOString())
        .eq("organization_id", user.organization_id);

    if (isLab) prevComplianceQuery = prevComplianceQuery.neq("type.test_category", "microbiological");
    if (isMicro) prevComplianceQuery = prevComplianceQuery.eq("type.test_category", "microbiological");

    const { data: prevSamples } = await prevComplianceQuery;
    const prevTotal = prevSamples?.length || 0;
    const prevApproved = prevSamples?.filter((s: any) => s.status === 'approved').length || 0;
    const prevComplianceRate = prevTotal > 0 ? (prevApproved / prevTotal) * 100 : 100;

    // OTD Trend (using simplified proxy: closed batches vs open)
    const { count: prevActiveBatches } = await supabase.from("production_batches")
        .select("*", { count: "exact", head: true })
        .lte("created_at", previousToDate.toISOString())
        .gte("created_at", previousFromDate.toISOString()) // Created in previous window
        .eq("organization_id", user.organization_id);

    // Deviations Trend - FIXED: Use pcc_logs
    const { count: prevDeviations } = await supabase.from("pcc_logs")
        .select("*", { count: "exact", head: true })
        .eq("is_compliant", false)
        .gte("checked_at", previousFromDate.toISOString())
        .lte("checked_at", previousToDate.toISOString())
        .eq("organization_id", user.organization_id);

    // Previous HACCP Compliance
    const { data: prevHaccpReadings } = await supabase.from("pcc_logs")
        .select("is_compliant")
        .gte("checked_at", previousFromDate.toISOString())
        .lte("checked_at", previousToDate.toISOString())
        .eq("organization_id", user.organization_id);

    const prevTotalHaccp = prevHaccpReadings?.length || 0;
    const prevCompliantHaccp = prevHaccpReadings?.filter((r: any) => r.is_compliant).length || 0;
    const prevHaccpComplianceRate = prevTotalHaccp > 0 ? (prevCompliantHaccp / prevTotalHaccp) * 100 : 100;

    // OTD Trend
    const { data: prevClosedBatches } = await supabase.from("production_batches")
        .select("start_date, end_date")
        .eq("status", "closed")
        .not("end_date", "is", null)
        .gte("end_date", previousFromDate.toISOString())
        .lte("end_date", previousToDate.toISOString())
        .eq("organization_id", user.organization_id);

    const prevTotalClosed = prevClosedBatches?.length || 0;
    const prevOnTime = prevClosedBatches?.filter((b: any) => {
        const start = new Date(b.start_date).getTime();
        const end = new Date(b.end_date).getTime();
        return (end - start) <= (48 * 60 * 60 * 1000);
    }).length || 0;
    const prevOtdRate = prevTotalClosed > 0 ? (prevOnTime / prevTotalClosed) * 100 : 100;

    const calculateTrend = (current: number, previous: number) => {
        if (previous === 0) return 0;
        return ((current - previous) / previous) * 100;
    };

    const trends = {
        compliance: calculateTrend(complianceRate, prevComplianceRate),
        deviations: calculateTrend(recentDeviations || 0, prevDeviations || 0),
        workload: calculateTrend(activeBatches || 0, prevActiveBatches || 0),
        otd: calculateTrend(otdRate, prevOtdRate),
        sampling: 0 // Placeholder
    };

    // --- Analyst Specific Premium Metrics (Lead Time & SLA) ---
    let ltQuery = supabase.from("samples")
        .select(`
            id,
            collected_at,
            status,
            type:sample_types!inner(test_category),
            lab_analysis (analyzed_at)
        `)
        .gte("created_at", fromDate.toISOString())
        .lte("created_at", toDate.toISOString())
        .eq("organization_id", user.organization_id)
        .in("status", ["reviewed", "approved", "rejected"]);

    if (isLab) ltQuery = ltQuery.neq("type.test_category", "microbiological");
    if (isMicro) ltQuery = ltQuery.eq("type.test_category", "microbiological");

    const { data: completedSamplesLT } = await ltQuery;

    let totalLeadTimeHours = 0;
    let compliantCount = 0;
    const completedCount = completedSamplesLT?.length || 0;

    completedSamplesLT?.forEach((s: any) => {
        const collected = new Date(s.collected_at).getTime();
        const analyses = s.lab_analysis || [];
        if (analyses.length > 0) {
            const lastAnalysis = Math.max(...analyses.map((a: any) => new Date(a.analyzed_at).getTime()));
            const minTime = Math.min(...analyses.map((a: any) => new Date(a.analyzed_at).getTime()));
            // Industrial Lead Time: Collection to FINAL Signature
            const leadTimeHours = (lastAnalysis - collected) / (1000 * 60 * 60);
            totalLeadTimeHours += leadTimeHours;
            if (leadTimeHours <= 8) compliantCount++; // 8h Shift SLA
        }
    });

    const avgLeadTime = completedCount > 0 ? totalLeadTimeHours / completedCount : 0;
    const slaComplianceAnalyst = completedCount > 0 ? (compliantCount / completedCount) * 100 : 100;

    // Previous Period for Analyst Trends
    let prevLTQuery = supabase.from("samples")
        .select(`
            id,
            collected_at,
            status,
            type:sample_types!inner(test_category),
            lab_analysis (analyzed_at)
        `)
        .gte("created_at", previousFromDate.toISOString())
        .lte("created_at", previousToDate.toISOString())
        .eq("organization_id", user.organization_id)
        .in("status", ["reviewed", "approved", "rejected"]);

    if (isLab) prevLTQuery = prevLTQuery.neq("type.test_category", "microbiological");
    if (isMicro) prevLTQuery = prevLTQuery.eq("type.test_category", "microbiological");

    const { data: prevCompletedSamplesLT } = await prevLTQuery;
    let prevTotalLT = 0;
    let prevCompliant = 0;
    const prevCompletedCount = prevCompletedSamplesLT?.length || 0;

    prevCompletedSamplesLT?.forEach((s: any) => {
        const collected = new Date(s.collected_at).getTime();
        const analyses = s.lab_analysis || [];
        if (analyses.length > 0) {
            const lastAnalysis = Math.max(...analyses.map((a: any) => new Date(a.analyzed_at).getTime()));
            const lt = (lastAnalysis - collected) / (1000 * 60 * 60);
            prevTotalLT += lt;
            if (lt <= 8) prevCompliant++;
        }
    });

    const prevAvgLT = prevCompletedCount > 0 ? prevTotalLT / prevCompletedCount : 0;
    const prevSlaComp = prevCompletedCount > 0 ? (prevCompliant / prevCompletedCount) * 100 : 100;

    // --- Trends & Sparklines (Last 7 Days) ---
    const last7Days = Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setHours(0, 0, 0, 0);
        d.setDate(d.getDate() - (6 - i));
        return d;
    });

    const { data: trendSamples } = await supabase.from("samples")
        .select("created_at, status")
        .gte("created_at", last7Days[0].toISOString())
        .eq("organization_id", user.organization_id);

    const { data: trendDeviations } = await supabase.from("pcc_logs")
        .select("checked_at, is_compliant")
        .eq("is_compliant", false)
        .gte("checked_at", last7Days[0].toISOString())
        .eq("organization_id", user.organization_id);

    const sparklines = {
        samples: last7Days.map(day => {
            const count = trendSamples?.filter((s: any) => {
                const sd = new Date(s.created_at);
                return sd.getFullYear() === day.getFullYear() &&
                    sd.getMonth() === day.getMonth() &&
                    sd.getDate() === day.getDate();
            }).length || 0;
            return { value: count };
        }),
        deviations: last7Days.map(day => {
            const count = trendDeviations?.filter((d: any) => {
                const dd = new Date(d.checked_at);
                return dd.getFullYear() === day.getFullYear() &&
                    dd.getMonth() === day.getMonth() &&
                    dd.getDate() === day.getDate();
            }).length || 0;
            return { value: count };
        }),
        compliance: last7Days.map(day => {
            const samples = trendSamples?.filter((s: any) => {
                const sd = new Date(s.created_at);
                return sd.getFullYear() === day.getFullYear() &&
                    sd.getMonth() === day.getMonth() &&
                    sd.getDate() === day.getDate();
            }) || [];
            if (samples.length === 0) return { value: 100 };
            const approved = samples.filter((s: any) => s.status === 'approved' || s.status === 'released').length;
            return { value: (approved / samples.length) * 100 };
        }),
        haccp: last7Days.map(day => {
            const readings = haccpReadings?.filter((r: any) => {
                const rd = new Date(r.checked_at);
                return rd.getFullYear() === day.getFullYear() &&
                    rd.getMonth() === day.getMonth() &&
                    rd.getDate() === day.getDate();
            }) || [];
            if (readings.length === 0) return { value: 100 };
            const compliant = readings.filter((r: any) => r.is_compliant).length;
            return { value: (compliant / readings.length) * 100 };
        })
    };

    // --- Micro KPIs & Incubators ---
    const { count: incubatingCount } = await supabase.from("samples")
        .select("*, type:sample_types!inner(test_category)", { count: "exact", head: true })
        .eq("status", "in_analysis")
        .eq("type.test_category", "microbiological")
        .eq("organization_id", user.organization_id);

    const { count: microCriticalCount } = await supabase.from("micro_results")
        .select("*", { count: "exact", head: true })
        .eq("status", "completed")
        .eq("is_conforming", false)
        .eq("organization_id", user.organization_id);

    const { data: incubators } = await supabase.from("equipments")
        .select("name, code, last_calibration_date")
        .ilike("name", "%estufa%")
        .eq("organization_id", user.organization_id)
        .limit(2);

    const micro = {
        incubating: incubatingCount || 0,
        readingsDue: 0, // Will be calculated after assignments are fetched in DashboardPage
        critical: microCriticalCount || 0,
        equipment: incubators?.map((e: { name: string; code: string; last_calibration_date: string | null }) => ({
            name: e.name,
            temp: "N/A",
            status: "online"
        })) || []
    };

    // --- Team & Productivity ---
    const { count: teamCount } = await supabase.from("teams")
        .select("*", { count: "exact", head: true })
        .eq("organization_id", user.organization_id);

    return {
        activeBatches: activeBatches || 0,
        pendingSamples: pendingSamples || 0,
        inAnalysis: inAnalysis || 0,
        complianceRate,
        expiringSoon: expiringSoon || 0,
        cipActive: cipActive || 0,
        recentDeviations: recentDeviations || 0,
        haccpCompliance: haccpComplianceRate,
        problematicCCP,
        recentHaccpLogs,
        lines,
        roleAlerts,
        otdRate,
        samplingCompliance,
        avgLeadTime,
        slaCompliance: slaComplianceAnalyst,
        sparklines,
        micro,
        teamCount: teamCount || 0,
        trends: {
            ...trends,
            haccpCompliance: calculateTrend(haccpComplianceRate, prevHaccpComplianceRate),
            deviations: calculateTrend(recentDeviations || 0, prevDeviations || 0),
            leadTime: calculateTrend(avgLeadTime, prevAvgLT) * -1, // Negative lead time change is positive trend
            sla: calculateTrend(slaComplianceAnalyst, prevSlaComp)
        }
    };
}

async function getAssignments(supabase: any, user: SafeUser) {
    const isMicro = user.role === 'micro_analyst';
    const isLab = user.role === 'lab_analyst';

    if (isMicro) {
        const { data: microTasks } = await supabase.from("micro_results")
            .select(`
                id,
                status,
                created_at,
                samples (code),
                qa_parameters (name)
            `)
            .eq("status", "pending")
            .eq("organization_id", user.organization_id)
            .limit(10); // Increased limit

        return microTasks?.map((t: any) => ({
            id: t.id,
            title: `Ler: ${t.samples?.code}`,
            subtitle: (t.qa_parameters as any)?.name,
            date: t.created_at,
            type: 'micro'
        })) || [];
    }

    if (isLab) {
        // Atomic Workflow: Group by Batch
        // Fetch pending samples with type filtering
        const { data: labSamples } = await supabase.from("samples")
            .select(`
                id,
                code,
                status,
                created_at,
                sample_types!inner(test_category),
                production_batches(id, code)
            `)
            .eq("status", "pending")
            .neq("sample_types.test_category", "microbiological") // Strict Segregation
            .eq("organization_id", user.organization_id);

        if (!labSamples) return [];

        // Group by Batch
        const batchGroups: Record<string, { batchId: string, batchCode: string, count: number, sampleId: string, date: string }> = {};
        const looseSamples: any[] = [];

        labSamples.forEach((s: any) => {
            if (s.production_batches) {
                const batchId = s.production_batches.id;
                if (!batchGroups[batchId]) {
                    batchGroups[batchId] = {
                        batchId: batchId,
                        batchCode: s.production_batches.code,
                        count: 0,
                        sampleId: s.id, // Reference sample for navigation
                        date: s.created_at
                    };
                }
                batchGroups[batchId].count++;
            } else {
                looseSamples.push(s);
            }
        });

        const batchTasks = Object.values(batchGroups).map(group => ({
            id: group.sampleId, // Navigate to sample to open wizard (wizard loads context)
            title: `Lote: ${group.batchCode}`,
            subtitle: `${group.count} Análises Pendentes`,
            date: group.date,
            type: 'batch', // New Type for AnalystView
            meta: { batchId: group.batchId }
        }));

        const individualTasks = looseSamples.map((s: any) => ({
            id: s.id,
            title: `Analisar: ${s.code}`,
            subtitle: 'Amostra Avulsa',
            date: s.created_at,
            type: 'lab'
        }));

        return [...batchTasks, ...individualTasks].slice(0, 10);
    }

    return [];
}

async function getRecentActivity(supabase: any, user: SafeUser, filters: DashboardFilters) {
    let sampleQuery = supabase.from("samples")
        .select("id, code, status, created_at")
        .eq("organization_id", user.organization_id)
        .eq("plant_id", user.plant_id)
        .order("created_at", { ascending: false })
        .limit(5);

    let batchQuery = supabase.from("production_batches")
        .select("id, code, status, start_date")
        .eq("organization_id", user.organization_id)
        .eq("plant_id", user.plant_id)
        .order("start_date", { ascending: false })
        .limit(5);

    if (filters.from) {
        sampleQuery = sampleQuery.gte("created_at", filters.from.toISOString());
        batchQuery = batchQuery.gte("start_date", filters.from.toISOString());
    }

    if (filters.to) {
        sampleQuery = sampleQuery.lte("created_at", filters.to.toISOString());
        batchQuery = batchQuery.lte("start_date", filters.to.toISOString());
    }

    const { data: samples } = await sampleQuery;
    const { data: batches } = await batchQuery;

    return { recentSamples: samples || [], recentBatches: batches || [] };
}


export default async function DashboardPage(props: { searchParams: Promise<{ from?: string; to?: string; scope?: string }> }) {
    const searchParams = await props.searchParams;

    const filters: DashboardFilters = {
        from: searchParams.from ? new Date(searchParams.from) : undefined,
        to: searchParams.to ? new Date(searchParams.to) : undefined,
        scope: searchParams.scope
    };

    const supabase = await createClient();
    const user = await getSafeUser();

    // Redirect System Owner directly to SaaS console
    if (user.role === 'system_owner') {
        redirect("/saas");
    }

    // Unified Role Logic
    const isSystemOwner = user.role === 'system_owner';
    const isMicro = user.role === 'micro_analyst';
    const isHaccp = user.role === 'haccp_analyst' || user.role === 'haccp';
    const isRmpm = user.role === 'rmpm_lab';
    const isLab = user.role === 'lab_analyst' || user.role === 'analyst';
    const isAdmin = user.role === 'admin';
    const isQaManager = user.role === 'qa_manager';
    const isManager = isQaManager || isAdmin;
    const isOperator = !isLab && !isMicro && !isHaccp && !isRmpm && !isManager && !isSystemOwner;

    // Fetch Global Stats for System Owner
    let globalStats = { totalOrgs: 0, totalPlants: 0, totalUsers: 0, activeSessions: 0 };
    if (isSystemOwner) {
        const [orgs, plants, users] = await Promise.all([
            supabase.from("organizations").select("*", { count: "exact", head: true }),
            supabase.from("plants").select("*", { count: "exact", head: true }),
            supabase.from("user_profiles").select("*", { count: "exact", head: true })
        ]);
        globalStats = {
            totalOrgs: orgs.count || 0,
            totalPlants: plants.count || 0,
            totalUsers: users.count || 0,
            activeSessions: 0
        };
    }

    // Search Params for filters
    // Next 15: params and searchParams are promises so we'd await them if inside specific page functions
    // but in Page props they are passed. However we can read headers/url too or props.
    // Let's assume this component receives props. But since we need to change the function signature:

    // We can't change the export default async function DashboardPage() signature purely from inside body.
    // But we can parse searchParams from props if we were passed them. 
    // Wait, the tool definition doesn't show props in the original file. 
    // We are editing the body.
    // Let's rely on Props type injection or use headers (not ideal for search params).
    // Actually, Server Components receive specific props. 
    // We need to change the function signature.
    // Since multi-replace can't change signature easily without context of arguments,
    // I will use a workaround: I'll try to update the signature in a separate chunk.

    // Actually, I can update the signature in the ReplacementContent of the function body start if I include it.
    // BUT, the start line 189 `export default async function DashboardPage() {`
    // I will target that.

    // For now, let's just initialize filters. I will update the signature in a separate chunk.

    // ...
    // ...

    // Parallel data fetching for standard roles
    const [stats, activity, assignments] = await (!isSystemOwner ? Promise.all([
        getStats(supabase, user, filters),
        getRecentActivity(supabase, user, filters),
        getAssignments(supabase, user)
    ]) : [null, null, null]);

    // Fetch Trend Data for Managers
    let products: any[] = [];
    let parameters: any[] = [];
    let initialTrendData: any[] = [];
    let initialSpecs: any = null;

    if (isManager && !isSystemOwner) {
        const { data: p } = await supabase.from("products").select("id, name").eq("organization_id", user.organization_id).eq("plant_id", user.plant_id).limit(5);
        const { data: q } = await supabase.from("qa_parameters").select("id, name").eq("organization_id", user.organization_id).eq("plant_id", user.plant_id).limit(5);

        products = p || [];
        parameters = q || [];

        if (products.length && parameters.length) {
            let analysisQuery = supabase.from("lab_analysis")
                .select(`
                    value_numeric,
                    created_at,
                    samples!inner (
                        code,
                        production_batches!inner (
                            product_id
                        )
                    )
                `)
                .eq("qa_parameter_id", parameters[0].id)
                .eq("samples.production_batches.product_id", products[0].id)
                .eq("organization_id", user.organization_id)
                .not("value_numeric", "is", null)
                .order("created_at", { ascending: false })
                .limit(20); // Increased limit for better trend visibility

            if (filters.from) analysisQuery = analysisQuery.gte("created_at", filters.from.toISOString());
            if (filters.to) analysisQuery = analysisQuery.lte("created_at", filters.to.toISOString());

            const { data: analyses } = await analysisQuery;

            initialTrendData = analyses?.map(a => ({
                value: a.value_numeric,
                sampleCode: (a.samples as any)?.code,
                batchCode: (a.samples as any)?.production_batches?.code,
                date: a.created_at
            })) || [];

            const { data: specs } = await supabase
                .from("product_specifications")
                .select("min_value, max_value, target_value")
                .eq("product_id", products[0].id)
                .eq("qa_parameter_id", parameters[0].id)
                .eq("is_current", true)
                .maybeSingle();

            initialSpecs = specs;
        }
    }

    const sparklines = stats?.sparklines || {
        deviations: Array(7).fill({ value: 0 }),
        haccp: Array(7).fill({ value: 100 })
    };

    return (
        <div className="min-h-screen bg-[#020817] text-slate-50 selection:bg-primary/30">
            {/* Ambient Background Glows */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 blur-[120px] rounded-full animate-pulse" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 blur-[120px] rounded-full animate-pulse" style={{ animationDelay: '2s' }} />
            </div>

            <div className="relative max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
                <PageHeader
                    variant="blue"
                    overline={`INDUSTRIAL INTELLIGENCE • ${user.role?.replace('_', ' ') || 'SYSTEM'}`}
                    title={`Olá, ${user.full_name?.split(' ')[0] || 'Utilizador'}`}
                    description={
                        isManager ? "Visão estratégica de qualidade, conformidade e KPIs globais da planta." :
                            isMicro ? "Monitoramento de incubações, leituras críticas e conformidade biológica." :
                                isHaccp ? "Controle de pontos críticos, segurança alimentar e alertas preventivos." :
                                    isRmpm ? "Inspeção de materiais, recebimento e homologação de fornecedores." :
                                        isLab ? "Gestão operacional de amostras, workflows analíticos e produtividade." :
                                            "Monitoramento de linhas produtivas, coletas e status em tempo real."
                    }
                    icon={<LayoutDashboard className="h-4 w-4" />}
                    actions={<DashboardToolbar />}
                />

                <main className="relative">
                    <Suspense fallback={<DashboardSkeleton />}>
                        {isManager ? (
                            <ManagerOverview
                                stats={stats}
                                products={products}
                                parameters={parameters}
                                initialTrendData={initialTrendData}
                                initialSpecs={initialSpecs}
                            />
                        ) : isMicro ? (
                            <MicroView
                                user={user}
                                stats={{
                                    ...stats!,
                                    micro: {
                                        ...stats!.micro,
                                        readingsDue: assignments!.filter((a: any) => a.type === 'micro').length
                                    }
                                }}
                                assignments={assignments}
                                activity={activity}
                            />
                        ) : isHaccp ? (
                            <HACCPView stats={stats} activity={activity} />
                        ) : isRmpm ? (
                            <RMPMView stats={stats} activity={activity} />
                        ) : isLab ? (
                            <AnalystView user={user} stats={stats} assignments={assignments} activity={activity} />
                        ) : (
                            <OperatorView stats={stats} activity={activity} />
                        )}
                    </Suspense>
                </main>

                {/* Global Status Footer */}
                <footer className="flex items-center justify-between pt-6 border-t border-white/5 opacity-50">
                    <span className="text-[10px] font-mono tracking-widest uppercase">GAMP 5 Certified Platform</span>
                    <div className="flex items-center gap-2">
                        <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500">Sincronizado com o Chão de Fábrica</span>
                    </div>
                </footer>
            </div>
        </div>
    );
}

function DashboardSkeleton() {
    return (
        <div className="space-y-10">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-[220px] rounded-3xl bg-slate-900/50 border border-white/5 animate-pulse relative overflow-hidden">
                        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-white/5 to-transparent" />
                    </div>
                ))}
            </div>
            <div className="grid gap-8 lg:grid-cols-3">
                <div className="lg:col-span-2 h-[400px] rounded-3xl bg-slate-900/50 border border-white/5 animate-pulse" />
                <div className="h-[400px] rounded-3xl bg-slate-900/50 border border-white/5 animate-pulse" />
            </div>
        </div>
    );
}


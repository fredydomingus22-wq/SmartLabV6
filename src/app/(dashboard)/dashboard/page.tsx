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
    LayoutDashboard,
    Microscope,
    Globe
} from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { DashboardTrendsClient } from "@/components/dashboard/dashboard-trends-client";
import { DashboardToolbar } from "@/components/dashboard/dashboard-toolbar";
import { getSafeUser } from "@/lib/auth.server"; import { SafeUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

interface DashboardFilters {
    from?: Date;
    to?: Date;
    scope?: string;
}

async function getStats(supabase: any, user: SafeUser, filters: DashboardFilters) {
    const fromDate = filters.from || new Date(new Date().setDate(new Date().getDate() - 7));
    const toDate = filters.to || new Date();

    const isMicro = user.role === 'micro_analyst';
    const isLab = user.role === 'lab_analyst';
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

    // 8. Recent Deviations (Moved up for dependencies)
    const { count: recentDeviations } = await supabase.from("ccp_readings")
        .select("*", { count: "exact", head: true })
        .eq("is_deviation", true)
        .gte("reading_time", fromDate.toISOString())
        .lte("reading_time", toDate.toISOString())
        .eq("organization_id", user.organization_id);

    // 5. Role Specific Alerts (Calculated LAST)
    let roleAlerts = 0;
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
    }

    return {
        activeBatches: activeBatches || 0,
        pendingSamples: pendingSamples || 0,
        inAnalysis: inAnalysis || 0,
        complianceRate,
        expiringSoon: expiringSoon || 0,
        cipActive: cipActive || 0,
        recentDeviations: recentDeviations || 0,
        roleAlerts,
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

import { ManagerOverview } from "@/components/dashboard/role-views/manager-overview";
import { AnalystView } from "@/components/dashboard/role-views/analyst-view";
import { OperatorView } from "@/components/dashboard/role-views/operator-view";
import { SystemOwnerView } from "@/components/dashboard/role-views/system-owner-view";
import { AdminView } from "@/components/dashboard/role-views/admin-view";

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

    const isSystemOwner = user.role === 'system_owner';
    const isAnalyst = ['lab_analyst', 'micro_analyst', 'analyst'].includes(user.role);
    const isAdmin = user.role === 'admin';
    const isQaManager = user.role === 'qa_manager';
    // Admin was previously grouped in isManager. Now we separate.
    const isManager = isQaManager; // Only QA Manager gets the specialized Manager Overview now, Admin gets AdminView
    const isOperator = !isAnalyst && !isManager && !isAdmin && !isSystemOwner;

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

    return (
        <div className="space-y-6">
            {/* Header section common to all */}
            <header className="flex flex-col gap-1">
                <h1 className="text-2xl font-bold tracking-tight text-slate-100 flex items-center gap-2">
                    {isSystemOwner ? <Globe className="h-6 w-6 text-blue-400" /> : isManager ? <TrendingUp className="h-6 w-6 text-emerald-400" /> : <LayoutDashboard className="h-6 w-6 text-blue-400" />}
                    Olá, {user.full_name?.split(' ')[0] || 'Utilizador'}
                </h1>
                <p className="text-sm text-muted-foreground italic">
                    {isSystemOwner ? "Consola Global de Gestão SmartLab SaaS." :
                        isManager ? "Aqui está o resumo de conformidade e operação da planta." :
                            isAdmin ? "Visão Geral Administrativa da Planta." :
                                isAnalyst ? "Tens novas amostras aguardando análise no seu turno." :
                                    "Pronto para registar novas atividades de produção."}
                </p>
            </header>

            {/* Global Toolbar - Hidden for System Owner */}
            {!isSystemOwner && <DashboardToolbar />}

            {/* Role-Specific Dashboard Content */}
            {isSystemOwner && (
                <SystemOwnerView stats={globalStats} />
            )}

            {isManager && !isSystemOwner && stats && (
                <ManagerOverview
                    stats={stats}
                    products={products}
                    parameters={parameters}
                    initialTrendData={initialTrendData}
                    initialSpecs={initialSpecs}
                />
            )}

            {isAdmin && !isSystemOwner && stats && (
                <AdminView
                    stats={stats}
                    activity={activity}
                />
            )}

            {isAnalyst && stats && (
                <AnalystView
                    user={user}
                    stats={stats}
                    assignments={assignments || []}
                    activity={activity}
                />
            )}

            {isOperator && stats && (
                <OperatorView
                    stats={stats}
                    activity={activity}
                />
            )}

            {/* Global System Status Footer (Simplified) */}
            <div className="flex items-center justify-between pt-6 border-t border-slate-800/50">
                <span className="text-[10px] text-slate-500 font-mono tracking-widest uppercase">GAMP 5 Certified Platform</span>
                <div className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[10px] text-emerald-500/80 font-bold uppercase tracking-widest">Sincronizado</span>
                </div>
            </div>
        </div>
    );
}


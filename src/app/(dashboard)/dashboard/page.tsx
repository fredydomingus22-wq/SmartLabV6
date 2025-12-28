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
import { getSafeUser } from "@/lib/auth.server"; import { SafeUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

async function getStats(supabase: any, user: SafeUser) {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const isMicro = user.role === 'micro_analyst';
    const isLab = user.role === 'lab_analyst';

    // 1. Active Batches (Always relevant for context)
    const { count: activeBatches } = await supabase.from("production_batches")
        .select("*", { count: "exact", head: true })
        .eq("status", "open")
        .eq("organization_id", user.organization_id);

    // 2. Pending & In-Analysis Samples (Filtered by role if applicable)
    const { count: pendingSamples } = await supabase.from("samples")
        .select("*", { count: "exact", head: true })
        .eq("status", "pending")
        .eq("organization_id", user.organization_id);

    const { count: inAnalysis } = await supabase.from("samples")
        .select("*", { count: "exact", head: true })
        .eq("status", "in_analysis")
        .eq("organization_id", user.organization_id);

    // 3. Compliance Rate
    const { data: recentSamples } = await supabase.from("samples")
        .select("status")
        .gte("created_at", sevenDaysAgo.toISOString())
        .eq("organization_id", user.organization_id);

    const totalRecent = recentSamples?.length || 0;
    const approvedRecent = recentSamples?.filter((s: { status: string }) => s.status === 'approved').length || 0;
    const complianceRate = totalRecent > 0 ? (approvedRecent / totalRecent) * 100 : 100;

    // 4. Role specific alerts
    let roleAlerts = 0;
    if (isMicro) {
        const { count: microPending } = await supabase.from("micro_results")
            .select("*", { count: "exact", head: true })
            .eq("status", "pending")
            .eq("organization_id", user.organization_id);
        roleAlerts = microPending || 0;
    } else if (isLab) {
        const { count: labPending } = await supabase.from("samples")
            .select("*", { count: "exact", head: true })
            .eq("status", "pending")
            .eq("organization_id", user.organization_id);
        roleAlerts = labPending || 0;
    }

    // 5. Expiring Soon
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    const { count: expiringSoon } = await supabase.from("raw_material_lots")
        .select("*", { count: "exact", head: true })
        .lte("expiry_date", thirtyDaysFromNow.toISOString())
        .eq("status", "approved")
        .eq("organization_id", user.organization_id);

    // 6. CIP Pending
    const { count: cipActive } = await supabase.from("cip_executions")
        .select("*", { count: "exact", head: true })
        .eq("status", "pending")
        .eq("organization_id", user.organization_id);

    // 7. Recent Deviations
    const { count: recentDeviations } = await supabase.from("ccp_readings")
        .select("*", { count: "exact", head: true })
        .eq("is_deviation", true)
        .gte("reading_time", sevenDaysAgo.toISOString())
        .eq("organization_id", user.organization_id);

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
    if (user.role === 'micro_analyst') {
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
            .limit(5);

        return microTasks?.map((t: any) => ({
            id: t.id,
            title: `Ler: ${t.samples?.code}`,
            subtitle: (t.qa_parameters as any)?.name,
            date: t.created_at,
            type: 'micro'
        })) || [];
    }

    if (user.role === 'lab_analyst') {
        const { data: labTasks } = await supabase.from("samples")
            .select(`
                id,
                code,
                status,
                created_at,
                sample_types (name)
            `)
            .eq("status", "pending")
            .eq("organization_id", user.organization_id)
            .limit(5);

        return labTasks?.map((t: any) => ({
            id: t.id,
            title: `Analisar: ${t.code}`,
            subtitle: (t.sample_types as any)?.name,
            date: t.created_at,
            type: 'lab'
        })) || [];
    }

    return [];
}

async function getRecentActivity(supabase: any, user: SafeUser) {
    const { data: samples } = await supabase.from("samples")
        .select("id, code, status, created_at")
        .eq("organization_id", user.organization_id)
        .eq("plant_id", user.plant_id)
        .order("created_at", { ascending: false })
        .limit(5);

    const { data: batches } = await supabase.from("production_batches")
        .select("id, code, status, start_date")
        .eq("organization_id", user.organization_id)
        .eq("plant_id", user.plant_id)
        .order("start_date", { ascending: false })
        .limit(5);

    return { recentSamples: samples || [], recentBatches: batches || [] };
}

import { ManagerOverview } from "@/components/dashboard/role-views/manager-overview";
import { AnalystView } from "@/components/dashboard/role-views/analyst-view";
import { OperatorView } from "@/components/dashboard/role-views/operator-view";
import { SystemOwnerView } from "@/components/dashboard/role-views/system-owner-view";

export default async function DashboardPage() {
    const supabase = await createClient();
    const user = await getSafeUser();

    // Redirect System Owner directly to SaaS console
    if (user.role === 'system_owner') {
        redirect("/saas");
    }

    const isSystemOwner = user.role === 'system_owner';
    const isAnalyst = ['lab_analyst', 'micro_analyst', 'analyst'].includes(user.role);
    const isManager = ['admin', 'qa_manager'].includes(user.role);
    const isOperator = !isAnalyst && !isManager && !isSystemOwner;

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

    // Parallel data fetching for standard roles
    const [stats, activity, assignments] = await (!isSystemOwner ? Promise.all([
        getStats(supabase, user),
        getRecentActivity(supabase, user),
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
            const { data: analyses } = await supabase
                .from("lab_analysis")
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
                .limit(10);

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
                    Olá, {user.full_name.split(' ')[0]}
                </h1>
                <p className="text-sm text-muted-foreground italic">
                    {isSystemOwner ? "Consola Global de Gestão SmartLab SaaS." :
                        isManager ? "Aqui está o resumo de conformidade e operação da planta." :
                            isAnalyst ? "Tens novas amostras aguardando análise no seu turno." :
                                "Pronto para registar novas atividades de produção."}
                </p>
            </header>

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


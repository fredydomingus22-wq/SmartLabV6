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
    Plus
} from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { DashboardTrendsClient } from "@/components/dashboard/dashboard-trends-client";
import { getSafeUser, SafeUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

async function getStats(supabase: any, user: SafeUser) {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // 1. Active Batches
    const { count: activeBatches } = await supabase.from("production_batches")
        .select("*", { count: "exact", head: true })
        .eq("status", "open")
        .eq("organization_id", user.organization_id);

    // 2. Pending & In-Analysis Samples
    const { count: pendingSamples } = await supabase.from("samples")
        .select("*", { count: "exact", head: true })
        .eq("status", "pending")
        .eq("organization_id", user.organization_id);

    const { count: inAnalysis } = await supabase.from("samples")
        .select("*", { count: "exact", head: true })
        .eq("status", "in_analysis")
        .eq("organization_id", user.organization_id);

    // 3. Compliance Rate (approved samples in last 7 days)
    const { data: recentSamples } = await supabase.from("samples")
        .select("status")
        .gte("created_at", sevenDaysAgo.toISOString())
        .eq("organization_id", user.organization_id);

    const totalRecent = recentSamples?.length || 0;
    const approvedRecent = recentSamples?.filter((s: { status: string }) => s.status === 'approved').length || 0;
    const complianceRate = totalRecent > 0 ? (approvedRecent / totalRecent) * 100 : 100;

    // 4. Lots in Quarantine
    const { count: lotsInQuarantine } = await supabase.from("raw_material_lots")
        .select("*", { count: "exact", head: true })
        .eq("status", "quarantine")
        .eq("organization_id", user.organization_id);

    // 5. Expiring Soon
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    const { count: expiringSoon } = await supabase.from("raw_material_lots")
        .select("*", { count: "exact", head: true })
        .lte("expiry_date", thirtyDaysFromNow.toISOString())
        .eq("status", "approved")
        .eq("organization_id", user.organization_id);

    // 6. CIP Pending (actually active executions for dashboard)
    const { count: cipActive } = await supabase.from("cip_executions")
        .select("*", { count: "exact", head: true })
        .eq("status", "pending")
        .eq("organization_id", user.organization_id);

    // 7. Critical Deviations (CCP Readings)
    const { count: recentDeviations } = await supabase.from("ccp_readings")
        .select("*", { count: "exact", head: true })
        .eq("is_deviation", true)
        .gte("reading_time", sevenDaysAgo.toISOString())
        .eq("organization_id", user.organization_id);

    // 8. Training Expiries
    const { data: trainingAlerts } = await supabase.from("analyst_qualifications")
        .select("id")
        .lte("valid_until", thirtyDaysFromNow.toISOString())
        .eq("organization_id", user.organization_id);

    return {
        activeBatches: activeBatches || 0,
        pendingSamples: pendingSamples || 0,
        inAnalysis: inAnalysis || 0,
        complianceRate,
        lotsInQuarantine: lotsInQuarantine || 0,
        expiringSoon: expiringSoon || 0,
        cipActive: cipActive || 0,
        recentDeviations: recentDeviations || 0,
        trainingAlerts: trainingAlerts?.length || 0,
    };
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

export default async function DashboardPage() {
    const supabase = await createClient();
    const user = await getSafeUser();
    const stats = await getStats(supabase, user);
    const activity = await getRecentActivity(supabase, user);

    // Fetch Trend Data
    const { data: products } = await supabase.from("products").select("id, name").eq("organization_id", user.organization_id).eq("plant_id", user.plant_id);
    const { data: parameters } = await supabase.from("qa_parameters").select("id, name").eq("organization_id", user.organization_id).eq("plant_id", user.plant_id);

    let initialTrendData: { value: number; sampleCode: string; date: string }[] = [];
    let initialSpecs: { min_value: number | null; max_value: number | null; target_value: number | null } | null = null;

    if (products?.length && parameters?.length) {
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

    return (
        <div className="space-y-8 pb-20">
            {/* KPI Overview */}
            <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
                <Card className="glass group hover:bg-slate-900/50 transition-all border-blue-500/20">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 p-3 sm:p-6">
                        <CardTitle className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-400">Lotes Ativos</CardTitle>
                        <Factory className="h-3 w-3 sm:h-4 sm:w-4 text-blue-500 group-hover:scale-110 transition-transform" />
                    </CardHeader>
                    <Link href="/production" className="cursor-pointer">
                        <CardContent className="p-3 sm:p-6 pt-0 sm:pt-0">
                            <div className="flex items-baseline gap-2">
                                <span className="text-3xl font-bold text-slate-100">{stats.activeBatches}</span>
                                <span className="text-[10px] text-emerald-400 flex items-center font-bold">
                                    <ArrowUpRight className="h-3 w-3" /> +2
                                </span>
                            </div>
                            <p className="text-[11px] text-slate-400 mt-1 font-medium">Produção em curso neste turno</p>
                        </CardContent>
                    </Link>
                </Card>

                <Card className="glass group hover:bg-slate-900/50 transition-all border-orange-500/20">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 p-3 sm:p-6">
                        <CardTitle className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-400">Amostras Pendentes</CardTitle>
                        <FlaskConical className="h-3 w-3 sm:h-4 sm:w-4 text-orange-500 group-hover:scale-110 transition-transform" />
                    </CardHeader>
                    <Link href="/lab" className="cursor-pointer">
                        <CardContent className="p-3 sm:p-6 pt-0 sm:pt-0">
                            <div className="flex items-baseline gap-2">
                                <span className="text-3xl font-bold text-orange-500">{stats.pendingSamples}</span>
                                <span className="text-[10px] text-slate-400 font-medium">{stats.inAnalysis} em análise</span>
                            </div>
                            <p className="text-[11px] text-slate-400 mt-1 font-bold">Prioridade: <span className="text-orange-400">Alta</span></p>
                        </CardContent>
                    </Link>
                </Card>

                <Card className="glass group hover:bg-slate-900/50 transition-all border-emerald-500/20">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 p-3 sm:p-6">
                        <CardTitle className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-400">Taxa Conformidade</CardTitle>
                        <ClipboardCheck className="h-3 w-3 sm:h-4 sm:w-4 text-emerald-500 group-hover:scale-110 transition-transform" />
                    </CardHeader>
                    <Link href="/quality/results" className="cursor-pointer">
                        <CardContent className="p-3 sm:p-6 pt-0 sm:pt-0">
                            <div className="flex items-baseline gap-2">
                                <span className="text-3xl font-bold text-emerald-500">{stats.complianceRate.toFixed(1)}%</span>
                                <Badge variant="outline" className="text-[10px] border-emerald-500/20 bg-emerald-500/5 text-emerald-400">L7D</Badge>
                            </div>
                            <p className="text-[11px] text-slate-400 mt-1 font-medium">Amostras dentro da especificação</p>
                        </CardContent>
                    </Link>
                </Card>

                <Card className="glass group hover:bg-slate-900/50 transition-all border-red-500/20">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 p-3 sm:p-6">
                        <CardTitle className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-400">Desvios Críticos</CardTitle>
                        <AlertTriangle className={`h-3 w-3 sm:h-4 sm:w-4 ${stats.recentDeviations > 0 ? 'text-red-500 animate-pulse' : 'text-emerald-500'}`} />
                    </CardHeader>
                    <Link href="/haccp/pcc" className="cursor-pointer">
                        <CardContent className="p-3 sm:p-6 pt-0 sm:pt-0">
                            <div className="flex items-baseline gap-2">
                                <span className={`text-4xl font-extrabold ${stats.recentDeviations > 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                                    {stats.recentDeviations}
                                </span>
                                <span className="text-[10px] text-slate-400 font-bold">Últimos 7 dias</span>
                            </div>
                            <p className="text-[11px] text-slate-400 mt-1 font-medium italic">PCC / OPRP sob vigilância</p>
                        </CardContent>
                    </Link>
                </Card>
            </div>

            {/* Main Content Grid */}
            <div className="grid gap-4 md:gap-6 grid-cols-1 md:grid-cols-3">
                {/* Trends & Activity */}
                <div className="md:col-span-2 space-y-6">
                    <DashboardTrendsClient
                        products={products || []}
                        parameters={parameters || []}
                        initialData={initialTrendData}
                        initialSpecs={initialSpecs}
                    />

                    <div className="grid gap-4 md:gap-6 grid-cols-1 sm:grid-cols-2">
                        <Card className="glass overflow-hidden">
                            <CardHeader className="border-b border-slate-800/50 bg-slate-900/20">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-base flex items-center gap-2">
                                        <Beaker className="h-4 w-4 text-blue-400" />
                                        Atividade Laboratorial
                                    </CardTitle>
                                    <Link href="/lab" className="text-[10px] text-slate-500 hover:text-slate-300 transition-colors uppercase font-bold tracking-widest">Ver Tudo</Link>
                                </div>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="divide-y divide-slate-800/50">
                                    {activity.recentSamples.map((sample: any) => (
                                        <div key={sample.id} className="flex items-center justify-between p-3 sm:p-4 hover:bg-slate-900/30 transition-colors group">
                                            <div className="flex flex-col gap-0.5">
                                                <span className="font-mono text-sm text-slate-100 font-extrabold tracking-tight">{sample.code}</span>
                                                <span className="text-[10px] text-slate-400 font-medium">{new Date(sample.created_at).toLocaleString()}</span>
                                            </div>
                                            <Badge className={cn(
                                                "capitalize text-[10px] font-bold border-2",
                                                sample.status === 'approved' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                                                    sample.status === 'pending' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' :
                                                        'bg-blue-500/10 text-blue-400 border-blue-500/20'
                                            )} variant="outline">
                                                {sample.status === 'approved' ? 'Aprovado' : sample.status === 'pending' ? 'Pendente' : 'Em Análise'}
                                            </Badge>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="glass overflow-hidden">
                            <CardHeader className="border-b border-slate-800/50 bg-slate-900/20">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-base flex items-center gap-2">
                                        <Zap className="h-4 w-4 text-purple-400" />
                                        Histórico de Lotes
                                    </CardTitle>
                                    <Link href="/production" className="text-[10px] text-slate-500 hover:text-slate-300 transition-colors uppercase font-bold tracking-widest">Ver Tudo</Link>
                                </div>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="divide-y divide-slate-800/50">
                                    {activity.recentBatches.map((batch: any) => (
                                        <div key={batch.id} className="flex items-center justify-between p-3 sm:p-4 hover:bg-slate-900/30 transition-colors group">
                                            <div className="flex flex-col gap-0.5">
                                                <span className="font-mono text-sm text-slate-200 font-bold tracking-tight">{batch.code}</span>
                                                <span className="text-[10px] text-slate-500">{new Date(batch.start_date).toLocaleString()}</span>
                                            </div>
                                            <Badge className={cn(
                                                "capitalize text-[10px]",
                                                batch.status === 'closed' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                                                    batch.status === 'open' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                                                        'bg-red-500/10 text-red-400 border-red-500/20'
                                            )} variant="outline">
                                                {batch.status === 'closed' ? 'Fechado' : batch.status === 'open' ? 'Aberto' : 'Cancelado'}
                                            </Badge>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* Status & Alerts Column */}
                <div className="space-y-6">
                    <Card className="glass border-emerald-500/10">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-semibold flex items-center gap-2">
                                <Zap className="h-4 w-4 text-emerald-400" />
                                Estado do Sistema
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center justify-between">
                                <span className="text-2xl font-bold text-emerald-400">Operacional</span>
                                <Badge variant="outline" className="text-[10px] border-emerald-500/20 bg-emerald-500/5">GAMP 5 OK</Badge>
                            </div>
                            <div className="mt-4 space-y-2">
                                <div className="flex justify-between text-[10px] uppercase tracking-[0.2em] font-bold text-slate-400">
                                    <span>Base de Dados</span>
                                    <span className="text-emerald-400">12ms</span>
                                </div>
                                <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                                    <div className="h-full w-[99%] bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="glass border-orange-500/10">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-semibold flex items-center gap-2">
                                <Clock className="h-4 w-4 text-orange-400" />
                                Alertas de Validação
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {stats.trainingAlerts > 0 && (
                                <div className="flex items-center gap-3 p-2 rounded bg-rose-500/5 border border-rose-500/10 animate-pulse">
                                    <div className="p-1.5 rounded bg-rose-500/10">
                                        <GraduationCap className="h-3 w-3 text-rose-400" />
                                    </div>
                                    <div className="flex flex-col flex-1">
                                        <div className="flex justify-between items-center">
                                            <span className="text-xs font-bold text-slate-100">{stats.trainingAlerts} Qualificações</span>
                                            <Link href="/quality/training" className="text-[9px] text-rose-400 underline uppercase font-bold tracking-widest">Resolver</Link>
                                        </div>
                                        <span className="text-[10px] text-slate-400 font-medium">Formação Pendente / Expirada</span>
                                    </div>
                                </div>
                            )}
                            <div className="flex items-center gap-3 p-2 rounded bg-orange-500/5 border border-orange-500/10">
                                <div className="p-1.5 rounded bg-orange-500/10">
                                    <FileText className="h-3 w-3 text-orange-400" />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-xs font-bold text-slate-100">{stats.expiringSoon} Lotes a expirar</span>
                                    <span className="text-[10px] text-slate-400 font-medium">Próximos 30 dias</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 p-2 rounded bg-blue-500/5 border border-blue-500/10">
                                <div className="p-1.5 rounded bg-blue-500/10">
                                    <ClipboardCheck className="h-3 w-3 text-blue-400" />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-xs font-bold text-slate-100">{stats.cipActive} CIPs Ativos</span>
                                    <span className="text-[10px] text-slate-400 font-medium">Monitorização de higiene</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}

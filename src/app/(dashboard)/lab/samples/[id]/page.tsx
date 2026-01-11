
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, FlaskConical, CheckCircle, Clock, User, MapPin, XCircle, Sparkles, AlertTriangle, ShieldAlert, TestTube2, Info } from "lucide-react";
import Link from "next/link";
import { pt } from "date-fns/locale";
import { AnalysisForm } from "./analysis-form";
import { ValidateDialog } from "./validate-dialog";
import { RealtimeAIBadge } from "@/components/lab/realtime-ai-badge";
import { PDFDownloadButton } from "@/components/reports/PDFDownloadButton";
import { CertificateOfAnalysis } from "@/components/reports/templates/CertificateOfAnalysis";
import { cn } from "@/lib/utils";
import { AiInsightsCard } from "@/components/lab/ai-insights-card";
import { reviewSampleAction } from "@/app/actions/lab_modules/approvals";
import { getSafeUser } from "@/lib/auth.server";
import { SampleStepper } from "./_components/sample-stepper";
import { ReleaseDialog } from "./_components/release-dialog";

export const dynamic = "force-dynamic";

interface PageProps {
    params: Promise<{ id: string }>;
}

interface Analysis {
    id: string;
    value_numeric: number | null;
    value_text: string | null;
    is_conforming: boolean | null;
    notes: string | null;
    analyzed_by: string | null;
    analyzed_at: string | null;
    qa_parameter_id: string;
    analysis_method: string | null;
    equipment_id: string | null;
    status: 'pending' | 'started' | 'completed' | 'reviewed' | 'validated' | 'invalidated';
    parameter: { id: string; name: string; code: string; unit: string | null } | null;
    analyst?: { full_name: string } | null;
    equipment?: { id: string; name: string; code: string; next_calibration_date: string; status: string } | null;
    final_value?: string | number | null;
    ai_insight?: { status: 'approved' | 'warning' | 'blocked' | 'info'; message: string; confidence: number } | null;
}

export default async function SampleDetailPage({ params }: PageProps) {
    const { id } = await params;
    const supabase = await createClient();

    const user = await getSafeUser();
    const userRole = user.role;

    // Build the query with role-based filtering for lab_analysis
    let sampleQuery = supabase
        .from("samples")
        .select(`
            id,
            code,
            collection_date,
            collected_at: collection_date,
            description,
            organization_id,
            status,
            collected_by,
            validated_by,
            validated_at,
            notes,
            attachment_url,
            sample_type_id,
            production_batch_id,
            intermediate_product_id,
            spec_version_id,
            type: sample_types(id, name, code),
            batch: production_batches(
                id, code, product_id,
                product: products(id, name, sku)
            ),
            intermediate_product: intermediate_products(
                id, code, status,
                tank_id,
                product_id,
                batch: production_batches(
                    id, code,
                    product: products(id, name, sku) 
                )
            ),
            sampling_point: sampling_points(id, name, code, location),
            lab_analysis(
                id,
                value_numeric,
                value_text,
                is_conforming,
                analyzed_by,
                analyzed_at,
                status,
                notes,
                qa_parameter_id,
                parameter: qa_parameters!inner(
                    id, name, code, unit, category
                ),
                analyst: user_profiles!lab_analysis_analyzed_by_profile_fkey(full_name),
                equipment: equipments(id, name, code, next_calibration_date, status)
            )
        `)
        .eq("id", id);

    // Apply status-based filtering or other root-level filters here
    // CRITICAL: We DO NOT filter by nested resource categories (e.g. lab_analysis.parameter.category) 
    // in the root .single() query, as this causes PostgREST row multiplication and fails the .single() constraint.
    // Filtering is handled in the JS layer below.

    const { data: sample, error: sampleError } = await sampleQuery.single();

    if (sampleError || !sample) {
        console.error("Sample fetch error:", {
            error: sampleError,
            message: sampleError?.message,
            code: sampleError?.code,
            id
        });
        notFound();
    }

    const allAnalyses = (sample as any).lab_analysis || [];

    // Apply role-based filtering in application layer to prevent query multiplication
    const analysesRaw = allAnalyses.filter((a: any) => {
        const category = Array.isArray(a.parameter) ? a.parameter[0]?.category : a.parameter?.category;
        if (userRole === 'lab_analyst') return category !== 'microbiological';
        if (userRole === 'micro_analyst') return category === 'microbiological';
        return true;
    });

    // Fetch AI Insights
    const analysisIds = analysesRaw.map((a: any) => a.id);
    let insights: any[] = [];
    if (analysisIds.length > 0) {
        const { data } = await supabase
            .from("ai_insights")
            .select("*")
            .eq("entity_type", "lab_analysis")
            .in("entity_id", analysisIds);
        insights = data || [];
    }

    // Fetch Sample Global Insight
    const { data: sampleInsightData } = await supabase
        .from("ai_insights")
        .select("*")
        .eq("entity_type", "sample")
        .eq("entity_id", sample.id)
        .single();

    const sampleInsight = sampleInsightData || null;

    const insightsMap = new Map(insights.map(i => [i.entity_id, i]));

    // Normalize analyses to ensure parameter and analyst are objects (not arrays)
    const normalizedAnalyses: Analysis[] = analysesRaw.map((a: any) => {
        const parameter = Array.isArray(a.parameter) ? (a.parameter[0] || null) : (a.parameter || null);
        const analyst = Array.isArray(a.analyst) ? (a.analyst[0] || null) : (a.analyst || null);
        const equipment = Array.isArray(a.equipment) ? (a.equipment[0] || null) : (a.equipment || null);
        const ai_insight = insightsMap.get(a.id) || null;

        // Explicitly map properties to ensure they are available to the UI
        return {
            ...a,
            parameter,
            analyst,
            equipment,
            ai_insight,
            // Ensure numeric values are prioritized if they exist
            final_value: a.value_numeric !== null && a.value_numeric !== undefined ? a.value_numeric : a.value_text
        };
    });

    // Fetch user names separately
    const { data: collectedUser } = sample.collected_by
        ? await supabase.from("user_profiles").select("full_name").eq("id", sample.collected_by).single()
        : { data: null };
    const collectedByName = collectedUser?.full_name || "Unknown";

    const { data: validatedUser } = sample.validated_by
        ? await supabase.from("user_profiles").select("full_name").eq("id", sample.validated_by).single()
        : { data: null };
    const validatedByName = validatedUser?.full_name || "Unknown";

    // Resolve Product Authority based on Sample Type (Strict Scoping)
    // CORRECTED LOGIC: FP samples ALWAYS use Batch Product. IP samples use IP Product.
    const sampleType = Array.isArray(sample.type) ? sample.type[0] : sample.type;
    const sampleTypeCode = sampleType?.code || "";
    const isFinishedProduct = sampleTypeCode.startsWith("FP");
    const isIntermediate = sampleTypeCode.startsWith("IP") || (!!sample.intermediate_product_id && !isFinishedProduct);


    const batchData: any = Array.isArray(sample.batch) ? sample.batch[0] : sample.batch;
    const ipData: any = Array.isArray(sample.intermediate_product) ? sample.intermediate_product[0] : sample.intermediate_product;
    const samplingPointData: any = Array.isArray(sample.sampling_point) ? sample.sampling_point[0] : sample.sampling_point;

    // AI Status constant for UI
    const aiStatus = sampleInsight?.status;

    // Level 2 - Technical Storage Info (Separate fetch due to missing DB FK)
    const { data: ipEquipment } = ipData?.tank_id
        ? await supabase.from("equipments").select("id, name, code").eq("id", ipData.tank_id).single()
        : { data: null };

    let productId = null;
    if (isFinishedProduct) {
        productId = batchData?.product_id || (Array.isArray(batchData?.product) ? batchData?.product[0]?.id : batchData?.product?.id);
    } else if (isIntermediate) {
        productId = ipData?.product_id || batchData?.product_id;
    } else {
        productId = batchData?.product_id;
    }

    let specs: Record<string, {
        min_value?: number;
        max_value?: number;
        target_value?: number;
        haccp?: { is_pcc?: boolean; category?: string }
    }> = {};

    // Fetch product specs strictly filtered by product context
    let specQuery = supabase
        .from("product_specifications")
        .select(`
            qa_parameter_id, 
            min_value, 
            max_value, 
            target_value, 
            sample_type_id,
            product_id,
            haccp_hazard_id,
            haccp_hazard:haccp_hazards(is_pcc, hazard_category),
            parameter:qa_parameters!inner(category)
        `)
        .eq("status", "active");

    if (userRole === 'lab_analyst') {
        specQuery = specQuery.neq('parameter.category', 'microbiological');
    } else if (userRole === 'micro_analyst') {
        specQuery = specQuery.eq('parameter.category', 'microbiological');
    }

    if (productId) {
        // Path A: Product-guided spec
        specQuery = specQuery
            .eq("product_id", productId)
            .or(`sample_type_id.eq.${sample.sample_type_id},sample_type_id.is.null`);
    } else {
        // Path B: General spec (Environment/Plant)
        specQuery = specQuery.eq("sample_type_id", sample.sample_type_id);
    }

    const { data: productSpecs } = await specQuery;

    productSpecs?.forEach((spec: any) => {
        // Preference: Specific Product Spec > Global Spec for that Sample Type
        const existing = specs[spec.qa_parameter_id];
        if (!existing || (spec.product_id === productId)) {
            specs[spec.qa_parameter_id] = {
                ...spec,
                haccp: spec.haccp_hazard_id ? {
                    is_pcc: spec.haccp_hazard?.is_pcc,
                    category: spec.haccp_hazard?.hazard_category
                } : undefined
            };
        }
    });

    // Filter analyses strictly by those that have an active specification
    // This prevents irrelevant parameters from cluttering the execution form
    const filteredAnalyses = normalizedAnalyses.filter(analysis => {
        const hasSpec = !!specs[analysis.qa_parameter_id];
        // For auditability: if it was already analyzed, we show it even if the spec was deleted
        const hasValue = analysis.value_numeric !== null || analysis.value_text !== null;
        return hasSpec || hasValue;
    });

    const getStatusBadge = (status: string) => {
        const variants: Record<string, any> = {
            draft: "outline",
            registered: "active",
            collected: "active",
            in_analysis: "in_analysis",
            under_review: "under_review",
            approved: "approved",
            rejected: "rejected",
            released: "approved",
            archived: "outline",
        };
        const label: Record<string, string> = {
            draft: "Rascunho",
            registered: "Registada",
            collected: "Colhida",
            in_analysis: "Em Análise",
            under_review: "Em Revisão",
            approved: "Aprovado",
            rejected: "Rejeitado",
            released: "Libertado",
            archived: "Arquivado",
        };
        return <Badge variant={variants[status] || "outline"} className="font-bold tracking-tight px-3 py-1 rounded-full border shadow-sm">{label[status] || status}</Badge>;
    };

    const isLocked = ['under_review', 'approved', 'rejected', 'released', 'archived'].includes(sample.status);
    const isValidated = ['approved', 'rejected', 'released', 'archived'].includes(sample.status) || !!sample.validated_at;
    const canValidate = filteredAnalyses?.every(a => a.value_numeric !== null || a.value_text !== null);


    const riskConfig: Record<string, { label: string; color: string; bg: string; icon: any }> = {
        blocked: { label: "Crítico", color: "text-rose-500", bg: "bg-rose-500/20", icon: ShieldAlert },
        warning: { label: "Atenção", color: "text-amber-500", bg: "bg-amber-500/20", icon: ShieldAlert },
        approved: { label: "Seguro", color: "text-emerald-500", bg: "bg-emerald-500/20", icon: CheckCircle },
        info: { label: "Info", color: "text-blue-500", bg: "bg-blue-500/20", icon: Info },
    };

    return (
        <div className="container py-8 space-y-6">
            {/* Premium Header Container */}
            <div className="glass p-8 rounded-[2.5rem] border-none shadow-2xl bg-gradient-to-br from-blue-500/10 via-slate-900/50 to-transparent relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 blur-[100px] -mr-32 -mt-32 rounded-full" />

                <div className="space-y-6 relative z-10">
                    <SampleStepper currentStatus={sample.status} className="mb-2" />

                    <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-8 relative z-10">
                        <div className="space-y-4">
                            <Link href="/lab">
                                <Button variant="ghost" size="sm" className="pl-0 text-slate-400 hover:text-white -ml-2 mb-2 group">
                                    <ArrowLeft className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform" />
                                    Voltar ao Laboratório
                                </Button>
                            </Link>

                            <div className="flex flex-col gap-4">
                                <div className="flex items-center gap-4">
                                    <div className="p-4 rounded-3xl bg-blue-500/20 border border-blue-500/30 shadow-inner">
                                        <FlaskConical className="h-8 w-8 text-blue-400" />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-3 mb-1">
                                            <h1 className="text-4xl sm:text-5xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400">
                                                {sample.code}
                                            </h1>
                                            {getStatusBadge(sample.status)}
                                            {aiStatus && (
                                                <div className={cn("px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-white/5", riskConfig[aiStatus].bg, riskConfig[aiStatus].color)}>
                                                    {(() => {
                                                        const Icon = riskConfig[aiStatus].icon;
                                                        return <Icon className="h-3 w-3 inline mr-1" />;
                                                    })()}
                                                    IA: {riskConfig[aiStatus].label}
                                                </div>
                                            )}
                                        </div>
                                        <p className="text-lg text-slate-400 font-medium tracking-wide">
                                            {sampleType?.name || "Tipo Desconhecido"}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col items-end gap-4">
                            <div className="flex flex-wrap justify-end gap-3">
                                {/* FSM: Review Action */}
                                {sample.status === 'in_analysis' && (
                                    <form action={async () => {
                                        "use server";
                                        await reviewSampleAction(sample.id);
                                    }}>
                                        <Button
                                            type="submit"
                                            className="bg-purple-600 hover:bg-purple-700 text-white shadow-lg shadow-purple-500/20"
                                            disabled={!canValidate}
                                        >
                                            <CheckCircle className="h-4 w-4 mr-2" />
                                            Submeter p/ Revisão Técnica
                                        </Button>
                                    </form>
                                )}

                                {/* Decision Dialog for Technical Review (Level 2) */}
                                {sample.status === 'under_review' && (
                                    <ValidateDialog sampleId={sample.id} sampleCode={sample.code} />
                                )}

                                {/* Decision Dialog for Quality Release (Level 3) */}
                                {sample.status === 'approved' && (
                                    <ReleaseDialog sampleId={sample.id} sampleCode={sample.code} />
                                )}

                                {sample.status === 'released' ? (
                                    <>
                                        <PDFDownloadButton
                                            document={
                                                <CertificateOfAnalysis
                                                    sample={{
                                                        id: sample.id,
                                                        sample_code: sample.code || 'N/A',
                                                        product_name: batchData?.product?.name || (Array.isArray(batchData?.product) ? batchData?.product[0]?.name : 'Unknown Product'),
                                                        batch_code: batchData?.code || 'N/A',
                                                        collection_date: sample.collected_at ? format(new Date(sample.collected_at), "dd/MM/yyyy HH:mm") : 'N/A',
                                                        description: sample.description || undefined
                                                    }}
                                                    analyses={filteredAnalyses.map(a => ({
                                                        parameter_name: a.parameter?.name || 'Unknown Parameter',
                                                        method_name: a.parameter?.code,
                                                        result: a.final_value?.toString() || 'Pending',
                                                        unit: a.parameter?.unit || '',
                                                        min_limit: specs[a.qa_parameter_id]?.min_value,
                                                        max_limit: specs[a.qa_parameter_id]?.max_value,
                                                        status: a.is_conforming === true ? 'compliant' : a.is_conforming === false ? 'non_compliant' : 'pending'
                                                    }))}
                                                    organization={{
                                                        name: "SmartLab Enterprise",
                                                        address: "123 Quality Street, Innovation City",
                                                    }}
                                                    approver={{
                                                        name: validatedByName,
                                                        role: "Quality Manager"
                                                    }}
                                                />
                                            }
                                            fileName={`CoA_${sample.code || sample.id}.pdf`}
                                            label="Certificado"
                                        />
                                        <div className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 font-bold shadow-lg shadow-emerald-500/10">
                                            <CheckCircle className="h-5 w-5" />
                                            <span>Validado</span>
                                        </div>
                                    </>
                                ) : null}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Error Display for Debugging */}
            {
                sampleError && (
                    <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs font-mono">
                        <p className="font-bold mb-1 underline">FETCH ERROR:</p>
                        <pre>{JSON.stringify(sampleError, null, 2)}</pre>
                    </div>
                )
            }

            {/* Sample Info Cards - Premium Grid */}
            <div className="grid gap-6 md:grid-cols-3">
                <div className="glass p-6 rounded-3xl border-slate-800/50 hover:bg-slate-900/40 transition-all group relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 blur-[50px] -mr-16 -mt-16 rounded-full group-hover:bg-blue-500/10 transition-colors" />
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-4 text-blue-400">
                            <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/20">
                                <FlaskConical className="h-4 w-4" />
                            </div>
                            <span className="text-xs font-black uppercase tracking-widest">Produto / Batch</span>
                        </div>
                        <div className="space-y-1">
                            <div className="font-mono text-2xl font-bold text-slate-100 tracking-tight">
                                {batchData?.code || "—"}
                            </div>
                            <div className="text-sm text-slate-400 font-medium truncate">
                                {batchData?.product?.name || (Array.isArray(batchData?.product) ? batchData?.product[0]?.name : "Sem Produto Associado")}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="glass p-6 rounded-3xl border-slate-800/50 hover:bg-slate-900/40 transition-all group relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 blur-[50px] -mr-16 -mt-16 rounded-full group-hover:bg-purple-500/10 transition-colors" />
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-4 text-purple-400">
                            <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/20">
                                <MapPin className="h-4 w-4" />
                            </div>
                            <span className="text-xs font-black uppercase tracking-widest">Ponto de Amostragem</span>
                        </div>
                        <div className="space-y-1">
                            <div className="text-xl font-bold text-slate-100">
                                {samplingPointData?.name || "Geral"}
                            </div>
                            <div className="text-sm text-slate-400 font-medium">
                                {samplingPointData?.location || "Localização N/D"}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="glass p-6 rounded-3xl border-slate-800/50 hover:bg-slate-900/40 transition-all group relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-[50px] -mr-16 -mt-16 rounded-full group-hover:bg-emerald-500/10 transition-colors" />
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-4 text-emerald-400">
                            <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                                <User className="h-4 w-4" />
                            </div>
                            <span className="text-xs font-black uppercase tracking-widest">Colheita</span>
                        </div>
                        <div className="space-y-1">
                            <div className="text-lg font-bold text-slate-100">
                                {collectedByName}
                            </div>
                            <div className="flex items-center gap-2 text-sm text-slate-400 font-medium">
                                <Clock className="h-3.5 w-3.5 opacity-70" />
                                {sample.collected_at
                                    ? format(new Date(sample.collected_at), "d MMM, HH:mm", { locale: pt })
                                    : "—"
                                }
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Intermediate Product Info */}
            {
                sample.intermediate_product && (
                    <div className="glass p-5 rounded-2xl border-slate-800/60 bg-slate-900/30 flex flex-col sm:flex-row sm:items-center gap-6 animate-in fade-in slide-in-from-bottom-2 duration-700 ring-1 ring-white/5">
                        <div className="flex items-center gap-4">
                            <div className="px-3 py-1 rounded-lg bg-blue-500/10 border border-blue-500/20 text-[10px] font-black uppercase tracking-widest text-blue-400">
                                Produto Intermédio
                            </div>
                            <div className="flex flex-col">
                                <div className="font-mono text-slate-100 font-bold text-lg leading-none mb-1">
                                    {ipData?.code}
                                </div>
                                <div className="text-[10px] text-slate-500 font-black uppercase tracking-widest">
                                    {ipData?.batch?.product?.name || "Produto N/D"}
                                </div>
                            </div>
                        </div>

                        {ipEquipment && (
                            <div className="sm:ml-auto flex items-center gap-3 text-sm">
                                <div className="p-2 rounded-xl bg-slate-800/50 border border-slate-700/50">
                                    <MapPin className="h-4 w-4 text-slate-400" />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest leading-none mb-1">Armazenado em</span>
                                    <div className="flex items-center gap-2">
                                        <span className="text-slate-100 font-bold">{ipEquipment.name}</span>
                                        <span className="font-mono text-xs text-slate-500">({ipEquipment.code})</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="flex items-center gap-3">
                            <Badge className="bg-slate-800 text-slate-300 border-slate-700 py-1 px-3 rounded-lg text-[10px] font-black uppercase tracking-widest">
                                {ipData?.status}
                            </Badge>
                        </div>
                    </div>
                )
            }

            {/* Debug Info (Visible only for investigation) */}
            <div className="text-[10px] text-muted-foreground opacity-50 font-mono">
                DEBUG: Analyses Count: {filteredAnalyses?.length || 0} |
                Sample User ID: {sample.collected_by || "—"} |
                Org ID: {sample.organization_id || "—"}
            </div>

            {/* AI Insights Summary */}
            <AiInsightsCard insights={insights} />

            {/* Technical Resume Section */}
            <Card className="bg-slate-950 border-slate-800 shadow-2xl relative overflow-hidden ring-1 ring-white/10">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 via-cyan-500 to-emerald-500" />
                <CardHeader className="bg-slate-900/80 py-6 border-b border-slate-800 backdrop-blur-md">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                            <CardTitle className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-3">
                                <Sparkles className="h-5 w-5 text-amber-400" />
                                Technical Resume
                            </CardTitle>
                            <CardDescription className="text-slate-400 text-sm mt-1">Comprehensive analytical summary of results</CardDescription>
                        </div>
                        <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/20 font-mono px-3 py-1 text-xs self-start sm:self-center">
                            ID: {sample.id.split('-')[0].toUpperCase()}
                        </Badge>
                    </div>
                </CardHeader>
                <CardContent className="pt-8 pb-8">
                    {filteredAnalyses && filteredAnalyses.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                            {filteredAnalyses.map(a => {
                                const param = a.parameter;
                                const spec = param ? specs[param.id] : null;
                                const isValuePresent = a.final_value !== null && a.final_value !== undefined;
                                const displayValue = a.final_value;

                                return (
                                    <div key={a.id} className="relative p-5 rounded-2xl border bg-slate-900/60 border-slate-800 shadow-lg hover:shadow-xl hover:bg-slate-900/80 transition-all group overflow-hidden ring-1 ring-white/5">
                                        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" />

                                        <div className="flex justify-between items-start mb-4 relative z-10">
                                            <div className="space-y-1.5">
                                                <p className="text-[10px] font-black text-blue-400 uppercase tracking-[0.2em]">{param?.code}</p>
                                                <h4 className="font-bold text-base sm:text-lg text-slate-100 leading-tight pr-8">{param?.name}</h4>
                                            </div>
                                            <div className="absolute top-0 right-0 flex gap-1.5">
                                                {/* AI Insight Badge (Realtime) */}
                                                <RealtimeAIBadge
                                                    analysisId={a.id}
                                                    initialInsight={a.ai_insight || null}
                                                />
                                                {a.is_conforming === true && <div className="bg-emerald-500/10 p-1.5 rounded-full ring-1 ring-emerald-500/20"><CheckCircle className="h-4 w-4 text-emerald-400" /></div>}
                                                {a.is_conforming === false && <div className="bg-rose-500/10 p-1.5 rounded-full ring-1 ring-rose-500/20"><XCircle className="h-4 w-4 text-rose-400" /></div>}
                                                {a.is_conforming === null && isValuePresent && <div className="bg-amber-500/10 p-1.5 rounded-full ring-1 ring-amber-500/20"><Clock className="h-4 w-4 text-amber-400" /></div>}
                                            </div>
                                        </div>

                                        <div className="mt-3 flex flex-col gap-4 relative z-10">
                                            <div className="flex items-baseline gap-2">
                                                <span className={`text-2xl sm:text-3xl font-black tracking-tighter ${a.is_conforming === false ? 'text-rose-400' : 'text-white'}`}>
                                                    {displayValue ?? "—"}
                                                </span>
                                                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                                                    {param?.unit}
                                                </span>
                                            </div>

                                            <div className="flex flex-wrap items-center gap-2 py-2">
                                                {spec && (
                                                    <div className="flex flex-wrap gap-2 py-1.5 px-3 bg-slate-950/60 rounded-lg border border-slate-800/60">
                                                        {spec.min_value !== undefined && (
                                                            <div className="text-[10px] text-slate-400 font-medium">
                                                                Min: <span className="text-slate-200 font-bold">{spec.min_value}</span>
                                                            </div>
                                                        )}
                                                        {spec.target_value !== undefined && (
                                                            <div className="text-[10px] text-blue-400 font-medium italic">
                                                                Target: <span className="font-bold">{spec.target_value}</span>
                                                            </div>
                                                        )}
                                                        {spec.max_value !== undefined && (
                                                            <div className="text-[10px] text-slate-400 font-medium">
                                                                Max: <span className="text-slate-200 font-bold">{spec.max_value}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                                {spec?.haccp && (
                                                    <div className="flex items-center">
                                                        {spec.haccp.is_pcc ? (
                                                            <Badge className="bg-red-500/20 text-red-400 border-red-500/30 text-[9px] px-1.5 py-0.5 hover:bg-red-500/30">
                                                                CCP
                                                            </Badge>
                                                        ) : (
                                                            <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 text-[9px] px-1.5 py-0.5 hover:bg-blue-500/30">
                                                                OPRP
                                                            </Badge>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {(a.analyzed_at || a.analyst) && (
                                            <div className="mt-5 pt-3 border-t border-slate-800/60 flex flex-col gap-1.5 relative z-10">
                                                <div className="flex items-center gap-2 text-[10px] font-bold tracking-tight uppercase">
                                                    <User className="h-3 w-3 text-blue-500" />
                                                    <span className="text-slate-300">
                                                        {a.analyst?.full_name || (a.analyzed_by ? `ID: ${String(a.analyzed_by).substring(0, 8).toUpperCase()} ` : "Not signed")}
                                                    </span>
                                                </div>
                                                {a.analyzed_at && (
                                                    <div className="flex items-center gap-2 text-[10px] text-slate-500 font-medium ml-0.5">
                                                        <Clock className="h-2.5 w-2.5" />
                                                        {format(new Date(a.analyzed_at), "dd MMM yyyy, HH:mm", { locale: pt })}
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* Analysis Notes / Justification */}
                                        {a.notes && (
                                            <div className="mt-4 p-3 bg-amber-500/5 border border-amber-500/20 rounded-lg relative z-10">
                                                <div className="flex items-start gap-2">
                                                    <AlertTriangle className="h-3 w-3 text-amber-500 mt-0.5 shrink-0" />
                                                    <p className="text-[10px] text-slate-300 italic leading-relaxed">
                                                        "{a.notes}"
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="py-16 text-center text-slate-500 italic bg-slate-900/30 rounded-2xl border border-dashed border-slate-800 mx-4">
                            <TestTube2 className="h-10 w-10 mx-auto mb-3 opacity-20" />
                            No analysis data available to resume.
                        </div>
                    )}
                </CardContent>
            </Card>

            {
                sample.status !== 'released' && sample.status !== 'archived' && (
                    <AnalysisForm
                        sample={sample}
                        analyses={filteredAnalyses}
                        specs={specs}
                        isValidated={isLocked}
                    />
                )
            }

            {/* Validation Info */}
            {
                isValidated && sample.validated_at && (
                    <Card className="glass border-green-200">
                        <CardHeader>
                            <CardTitle className="text-green-700 flex items-center gap-2">
                                <CheckCircle className="h-5 w-5" />
                                Validated
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-sm">
                                <span className="font-semibold">By:</span>{" "}
                                {validatedByName}
                            </div>
                            <div className="text-sm text-muted-foreground">
                                {format(new Date(sample.validated_at), "dd/MM/yyyy HH:mm")}
                            </div>
                        </CardContent>
                    </Card>
                )
            }
        </div >
    );
}

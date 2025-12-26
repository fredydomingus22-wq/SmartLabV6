
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, FlaskConical, CheckCircle, Clock, User, MapPin, XCircle, Sparkles, AlertTriangle, ShieldAlert } from "lucide-react";
import Link from "next/link";
import { AnalysisForm } from "./analysis-form";
import { ValidateDialog } from "./validate-dialog";
import { RealtimeAIBadge } from "@/components/lab/realtime-ai-badge";
import { PDFDownloadButton } from "@/components/reports/PDFDownloadButton";
import { CertificateOfAnalysis } from "@/components/reports/templates/CertificateOfAnalysis";

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
    parameter: { id: string; name: string; code: string; unit: string | null } | null;
    analyst?: { full_name: string } | null;
    final_value?: string | number | null;
    ai_insight?: { status: 'approved' | 'warning' | 'blocked' | 'info'; message: string; confidence: number } | null;
}

export default async function SampleDetailPage({ params }: PageProps) {
    const { id } = await params;
    const supabase = await createClient();

    // Get sample with all related data in a single unified query for RLS robustness
    const { data: sample, error: sampleError } = await supabase
        .from("samples")
        .select(`
    *,
    type: sample_types(id, name, code),
        batch: production_batches(
            id, code,
            product: products(id, name, sku)
        ),
            intermediate_product: intermediate_products(
                id, code, status,
                equipment: equipments(id, code, name)
            ),
                sampling_point: sampling_points(id, name, code, location),
                    lab_analysis(
                        id,
                        value_numeric,
                        value_text,
                        is_conforming,
                        analyzed_by,
                        analyzed_at,
                        qa_parameter_id,
                        parameter: qa_parameters(
                            id, name, code, unit
                        ),
                        analyst: user_profiles!lab_analysis_analyzed_by_profile_fkey(full_name)
                    )
                        `)
        .eq("id", id)
        .single();

    if (sampleError || !sample) {
        console.error("Sample fetch error:", sampleError);
        notFound();
    }

    const analysesRaw = (sample as any).lab_analysis || [];

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
    const insightsMap = new Map(insights.map(i => [i.entity_id, i]));

    // Normalize analyses to ensure parameter and analyst are objects (not arrays)
    const normalizedAnalyses: Analysis[] = analysesRaw.map((a: any) => {
        const parameter = Array.isArray(a.parameter) ? (a.parameter[0] || null) : (a.parameter || null);
        const analyst = Array.isArray(a.analyst) ? (a.analyst[0] || null) : (a.analyst || null);
        const ai_insight = insightsMap.get(a.id) || null;

        // Explicitly map properties to ensure they are available to the UI
        return {
            ...a,
            parameter,
            analyst,
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

    // Get product specifications for comparison
    const productId = sample.batch?.product?.id;
    let specs: Record<string, { min_value?: number; max_value?: number; target_value?: number }> = {};

    if (productId) {
        const { data: productSpecs } = await supabase
            .from("product_specifications")
            .select("qa_parameter_id, min_value, max_value, target_value, sample_type_id")
            .eq("product_id", productId)
            .eq("status", "active");

        // Specific specs ONLY (Strict Mode requested by User)
        // "samples should get parameters only from the specific sample_type... others don't need to appear"
        productSpecs?.forEach(spec => {
            if (spec.sample_type_id === sample.sample_type_id) {
                specs[spec.qa_parameter_id] = spec;
            }
        });
    }

    // Filter analyses to ONLY show those that have a defined Specification for this Sample Type
    const filteredAnalyses = normalizedAnalyses.filter(a => !!specs[a.qa_parameter_id]);

    const getStatusBadge = (status: string) => {
        const styles: Record<string, string> = {
            collected: "bg-blue-100 text-blue-700",
            pending: "bg-gray-100 text-gray-700",
            in_analysis: "bg-yellow-100 text-yellow-700",
            reviewed: "bg-purple-100 text-purple-700",
            validated: "bg-green-100 text-green-700",
            approved: "bg-green-100 text-green-700",
            rejected: "bg-red-100 text-red-700",
        };
        return <Badge className={styles[status] || styles.pending}>{status}</Badge>;
    };

    const isValidated = sample.status === "validated" || sample.status === "approved" || !!sample.validated_at;
    const isReviewed = sample.status === "reviewed" || isValidated;
    const canValidate = filteredAnalyses?.every(a => a.value_numeric !== null || a.value_text !== null);

    return (
        <div className="container py-8 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <Link href="/lab">
                            <Button variant="ghost" size="sm">
                                <ArrowLeft className="h-4 w-4 mr-1" />
                                Lab
                            </Button>
                        </Link>
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                        <FlaskConical className="h-8 w-8 text-blue-500" />
                        Sample: {sample.code || `[Empty Code for ${sample.id.substring(0, 8)}]`}
                    </h1>
                    <div className="flex items-center gap-3 mt-2">
                        {getStatusBadge(sample.status)}
                        <span className="text-muted-foreground">
                            {sample.type?.name || "Unknown Type"}
                        </span>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {isValidated && (
                        <>
                            <PDFDownloadButton
                                document={
                                    <CertificateOfAnalysis
                                        sample={{
                                            id: sample.id,
                                            sample_code: sample.code || 'N/A',
                                            product_name: sample.batch?.product?.name || 'Unknown Product',
                                            batch_code: sample.batch?.code || 'N/A',
                                            collection_date: sample.collected_at ? format(new Date(sample.collected_at), "dd/MM/yyyy HH:mm") : 'N/A',
                                            description: sample.description || undefined
                                        }}
                                        analyses={filteredAnalyses.map(a => ({
                                            parameter_name: a.parameter?.name || 'Unknown Parameter',
                                            method_name: a.parameter?.code, // Using code as method placeholder for now
                                            result: a.final_value?.toString() || 'Pending',
                                            unit: a.parameter?.unit || '',
                                            min_limit: specs[a.qa_parameter_id]?.min_value,
                                            max_limit: specs[a.qa_parameter_id]?.max_value,
                                            status: a.is_conforming === true ? 'compliant' : a.is_conforming === false ? 'non_compliant' : 'pending'
                                        }))}
                                        organization={{
                                            name: "SmartLab Enterprise",
                                            address: "123 Quality Street, Innovation City",
                                            // logoUrl: "..." 
                                        }}
                                        approver={{
                                            name: validatedByName,
                                            role: "Quality Manager"
                                        }}
                                    />
                                }
                                fileName={`CoA_${sample.code || sample.id}.pdf`}
                                label="Certificate"
                            />
                            <Badge className="bg-green-100 text-green-700 text-lg px-4 py-2">
                                <CheckCircle className="h-5 w-5 mr-2" />
                                Validated
                            </Badge>
                        </>
                    )}
                    {!isValidated && canValidate && (
                        <ValidateDialog sampleId={sample.id} sampleCode={sample.code} />
                    )}
                </div>
            </div>

            {/* Error Display for Debugging */}
            {sampleError && (
                <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs font-mono">
                    <p className="font-bold mb-1 underline">FETCH ERROR:</p>
                    <pre>{JSON.stringify(sampleError, null, 2)}</pre>
                </div>
            )}

            {/* Sample Info Cards */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card className="bg-slate-900/50 border-slate-800 shadow-lg backdrop-blur-sm">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-bold text-blue-400 uppercase tracking-wider flex items-center gap-2">
                            <FlaskConical className="h-4 w-4" />
                            Batch / Product
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="font-bold text-lg text-slate-100">{sample.batch?.code || "—"}</div>
                        <div className="text-sm text-slate-400 font-medium">
                            {sample.batch?.product?.name || "No product"}
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-slate-900/50 border-slate-800 shadow-lg backdrop-blur-sm">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-bold text-blue-400 uppercase tracking-wider flex items-center gap-2">
                            <MapPin className="h-4 w-4" />
                            Sampling Point
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="font-bold text-lg text-slate-100">
                            {sample.sampling_point?.name || "—"}
                        </div>
                        <div className="text-sm text-slate-400 font-medium">
                            {sample.sampling_point?.location || ""}
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-slate-900/50 border-slate-800 shadow-lg backdrop-blur-sm">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-bold text-blue-400 uppercase tracking-wider flex items-center gap-2">
                            <User className="h-4 w-4" />
                            Collection
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="font-bold text-lg text-slate-100">
                            {collectedByName}
                        </div>
                        <div className="text-sm text-slate-400 font-medium flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {sample.collected_at
                                ? format(new Date(sample.collected_at), "dd/MM/yyyy HH:mm")
                                : "—"
                            }
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Intermediate Product Info */}
            {sample.intermediate_product && (
                <Card className="bg-slate-900/40 border-slate-800 shadow-sm overflow-hidden">
                    <CardHeader className="py-2 border-b border-slate-800 bg-slate-950/30">
                        <CardTitle className="text-[10px] font-black uppercase tracking-widest text-slate-500">Intermediate Product</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4 flex items-center gap-4">
                        <Badge variant="secondary" className="font-mono text-blue-400 bg-blue-500/10 border-blue-500/20">
                            {sample.intermediate_product.code}
                        </Badge>
                        {sample.intermediate_product.equipment && (
                            <span className="text-sm font-medium text-slate-300">
                                <span className="text-slate-500 mr-2">Stored in:</span>
                                {sample.intermediate_product.equipment.name}
                                <span className="ml-2 text-[10px] text-slate-600 font-mono">({sample.intermediate_product.equipment.code})</span>
                            </span>
                        )}
                        <Badge className="ml-auto bg-slate-800 text-slate-300 border-slate-700">{sample.intermediate_product.status}</Badge>
                    </CardContent>
                </Card>
            )}

            {/* Debug Info (Visible only for investigation) */}
            <div className="text-[10px] text-muted-foreground opacity-50 font-mono">
                DEBUG: Analyses Count: {filteredAnalyses?.length || 0} |
                Sample User ID: {sample.collected_by || "—"} |
                Org ID: {sample.organization_id || "—"}
            </div>

            {/* Technical Resume Section */}
            <Card className="bg-slate-950 border-slate-800 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 to-cyan-500" />
                <CardHeader className="bg-slate-900/50 py-5 border-b border-slate-800">
                    <div className="flex justify-between items-center">
                        <div>
                            <CardTitle className="text-xl font-black text-white tracking-tight">Technical Resume</CardTitle>
                            <CardDescription className="text-slate-400">Comprehensive analytical summary of results</CardDescription>
                        </div>
                        <Badge className="bg-blue-600/10 text-blue-400 border-blue-500/20 shadow-sm font-mono px-3 py-1">
                            ID: {sample.id.split('-')[0].toUpperCase()}
                        </Badge>
                    </div>
                </CardHeader>
                <CardContent className="pt-6">
                    {filteredAnalyses && filteredAnalyses.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredAnalyses.map(a => {
                                const param = a.parameter;
                                const spec = param ? specs[param.id] : null;
                                const isValuePresent = a.final_value !== null && a.final_value !== undefined;
                                const displayValue = a.final_value;

                                return (
                                    <div key={a.id} className="relative p-5 rounded-2xl border bg-slate-900/40 border-slate-800 shadow-xl hover:shadow-2xl transition-all group overflow-hidden">
                                        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent pointer-events-none" />

                                        <div className="flex justify-between items-start mb-4 relative z-10">
                                            <div className="space-y-1">
                                                <p className="text-[10px] font-bold text-blue-400 uppercase tracking-[0.2em]">{param?.code}</p>
                                                <h4 className="font-bold text-base text-slate-100 leading-tight pr-8">{param?.name}</h4>
                                            </div>
                                            <div className="absolute top-0 right-0 flex gap-2">
                                                {/* AI Insight Badge (Realtime) */}
                                                <RealtimeAIBadge
                                                    analysisId={a.id}
                                                    initialInsight={a.ai_insight || null}
                                                />
                                                {a.is_conforming === true && <div className="bg-green-500/10 p-1.5 rounded-full"><CheckCircle className="h-5 w-5 text-green-400" /></div>}
                                                {a.is_conforming === false && <div className="bg-red-500/10 p-1.5 rounded-full"><XCircle className="h-5 w-5 text-red-400" /></div>}
                                                {a.is_conforming === null && isValuePresent && <div className="bg-amber-500/10 p-1.5 rounded-full"><Clock className="h-5 w-5 text-amber-400" /></div>}
                                            </div>
                                        </div>

                                        <div className="mt-2 flex flex-col gap-4 relative z-10">
                                            <div className="flex items-baseline gap-2">
                                                <span className={`text-3xl font-black tracking-tighter ${a.is_conforming === false ? 'text-red-400' : 'text-white'}`}>
                                                    {displayValue ?? "—"}
                                                </span>
                                                <span className="text-xs font-semibold text-slate-400">
                                                    {param?.unit}
                                                </span>
                                            </div>

                                            {spec && (
                                                <div className="flex flex-wrap gap-2 py-2 px-3 bg-slate-950/50 rounded-lg border border-slate-800/50">
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
                                        </div>

                                        {(a.analyzed_at || a.analyst) && (
                                            <div className="mt-6 pt-4 border-t border-slate-800/50 flex flex-col gap-2 relative z-10">
                                                <div className="flex items-center gap-2 text-[10px] text-slate-400 font-bold tracking-tight uppercase">
                                                    <User className="h-3 w-3 text-blue-500" />
                                                    <span className="text-slate-300 font-bold">
                                                        {a.analyst?.full_name || (a.analyzed_by ? `ID: ${String(a.analyzed_by).substring(0, 8).toUpperCase()} ` : "Not signed")}
                                                    </span>
                                                </div>
                                                {a.analyzed_at && (
                                                    <div className="flex items-center gap-2 text-[9px] text-slate-500 font-medium">
                                                        <Clock className="h-2.5 w-2.5" />
                                                        {format(new Date(a.analyzed_at), "dd/MM/yyyy HH:mm:ss")}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="py-12 text-center text-muted-foreground italic bg-slate-50/50 rounded-xl border border-dashed">
                            No analysis data available to resume.
                        </div>
                    )}
                </CardContent>
            </Card>

            {!isReviewed && (
                <AnalysisForm
                    sampleId={sample.id}
                    sampleCode={sample.code || ""}
                    analyses={filteredAnalyses || []}
                    specs={specs}
                    isValidated={isValidated}
                />
            )}

            {/* Validation Info */}
            {isValidated && sample.validated_at && (
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
            )}
        </div>
    );
}

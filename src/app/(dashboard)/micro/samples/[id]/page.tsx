import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    ArrowLeft,
    Beaker,
    Calendar,
    User,
    Package,
    Layers,
    Clock,
    CheckCircle2,
    AlertCircle,
    Thermometer,
    FileText
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { format, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

export const dynamic = "force-dynamic";

interface PageProps {
    params: Promise<{ id: string }>;
}

export default async function MicroSampleDetailsPage(props: PageProps) {
    const params = await props.params;
    const supabase = await createClient();

    // Fetch Sample with all related data
    const { data: sample, error } = await supabase
        .from("samples")
        .select(`
            *,
            sample_type:sample_types(id, name, test_category),
            batch:production_batches(
                id,
                code,
                product:products(id, name, code)
            ),
            sampling_point:sampling_points(id, name),
            collected_by_user:user_profiles!samples_collected_by_fkey(id, display_name),
            validated_by_user:user_profiles!samples_validated_by_fkey(id, display_name)
        `)
        .eq("id", params.id)
        .single();

    if (error || !sample) {
        return (
            <div className="container py-8 flex flex-col items-center justify-center min-h-[50vh]">
                <AlertCircle className="h-12 w-12 text-rose-500 mb-4" />
                <h1 className="text-2xl font-bold text-slate-200">Amostra não encontrada</h1>
                <Link href="/micro/samples">
                    <Button variant="ghost" className="mt-4">
                        <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
                    </Button>
                </Link>
            </div>
        );
    }

    // Fetch Micro Results for this sample
    const { data: microResults } = await supabase
        .from("micro_results")
        .select(`
            *,
            qa_parameter:qa_parameters(id, name, analysis_time_minutes, spec_min, spec_max, spec_unit),
            test_session:micro_test_sessions(
                id,
                started_at,
                ended_at,
                status,
                incubator:micro_incubators(id, name, setpoint_temp_c)
            )
        `)
        .eq("sample_id", params.id)
        .order("created_at", { ascending: true });

    // Status badge helper
    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'pending':
                return <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-400 border-yellow-500/20">Pendente</Badge>;
            case 'in_analysis':
            case 'incubating':
                return <Badge variant="secondary" className="bg-blue-500/10 text-blue-400 border-blue-500/20">Em Análise</Badge>;
            case 'completed':
                return <Badge className="bg-emerald-500 text-white border-none">Concluído</Badge>;
            case 'validated':
                return <Badge className="bg-indigo-500 text-white border-none">Validado</Badge>;
            case 'rejected':
                return <Badge className="bg-rose-500 text-white border-none">Rejeitado</Badge>;
            default:
                return <Badge variant="outline" className="border-slate-700 text-slate-400">{status}</Badge>;
        }
    };

    const productName = sample.batch?.product?.name || sample.sample_type?.name || "Amostra";
    const batchCode = sample.batch?.code || "-";

    return (
        <div className="container py-8 space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                    <Link href="/micro/samples">
                        <Button variant="outline" size="icon" className="h-12 w-12 rounded-full border-slate-700 bg-slate-900/50 hover:bg-slate-800">
                            <ArrowLeft className="h-5 w-5 text-slate-400" />
                        </Button>
                    </Link>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white font-mono">
                                {sample.code}
                            </h1>
                            {getStatusBadge(sample.status)}
                        </div>
                        <p className="text-slate-400 mt-1 text-sm">{productName}</p>
                    </div>
                </div>
            </div>

            {/* Info Cards Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <InfoCard
                    icon={<Package className="h-4 w-4 text-blue-400" />}
                    label="Produto"
                    value={productName}
                />
                <InfoCard
                    icon={<Layers className="h-4 w-4 text-indigo-400" />}
                    label="Lote"
                    value={batchCode}
                />
                <InfoCard
                    icon={<Calendar className="h-4 w-4 text-orange-400" />}
                    label="Colheita"
                    value={sample.collected_at ? format(new Date(sample.collected_at), "dd/MM/yy HH:mm", { locale: ptBR }) : "-"}
                />
                <InfoCard
                    icon={<User className="h-4 w-4 text-emerald-400" />}
                    label="Recolhido por"
                    value={sample.collected_by_user?.display_name || "-"}
                />
            </div>

            {/* Micro Results Section */}
            <div className="space-y-4">
                <h2 className="text-xl font-bold text-slate-200 flex items-center gap-2">
                    <Beaker className="h-5 w-5 text-blue-400" />
                    Resultados Microbiológicos ({microResults?.length || 0})
                </h2>

                {microResults && microResults.length > 0 ? (
                    <div className="grid gap-4">
                        {microResults.map((result: any) => (
                            <ResultCard key={result.id} result={result} />
                        ))}
                    </div>
                ) : (
                    <div className="py-12 flex flex-col items-center justify-center text-center border-2 border-dashed border-slate-800 rounded-2xl bg-slate-900/20">
                        <Beaker className="h-10 w-10 text-slate-700 mb-3" />
                        <p className="text-slate-500 font-medium">Nenhum resultado microbiológico registrado.</p>
                    </div>
                )}
            </div>

            {/* Notes Section */}
            {sample.notes && (
                <div className="space-y-2">
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        Observações
                    </h3>
                    <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/40 text-slate-300">
                        {sample.notes}
                    </div>
                </div>
            )}
        </div>
    );
}

function InfoCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
    return (
        <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/40">
            <div className="flex items-center gap-2 text-slate-500 mb-1">
                {icon}
                <span className="text-[10px] font-bold uppercase tracking-wider">{label}</span>
            </div>
            <div className="text-sm font-semibold text-slate-200 truncate" title={value}>
                {value}
            </div>
        </div>
    );
}

function ResultCard({ result }: { result: any }) {
    const paramName = result.qa_parameter?.name || "Parâmetro Desconhecido";
    const incubator = result.test_session?.incubator;
    const session = result.test_session;

    // Determine result display
    let resultDisplay = "-";
    let isConforming = true;

    if (result.result_text) {
        resultDisplay = result.result_text;
    } else if (result.colony_count !== null) {
        resultDisplay = `${result.colony_count} UFC`;
    }

    if (result.is_conforming === false) {
        isConforming = false;
    }

    // Status check
    const isCompleted = result.status === 'completed';
    const isIncubating = session?.status === 'incubating';

    return (
        <div className={cn(
            "p-4 rounded-xl border transition-all",
            !isConforming
                ? "border-rose-500/30 bg-rose-950/10"
                : "border-slate-800 bg-slate-900/40"
        )}>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-bold text-slate-200">{paramName}</h3>
                        {isCompleted ? (
                            <Badge variant="outline" className="border-emerald-500/30 text-emerald-400 text-[10px]">
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                Lido
                            </Badge>
                        ) : isIncubating ? (
                            <Badge variant="outline" className="border-blue-500/30 text-blue-400 text-[10px]">
                                <Clock className="h-3 w-3 mr-1" />
                                Incubando
                            </Badge>
                        ) : (
                            <Badge variant="outline" className="border-yellow-500/30 text-yellow-400 text-[10px]">
                                Pendente
                            </Badge>
                        )}
                    </div>

                    {incubator && (
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                            <Thermometer className="h-3 w-3" />
                            <span>{incubator.name} ({incubator.setpoint_temp_c}°C)</span>
                            {session?.started_at && (
                                <span className="text-slate-600">
                                    • Iniciado {formatDistanceToNow(new Date(session.started_at), { addSuffix: true, locale: ptBR })}
                                </span>
                            )}
                        </div>
                    )}
                </div>

                <div className="text-right">
                    <div className={cn(
                        "text-lg font-black",
                        !isConforming ? "text-rose-400" : "text-emerald-400"
                    )}>
                        {resultDisplay}
                    </div>
                    {result.qa_parameter?.spec_max && (
                        <div className="text-[10px] text-slate-500">
                            Limite: {result.qa_parameter.spec_max} {result.qa_parameter.spec_unit || ''}
                        </div>
                    )}
                </div>
            </div>

            {result.notes && (
                <div className="mt-3 pt-3 border-t border-slate-800/50 text-xs text-slate-400">
                    <span className="font-semibold text-slate-500">Obs:</span> {result.notes}
                </div>
            )}
        </div>
    );
}

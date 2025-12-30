import { format } from "date-fns";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Microscope, Clock, CheckCircle, AlertTriangle, AlertCircle, Beaker, Layers, FlaskConical, Calendar } from "lucide-react";
import Link from "next/link";
import { getSafeUser } from "@/lib/auth.server";
import { CreateMicroSampleDialog } from "./create-micro-sample-dialog";
import { cn } from "@/lib/utils";
import { GlassTable, GlassTableHeader, GlassTableRow, GlassTableHead, GlassTableCell } from "@/components/ui/glass-table";
import { TableBody } from "@/components/ui/table";

export const dynamic = "force-dynamic";

export default async function MicroSamplesPage() {
    const supabase = await createClient();
    const user = await getSafeUser();
    const plantId = user.plant_id;

    if (!plantId) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4 p-8 glass rounded-3xl border-purple-500/20">
                <AlertCircle className="h-12 w-12 text-purple-500 animate-pulse" />
                <div className="text-center">
                    <h3 className="text-xl font-bold text-slate-100 uppercase tracking-tighter">Sem Planta Associada</h3>
                    <p className="text-slate-400 mt-2 max-w-sm font-medium italic">O seu perfil não está associado a nenhuma unidade fabril microbiológica.</p>
                </div>
                <Button asChild variant="outline" className="rounded-xl border-purple-500/30 text-purple-400 hover:bg-purple-500/10">
                    <Link href="/micro">Voltar ao Laboratório</Link>
                </Button>
            </div>
        );
    }

    const { data: sampleTypes } = await supabase.from("sample_types").select("id, name, code, test_category").in("test_category", ["microbiological", "both"]).order("name");
    const microTypeIds = sampleTypes?.map(t => t.id) || [];

    const [tanksRes, samplingPointsRes, samplesRes] = await Promise.all([
        supabase.from("intermediate_products").select(`id, code, status, batch:production_batches(id, code, product:products(id, name))`).in("status", ["pending", "approved", "in_use"]).order("code"),
        supabase.from("sampling_points").select("id, name, code").eq("status", "active").order("name"),
        supabase.from("samples").select(`id, code, status, collected_at, sample_type:sample_types(id, name, code, test_category), batch:production_batches(id, code, product:products(name)), intermediate_product:intermediate_products(code)`).in("sample_type_id", microTypeIds.length > 0 ? microTypeIds : ["00000000-0000-0000-0000-000000000000"]).order("collected_at", { ascending: false }).limit(50)
    ]);

    const tanks = tanksRes.data;
    const samplingPoints = samplingPointsRes.data;
    const samples = samplesRes.data;

    const getStatusStyles = (status: string) => {
        switch (status) {
            case 'pending': return { color: "text-amber-400 bg-amber-400/10 border-amber-400/20", icon: Clock, label: "Pendente" };
            case 'in_analysis': return { color: "text-blue-400 bg-blue-400/10 border-blue-400/20", icon: Microscope, label: "Em Incubação" };
            case 'reviewed': return { color: "text-purple-400 bg-purple-400/10 border-purple-400/20", icon: CheckCircle, label: "Leitura OK" };
            case 'approved': return { color: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20", icon: CheckCircle, label: "Aprovada" };
            case 'rejected': return { color: "text-rose-400 bg-rose-400/10 border-rose-400/20", icon: AlertTriangle, label: "Rejeitada" };
            default: return { color: "text-slate-400 bg-slate-400/10 border-slate-400/20", icon: Clock, label: status };
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-700 p-3 sm:p-4 md:p-8">
            {/* Standardized Glass Header */}
            <div className="glass p-8 rounded-[2.5rem] border-none shadow-2xl bg-gradient-to-br from-purple-500/10 via-slate-900/50 to-transparent relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 blur-[100px] -mr-32 -mt-32 rounded-full" />

                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 relative z-10">
                    <div className="space-y-4">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-2xl bg-purple-500/20 border border-purple-500/30 shadow-[0_0_20px_rgba(168,85,247,0.2)]">
                                <Microscope className="h-6 w-6 text-purple-400" />
                            </div>
                            <div>
                                <h1 className="text-4xl font-black tracking-tighter bg-gradient-to-r from-slate-100 to-slate-400 bg-clip-text text-transparent">
                                    Microbiologia
                                </h1>
                                <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">
                                    Monitorização de Amostras & Incubação
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <CreateMicroSampleDialog
                            sampleTypes={sampleTypes || []}
                            tanks={tanks || []}
                            samplingPoints={samplingPoints || []}
                            plantId={plantId}
                        />
                    </div>
                </div>
            </div>

            {/* Premium KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: "Pendentes", value: samples?.filter(s => s.status === "pending").length || 0, color: "text-amber-400", bg: "bg-amber-400/10", icon: Clock },
                    { label: "Em Incubação", value: samples?.filter(s => s.status === "in_analysis").length || 0, color: "text-blue-400", bg: "bg-blue-400/10", icon: FlaskConical },
                    { label: "Aguardando Visto", value: samples?.filter(s => s.status === "reviewed").length || 0, color: "text-purple-400", bg: "bg-purple-400/10", icon: CheckCircle },
                    { label: "Não Conformidades", value: samples?.filter(s => s.status === "rejected").length || 0, color: "text-rose-400", bg: "bg-rose-400/10", icon: AlertTriangle }
                ].map((kpi, i) => (
                    <div key={i} className="glass p-6 rounded-3xl border-white/5 flex items-center justify-between group hover:border-white/10 transition-all shadow-xl">
                        <div className="space-y-1">
                            <p className="text-slate-500 font-black uppercase tracking-widest text-[10px]">{kpi.label}</p>
                            <h3 className={cn("text-3xl font-black tracking-tighter", kpi.color)}>{kpi.value}</h3>
                        </div>
                        <div className={cn("p-4 rounded-2xl bg-slate-950/50 border border-white/5 group-hover:scale-110 transition-transform shadow-inner")}>
                            <kpi.icon className={cn("h-6 w-6", kpi.color)} />
                        </div>
                    </div>
                ))}
            </div>

            {/* Samples Content */}
            <GlassTable>
                <GlassTableHeader>
                    <GlassTableRow>
                        <GlassTableHead>Código</GlassTableHead>
                        <GlassTableHead>Origem / Matriz</GlassTableHead>
                        <GlassTableHead>Recolha</GlassTableHead>
                        <GlassTableHead className="text-center">Estado</GlassTableHead>
                        <GlassTableHead className="text-right">Ação Rápida</GlassTableHead>
                    </GlassTableRow>
                </GlassTableHeader>
                <TableBody>
                    {samples?.map((sample) => {
                        const styles = getStatusStyles(sample.status);
                        const StatusIcon = styles.icon;
                        const sampleType = Array.isArray(sample.sample_type) ? (sample.sample_type[0] as any) : (sample.sample_type as any);
                        const batch = Array.isArray(sample.batch) ? (sample.batch[0] as any) : (sample.batch as any);
                        const intermediate = Array.isArray(sample.intermediate_product) ? (sample.intermediate_product[0] as any) : (sample.intermediate_product as any);

                        return (
                            <GlassTableRow key={sample.id}>
                                <GlassTableCell>
                                    <Link href={`/micro/samples/${sample.id}`} className="block">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-xl bg-slate-900 border border-white/5 flex items-center justify-center text-blue-400 shadow-inner group-hover:border-blue-500/50 transition-colors">
                                                <Layers className="h-5 w-5" />
                                            </div>
                                            <div>
                                                <span className="font-black text-slate-200 group-hover:text-blue-400 transition-colors">{sample.code}</span>
                                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{sampleType?.name}</p>
                                            </div>
                                        </div>
                                    </Link>
                                </GlassTableCell>
                                <GlassTableCell>
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <div className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                                            <p className="text-xs font-black text-slate-300">{batch?.code || "S/ Lote"}</p>
                                        </div>
                                        <p className="text-[10px] text-slate-500 font-medium">
                                            {intermediate?.code ? `Tanque: ${intermediate.code}` : 'Ponto de recolha fixo'}
                                        </p>
                                    </div>
                                </GlassTableCell>
                                <GlassTableCell>
                                    <div className="flex items-center gap-3 text-slate-400">
                                        <Calendar className="h-4 w-4 opacity-40" />
                                        <span className="text-xs font-bold">
                                            {sample.collected_at ? format(new Date(sample.collected_at), "dd/MM/yyyy HH:mm") : "—"}
                                        </span>
                                    </div>
                                </GlassTableCell>
                                <GlassTableCell>
                                    <div className="flex justify-center">
                                        <Badge className={cn("px-4 py-1.5 rounded-xl border font-black uppercase tracking-tighter text-[10px] flex items-center gap-2 shadow-sm", styles.color)}>
                                            <StatusIcon className="h-3 w-3" />
                                            {styles.label}
                                        </Badge>
                                    </div>
                                </GlassTableCell>
                                <GlassTableCell className="text-right">
                                    {sample.status === "pending" ? (
                                        <Link href="/micro/incubators">
                                            <Button variant="ghost" size="sm" className="rounded-xl font-black text-[10px] uppercase tracking-widest text-purple-400 hover:bg-purple-400/10">
                                                Iniciar Incubação →
                                            </Button>
                                        </Link>
                                    ) : sample.status === "in_analysis" ? (
                                        <Link href="/micro/reading">
                                            <Button variant="ghost" size="sm" className="rounded-xl font-black text-[10px] uppercase tracking-widest text-blue-400 hover:bg-blue-400/10">
                                                Ver Leituras →
                                            </Button>
                                        </Link>
                                    ) : (
                                        <Link href={`/micro/samples/${sample.id}`}>
                                            <Button variant="ghost" size="sm" className="rounded-xl font-black text-[10px] uppercase tracking-widest text-slate-500 hover:bg-slate-500/10">
                                                Detalhes
                                            </Button>
                                        </Link>
                                    )}
                                </GlassTableCell>
                            </GlassTableRow>
                        );
                    })}
                </TableBody>
            </GlassTable>

            {(!samples || samples.length === 0) && (
                <div className="text-center py-24 group">
                    <div className="h-24 w-24 bg-slate-900/50 rounded-[2rem] border border-white/5 flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform shadow-2xl">
                        <Microscope className="h-10 w-10 text-slate-700" />
                    </div>
                    <h3 className="text-xl font-black text-slate-300 tracking-tighter">Sem Registos Ativos</h3>
                    <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-2 max-w-xs mx-auto">
                        Inicie o processo criando uma nova amostra para começar o rastreio microbiológico.
                    </p>
                </div>
            )}
        </div>
    );
}

import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
    ArrowLeft, Factory, Beaker, Package, Plus,
    History as HistoryIcon, ClipboardList, PackageCheck, Thermometer,
    LayoutDashboard
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { IntermediateDialog } from "./intermediate-dialog";
import { IntermediatesTable } from "./intermediates-table";
import { BatchReportButton } from "@/components/reports/BatchReportButton";
import { getBatchTraceabilityAction } from "@/app/actions/traceability";
import { BatchDossier } from "./batch-dossier";
import { ReleaseBatchButton } from "./release-batch-button";

export const dynamic = "force-dynamic";

interface PageProps {
    params: Promise<{ id: string }>;
}

export default async function BatchDetailPage({ params }: PageProps) {
    const { id } = await params;
    const supabase = await createClient();

    // 1. Fetch user & profile
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    const { data: profile } = await supabase
        .from("user_profiles")
        .select("role")
        .eq("id", user.id)
        .single();

    // 2. Fetch batch with relations
    const { data: batch, error } = await supabase
        .from("production_batches")
        .select(`
            *,
            product:products(id, name, sku),
            line:production_lines(id, name, code)
        `)
        .eq("id", id)
        .single();

    if (error || !batch) {
        notFound();
    }

    // 3. Fetch Traceability Data for Dossier Tab
    const traceabilityResponse = await getBatchTraceabilityAction(id);
    const traceabilityData = traceabilityResponse.success ? traceabilityResponse.data : null;

    // 2. Fetch intermediates
    const { data: intermediates } = await supabase
        .from("intermediate_products")
        .select(`
            *,
            ingredients:intermediate_ingredients(
                *,
                lot:raw_material_lots(
                    id,
                    lot_code,
                    raw_material:raw_materials(name, code)
                )
            )
        `)
        .eq("production_batch_id", id)
        .order("created_at", { ascending: true });

    // 3. Fetch all samples related to this batch
    const intermediateIds = intermediates?.map(i => i.id) || [];
    let query = supabase
        .from("samples")
        .select(`
            *,
            type:sample_types(name),
            lab_analysis(
                id,
                value_numeric,
                value_text,
                is_conforming,
                parameter:qa_parameters(name, unit)
            )
        `);

    if (intermediateIds.length > 0) {
        query = query.or(`production_batch_id.eq.${id},intermediate_product_id.in.(${intermediateIds.join(',')})`);
    } else {
        query = query.eq("production_batch_id", id);
    }

    const { data: samples } = await query.order('collected_at', { ascending: true });

    // 4. Data Preparation
    const product = Array.isArray(batch.product) ? batch.product[0] : batch.product;
    const line = Array.isArray(batch.line) ? batch.line[0] : batch.line;

    const statusColors: Record<string, string> = {
        planned: "bg-blue-500/10 text-blue-700 border-none",
        open: "bg-amber-500/10 text-amber-700 border-none",
        in_progress: "bg-amber-500/10 text-amber-700 border-none",
        completed: "bg-purple-500/10 text-purple-700 border-none",
        closed: "bg-emerald-500/10 text-emerald-700 border-none",
        released: "bg-emerald-500/10 text-emerald-700 border-none",
        blocked: "bg-rose-500/10 text-rose-700 border-none",
        rejected: "bg-rose-500/10 text-rose-700 border-none",
    };

    const statusLabels: Record<string, string> = {
        planned: "PLANEADO",
        open: "EM PROCESSO",
        in_progress: "EM PROCESSO",
        completed: "FINALIZADO",
        closed: "LIBERADO",
        released: "LIBERADO",
        blocked: "BLOQUEADO",
        rejected: "REJEITADO",
    };

    const statusColor = statusColors[batch.status] || "bg-muted text-muted-foreground";
    const statusLabel = statusLabels[batch.status] || batch.status.toUpperCase();

    // Prepare Report Data
    const phasesMap = new Map<string, any[]>();
    samples?.forEach(sample => {
        const typeName = sample.type?.name || "Geral";
        if (!phasesMap.has(typeName)) phasesMap.set(typeName, []);
        phasesMap.get(typeName)?.push({
            id: sample.id,
            sample_code: sample.code,
            collection_date: sample.collected_at ? new Date(sample.collected_at).toLocaleDateString() : "-",
            sample_type: typeName,
            overall_status: sample.status === 'validated' || sample.status === 'approved' ? 'compliant' : sample.status,
            analyses: sample.lab_analysis?.map((a: any) => ({
                parameter_name: a.parameter?.name,
                result: a.value_numeric ?? a.value_text ?? "-",
                unit: a.parameter?.unit || "",
                status: a.is_conforming === true ? 'compliant' : a.is_conforming === false ? 'non_compliant' : 'pending'
            })) || []
        });
    });

    const reportPhases = Array.from(phasesMap.entries()).map(([name, samples]) => ({ name, samples }));

    // 5. Fetch Aux Data (Tanks, Types, Points)
    const { data: tanks } = await supabase
        .from("equipments")
        .select("id, name, code, status")
        .eq("equipment_type", "tank")
        .eq("status", "active");

    const { data: sampleTypes } = await supabase.from("sample_types").select("id, name, code").order("name");
    const { data: samplingPoints } = await supabase.from("sampling_points").select("id, name, code").order("name");

    return (
        <div className="space-y-6">
            {/* Minimal Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Link href="/production">
                        <Button variant="outline" size="icon" className="h-8 w-8 rounded-full border-none bg-muted/30">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-2xl font-bold tracking-tight">{batch.code}</h1>
                            <Badge className={cn("px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider", statusColor)}>
                                {statusLabel}
                            </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground font-medium uppercase tracking-tight">
                            {product?.name || "No Product"} • Linha: {line?.name || "N/A"}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <BatchReportButton
                        data={{
                            batchCode: batch.code,
                            productName: product?.name || "",
                            startDate: batch.start_date ? new Date(batch.start_date).toLocaleDateString() : "",
                            endDate: batch.end_date ? new Date(batch.end_date).toLocaleDateString() : undefined,
                            organization: { name: "SmartLab Enterprise", address: "Production Plant 1" },
                            phases: reportPhases
                        }}
                    />
                    <ReleaseBatchButton batchId={id} status={batch.status} userRole={profile?.role || "operator"} />
                </div>
            </div>

            <Tabs defaultValue="overview" className="space-y-6">
                <TabsList className="bg-transparent p-0 h-10 gap-8 border-b border-border/10 w-full justify-start rounded-none">
                    <TabsTrigger value="overview" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none text-[10px] px-0 h-10 font-bold uppercase tracking-widest text-muted-foreground/50 transition-none">Vista Geral</TabsTrigger>
                    <TabsTrigger value="tanks" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none text-[10px] px-0 h-10 font-bold uppercase tracking-widest text-muted-foreground/50 transition-none">Tanques</TabsTrigger>
                    <TabsTrigger value="quality" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none text-[10px] px-0 h-10 font-bold uppercase tracking-widest text-muted-foreground/50 transition-none">Laboratório</TabsTrigger>
                    <TabsTrigger value="packaging" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none text-[10px] px-0 h-10 font-bold uppercase tracking-widest text-muted-foreground/50 transition-none text-muted-foreground/30">Embalagem</TabsTrigger>
                    <TabsTrigger value="history" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none text-[10px] px-0 h-10 font-bold uppercase tracking-widest text-muted-foreground/50 transition-none">Dossiê de Rastreabilidade</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-6 mt-4">
                    <div className="grid gap-4 md:grid-cols-4">
                        <Card className="glass border-none shadow-sm rounded-2xl overflow-hidden">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                    <Factory className="h-3 w-3" />
                                    Produto Base
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-lg font-bold">{product?.name || "N/A"}</p>
                                <p className="text-[10px] font-medium text-muted-foreground uppercase opacity-50">SKU: {product?.sku || "-"}</p>
                            </CardContent>
                        </Card>

                        <Card className="glass border-none shadow-sm rounded-2xl overflow-hidden">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Volume Planeado</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-lg font-bold">{batch.planned_quantity || "0"}</p>
                                <p className="text-[10px] font-medium text-muted-foreground uppercase opacity-50">Kg / Litros</p>
                            </CardContent>
                        </Card>

                        <Card className="glass border-none shadow-sm rounded-2xl overflow-hidden">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Início da Ordem</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-lg font-bold">
                                    {batch.start_date ? new Date(batch.start_date).toLocaleDateString() : "-"}
                                </p>
                                <p className="text-[10px] font-medium text-muted-foreground uppercase opacity-50">
                                    {batch.end_date ? `Fechado: ${new Date(batch.end_date).toLocaleDateString()}` : "Em Execução"}
                                </p>
                            </CardContent>
                        </Card>

                        <Card className="glass border-none shadow-sm rounded-2xl overflow-hidden">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                    <Thermometer className="h-3 w-3" />
                                    Rastreados
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-lg font-bold">{intermediates?.length || 0}</p>
                                <p className="text-[10px] font-medium text-muted-foreground uppercase opacity-50">Sub-Lotes (WIP)</p>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="grid gap-6 md:grid-cols-2">
                        <Card className="glass border-none shadow-sm rounded-2xl p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-xs font-bold uppercase tracking-widest">Resumo de Qualidade</h3>
                                <Badge variant="secondary" className="text-[8px] font-bold uppercase">{samples?.length || 0} Amostras</Badge>
                            </div>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between p-3 bg-muted/20 rounded-xl">
                                    <span className="text-[10px] font-bold uppercase text-muted-foreground">Taxa de Conformidade</span>
                                    <span className="text-sm font-bold text-emerald-600">
                                        {samples?.length ? Math.round((samples.filter(s => s.status === 'validated').length / samples.length) * 100) : 0}%
                                    </span>
                                </div>
                            </div>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="tanks" className="mt-4">
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-sm font-bold uppercase tracking-tight">Tanques e Misturas</h2>
                                <p className="text-[10px] text-muted-foreground uppercase">Monitorização de produtos em fase intermédia</p>
                            </div>
                            <IntermediateDialog batchId={id} availableTanks={tanks || []} />
                        </div>

                        {intermediates && intermediates.length > 0 ? (
                            <IntermediatesTable
                                intermediates={intermediates}
                                sampleTypes={sampleTypes || []}
                                samplingPoints={samplingPoints || []}
                                plantId={batch.plant_id}
                                batchCode={batch.code}
                            />
                        ) : (
                            <div className="text-center py-20 bg-muted/10 rounded-3xl border border-dashed">
                                <Package className="h-8 w-8 mx-auto mb-3 opacity-20" />
                                <p className="text-[10px] font-bold uppercase tracking-widest opacity-40">Nenhum tanque associado a este lote</p>
                            </div>
                        )}
                    </div>
                </TabsContent>

                <TabsContent value="quality" className="mt-4">
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-sm font-bold uppercase tracking-tight">Histórico de Análises (LIMS)</h2>
                            <Link href="/lab">
                                <Button variant="ghost" size="sm" className="text-[10px] font-bold uppercase tracking-widest">Ir para o Lab <ArrowLeft className="ml-2 h-3 w-3 rotate-180" /></Button>
                            </Link>
                        </div>

                        <div className="glass border-none shadow-sm rounded-2xl overflow-hidden">
                            {samples && samples.length > 0 ? (
                                <div className="divide-y divide-border/10">
                                    {samples.map(sample => (
                                        <div key={sample.id} className="flex items-center justify-between p-4 group hover:bg-muted/30 transition-colors">
                                            <div className="flex flex-col">
                                                <span className="font-mono text-xs font-bold tracking-tighter">{sample.code}</span>
                                                <span className="text-[9px] text-muted-foreground uppercase font-medium">{sample.type?.name}</span>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <div className="hidden md:flex flex-col items-end mr-4">
                                                    <span className="text-[8px] text-muted-foreground uppercase font-bold">Colhido</span>
                                                    <span className="text-[10px] font-medium">{new Date(sample.collected_at).toLocaleDateString()}</span>
                                                </div>
                                                <Badge className={cn("text-[9px] font-bold uppercase tracking-widest h-6 px-3 border-none",
                                                    sample.status === 'validated' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-muted text-muted-foreground')}>
                                                    {sample.status}
                                                </Badge>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-20 opacity-30">
                                    <ClipboardList className="h-8 w-8 mx-auto mb-3" />
                                    <p className="text-[10px] font-bold uppercase tracking-widest">Aguardando registo de amostras</p>
                                </div>
                            )}
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="packaging" className="mt-4">
                    <div className="text-center py-24 bg-muted/5 rounded-3xl border border-dashed">
                        <PackageCheck className="h-10 w-12 mx-auto mb-4 opacity-10" />
                        <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] opacity-30">Controlo de Embalagem</h3>
                        <p className="text-[9px] text-muted-foreground uppercase mt-2 opacity-50 tracking-wider">Aguardando implementação da US-SUP-01</p>
                    </div>
                </TabsContent>

                <TabsContent value="history" className="mt-4">
                    <BatchDossier data={traceabilityData} batchId={id} />
                </TabsContent>
            </Tabs>
        </div>
    );
}

import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
    ArrowLeft, Factory, Beaker, Package, Plus,
    History as HistoryIcon, ClipboardList, PackageCheck, Thermometer,
    LayoutDashboard, AlertTriangle, RefreshCcw
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { IntermediateDialog } from "./intermediate-dialog";
import { IntermediatesTable } from "./intermediates-table";
import { BatchReportButton } from "@/components/reports/BatchReportButton";
import { getBatchTraceabilityAction } from "@/app/actions/traceability";
import { BatchDossier } from "./batch-dossier";
import { ReleaseBatchButton } from "./release-batch-button";
import { PackagingDialog } from "./packaging-dialog";
import { ProductionEventControls } from "../_components/production-event-controls";
import { ExecutionHeartbeat } from "../_components/execution-heartbeat";

import { StoppagesPanel } from "./stoppages-panel";
import { getProductionEvents } from "@/lib/queries/production";
import { KPIUpdateDialog } from "./kpi-update-dialog";

export const dynamic = "force-dynamic";

interface PageProps {
    params: Promise<{ id: string }>;
}

export default async function BatchDetailPage({ params }: PageProps) {
    const { id } = await params;
    const supabase = await createClient();

    // 1. Fetch user & profile
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) notFound();

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

    // 4. Fetch Last Production Event
    const events = await getProductionEvents(id);
    const lastEvent = events[0];

    // 5. Fetch intermediates
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

    // 4. Map Samples to Intermediates for Table UI
    const intermediatesWithSamples = intermediates?.map(inter => ({
        ...inter,
        samples: samples?.filter(s => s.intermediate_product_id === inter.id) || []
    })) || [];

    // 4. Data Preparation
    const product = Array.isArray(batch.product) ? batch.product[0] : batch.product;
    const line = Array.isArray(batch.line) ? batch.line[0] : batch.line;

    const getStatusBadge = (status: string) => {
        const variants: Record<string, any> = {
            planned: "outline",
            open: "active",
            in_progress: "active",
            completed: "completed",
            closed: "approved",
            released: "approved",
            blocked: "blocked",
            rejected: "rejected",
        };
        const labels: Record<string, string> = {
            planned: "Planeado",
            open: "Em Processo",
            in_progress: "Em Processo",
            completed: "Finalizado",
            closed: "Liberado",
            released: "Liberado",
            blocked: "Bloqueado",
            rejected: "Rejeitado",
        };
        return <Badge variant={variants[status] || "outline"} className="font-bold tracking-tight px-3 py-1 rounded-full border shadow-sm">{labels[status] || status.toUpperCase()}</Badge>;
    };

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
    const [{ data: legacyTanks }, { data: modernTanks }] = await Promise.all([
        supabase
            .from("equipments")
            .select("id, name, code, status")
            .eq("equipment_type", "tank")
            .eq("status", "active"),
        supabase
            .from("tanks")
            .select("id, name, code, status")
            .eq("status", "active")
    ]);

    // Merge tanks avoiding duplicates
    const tanksMap = new Map();
    legacyTanks?.forEach(t => tanksMap.set(t.id, t));
    modernTanks?.forEach(t => tanksMap.set(t.id, t));
    const tanks = Array.from(tanksMap.values());

    // 4. Fetch available Raw Material Lots (for IngredientDialog)
    const { data: rawMaterialLots } = await supabase
        .from("raw_material_lots")
        .select("id, lot_code, quantity_remaining, unit, raw_material:raw_materials(name, code)")
        .eq("status", "approved")
        .gt("quantity_remaining", 0)
        .order("lot_code");

    // 5. Fetch available Packaging Lots
    const { data: rawPackaging } = await supabase
        .from("packaging_lots")
        .select("id, lot_code, remaining_quantity, material:packaging_materials(name, code)")
        .in("status", ["approved", "active"])
        .gt("remaining_quantity", 0)
        .order("lot_code");

    const availablePackaging = rawPackaging?.map(p => ({
        ...p,
        material: Array.isArray(p.material) ? p.material[0] : p.material
    })) || [];

    // 6. Fetch used Packaging for this batch
    const { data: usedPackaging } = await supabase
        .from("batch_packaging_usage")
        .select("*, lot:packaging_lots(lot_code, material:packaging_materials(name))")
        .eq("production_batch_id", id);


    const { data: allProducts } = await supabase.from("products").select("id, name, sku").eq("status", "active").order("name");
    const { data: sampleTypes } = await supabase.from("sample_types").select("id, name, code").order("name");
    const { data: samplingPoints } = await supabase.from("sampling_points").select("id, name, code").order("name");

    return (
        <div className="container py-8 space-y-6">
            {/* Premium Header Container (NC-UI-03) */}
            <div className="glass p-8 rounded-[2.5rem] border-none shadow-2xl bg-gradient-to-br from-indigo-500/10 via-slate-900/50 to-transparent relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 blur-[100px] -mr-32 -mt-32 rounded-full" />

                <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-8 relative z-10">
                    <div className="space-y-6">
                        <Link href="/production">
                            <Button variant="ghost" size="sm" className="pl-0 text-slate-400 hover:text-white -ml-2 mb-2 group">
                                <ArrowLeft className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform" />
                                Voltar à Produção
                            </Button>
                        </Link>

                        <div className="flex flex-col gap-4">
                            <div className="flex items-center gap-4">
                                <div className="p-4 rounded-3xl bg-indigo-500/20 border border-indigo-500/30 shadow-inner">
                                    <Factory className="h-8 w-8 text-indigo-400" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-3 mb-1">
                                        <h1 className="text-4xl sm:text-5xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400">
                                            {batch.code}
                                        </h1>
                                        {getStatusBadge(batch.status)}
                                    </div>
                                    <p className="text-lg text-slate-400 font-medium tracking-wide">
                                        {product?.name || "Sem Produto"} • Linha: {line?.name || "N/A"}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col items-end gap-4">
                        <div className="flex flex-wrap justify-end gap-3">
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
                </div>
            </div>

            <ProductionEventControls
                batchId={id}
                currentStatus={batch.status}
                lastEventType={lastEvent?.event_type}
            />

            <Tabs defaultValue="overview" className="space-y-6">
                <TabsList className="bg-transparent p-0 h-10 gap-8 border-b border-border/10 w-full justify-start rounded-none">
                    <TabsTrigger value="overview" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none text-[10px] px-0 h-10 font-bold uppercase tracking-widest text-muted-foreground/50 transition-none">Vista Geral</TabsTrigger>
                    <TabsTrigger value="events" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none text-[10px] px-0 h-10 font-bold uppercase tracking-widest text-muted-foreground/50 transition-none">Eventos & Paragens</TabsTrigger>
                    <TabsTrigger value="tanks" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none text-[10px] px-0 h-10 font-bold uppercase tracking-widest text-muted-foreground/50 transition-none">Tanques</TabsTrigger>
                    <TabsTrigger value="quality" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none text-[10px] px-0 h-10 font-bold uppercase tracking-widest text-muted-foreground/50 transition-none">Laboratório</TabsTrigger>
                    <TabsTrigger value="packaging" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none text-[10px] px-0 h-10 font-bold uppercase tracking-widest text-muted-foreground/50 transition-none">Embalagem</TabsTrigger>
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

                        <Card className="glass border-none shadow-sm rounded-2xl overflow-hidden border-l-4 border-l-red-500/50">
                            <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                                <CardTitle className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                    <AlertTriangle className="h-3 w-3 text-red-500" />
                                    Refugo / Perdas
                                </CardTitle>
                                <KPIUpdateDialog
                                    batchId={id}
                                    currentScrap={Number((batch as any).scrap_quantity || 0)}
                                    currentRework={Number((batch as any).rework_quantity || 0)}
                                />
                            </CardHeader>
                            <CardContent>
                                <p className="text-lg font-bold">{(batch as any).scrap_quantity || "0"}</p>
                                <p className="text-[10px] font-medium text-muted-foreground uppercase opacity-50">Kg / Unidades</p>
                            </CardContent>
                        </Card>

                        <Card className="glass border-none shadow-sm rounded-2xl overflow-hidden border-l-4 border-l-amber-500/50">
                            <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                                <CardTitle className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                    <RefreshCcw className="h-3 w-3 text-amber-500" />
                                    Retrabalho
                                </CardTitle>
                                <KPIUpdateDialog
                                    batchId={id}
                                    currentScrap={Number((batch as any).scrap_quantity || 0)}
                                    currentRework={Number((batch as any).rework_quantity || 0)}
                                />
                            </CardHeader>
                            <CardContent>
                                <p className="text-lg font-bold">{(batch as any).rework_quantity || "0"}</p>
                                <p className="text-[10px] font-medium text-muted-foreground uppercase opacity-50">Lotes / Qtd</p>
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
                                        {(() => {
                                            if (!samples?.length) return '—';
                                            // Flatten all analysis results from all samples
                                            const allAnalysis = samples.flatMap(s => s.lab_analysis || []);
                                            // Only count analyzed parameters (is_conforming is not null)
                                            const analyzedParams = allAnalysis.filter((a: any) => a.is_conforming !== null);
                                            if (analyzedParams.length === 0) return '—';
                                            const conformingParams = analyzedParams.filter((a: any) => a.is_conforming === true);
                                            return `${Math.round((conformingParams.length / analyzedParams.length) * 100)}%`;
                                        })()}
                                    </span>
                                </div>
                            </div>
                        </Card>

                        <Card className="glass border-none shadow-sm rounded-2xl p-6">
                            <h3 className="text-xs font-bold uppercase tracking-widest mb-4">Métricas de OEE (Estimadas)</h3>
                            <div className="space-y-4 text-[10px] font-medium text-muted-foreground">
                                <div className="flex justify-between border-b border-white/5 pb-2">
                                    <span>Paragens Avaria</span>
                                    <span className="text-white">{events.filter((e: any) => e.event_type === 'breakdown').length}</span>
                                </div>
                                <div className="flex justify-between border-b border-white/5 pb-2">
                                    <span>Paragens Operacionais</span>
                                    <span className="text-white">{events.filter((e: any) => e.event_type === 'stop').length}</span>
                                </div>
                            </div>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="events" className="mt-6">
                    <StoppagesPanel events={events} />
                </TabsContent>

                <TabsContent value="tanks" className="mt-6">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h3 className="text-lg font-bold tracking-tight">Produtos Intermédios</h3>
                            <p className="text-sm text-muted-foreground">Monitorização de tanques e silos ocupados por este lote.</p>
                        </div>
                        <IntermediateDialog
                            batchId={id}
                            availableTanks={tanks || []}
                            availableProducts={allProducts || []}
                        />
                    </div>

                    {intermediates && intermediates.length > 0 ? (
                        <IntermediatesTable
                            intermediates={intermediatesWithSamples}
                            sampleTypes={sampleTypes || []}
                            samplingPoints={samplingPoints || []}
                            plantId={batch.plant_id}
                            batchCode={batch.code}
                            availableLots={rawMaterialLots || []}
                        />
                    ) : (
                        <div className="text-center py-20 bg-muted/10 rounded-3xl border border-dashed">
                            <Package className="h-8 w-8 mx-auto mb-3 opacity-20" />
                            <p className="text-[10px] font-bold uppercase tracking-widest opacity-40">Nenhum tanque associado a este lote</p>
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="packaging" className="space-y-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-lg font-bold tracking-tight">Utilização de Embalagem</h3>
                            <p className="text-sm text-muted-foreground">Registo de lotes de embalagem utilizados neste lote.</p>
                        </div>
                        <PackagingDialog
                            batchId={batch.id}
                            availableLots={availablePackaging || []}
                        />
                    </div>

                    <Card className="glass border-none overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-muted/50 text-[10px] font-bold uppercase tracking-widest text-muted-foreground border-b border-border/5">
                                    <tr>
                                        <th className="px-6 py-4">Material</th>
                                        <th className="px-6 py-4">Lote</th>
                                        <th className="px-6 py-4 text-right">Quantidade</th>
                                        <th className="px-6 py-4 text-right">Data</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border/5">
                                    {(usedPackaging || []).length > 0 ? (
                                        usedPackaging?.map((usage) => {
                                            const lot = usage.lot as any; // Cast for property access from deep join safely
                                            const material = lot?.material;
                                            const materialName = Array.isArray(material) ? material[0]?.name : material?.name;

                                            return (
                                                <tr key={usage.id} className="hover:bg-muted/30 transition-colors">
                                                    <td className="px-6 py-4 font-medium">
                                                        {materialName || "Material"}
                                                    </td>
                                                    <td className="px-6 py-4 font-mono text-xs">
                                                        {lot?.lot_code}
                                                    </td>
                                                    <td className="px-6 py-4 text-right font-bold">
                                                        {usage.quantity_used} {usage.unit}
                                                    </td>
                                                    <td className="px-6 py-4 text-right text-muted-foreground text-xs">
                                                        {new Date(usage.added_at).toLocaleString('pt-PT')}
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    ) : (
                                        <tr>
                                            <td colSpan={4} className="px-6 py-12 text-center text-muted-foreground uppercase text-[10px] font-bold tracking-widest opacity-30">
                                                Nenhum material de embalagem registado
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </Card>
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


                <TabsContent value="history" className="mt-4">
                    <BatchDossier data={traceabilityData} batchId={id} />
                </TabsContent>
            </Tabs>
        </div>
    );
}

import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Inbox,
    Clock,
    Zap,
    ArrowLeft,
    CheckCircle2,
    Activity,
    FlaskConical,
    Timer,
    ChevronRight,
    Search,
    Filter
} from "lucide-react";
import Link from "next/link";
import { RequestActionButtons } from "./RequestActionButtons";

export const dynamic = "force-dynamic";

export default async function LabRequestsPage() {
    const supabase = await createClient();

    // Fetch pending requests
    const { data: requests } = await supabase
        .from("sample_requests")
        .select(`
            *,
            sampling_plan:production_sampling_plans(id, name, event_anchor, sample_type_id),
            production_batch:production_batches(id, code, product:products(name, sku))
        `)
        .eq("status", "pending")
        .order("requested_at", { ascending: false });

    // Fetch supplementary data for collection dialogs
    // Fetch supplementary data for collection dialogs
    const { data: sampleTypes } = await supabase.from("sample_types").select("id, name, code");
    const { data: tanks } = await supabase.from("intermediate_products").select("id, code, batch:production_batches(id, code, product:products(id, name))").is("deleted_at", null);
    const { data: samplingPoints } = await supabase.from("sampling_points").select("id, name, code").eq("status", "active");
    const { data: users } = await supabase.from("user_profiles").select("id, full_name, role");
    const { data: profile } = await supabase.from("user_profiles").select("plant_id").eq("id", (await supabase.auth.getUser()).data.user?.id).single();

    const getPriorityColor = (priority: string) => {
        const colors: any = {
            critical: "bg-red-500/10 text-red-500 border-red-500/20 shadow-[0_0_10px_rgba(239,68,68,0.2)]",
            urgent: "bg-orange-500/10 text-orange-500 border-orange-500/20",
            normal: "bg-blue-500/10 text-blue-500 border-blue-500/20",
            low: "bg-slate-500/10 text-slate-500 border-slate-500/20"
        };
        return colors[priority] || colors.normal;
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Link href="/lab">
                        <Button variant="ghost" size="icon" className="rounded-full hover:bg-white/10">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-3xl font-black tracking-tighter uppercase italic flex items-center gap-3">
                            <Inbox className="h-8 w-8 text-amber-500" />
                            Pedidos de Amostragem
                        </h1>
                        <p className="text-muted-foreground font-mono text-[10px] uppercase tracking-widest mt-1">
                            Inbox Industrial • Orquestração MES-LIMS
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                        <input
                            placeholder="Procurar lote ou plano..."
                            className="h-10 w-64 bg-slate-900/50 border border-slate-800 rounded-xl pl-10 text-sm focus:ring-amber-500/20 outline-none"
                        />
                    </div>
                    <Button variant="outline" className="border-slate-800 bg-slate-900/50">
                        <Filter className="h-4 w-4 mr-2" /> Filtros
                    </Button>
                </div>
            </div>

            {/* List View */}
            <div className="grid grid-cols-1 gap-4">
                {(!requests || requests.length === 0) ? (
                    <Card className="glass border-dashed bg-white/5 py-24">
                        <CardContent className="flex flex-row items-center justify-center gap-8">
                            <div className="h-24 w-24 rounded-full bg-slate-950 border border-slate-800 flex items-center justify-center relative shadow-2xl">
                                <CheckCircle2 className="h-12 w-12 text-emerald-500 animate-pulse" />
                                <div className="absolute inset-0 rounded-full bg-emerald-500/10 animate-ping" />
                            </div>
                            <div className="text-left">
                                <h3 className="text-2xl font-black text-white uppercase tracking-tight italic">Tudo em conformidade</h3>
                                <p className="text-slate-500 max-w-sm mt-1">
                                    Não existem pedidos de amostragem pendentes no momento. <br />A produção está a fluir conforme planeado.
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                ) : (
                    requests.map(req => (
                        <Card key={req.id} className="glass flex flex-row items-stretch p-0 overflow-hidden group hover:border-amber-500/50 transition-all duration-500 bg-slate-950/40">
                            {/* State Indicator Bar */}
                            <div className={cn(
                                "w-1.5 transition-all duration-500",
                                req.priority === 'critical' ? "bg-red-500" : "bg-amber-500 group-hover:bg-amber-400"
                            )} />

                            <CardContent className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-6 p-6 items-center">
                                {/* Time and Identity */}
                                <div className="md:col-span-3 space-y-2">
                                    <div className="flex items-center gap-2 text-slate-500 font-mono text-[9px] uppercase tracking-widest">
                                        <Timer className="h-3 w-3" />
                                        Há {Math.floor((Date.now() - new Date(req.requested_at).getTime()) / 60000)} min
                                    </div>
                                    <div className="space-y-0.5">
                                        <h4 className="text-lg font-black text-white italic leading-tight group-hover:text-amber-400 transition-colors">
                                            {req.sampling_plan?.name || "Solicitação Industrial"}
                                        </h4>
                                        <p className="text-xs text-slate-500 flex items-center gap-1 font-bold">
                                            <Zap className="h-3 w-3" />
                                            TRIGGER: {req.sampling_plan?.event_anchor || "Manual"}
                                        </p>
                                    </div>
                                </div>

                                {/* Batch Details */}
                                <div className="md:col-span-4 bg-black/40 p-4 rounded-2xl border border-white/5 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Lote em Produção</span>
                                        <Badge variant="outline" className="h-4 text-[9px] bg-blue-500/5 text-blue-400 border-blue-500/20 font-mono">
                                            {req.production_batch?.code}
                                        </Badge>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 flex-shrink-0 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center">
                                            <Activity className="h-5 w-5 text-blue-500" />
                                        </div>
                                        <div className="min-w-0">
                                            <div className="text-sm font-bold text-slate-200 truncate leading-none">
                                                {req.production_batch?.product?.name}
                                            </div>
                                            <div className="text-[10px] text-slate-500 font-mono mt-1">
                                                SKU: {req.production_batch?.product?.sku}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Priority and Quick Info */}
                                <div className="md:col-span-2 flex flex-col items-center justify-center gap-3">
                                    <Badge className={cn("px-4 py-1 uppercase text-[10px] font-black tracking-widest rounded-full", getPriorityColor(req.priority))}>
                                        {req.priority}
                                    </Badge>
                                    <div className="flex items-center gap-4 text-slate-600">
                                        <div className="text-center">
                                            <div className="text-xs font-black text-slate-400 leading-none">0/1</div>
                                            <div className="text-[8px] uppercase tracking-tighter">Colhidas</div>
                                        </div>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="md:col-span-3 flex justify-end items-center gap-3">
                                    <RequestActionButtons
                                        requestId={req.id}
                                        batchId={req.production_batch?.id}
                                        productName={req.production_batch?.product?.name}
                                        batchCode={req.production_batch?.code}
                                        sampleTypes={sampleTypes || []}
                                        tanks={tanks || []}
                                        samplingPoints={samplingPoints || []}
                                        plantId={profile?.plant_id || ""}
                                        users={users || []}
                                        plan={{
                                            sample_type_id: req.sampling_plan?.sample_type_id,
                                            event_anchor: req.sampling_plan?.event_anchor
                                        }}
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
}

function cn(...classes: string[]) {
    return classes.filter(Boolean).join(" ");
}

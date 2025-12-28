import { createClient } from "@/lib/supabase/server";
import { RegisterIncubatorDialog } from "./register-incubator-dialog";
import { AssignSampleDialog } from "./assign-sample-dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Thermometer, Layers, Zap, Plus, AlertCircle, ThermometerSun, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function IncubatorsPage() {
    const supabase = await createClient();

    // Fetch Incubators
    const { data: incubators } = await supabase
        .from("micro_incubators")
        .select("*")
        .order("name");

    // Fetch Pending Samples - only microbiological types
    const { data: pendingSamples } = await supabase
        .from("samples")
        .select(`
            id, 
            code, 
            status,
            sample_type:sample_types(test_category)
        `)
        .eq("status", "pending")
        .limit(50);

    // Filter to only microbiological samples client-side
    // (Supabase doesn't support filtering on nested relations directly)
    const microSamples = pendingSamples?.filter(s => {
        const sampleType = Array.isArray(s.sample_type) ? s.sample_type[0] : s.sample_type;
        return sampleType?.test_category === "microbiological" || sampleType?.test_category === "both";
    }) || [];

    // Fetch Active Media Lots
    const { data: activeMediaLots } = await supabase
        .from("micro_media_lots")
        .select("id, lot_code, expiry_date")
        .eq("status", "active")
        .gt("quantity_current", 0);

    // Fetch a Plant ID
    const { data: plants } = await supabase.from("plants").select("id").limit(1);
    const plantId = plants?.[0]?.id || "00000000-0000-0000-0000-000000000000";

    return (
        <div className="container py-8 space-y-8">
            {/* Premium Header */}
            <div className="glass p-8 rounded-[2.5rem] border-none shadow-2xl bg-gradient-to-br from-orange-500/10 via-slate-900/50 to-transparent relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/10 blur-[100px] -mr-32 -mt-32 rounded-full" />

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
                    <div className="flex items-center gap-6">
                        <div className="p-4 rounded-3xl bg-orange-500/20 border border-orange-500/30">
                            <ThermometerSun className="h-8 w-8 text-orange-400" />
                        </div>
                        <div>
                            <h1 className="text-4xl font-black tracking-tighter bg-gradient-to-r from-slate-100 to-slate-400 bg-clip-text text-transparent">
                                Incubadoras
                            </h1>
                            <p className="text-slate-400 font-medium">
                                Monitorização de temperatura e gestão de capacidade
                            </p>
                        </div>
                    </div>
                    <div>
                        <RegisterIncubatorDialog plantId={plantId} />
                    </div>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {incubators?.map((inc) => (
                    <div key={inc.id} className="glass group relative overflow-hidden rounded-3xl border-slate-800/50 hover:bg-slate-900/40 transition-all flex flex-col">
                        {/* Gradient Accent */}
                        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-orange-500/50 to-transparent opacity-50 group-hover:opacity-100 transition-opacity" />

                        <div className="p-6 flex-1 flex flex-col">
                            <Link href={`/micro/incubators/${inc.id}`} className="block flex-1">
                                <div className="flex items-start justify-between mb-6">
                                    <div className="space-y-1">
                                        <h3 className="text-xl font-bold text-slate-100 group-hover:text-orange-400 transition-colors flex items-center gap-2">
                                            {inc.name}
                                            <ExternalLink className="h-4 w-4 opacity-0 group-hover:opacity-50 transition-opacity" />
                                        </h3>
                                        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
                                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                            Operacional
                                        </div>
                                    </div>
                                    <div className="p-2 rounded-xl bg-slate-800/50 text-slate-400 transition-colors group-hover:bg-slate-800">
                                        <Zap className="h-5 w-5" />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4 mb-6">
                                    <div className="p-4 rounded-2xl bg-slate-950/30 border border-slate-800/50 group-hover:border-slate-700/50 transition-colors">
                                        <div className="flex items-center gap-2 mb-2 text-orange-400">
                                            <Thermometer className="h-4 w-4" />
                                            <span className="text-[10px] font-black uppercase tracking-widest">Temp</span>
                                        </div>
                                        <div className="text-2xl font-black text-slate-100">
                                            {inc.setpoint_temp_c}°C
                                        </div>
                                        <div className="text-[10px] text-slate-500 font-medium mt-1">
                                            Setpoint
                                        </div>
                                    </div>
                                    <div className="p-4 rounded-2xl bg-slate-950/30 border border-slate-800/50 group-hover:border-slate-700/50 transition-colors">
                                        <div className="flex items-center gap-2 mb-2 text-blue-400">
                                            <Layers className="h-4 w-4" />
                                            <span className="text-[10px] font-black uppercase tracking-widest">Ocupação</span>
                                        </div>
                                        <div className="flex items-baseline gap-1">
                                            <span className={cn(
                                                "text-2xl font-black",
                                                (inc.current_usage || 0) >= inc.capacity_plates ? "text-rose-400" : "text-emerald-400"
                                            )}>
                                                {inc.current_usage || 0}
                                            </span>
                                            <span className="text-sm font-bold text-slate-600">
                                                / {inc.capacity_plates}
                                            </span>
                                        </div>
                                        <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
                                            <div
                                                className={cn(
                                                    "h-full rounded-full transition-all duration-500",
                                                    (inc.current_usage || 0) >= inc.capacity_plates ? "bg-rose-500" : "bg-emerald-500"
                                                )}
                                                style={{ width: `${Math.min(((inc.current_usage || 0) / inc.capacity_plates) * 100, 100)}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </Link>

                            <div className="mt-auto pt-2">
                                <AssignSampleDialog
                                    incubatorId={inc.id}
                                    incubatorName={inc.name}
                                    incubatorTempC={inc.setpoint_temp_c}
                                    samples={microSamples}
                                    mediaLots={activeMediaLots || []}
                                />
                            </div>
                        </div>
                    </div>
                ))}

                {incubators?.length === 0 && (
                    <div className="col-span-full py-16 flex flex-col items-center justify-center text-center border-2 border-dashed border-slate-800 rounded-[2.5rem]">
                        <div className="p-6 rounded-full bg-slate-900/50 mb-4">
                            <ThermometerSun className="h-12 w-12 text-slate-700" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-300 mb-2">Sem incubadoras registadas</h3>
                        <p className="text-slate-500 max-w-sm mx-auto mb-6">
                            Registe a sua primeira incubadora para começar a gerir as amostras microbiológicas.
                        </p>
                        <RegisterIncubatorDialog plantId={plantId} />
                    </div>
                )}
            </div>
        </div>
    );
}

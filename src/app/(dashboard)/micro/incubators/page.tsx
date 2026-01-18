import { createClient } from "@/lib/supabase/server";
import { RegisterIncubatorDialog } from "./register-incubator-dialog";
import { AssignSampleDialog } from "./assign-sample-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Thermometer, Layers, Zap, ThermometerSun, ExternalLink } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { PageShell } from "@/components/defaults/page-shell";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";

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
        <PageShell>
            <PageHeader
                variant="purple"
                icon={<ThermometerSun className="h-6 w-6" />}
                overline="Microbiologia"
                title="Incubadoras"
                description="Monitorização de temperatura e gestão de capacidade."
                actions={<RegisterIncubatorDialog plantId={plantId} />}
            />

            <div className="p-6 space-y-6">
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {incubators?.map((inc) => (
                        <Card key={inc.id} className="group relative overflow-hidden transition-all hover:border-primary/50">
                            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                            <CardContent className="p-6 flex flex-col h-full">
                                <Link href={`/micro/incubators/${inc.id}`} className="block flex-1 mb-6">
                                    <div className="flex items-start justify-between mb-6">
                                        <div className="space-y-1">
                                            <h3 className="text-xl font-bold flex items-center gap-2 group-hover:text-primary transition-colors">
                                                {inc.name}
                                                <ExternalLink className="h-4 w-4 opacity-0 group-hover:opacity-50 transition-opacity" />
                                            </h3>
                                            <div className="flex items-center gap-2">
                                                <span className="relative flex h-2 w-2">
                                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                                </span>
                                                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Operacional</span>
                                            </div>
                                        </div>
                                        <div className="p-2 rounded-xl bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                                            <Zap className="h-5 w-5" />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="p-4 rounded-xl bg-muted/50 border border-border group-hover:border-primary/20 transition-colors">
                                            <div className="flex items-center gap-2 mb-2 text-primary">
                                                <Thermometer className="h-4 w-4" />
                                                <span className="text-[10px] font-black uppercase tracking-widest">Temp</span>
                                            </div>
                                            <div className="text-2xl font-black">
                                                {inc.setpoint_temp_c}°C
                                            </div>
                                            <div className="text-[10px] text-muted-foreground font-medium mt-1">
                                                Setpoint
                                            </div>
                                        </div>
                                        <div className="p-4 rounded-xl bg-muted/50 border border-border group-hover:border-primary/20 transition-colors">
                                            <div className="flex items-center gap-2 mb-2 text-blue-500">
                                                <Layers className="h-4 w-4" />
                                                <span className="text-[10px] font-black uppercase tracking-widest">Ocupação</span>
                                            </div>
                                            <div className="flex items-baseline gap-1">
                                                <span className={cn(
                                                    "text-2xl font-black",
                                                    (inc.current_usage || 0) >= inc.capacity_plates ? "text-destructive" : "text-emerald-500"
                                                )}>
                                                    {inc.current_usage || 0}
                                                </span>
                                                <span className="text-sm font-bold text-muted-foreground">
                                                    / {inc.capacity_plates}
                                                </span>
                                            </div>
                                            <div className="w-full bg-muted h-1.5 rounded-full mt-2 overflow-hidden">
                                                <div
                                                    className={cn(
                                                        "h-full rounded-full transition-all duration-500",
                                                        (inc.current_usage || 0) >= inc.capacity_plates ? "bg-destructive" : "bg-emerald-500"
                                                    )}
                                                    style={{ width: `${Math.min(((inc.current_usage || 0) / inc.capacity_plates) * 100, 100)}%` }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </Link>

                                <div className="mt-auto pt-2 border-t border-border/50">
                                    <AssignSampleDialog
                                        incubatorId={inc.id}
                                        incubatorName={inc.name}
                                        incubatorTempC={inc.setpoint_temp_c}
                                        samples={microSamples}
                                        mediaLots={activeMediaLots || []}
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    ))}

                    {incubators?.length === 0 && (
                        <div className="col-span-full py-16 flex flex-col items-center justify-center text-center border-2 border-dashed border-border rounded-xl bg-muted/20">
                            <div className="p-6 rounded-full bg-muted mb-4">
                                <ThermometerSun className="h-12 w-12 text-muted-foreground" />
                            </div>
                            <h3 className="text-xl font-bold mb-2">Sem incubadoras registadas</h3>
                            <p className="text-muted-foreground max-w-sm mx-auto mb-6">
                                Registe a sua primeira incubadora para começar a gerir as amostras microbiológicas.
                            </p>
                            <RegisterIncubatorDialog plantId={plantId} />
                        </div>
                    )}
                </div>
            </div>
        </PageShell>
    );
}

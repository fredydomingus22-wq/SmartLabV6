import { createClient } from "@/lib/supabase/server";
import { RegisterIncubatorDialog } from "./register-incubator-dialog";
import { AssignSampleDialog } from "./assign-sample-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Thermometer, Layers } from "lucide-react";

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
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Incubators</h1>
                    <p className="text-muted-foreground">Monitor temperature and usage.</p>
                </div>
                <RegisterIncubatorDialog plantId={plantId} />
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {incubators?.map((inc) => (
                    <Card key={inc.id} className="glass border-l-4 border-l-blue-500">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                {inc.name}
                            </CardTitle>
                            <Thermometer className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{inc.setpoint_temp_c}°C</div>
                            <p className="text-xs text-muted-foreground">Setpoint</p>

                            <div className="mt-4 flex items-center gap-2 text-sm mb-4">
                                <Layers className="h-4 w-4 text-muted-foreground" />
                                <span>Capacity: {inc.capacity_plates} slots</span>
                            </div>

                            <AssignSampleDialog
                                incubatorId={inc.id}
                                incubatorName={inc.name}
                                samples={microSamples}
                                mediaLots={activeMediaLots || []}
                            />
                        </CardContent>
                    </Card>
                ))}
                {incubators?.length === 0 && (
                    <div className="col-span-full text-center text-muted-foreground py-10">
                        No incubators registered.
                    </div>
                )}
            </div>
        </div>
    );
}

import { createClient } from "@/lib/supabase/server";
import { HazardDialog } from "./hazard-dialog";
import { HazardsPageClient } from "./hazards-page-client";

export const dynamic = "force-dynamic";

export default async function HazardsPage() {
    const supabase = await createClient();

    const { data: hazards } = await supabase
        .from("haccp_hazards")
        .select("*")
        .order("process_step");

    const { data: plants } = await supabase.from("plants").select("id").limit(1);
    const plantId = plants?.[0]?.id || "";

    return (
        <div className="container py-8 space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">HACCP Hazards</h1>
                    <p className="text-muted-foreground">Manage hazard analysis and critical control points.</p>
                </div>
                <HazardDialog plantId={plantId} />
            </div>

            <div className="glass rounded-xl p-6">
                <HazardsPageClient hazards={hazards || []} />
            </div>
        </div>
    );
}


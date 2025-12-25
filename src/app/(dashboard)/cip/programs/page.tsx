import { createClient } from "@/lib/supabase/server";
import { ProgramDialog } from "./program-dialog";
import { CIPProgramsPageClient } from "./programs-page-client";

export const dynamic = "force-dynamic";

export default async function CIPProgramsPage() {
    const supabase = await createClient();

    // Fetch Programs
    const { data: programs } = await supabase
        .from("cip_programs")
        .select("*")
        .order("created_at", { ascending: false });

    const { data: plants } = await supabase.from("plants").select("id").limit(1);
    const plantId = plants?.[0]?.id || "00000000-0000-0000-0000-000000000000";

    return (
        <div className="container py-8 space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">CIP Programs</h1>
                    <p className="text-muted-foreground">Manage cleaning recipes and validation criteria.</p>
                </div>
                <ProgramDialog plantId={plantId} />
            </div>

            <div className="glass rounded-xl p-6">
                <CIPProgramsPageClient programs={programs || []} />
            </div>
        </div>
    );
}


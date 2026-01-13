import { createClient } from "@/lib/supabase/server";
import { ProgramDialog } from "./program-dialog";
import { CIPProgramsPageClient } from "./programs-page-client";
import { PageHeader } from "@/components/layout/page-header";
import { Settings } from "lucide-react";

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
        <div className="space-y-10">
            <PageHeader
                variant="purple"
                icon={<Settings className="h-4 w-4" />}
                overline="Saneamento Industrial • Receitas"
                title="CIP Programs"
                description="Manage cleaning recipes and validation criteria."
                backHref="/cip"
                actions={<ProgramDialog plantId={plantId} />}
            />

            <div className="glass rounded-xl p-6">
                <CIPProgramsPageClient programs={programs || []} />
            </div>
        </div>
    );
}


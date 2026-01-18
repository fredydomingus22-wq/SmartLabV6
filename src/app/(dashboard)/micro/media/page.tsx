import { createClient } from "@/lib/supabase/server";
import { CreateMediaDialog } from "./create-media-dialog";
import { MediaPageClient } from "./media-page-client";
import { PageShell } from "@/components/defaults/page-shell";
import { PageHeader } from "@/components/layout/page-header";
import { FlaskConical } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function MediaPage() {
    const supabase = await createClient();

    // Fetch Media Lots with Type Name
    const { data: lots } = await supabase
        .from("micro_media_lots")
        .select("*, media_type:micro_media_types(name)")
        .neq("status", "exhausted")
        .order("created_at", { ascending: false });

    // Fetch Metadata for Dialog
    const { data: mediaTypes } = await supabase.from("micro_media_types").select("id, name");

    // Fetch a Plant ID
    const { data: plants } = await supabase.from("plants").select("id").limit(1);
    const plantId = plants?.[0]?.id || "00000000-0000-0000-0000-000000000000";

    return (
        <PageShell>
            <PageHeader
                variant="purple"
                icon={<FlaskConical className="h-6 w-6" />}
                title="Estoque de Meios"
                description="Gerencie lotes de meios de cultura e controle de estoque."
                actions={<CreateMediaDialog mediaTypes={mediaTypes || []} plantId={plantId} />}
            />

            <div className="p-6 space-y-6">
                <MediaPageClient lots={lots || []} />
            </div>
        </PageShell>
    );
}


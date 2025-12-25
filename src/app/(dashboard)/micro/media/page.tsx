import { createClient } from "@/lib/supabase/server";
import { CreateMediaDialog } from "./create-media-dialog";
import { MediaPageClient } from "./media-page-client";

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
        <div className="container py-8 space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Media Inventory</h1>
                    <p className="text-muted-foreground">Manage culture media batches and stock.</p>
                </div>
                <CreateMediaDialog mediaTypes={mediaTypes || []} plantId={plantId} />
            </div>

            <div className="glass rounded-xl p-6">
                <MediaPageClient lots={lots || []} />
            </div>
        </div>
    );
}


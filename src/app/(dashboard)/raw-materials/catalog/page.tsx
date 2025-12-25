import { createClient } from "@/lib/supabase/server";
import { getRawMaterials } from "@/lib/queries/raw-materials";
import { MaterialsPageClient } from "./materials-page-client";
import { MaterialDialog } from "./material-dialog";

export const dynamic = "force-dynamic";

export default async function MaterialsPage() {
    const supabase = await createClient();

    // Fetch materials
    const materials = await getRawMaterials();

    // Fetch plant ID
    const { data: plants } = await supabase.from("plants").select("id").limit(1);
    const plantId = plants?.[0]?.id || "";

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Catálogo de Matérias-Primas</h1>
                    <p className="text-muted-foreground">Gerir o catálogo de matérias-primas e especificações.</p>
                </div>
                <MaterialDialog plantId={plantId} />
            </div>

            <div className="glass rounded-xl p-6">
                <MaterialsPageClient materials={materials || []} />
            </div>
        </div>
    );
}


import { createClient } from "@/lib/supabase/server";
import { getPackagingMaterials } from "@/lib/queries/packaging";
import { PackagingPageClient } from "./packaging-page-client";
import { PackagingDialog } from "./packaging-dialog";

export const dynamic = "force-dynamic";

export default async function PackagingMaterialsPage() {
    const supabase = await createClient();

    // Fetch materials
    const materials = await getPackagingMaterials();

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Materiais de Embalagem</h1>
                    <p className="text-muted-foreground">Gerir catálogo de recipientes, tampas e rótulos.</p>
                </div>
                <PackagingDialog />
            </div>

            <div className="glass rounded-xl p-6">
                <PackagingPageClient materials={materials || []} />
            </div>
        </div>
    );
}

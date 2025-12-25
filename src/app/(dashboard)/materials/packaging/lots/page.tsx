import { createClient } from "@/lib/supabase/server";
import { getPackagingLots, getPackagingMaterials } from "@/lib/queries/packaging";
import { PackagingLotsClient } from "./packaging-lots-client";
import { PackagingLotDialog } from "./packaging-lot-dialog";

export const dynamic = "force-dynamic";

export default async function PackagingLotsPage() {
    const supabase = await createClient();

    // Fetch data in parallel
    const [lots, materials] = await Promise.all([
        getPackagingLots(),
        getPackagingMaterials()
    ]);

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Lotes de Embalagem</h1>
                    <p className="text-muted-foreground">Gestão de stock e receção de materiais de embalagem.</p>
                </div>
                <PackagingLotDialog materials={materials || []} />
            </div>

            <div className="glass rounded-xl p-6">
                <PackagingLotsClient lots={lots || []} />
            </div>
        </div>
    );
}

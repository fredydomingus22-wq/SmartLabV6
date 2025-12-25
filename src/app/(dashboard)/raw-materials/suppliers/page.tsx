import { createClient } from "@/lib/supabase/server";
import { getSuppliers } from "@/lib/queries/raw-materials";
import { SuppliersPageClient } from "./suppliers-page-client";
import { SupplierDialog } from "./supplier-dialog";

export const dynamic = "force-dynamic";

export default async function SuppliersPage() {
    const supabase = await createClient();

    // Fetch suppliers
    const suppliers = await getSuppliers();

    // Fetch plant ID
    const { data: plants } = await supabase.from("plants").select("id").limit(1);
    const plantId = plants?.[0]?.id || "";

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Fornecedores</h1>
                    <p className="text-muted-foreground">Gerir fornecedores de matérias-primas e contactos.</p>
                </div>
                <SupplierDialog plantId={plantId} />
            </div>

            <div className="glass rounded-xl p-6">
                <SuppliersPageClient suppliers={suppliers || []} />
            </div>
        </div>
    );
}


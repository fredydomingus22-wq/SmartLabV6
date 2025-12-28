import { createClient } from "@/lib/supabase/server";
import { getSuppliers } from "@/lib/queries/raw-materials";
import { SuppliersPageClient } from "./suppliers-page-client";
import { SupplierDialog } from "./supplier-dialog";
import { Truck, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function SuppliersPage() {
    const supabase = await createClient();

    // Fetch suppliers
    const suppliers = await getSuppliers();

    // Fetch plant ID
    const { data: plants } = await supabase.from("plants").select("id").limit(1);
    const plantId = plants?.[0]?.id || "";

    return (
        <div className="container py-8 space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Link href="/materials">
                        <Button variant="ghost" size="icon" className="text-slate-400">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-slate-100 flex items-center gap-3">
                            <Truck className="h-8 w-8 text-amber-400" />
                            Gestão de Fornecedores
                        </h1>
                        <p className="text-slate-400 mt-1">Qualificação, avaliação e controlo de fornecedores.</p>
                    </div>
                </div>
                <SupplierDialog plantId={plantId} />
            </div>

            <div className="glass rounded-xl p-6">
                <SuppliersPageClient suppliers={suppliers || []} />
            </div>
        </div>
    );
}

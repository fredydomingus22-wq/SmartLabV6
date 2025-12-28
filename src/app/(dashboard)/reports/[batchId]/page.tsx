import { createClient } from "@/lib/supabase/server";
import { getSafeUser } from "@/lib/auth.server";
import { notFound } from "next/navigation";
import ReportDossier from "../components/report-dossier";
import { ArrowLeft, Package } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function BatchReportsPage({ params }: { params: Promise<{ batchId: string }> }) {
    const { batchId } = await params;
    const supabase = await createClient();

    // Fetch Batch Details
    const { data: batch, error } = await supabase
        .from("production_batches")
        .select(`
            id, 
            code, 
            product:products(name),
            status
        `)
        .eq("id", batchId)
        .single();

    if (error || !batch) {
        notFound();
    }

    // Normalize product (Supabase may return array or object)
    const product = Array.isArray(batch.product) ? batch.product[0] : batch.product;
    const productName = product?.name || "Produto";

    return (
        <div className="space-y-8">
            <div className="flex items-center gap-4">
                <Link href="/reports">
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                        <Package className="h-8 w-8 text-indigo-500" />
                        {batch.code}
                    </h1>
                    <p className="text-muted-foreground">
                        Dossier de Relatórios - {productName}
                    </p>
                </div>
            </div>

            <ReportDossier
                batchId={batch.id}
                batchCode={batch.code}
                productName={productName}
            />
        </div>
    );
}


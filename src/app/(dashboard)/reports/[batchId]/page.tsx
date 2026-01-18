import { createClient } from "@/lib/supabase/server";
import { getSafeUser } from "@/lib/auth.server";
import { notFound } from "next/navigation";
import ReportDossier from "../components/report-dossier";
import { ArrowLeft, Package, ClipboardList } from "lucide-react";
import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
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
        <div className="space-y-10 px-6 pb-20">
            <PageHeader
                title={`Dossier: ${batch.code}`}
                overline="Batch Quality Record"
                description={`Agregação completa de registos técnicos, análises laboratoriais e conformidade para o produto ${productName}.`}
                icon={<ClipboardList className="h-4 w-4" />}
                backHref="/reports"
                variant="indigo"
            />

            <ReportDossier
                batchId={batch.id}
                batchCode={batch.code}
                productName={productName}
            />
        </div>
    );
}


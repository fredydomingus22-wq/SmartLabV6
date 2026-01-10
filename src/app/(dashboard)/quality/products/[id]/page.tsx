import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { ProductDetailClientPage } from "./product-detail-client-page";

export const dynamic = "force-dynamic";

interface PageProps {
    params: Promise<{ id: string }>;
}

export default async function ProductDetailPage({ params }: PageProps) {
    const { id } = await params;
    const supabase = await createClient();

    // 1. Fetch Product
    const { data: product, error } = await supabase
        .from("products")
        .select("*")
        .eq("id", id)
        .single();

    if (error || !product) {
        notFound();
    }

    // 2. Fetch Specifications
    const { data: specifications } = await supabase
        .from("product_specifications")
        .select(`
            *,
            parameter:qa_parameters(id, name, code, unit, category)
        `)
        .eq("product_id", id)
        .order("created_at");

    // 3. Fetch Recent Batches
    const { data: recentBatches } = await supabase
        .from("production_batches")
        .select("id, code, status, created_at")
        .eq("product_id", id)
        .order("created_at", { ascending: false })
        .limit(10);

    // 4. Fetch Product History
    const { data: productHistory } = await supabase
        .from("product_history")
        .select(`
            *,
            changed_by_user:user_profiles(full_name)
        `)
        .eq("product_id", id)
        .order("version", { ascending: false });

    // 5. Fetch Specification History
    const { data: specHistory } = await supabase
        .from("specification_history")
        .select(`
            *,
            changed_by_user:user_profiles(full_name),
            parameter:qa_parameters(name, code)
        `)
        .eq("product_id", id)
        .order("superseded_at", { ascending: false })
        .limit(50);

    return (
        <ProductDetailClientPage
            product={product}
            specifications={specifications || []}
            recentBatches={recentBatches || []}
            productHistory={productHistory || []}
            specHistory={specHistory || []}
        />
    );
}


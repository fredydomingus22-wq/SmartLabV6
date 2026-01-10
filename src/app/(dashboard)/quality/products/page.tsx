import { createClient } from "@/lib/supabase/server";
import { ProductsClientPage } from "./products-client-page";

export const dynamic = "force-dynamic";

export default async function ProductsPage() {
    const supabase = await createClient();

    // 1. Fetch Products with Parent Info
    const { data: products } = await supabase
        .from("products")
        .select(`
            *,
            parent:products!parent_id(name, sku)
        `)
        .order("name");

    const safeProducts = products || [];

    // 2. Pre-calculate Stats
    const categories: Record<string, number> = {};
    safeProducts.forEach(p => {
        const cat = p.category || "final";
        categories[cat] = (categories[cat] || 0) + 1;
    });

    // 3. Get Specification Counts
    const { data: specCounts } = await supabase
        .from("product_specifications")
        .select("product_id");

    const specsByProduct = (specCounts || []).reduce((acc, s) => {
        acc[s.product_id] = (acc[s.product_id] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    return (
        <ProductsClientPage
            initialProducts={safeProducts}
            categories={categories}
            specsByProduct={specsByProduct}
        />
    );
}



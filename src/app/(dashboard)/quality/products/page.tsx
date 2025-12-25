import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Package,
    ArrowLeft,
    Search,
    Upload
} from "lucide-react";
import Link from "next/link";
import { ProductDialog } from "./product-dialog";
import { BulkImportDialog } from "./bulk-import-dialog";

export const dynamic = "force-dynamic";

interface PageProps {
    searchParams: Promise<{ status?: string; category?: string; search?: string }>;
}

export default async function ProductsPage({ searchParams }: PageProps) {
    const params = await searchParams;
    const supabase = await createClient();

    // Build query with filters
    let query = supabase
        .from("products")
        .select("*")
        .order("name");

    if (params.status) {
        query = query.eq("status", params.status);
    }

    if (params.category) {
        query = query.eq("category", params.category);
    }

    if (params.search) {
        query = query.or(`name.ilike.%${params.search}%,sku.ilike.%${params.search}%`);
    }

    const { data: products } = await query;

    // Get category counts
    const { data: categoryCounts } = await supabase
        .from("products")
        .select("category")
        .eq("status", "active");

    const categories = (categoryCounts || []).reduce((acc, p) => {
        const cat = p.category || "final";
        acc[cat] = (acc[cat] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    // Get specification counts per product
    const { data: specCounts } = await supabase
        .from("product_specifications")
        .select("product_id");

    const specsByProduct = (specCounts || []).reduce((acc, s) => {
        acc[s.product_id] = (acc[s.product_id] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    const getCategoryLabel = (cat: string) => {
        const labels: Record<string, string> = {
            final: "Produto Final",
            intermediate: "Intermédio",
            raw_material: "Matéria-Prima"
        };
        return labels[cat] || cat;
    };

    const getCategoryColor = (cat: string) => {
        const colors: Record<string, string> = {
            final: "bg-green-100 text-green-700",
            intermediate: "bg-blue-100 text-blue-700",
            raw_material: "bg-orange-100 text-orange-700"
        };
        return colors[cat] || "bg-gray-100 text-gray-700";
    };

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/quality">
                        <Button variant="ghost" size="icon">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                            <Package className="h-8 w-8 text-green-500" />
                            Catálogo de Produtos
                        </h1>
                        <p className="text-muted-foreground">
                            Gerir produtos e as suas especificações
                        </p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <BulkImportDialog />
                    <ProductDialog mode="create" />
                </div>
            </div>

            {/* Category Filter Cards */}
            <div className="grid gap-4 md:grid-cols-4">
                <Link href="/quality/products">
                    <Card className={`glass cursor-pointer hover:border-primary ${!params.category ? 'border-primary' : ''}`}>
                        <CardContent className="pt-6">
                            <div className="text-2xl font-bold">{products?.length || 0}</div>
                            <p className="text-sm text-muted-foreground">Todos os Produtos</p>
                        </CardContent>
                    </Card>
                </Link>
                {Object.entries(categories).map(([cat, count]) => (
                    <Link key={cat} href={`/quality/products?category=${cat}`}>
                        <Card className={`glass cursor-pointer hover:border-primary ${params.category === cat ? 'border-primary' : ''}`}>
                            <CardContent className="pt-6">
                                <div className="text-2xl font-bold">{count}</div>
                                <p className="text-sm text-muted-foreground">{getCategoryLabel(cat)}</p>
                            </CardContent>
                        </Card>
                    </Link>
                ))}
            </div>

            {/* Search & Filters */}
            <Card className="glass">
                <CardContent className="pt-6">
                    <form className="flex gap-4">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <input
                                type="text"
                                name="search"
                                placeholder="Pesquisar por nome ou SKU..."
                                defaultValue={params.search}
                                className="w-full pl-10 pr-4 py-2 border rounded-lg bg-background"
                            />
                        </div>
                        <select
                            name="status"
                            defaultValue={params.status || ""}
                            className="px-4 py-2 border rounded-lg bg-background"
                        >
                            <option value="">Todos os Status</option>
                            <option value="active">Ativos</option>
                            <option value="inactive">Inativos</option>
                        </select>
                        <Button type="submit">Filtrar</Button>
                    </form>
                </CardContent>
            </Card>

            {/* Products Table */}
            <Card className="glass">
                <CardHeader>
                    <CardTitle>Lista de Produtos</CardTitle>
                    <CardDescription>
                        {products?.length || 0} produtos encontrados
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {!products || products.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                            <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p>Nenhum produto encontrado.</p>
                            <p className="text-sm">Crie o primeiro produto ou importe via CSV.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b">
                                        <th className="text-left py-3 px-2">SKU</th>
                                        <th className="text-left py-3 px-2">Nome</th>
                                        <th className="text-left py-3 px-2">Categoria</th>
                                        <th className="text-center py-3 px-2">Specs</th>
                                        <th className="text-center py-3 px-2">Validade</th>
                                        <th className="text-left py-3 px-2">Status</th>
                                        <th className="text-right py-3 px-2">Ações</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {products.map((product) => (
                                        <tr key={product.id} className="border-b hover:bg-muted/50">
                                            <td className="py-3 px-2 font-mono font-medium">{product.sku}</td>
                                            <td className="py-3 px-2">
                                                <Link
                                                    href={`/quality/products/${product.id}`}
                                                    className="hover:underline hover:text-primary font-medium"
                                                >
                                                    {product.name}
                                                </Link>
                                            </td>
                                            <td className="py-3 px-2">
                                                <Badge className={getCategoryColor(product.category)}>
                                                    {getCategoryLabel(product.category)}
                                                </Badge>
                                            </td>
                                            <td className="py-3 px-2 text-center">
                                                <Link
                                                    href={`/quality/specifications?product=${product.id}`}
                                                    className="hover:underline text-primary"
                                                >
                                                    {specsByProduct[product.id] || 0}
                                                </Link>
                                            </td>
                                            <td className="py-3 px-2 text-center">
                                                {product.shelf_life_days ? `${product.shelf_life_days}d` : "-"}
                                            </td>
                                            <td className="py-3 px-2">
                                                <Badge variant={product.status === "active" ? "default" : "secondary"}>
                                                    {product.status === "active" ? "Ativo" : "Inativo"}
                                                </Badge>
                                            </td>
                                            <td className="py-3 px-2 text-right">
                                                <ProductDialog mode="edit" product={product} />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}


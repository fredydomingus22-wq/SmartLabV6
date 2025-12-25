import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Package,
    ArrowLeft,
    ClipboardList,
    Calendar,
    Thermometer,
    Box,
    History,
    User
} from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductDialog } from "../product-dialog";

export const dynamic = "force-dynamic";

interface PageProps {
    params: Promise<{ id: string }>;
}

export default async function ProductDetailPage({ params }: PageProps) {
    const { id } = await params;
    const supabase = await createClient();

    // Fetch product
    const { data: product, error } = await supabase
        .from("products")
        .select("*")
        .eq("id", id)
        .single();

    if (error || !product) {
        notFound();
    }

    // Fetch specifications for this product
    const { data: specifications } = await supabase
        .from("product_specifications")
        .select(`
            id,
            min_value,
            max_value,
            target_value,
            is_critical,
            version,
            parameter:qa_parameters(id, name, code, unit, category)
        `)
        .eq("product_id", id)
        .order("created_at");

    // Fetch recent batches
    const { data: recentBatches } = await supabase
        .from("production_batches")
        .select("id, code, status, created_at")
        .eq("product_id", id)
        .order("created_at", { ascending: false })
        .limit(5);

    // Fetch version history
    const { data: history } = await supabase
        .from("product_history")
        .select(`
            *,
            changed_by_user:changed_by(email)
        `)
        .eq("product_id", id)
        .order("version", { ascending: false });

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

    const getParamCategoryColor = (cat: string) => {
        const colors: Record<string, string> = {
            physico_chemical: "bg-blue-100 text-blue-700",
            microbiological: "bg-green-100 text-green-700",
            sensory: "bg-purple-100 text-purple-700",
            other: "bg-gray-100 text-gray-700"
        };
        return colors[cat] || "bg-gray-100 text-gray-700";
    };

    return (
        <div className="container py-8 space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/quality/products">
                        <Button variant="ghost" size="icon">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                            <Package className="h-8 w-8 text-green-500" />
                            {product.name}
                        </h1>
                        <div className="text-muted-foreground flex items-center gap-2">
                            <span className="font-mono">{product.sku}</span>
                            <Badge className={getCategoryColor(product.category)}>
                                {getCategoryLabel(product.category)}
                            </Badge>
                            <Badge variant={product.status === "active" ? "default" : "secondary"}>
                                {product.status === "active" ? "Ativo" : "Inativo"}
                            </Badge>
                        </div>
                    </div>
                </div>
                <ProductDialog mode="edit" product={product} />
            </div>

            {/* Details Grid */}
            <div className="grid gap-6 md:grid-cols-2">
                <Card className="glass">
                    <CardHeader>
                        <CardTitle>Detalhes do Produto</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-sm text-muted-foreground">Unidade</p>
                                <p className="font-medium flex items-center gap-1">
                                    <Box className="h-4 w-4" />
                                    {product.unit || "unit"}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Validade</p>
                                <p className="font-medium flex items-center gap-1">
                                    <Calendar className="h-4 w-4" />
                                    {product.shelf_life_days ? `${product.shelf_life_days} dias` : "N/A"}
                                </p>
                            </div>
                        </div>

                        {product.storage_conditions && (
                            <div>
                                <p className="text-sm text-muted-foreground">Condições de Armazenamento</p>
                                <p className="font-medium flex items-center gap-1">
                                    <Thermometer className="h-4 w-4" />
                                    {product.storage_conditions}
                                </p>
                            </div>
                        )}

                        {product.description && (
                            <div>
                                <p className="text-sm text-muted-foreground">Descrição</p>
                                <p className="font-medium">{product.description}</p>
                            </div>
                        )}

                        <div className="pt-4 border-t text-xs text-muted-foreground">
                            <p>Criado: {new Date(product.created_at).toLocaleDateString()}</p>
                            {product.updated_at && (
                                <p>Atualizado: {new Date(product.updated_at).toLocaleDateString()}</p>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Recent Batches */}
                <Card className="glass">
                    <CardHeader>
                        <CardTitle>Lotes Recentes</CardTitle>
                        <CardDescription>
                            Últimos {recentBatches?.length || 0} lotes de produção
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {!recentBatches || recentBatches.length === 0 ? (
                            <p className="text-sm text-muted-foreground py-4">
                                Nenhum lote de produção encontrado.
                            </p>
                        ) : (
                            <div className="space-y-2">
                                {recentBatches.map((batch) => (
                                    <Link
                                        key={batch.id}
                                        href={`/production/${batch.id}`}
                                        className="flex items-center justify-between p-2 rounded-lg border hover:bg-muted/50"
                                    >
                                        <span className="font-mono font-medium">{batch.code}</span>
                                        <div className="flex items-center gap-2">
                                            <Badge variant="outline">{batch.status}</Badge>
                                            <span className="text-xs text-muted-foreground">
                                                {new Date(batch.created_at).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Specifications */}
            <Card className="glass">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <ClipboardList className="h-5 w-5" />
                                Especificações
                            </CardTitle>
                            <CardDescription>
                                {specifications?.length || 0} parâmetros de qualidade definidos
                            </CardDescription>
                        </div>
                        <Link href={`/quality/specifications?product=${id}`}>
                            <Button variant="outline" size="sm">
                                Gerir Especificações
                            </Button>
                        </Link>
                    </div>
                </CardHeader>
                <CardContent>
                    {!specifications || specifications.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            <ClipboardList className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p>Nenhuma especificação definida.</p>
                            <Link href={`/quality/specifications?product=${id}`}>
                                <Button variant="link" className="mt-2">
                                    Adicionar Especificações
                                </Button>
                            </Link>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b">
                                        <th className="text-left py-2 px-2">Parâmetro</th>
                                        <th className="text-left py-2 px-2">Categoria</th>
                                        <th className="text-right py-2 px-2">Min</th>
                                        <th className="text-right py-2 px-2">Target</th>
                                        <th className="text-right py-2 px-2">Max</th>
                                        <th className="text-left py-2 px-2">Unidade</th>
                                        <th className="text-center py-2 px-2">Crítico</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {specifications.map((spec: any) => (
                                        <tr key={spec.id} className="border-b hover:bg-muted/50">
                                            <td className="py-2 px-2">
                                                <Link
                                                    href={`/quality/specifications/${spec.id}`}
                                                    className="hover:underline font-medium"
                                                >
                                                    {spec.parameter?.name}
                                                </Link>
                                                <span className="text-xs text-muted-foreground ml-2 font-mono">
                                                    {spec.parameter?.code}
                                                </span>
                                            </td>
                                            <td className="py-2 px-2">
                                                <Badge className={getParamCategoryColor(spec.parameter?.category)}>
                                                    {(spec.parameter?.category || "").replace("_", "-")}
                                                </Badge>
                                            </td>
                                            <td className="py-2 px-2 text-right font-mono">
                                                {spec.min_value ?? "-"}
                                            </td>
                                            <td className="py-2 px-2 text-right font-mono font-bold">
                                                {spec.target_value ?? "-"}
                                            </td>
                                            <td className="py-2 px-2 text-right font-mono">
                                                {spec.max_value ?? "-"}
                                            </td>
                                            <td className="py-2 px-2">{spec.parameter?.unit || "-"}</td>
                                            <td className="py-2 px-2 text-center">
                                                {spec.is_critical ? "⚠️" : "-"}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Version History */}
            <Card className="glass">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <History className="h-5 w-5" />
                        Histórico de Versões
                    </CardTitle>
                    <CardDescription>
                        Versão atual: v{product.version || 1}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {!history || history.length === 0 ? (
                        <p className="text-sm text-muted-foreground py-4">
                            Sem histórico de versões. O histórico é registado quando o produto é atualizado.
                        </p>
                    ) : (
                        <div className="space-y-4">
                            {history.map((h) => (
                                <div key={h.id} className="p-4 border rounded-lg bg-muted/30">
                                    <div className="flex items-center justify-between mb-2">
                                        <Badge variant="outline" className="font-mono">
                                            Versão {h.version}
                                        </Badge>
                                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                                            <Calendar className="h-3 w-3" />
                                            {new Date(h.superseded_at).toLocaleString()}
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-3 gap-2 text-sm">
                                        <div>
                                            <span className="text-muted-foreground">Nome:</span> {h.name}
                                        </div>
                                        <div>
                                            <span className="text-muted-foreground">Categoria:</span> {getCategoryLabel(h.category)}
                                        </div>
                                        <div>
                                            <span className="text-muted-foreground">Validade:</span> {h.shelf_life_days ? `${h.shelf_life_days}d` : "-"}
                                        </div>
                                    </div>
                                    {h.change_reason && (
                                        <p className="text-xs text-muted-foreground mt-2">
                                            Motivo: {h.change_reason}
                                        </p>
                                    )}
                                    <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                                        <User className="h-3 w-3" />
                                        Alterado por: {h.changed_by_user?.email || "Desconhecido"}
                                    </p>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

import { createClient } from "@/lib/supabase/server";
import { getBackwardTrace } from "@/lib/queries/traceability";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TraceabilityGraph } from "@/components/traceability/traceability-graph";
import { ArrowLeft, Package, Factory, Truck, AlertTriangle, Box, GitBranch, Table, User } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

interface PageProps {
    params: Promise<{ id: string }>;
}

export default async function BackwardTracePage({ params }: PageProps) {
    const { id } = await params;

    // Get backward trace
    const { batch, intermediates, materials, error: traceError } = await getBackwardTrace(id);

    if (!batch) {
        notFound();
    }

    const unwrap = (val: any) => Array.isArray(val) ? val[0] : val;
    const product = unwrap(batch.product);
    const line = unwrap(batch.production_line);

    // Group materials by supplier
    const supplierGroups = new Map<string, any[]>();
    for (const mat of materials) {
        const supplierId = mat.supplier?.id || "unknown";
        const supplierName = mat.supplier?.name || "Unknown Supplier";
        if (!supplierGroups.has(supplierId)) {
            supplierGroups.set(supplierId, []);
        }
        supplierGroups.get(supplierId)!.push({ ...mat, supplierName });
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Link href="/traceability">
                        <Button variant="ghost" size="icon" className="rounded-full">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                            <GitBranch className="h-8 w-8 text-primary" />
                            Rastreabilidade
                        </h1>
                        <p className="text-muted-foreground">
                            Rastreio descendente do lote <span className="font-mono font-bold text-foreground">{batch.code}</span>
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Badge variant="outline" className="px-3 py-1 border-primary/20 bg-primary/5">
                        <User className="h-3 w-3 mr-2 text-primary" />
                        Rastreio Automático
                    </Badge>
                </div>
            </div>

            <Tabs defaultValue="visual" className="w-full">
                <TabsList className="grid w-[400px] grid-cols-2 mb-8 glass">
                    <TabsTrigger value="visual" className="flex items-center gap-2">
                        <GitBranch className="h-4 w-4" /> Visual (Árvore)
                    </TabsTrigger>
                    <TabsTrigger value="details" className="flex items-center gap-2">
                        <Table className="h-4 w-4" /> Detalhes (Tabela)
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="visual" className="mt-0">
                    <Card className="glass border-primary/20 overflow-hidden">
                        <CardContent className="p-0">
                            <div className="bg-slate-950/20 p-8 min-h-[500px] overflow-auto">
                                <TraceabilityGraph
                                    batch={batch}
                                    intermediates={intermediates}
                                    materials={materials}
                                    type="backward"
                                />
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="details" className="space-y-8 mt-0">
                    {/* Source Batch Info */}
                    <Card className="glass border-blue-500/30">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-blue-400">
                                <Factory className="h-5 w-5" />
                                Origem: Lote de Produção
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid gap-4 md:grid-cols-4">
                                <div>
                                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Cód. Lote</p>
                                    <p className="font-mono font-bold text-lg">{batch.code}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Produto</p>
                                    <p className="font-medium">{product?.name || "Desconhecido"}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Linha de Produção</p>
                                    <p className="font-medium">{line?.name || "Desconhecida"}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Estado</p>
                                    <Badge variant={batch.status === "completed" ? "default" : "secondary"}>{batch.status}</Badge>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Intermediates */}
                    <div>
                        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                            <Box className="h-5 w-5" />
                            Intermediate Products (Tanks)
                            <Badge variant="secondary">{intermediates.length}</Badge>
                        </h2>
                        <div className="flex flex-wrap gap-2">
                            {intermediates.map((int: any) => (
                                <Badge key={int.id} variant="outline" className="text-sm">
                                    {int.code} • {int.volume} {int.unit} • {int.status}
                                </Badge>
                            ))}
                        </div>
                    </div>

                    {/* Materials by Supplier */}
                    <div>
                        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                            <Truck className="h-5 w-5" />
                            Raw Materials & Suppliers
                            <Badge variant="secondary">{materials.length} lots</Badge>
                        </h2>

                        {traceError && (
                            <Card className="border-destructive">
                                <CardContent className="pt-6">
                                    <p className="text-destructive flex items-center gap-2">
                                        <AlertTriangle className="h-4 w-4" />
                                        {traceError}
                                    </p>
                                </CardContent>
                            </Card>
                        )}

                        {materials.length === 0 ? (
                            <Card className="glass">
                                <CardContent className="pt-6 text-center py-12">
                                    <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                                    <p className="text-muted-foreground">
                                        No raw materials tracked for this batch.
                                    </p>
                                </CardContent>
                            </Card>
                        ) : (
                            <div className="space-y-4">
                                {Array.from(supplierGroups.entries()).map(([supplierId, mats]) => (
                                    <Card key={supplierId} className="glass">
                                        <CardHeader>
                                            <CardTitle className="flex items-center gap-2">
                                                <Truck className="h-5 w-5" />
                                                {mats[0].supplierName}
                                            </CardTitle>
                                            <CardDescription>
                                                {mats.length} lot(s) from this supplier
                                            </CardDescription>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="space-y-3">
                                                {mats.map((mat: any) => (
                                                    <div
                                                        key={`${mat.material.id}-${mat.lot.id}`}
                                                        className="flex items-center justify-between p-3 border rounded-lg"
                                                    >
                                                        <div>
                                                            <p className="font-medium">{mat.material.name}</p>
                                                            <p className="text-sm text-muted-foreground">
                                                                Lot: <span className="font-mono">{mat.lot.code}</span>
                                                            </p>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="font-mono font-bold">
                                                                {mat.totalUsed} {mat.usages[0]?.unit || ""}
                                                            </p>
                                                            <Badge variant="outline">{mat.lot.status}</Badge>
                                                        </div>
                                                        <Link href={`/raw-materials/lots/${mat.lot.id}`}>
                                                            <Button variant="ghost" size="sm">
                                                                View Lot
                                                            </Button>
                                                        </Link>
                                                    </div>
                                                ))}
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}

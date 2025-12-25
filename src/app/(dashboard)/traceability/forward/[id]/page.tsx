import { createClient } from "@/lib/supabase/server";
import { getForwardTrace } from "@/lib/queries/traceability";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TraceabilityGraph } from "@/components/traceability/traceability-graph";
import { ArrowLeft, ArrowRight, Package, Factory, AlertTriangle, GitBranch, Table, User } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

interface PageProps {
    params: Promise<{ id: string }>;
}

export default async function ForwardTracePage({ params }: PageProps) {
    const { id } = await params;
    const supabase = await createClient();

    // Get lot details
    const { data: lot, error: lotError } = await supabase
        .from("raw_material_lots")
        .select(`
            *,
            raw_material:raw_materials(id, name, code),
            supplier:suppliers(id, name, code)
        `)
        .eq("id", id)
        .single();

    if (lotError || !lot) {
        notFound();
    }

    // Get forward trace
    const { batches, error: traceError } = await getForwardTrace(id);

    const unwrap = (val: any) => Array.isArray(val) ? val[0] : val;
    const material = unwrap(lot.raw_material);
    const supplier = unwrap(lot.supplier);

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
                            Rastreio ascendente do lote <span className="font-mono font-bold text-foreground">{lot.lot_code}</span>
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
                                    batch={{
                                        ...lot,
                                        batches_using_this: batches
                                    }}
                                    intermediates={Array.from(new Map(
                                        batches.flatMap(b => b.intermediates || []).map(i => [i.code, i])
                                    ).values())}
                                    materials={[]} // Not used in forward type
                                    type="forward"
                                />
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="details" className="space-y-8 mt-0">
                    {/* Source Lot Info */}
                    <Card className="glass border-green-500/30">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-emerald-400">
                                <Package className="h-5 w-5" />
                                Origem: Lote de Matéria-Prima
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid gap-4 md:grid-cols-4">
                                <div>
                                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Cód. Lote</p>
                                    <p className="font-mono font-bold text-lg">{lot.lot_code}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Material</p>
                                    <p className="font-medium">{material?.name || "Desconhecido"}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Fornecedor</p>
                                    <p className="font-medium">{supplier?.name || "Desconhecido"}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Quantidade</p>
                                    <p className="font-mono">
                                        {lot.quantity_remaining} / {lot.quantity_received} {lot.unit}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Trace Results */}
                    <div>
                        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                            <Factory className="h-5 w-5" />
                            Production Batches Using This Lot
                            <Badge variant="secondary">{batches.length}</Badge>
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

                        {batches.length === 0 ? (
                            <Card className="glass">
                                <CardContent className="pt-6 text-center py-12">
                                    <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                                    <p className="text-muted-foreground">
                                        This lot has not been used in any production batches yet.
                                    </p>
                                </CardContent>
                            </Card>
                        ) : (
                            <div className="space-y-4">
                                {batches.map((batch: any) => {
                                    const product = unwrap(batch.product);
                                    return (
                                        <Card key={batch.id} className="glass hover:shadow-md transition-shadow">
                                            <CardHeader>
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <CardTitle className="font-mono">{batch.code}</CardTitle>
                                                        <CardDescription>{product?.name || "Unknown Product"}</CardDescription>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Badge>{batch.status}</Badge>
                                                        <Link href={`/production/${batch.id}`}>
                                                            <Button variant="outline" size="sm">
                                                                View Batch
                                                            </Button>
                                                        </Link>
                                                    </div>
                                                </div>
                                            </CardHeader>
                                            <CardContent>
                                                <div className="space-y-2">
                                                    <p className="text-sm text-muted-foreground">
                                                        Used in {batch.intermediates?.length || 0} tank(s):
                                                    </p>
                                                    <div className="flex flex-wrap gap-2">
                                                        {batch.intermediates?.map((int: any, idx: number) => (
                                                            <Badge key={idx} variant="outline">
                                                                {int.code}: {int.quantityUsed} {int.unit}
                                                            </Badge>
                                                        ))}
                                                    </div>
                                                    <p className="text-sm font-medium mt-2">
                                                        Total: {batch.totalQuantityUsed} {lot.unit}
                                                    </p>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}

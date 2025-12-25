import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, ArrowRight, ArrowLeft, GitBranch } from "lucide-react";
import { TraceabilitySearch } from "./traceability-search";

export const dynamic = "force-dynamic";

export default async function TraceabilityPage() {
    const supabase = await createClient();

    // Get recent batches for quick access
    const { data: recentBatches } = await supabase
        .from("production_batches")
        .select(`
            id,
            code,
            status,
            start_date,
            product:products(name)
        `)
        .order("created_at", { ascending: false })
        .limit(5);

    // Get recent lots for quick access
    const { data: recentLots } = await supabase
        .from("raw_material_lots")
        .select(`
            id,
            lot_code,
            status,
            received_date,
            raw_material:raw_materials(name)
        `)
        .order("created_at", { ascending: false })
        .limit(5);

    const unwrap = (val: any) => Array.isArray(val) ? val[0] : val;

    return (
        <div className="space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                    <GitBranch className="h-8 w-8 text-primary" />
                    Traceability
                </h1>
                <p className="text-muted-foreground">
                    Track raw materials to finished products and vice versa
                </p>
            </div>

            {/* Search Section */}
            <TraceabilitySearch />

            {/* Quick Access Cards */}
            <div className="grid gap-6 md:grid-cols-2">
                {/* Recent Batches */}
                <Card className="glass">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <ArrowLeft className="h-5 w-5 text-blue-500" />
                            Recent Production Batches
                        </CardTitle>
                        <CardDescription>Backward trace to find raw materials</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            {(recentBatches || []).map((batch) => {
                                const product = unwrap(batch.product);
                                return (
                                    <a
                                        key={batch.id}
                                        href={`/traceability/backward/${batch.id}`}
                                        className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                                    >
                                        <div>
                                            <p className="font-mono font-semibold">{batch.code}</p>
                                            <p className="text-xs text-muted-foreground">{product?.name || "Unknown"}</p>
                                        </div>
                                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                                    </a>
                                );
                            })}
                            {(!recentBatches || recentBatches.length === 0) && (
                                <p className="text-muted-foreground text-sm text-center py-4">No recent batches</p>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Recent Lots */}
                <Card className="glass">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <ArrowRight className="h-5 w-5 text-green-500" />
                            Recent Raw Material Lots
                        </CardTitle>
                        <CardDescription>Forward trace to find finished products</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            {(recentLots || []).map((lot) => {
                                const material = unwrap(lot.raw_material);
                                return (
                                    <a
                                        key={lot.id}
                                        href={`/traceability/forward/${lot.id}`}
                                        className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                                    >
                                        <div>
                                            <p className="font-mono font-semibold">{lot.lot_code}</p>
                                            <p className="text-xs text-muted-foreground">{material?.name || "Unknown"}</p>
                                        </div>
                                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                                    </a>
                                );
                            })}
                            {(!recentLots || recentLots.length === 0) && (
                                <p className="text-muted-foreground text-sm text-center py-4">No recent lots</p>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

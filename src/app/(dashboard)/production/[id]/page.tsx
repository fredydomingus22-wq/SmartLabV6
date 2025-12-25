import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Factory, Beaker, Package, Plus } from "lucide-react";
import Link from "next/link";
import { IntermediateDialog } from "./intermediate-dialog";
import { ReleaseBatchButton } from "./release-batch-button";
import { IngredientDialog } from "./ingredient-dialog";
import { IntermediatesTable } from "./intermediates-table";

export const dynamic = "force-dynamic";

interface PageProps {
    params: Promise<{ id: string }>;
}

export default async function BatchDetailPage({ params }: PageProps) {
    const { id } = await params;
    const supabase = await createClient();

    // Fetch batch with relations
    const { data: batch, error } = await supabase
        .from("production_batches")
        .select(`
            *,
            product:products(id, name, sku),
            line:production_lines(id, name, code)
        `)
        .eq("id", id)
        .single();

    if (error || !batch) {
        notFound();
    }

    // Fetch intermediates for this batch with ingredient details
    const { data: intermediates } = await supabase
        .from("intermediate_products")
        .select(`
            *,
            ingredients:intermediate_ingredients(
                *,
                lot:raw_material_lots(
                    id,
                    lot_code,
                    raw_material:raw_materials(name, code)
                )
            )
        `)
        .eq("production_batch_id", id)
        .order("created_at", { ascending: true });

    // Helper to unwrap Supabase array returns
    const unwrap = (val: any) => Array.isArray(val) ? val[0] : val;
    const product = unwrap(batch.product);
    const line = unwrap(batch.line);

    const statusColors: Record<string, string> = {
        open: "bg-blue-100 text-blue-800",
        closed: "bg-green-100 text-green-800",
        blocked: "bg-red-100 text-red-800",
    };
    const statusColor = statusColors[batch.status] || "bg-gray-100";

    // Fetch available tanks
    const { data: tanks } = await supabase
        .from("equipments")
        .select("id, name, code, status")
        .eq("equipment_type", "tank")
        .eq("status", "active");

    // Fetch sample types and sampling points for the dialog
    const { data: sampleTypes } = await supabase
        .from("sample_types")
        .select("id, name, code")
        .order("name");

    const { data: samplingPoints } = await supabase
        .from("sampling_points")
        .select("id, name, code")
        .order("name");

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link href="/production">
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                </Link>
                <div className="flex-1">
                    <div className="flex items-center gap-3">
                        <h1 className="text-3xl font-bold tracking-tight">{batch.code}</h1>
                        <Badge className={statusColor}>{batch.status}</Badge>
                    </div>
                    <p className="text-muted-foreground">
                        {product?.name || "No Product"} • Line: {line?.name || "N/A"}
                    </p>
                </div>
                <ReleaseBatchButton batchId={id} status={batch.status} />
                <IntermediateDialog batchId={id} availableTanks={tanks || []} />
            </div>

            {/* Batch Info Cards */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card className="glass">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <Factory className="h-4 w-4" />
                            Product
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-xl font-bold">{product?.name || "N/A"}</p>
                        <p className="text-xs text-muted-foreground">SKU: {product?.sku || "-"}</p>
                    </CardContent>
                </Card>

                <Card className="glass">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Planned Qty</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-xl font-bold">{batch.planned_quantity || "-"}</p>
                        <p className="text-xs text-muted-foreground">Actual: {batch.actual_quantity || "-"}</p>
                    </CardContent>
                </Card>

                <Card className="glass">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Start Date</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-xl font-bold">
                            {batch.start_date ? new Date(batch.start_date).toLocaleDateString() : "-"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                            {batch.end_date ? `End: ${new Date(batch.end_date).toLocaleDateString()}` : "In Progress"}
                        </p>
                    </CardContent>
                </Card>

                <Card className="glass">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <Beaker className="h-4 w-4" />
                            Tanks
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-xl font-bold">{intermediates?.length || 0}</p>
                        <p className="text-xs text-muted-foreground">Intermediate products</p>
                    </CardContent>
                </Card>
            </div>

            {/* Intermediates (Tanks) Section */}
            <Card className="glass">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <Package className="h-5 w-5" />
                                Intermediate Products (Tanks)
                            </CardTitle>
                            <CardDescription>
                                Tanks, mixes, and syrups linked to this batch
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {intermediates && intermediates.length > 0 ? (
                        <IntermediatesTable
                            intermediates={intermediates}
                            sampleTypes={sampleTypes || []}
                            samplingPoints={samplingPoints || []}
                            plantId={batch.plant_id}
                            batchCode={batch.code}
                        />
                    ) : (
                        <div className="text-center py-8 text-muted-foreground">
                            <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p>No intermediate products registered yet.</p>
                            <p className="text-sm">Click "Add Tank" to register the first one.</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

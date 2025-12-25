import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Package, Truck, Calendar, FileText, MapPin, ExternalLink } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

interface PageProps {
    params: Promise<{ id: string }>;
}

export default async function LotDetailPage({ params }: PageProps) {
    const { id } = await params;
    const supabase = await createClient();

    // Fetch lot with relations
    const { data: lot, error } = await supabase
        .from("raw_material_lots")
        .select(`
            *,
            raw_material:raw_materials(id, name, code, category, unit),
            supplier:suppliers(id, name, code)
        `)
        .eq("id", id)
        .single();

    if (error || !lot) {
        notFound();
    }

    // Fetch usage history (where this lot was used as ingredient)
    const { data: usageHistory } = await supabase
        .from("intermediate_ingredients")
        .select(`
            id,
            quantity,
            unit,
            added_at,
            intermediate_product:intermediate_products(
                id,
                code,
                production_batch:production_batches(id, code, product:products(name))
            )
        `)
        .eq("raw_material_lot_id", id)
        .order("added_at", { ascending: false });

    // Helper to unwrap Supabase array returns
    const unwrap = (val: any) => Array.isArray(val) ? val[0] : val;
    const material = unwrap(lot.raw_material);
    const supplier = unwrap(lot.supplier);

    const statusColor: Record<string, string> = {
        quarantine: "bg-yellow-100 text-yellow-800",
        approved: "bg-green-100 text-green-800",
        rejected: "bg-red-100 text-red-800",
        expired: "bg-gray-100 text-gray-800",
        depleted: "bg-slate-100 text-slate-800",
    };

    const usagePercentage = lot.quantity_received > 0
        ? Math.round(((lot.quantity_received - lot.quantity_remaining) / lot.quantity_received) * 100)
        : 0;

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link href="/raw-materials/lots">
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                </Link>
                <div className="flex-1">
                    <div className="flex items-center gap-3">
                        <h1 className="text-3xl font-bold tracking-tight font-mono">{lot.lot_code}</h1>
                        <Badge className={statusColor[lot.status] || "bg-gray-100"}>
                            {lot.status}
                        </Badge>
                    </div>
                    <p className="text-muted-foreground">
                        {material?.name || "Unknown Material"} • {material?.code || ""}
                    </p>
                </div>
            </div>

            {/* Info Cards */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card className="glass">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <Package className="h-4 w-4" />
                            Material
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-xl font-bold">{material?.name || "N/A"}</p>
                        <p className="text-xs text-muted-foreground">
                            Category: {material?.category || "-"}
                        </p>
                    </CardContent>
                </Card>

                <Card className="glass">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <Truck className="h-4 w-4" />
                            Supplier
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-xl font-bold">{supplier?.name || "N/A"}</p>
                        <p className="text-xs text-muted-foreground">
                            Code: {supplier?.code || "-"}
                        </p>
                    </CardContent>
                </Card>

                <Card className="glass">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Quantity</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-xl font-bold">
                            {lot.quantity_remaining} / {lot.quantity_received} {lot.unit}
                        </p>
                        <div className="mt-2 h-2 bg-muted rounded-full overflow-hidden">
                            <div
                                className="h-full bg-primary transition-all"
                                style={{ width: `${100 - usagePercentage}%` }}
                            />
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            {usagePercentage}% used
                        </p>
                    </CardContent>
                </Card>

                <Card className="glass">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            Dates
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm">
                            <span className="text-muted-foreground">Received:</span>{" "}
                            {lot.received_date ? new Date(lot.received_date).toLocaleDateString() : "-"}
                        </p>
                        <p className="text-sm">
                            <span className="text-muted-foreground">Expiry:</span>{" "}
                            {lot.expiry_date ? new Date(lot.expiry_date).toLocaleDateString() : "-"}
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Details Section */}
            <div className="grid gap-6 md:grid-cols-2">
                {/* Lot Details */}
                <Card className="glass">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <FileText className="h-5 w-5" />
                            Lot Details
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <p className="text-muted-foreground">Certificate No.</p>
                                <p className="font-medium">{lot.certificate_number || "-"}</p>
                            </div>
                            <div>
                                <p className="text-muted-foreground">Production Date</p>
                                <p className="font-medium">
                                    {lot.production_date ? new Date(lot.production_date).toLocaleDateString() : "-"}
                                </p>
                            </div>
                            <div>
                                <p className="text-muted-foreground">Storage Location</p>
                                <p className="font-medium flex items-center gap-1">
                                    <MapPin className="h-3 w-3" />
                                    {lot.storage_location || "-"}
                                </p>
                            </div>
                            <div>
                                <p className="text-muted-foreground">Created</p>
                                <p className="font-medium">
                                    {lot.created_at ? new Date(lot.created_at).toLocaleDateString() : "-"}
                                </p>
                            </div>
                        </div>

                        {lot.notes && (
                            <div>
                                <p className="text-muted-foreground text-sm">Notes</p>
                                <p className="text-sm mt-1 p-2 bg-muted/30 rounded">{lot.notes}</p>
                            </div>
                        )}

                        {lot.coa_file_url && (
                            <div>
                                <p className="text-muted-foreground text-sm mb-2">Certificate of Analysis</p>
                                <a
                                    href={lot.coa_file_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 px-3 py-2 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors"
                                >
                                    <FileText className="h-4 w-4" />
                                    View/Download COA
                                    <ExternalLink className="h-3 w-3" />
                                </a>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Usage History */}
                <Card className="glass">
                    <CardHeader>
                        <CardTitle>Usage History</CardTitle>
                        <CardDescription>
                            Where this lot has been used in production
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {usageHistory && usageHistory.length > 0 ? (
                            <div className="space-y-3">
                                {usageHistory.map((usage) => {
                                    const intermediate = unwrap(usage.intermediate_product);
                                    const batch = intermediate ? unwrap(intermediate.production_batch) : null;
                                    const product = batch ? unwrap(batch.product) : null;

                                    return (
                                        <div
                                            key={usage.id}
                                            className="flex items-center justify-between p-3 border rounded-lg"
                                        >
                                            <div>
                                                <p className="font-medium">
                                                    {batch?.code || "Unknown Batch"}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    Tank: {intermediate?.code || "-"} • {product?.name || ""}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-mono font-bold">
                                                    {usage.quantity} {usage.unit}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    {new Date(usage.added_at).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="text-center py-8 text-muted-foreground">
                                <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                <p>This lot has not been used yet.</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

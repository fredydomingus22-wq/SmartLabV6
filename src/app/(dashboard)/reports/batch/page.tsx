import { getBatchesForReport } from "@/lib/queries/reports";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Package, CheckCircle, Clock } from "lucide-react";
import Link from "next/link";

import { PageHeader } from "@/components/layout/page-header";

export const dynamic = "force-dynamic";

export default async function BatchReportListPage() {
    const { data: batches } = await getBatchesForReport();

    const statusColors: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
        completed: "default",
        in_progress: "secondary",
        on_hold: "destructive",
        planned: "outline",
    };

    return (
        <div className="space-y-10">
            <PageHeader
                title="Production Batch Reports"
                overline="Traceability Engine"
                description="Rastreabilidade total, análises, NCs e dados de qualidade por lote."
                icon={<Package className="h-4 w-4" />}
                backHref="/reports"
                variant="emerald"
            />

            {/* Batches List */}
            <Card className="glass">
                <CardHeader>
                    <CardTitle>Available Batches</CardTitle>
                    <CardDescription>
                        Select a batch to generate full production report ({batches.length})
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {batches.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
                            <p>No batches available</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {batches.map((batch: any) => (
                                <Link href={`/reports/batch/${batch.id}`} key={batch.id}>
                                    <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 cursor-pointer">
                                        <div className="flex items-center gap-4">
                                            <Package className="h-5 w-5 text-green-500" />
                                            <div>
                                                <p className="font-mono font-semibold">
                                                    {batch.code}
                                                </p>
                                                <p className="text-sm text-muted-foreground">
                                                    {batch.product?.name || "-"}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <Badge variant={statusColors[batch.status] || "outline"}>
                                                {batch.status}
                                            </Badge>
                                            <span className="text-sm text-muted-foreground">
                                                {batch.start_date
                                                    ? new Date(batch.start_date).toLocaleDateString()
                                                    : "-"}
                                            </span>
                                            <Button size="sm">
                                                View Report
                                            </Button>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

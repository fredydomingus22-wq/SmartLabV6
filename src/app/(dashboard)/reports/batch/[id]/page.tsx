import { getBatchReportData } from "@/lib/queries/reports";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    ArrowLeft, Package, CheckCircle, XCircle,
    Beaker, AlertTriangle, FlaskConical, Microscope
} from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { GenerateBatchReportButton } from "./generate-batch-report-button";
import { PrintButton } from "@/components/smart/print-button";

export const dynamic = "force-dynamic";

interface PageProps {
    params: Promise<{ id: string }>;
}

export default async function BatchReportDetailPage({ params }: PageProps) {
    const { id } = await params;
    const data = await getBatchReportData(id);

    if (!data.batch || data.error) {
        notFound();
    }

    const { batch, tanks, ingredients, samples, analysis, ncs, capas, microResults } = data;

    return (
        <div className="space-y-8 print:space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between print:hidden">
                <div className="flex items-center gap-4">
                    <Link href="/reports/batch">
                        <Button variant="ghost" size="icon">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                            <Package className="h-8 w-8 text-green-500" />
                            Production Batch Report
                        </h1>
                        <p className="text-muted-foreground">
                            Batch: {batch.code}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <PrintButton />
                    <GenerateBatchReportButton batchId={id} batchNumber={batch.batch_number} />
                </div>
            </div>

            {/* Report Content */}
            <div className="space-y-6 print:space-y-4">
                {/* Batch Info */}
                <Card className="glass print:shadow-none">
                    <CardHeader className="border-b">
                        <CardTitle className="text-2xl">PRODUCTION BATCH REPORT</CardTitle>
                        <CardDescription className="text-lg">
                            {batch.code}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-muted/50 rounded-lg">
                            <div>
                                <p className="text-sm text-muted-foreground">Batch Code</p>
                                <p className="font-mono font-semibold">{batch.code}</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Status</p>
                                <Badge>{batch.status}</Badge>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Start Date</p>
                                <p>{batch.start_date ? new Date(batch.start_date).toLocaleDateString() : "-"}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Tanks */}
                <Card className="glass print:shadow-none">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Beaker className="h-5 w-5" />
                            Tank Mapping
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {(!tanks || tanks.length === 0) ? (
                            <p className="text-muted-foreground">No tanks assigned</p>
                        ) : (
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                {tanks.map((t: any) => (
                                    <div key={t.id} className="p-3 border rounded-lg">
                                        <p className="font-semibold">{t.tank?.name || t.tank_id}</p>
                                        <p className="text-sm text-muted-foreground">
                                            {t.tank?.capacity_liters}L capacity
                                        </p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Ingredients (Traceability) */}
                <Card className="glass print:shadow-none">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Package className="h-5 w-5" />
                            Ingredients & Traceability
                        </CardTitle>
                        <CardDescription>Raw material lots used in this batch</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {(!ingredients || ingredients.length === 0) ? (
                            <p className="text-muted-foreground">No ingredients recorded</p>
                        ) : (
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b bg-muted/50">
                                        <th className="text-left p-2">Material</th>
                                        <th className="text-left p-2">Lot Number</th>
                                        <th className="text-right p-2">Quantity</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {ingredients.map((ing: any) => (
                                        <tr key={ing.id} className="border-b">
                                            <td className="p-2">{ing.lot?.raw_material?.name || "-"}</td>
                                            <td className="p-2 font-mono">{ing.lot?.lot_number || "-"}</td>
                                            <td className="p-2 text-right">{ing.quantity_used} {ing.unit}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </CardContent>
                </Card>

                {/* Lab Analysis */}
                <Card className="glass print:shadow-none">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <FlaskConical className="h-5 w-5" />
                            Laboratory Analysis
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {(!analysis || analysis.length === 0) ? (
                            <p className="text-muted-foreground">No analysis results</p>
                        ) : (
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b bg-muted/50">
                                        <th className="text-left p-2">Sample</th>
                                        <th className="text-left p-2">Parameter</th>
                                        <th className="text-right p-2">Result</th>
                                        <th className="text-center p-2">Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {(analysis as any[]).map((a: any) => (
                                        <tr key={a.id} className="border-b">
                                            <td className="p-2 font-mono text-sm">{a.sample?.code}</td>
                                            <td className="p-2">{a.parameter?.name}</td>
                                            <td className="p-2 text-right font-mono">
                                                {a.value_numeric ?? a.value_text ?? "-"} {a.parameter?.unit}
                                            </td>
                                            <td className="p-2 text-center">
                                                {a.is_conforming ? (
                                                    <CheckCircle className="h-4 w-4 text-green-500 mx-auto" />
                                                ) : a.is_conforming === false ? (
                                                    <XCircle className="h-4 w-4 text-red-500 mx-auto" />
                                                ) : "-"}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </CardContent>
                </Card>

                {/* Microbiology */}
                {microResults && microResults.length > 0 && (
                    <Card className="glass print:shadow-none">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Microscope className="h-5 w-5" />
                                Microbiology Results
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b bg-muted/50">
                                        <th className="text-left p-2">Session</th>
                                        <th className="text-left p-2">Test Type</th>
                                        <th className="text-right p-2">Result</th>
                                        <th className="text-center p-2">Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {(microResults as any[]).map((r: any) => (
                                        <tr key={r.id} className="border-b">
                                            <td className="p-2 font-mono text-sm">{r.session?.session_code}</td>
                                            <td className="p-2">{r.session?.test_type}</td>
                                            <td className="p-2 text-right font-mono">{r.result}</td>
                                            <td className="p-2 text-center">
                                                {r.is_conforming ? (
                                                    <CheckCircle className="h-4 w-4 text-green-500 mx-auto" />
                                                ) : (
                                                    <XCircle className="h-4 w-4 text-red-500 mx-auto" />
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </CardContent>
                    </Card>
                )}

                {/* NCs */}
                {ncs && ncs.length > 0 && (
                    <Card className="glass print:shadow-none border-orange-200">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-orange-600">
                                <AlertTriangle className="h-5 w-5" />
                                Nonconformities ({ncs.length})
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {ncs.map((nc: any) => (
                                    <div key={nc.id} className="p-3 border rounded-lg bg-orange-50">
                                        <div className="flex items-center justify-between">
                                            <span className="font-mono font-semibold">{nc.nc_number}</span>
                                            <Badge variant={nc.status === "closed" ? "default" : "destructive"}>
                                                {nc.status}
                                            </Badge>
                                        </div>
                                        <p className="text-sm mt-1">{nc.title}</p>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            Severity: {nc.severity}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* CAPAs */}
                {capas && capas.length > 0 && (
                    <Card className="glass print:shadow-none">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <CheckCircle className="h-5 w-5" />
                                Corrective Actions ({capas.length})
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {(capas as any[]).map((capa: any) => (
                                    <div key={capa.id} className="p-3 border rounded-lg">
                                        <div className="flex items-center justify-between">
                                            <span className="font-mono font-semibold">{capa.action_number}</span>
                                            <Badge>{capa.status}</Badge>
                                        </div>
                                        <p className="text-sm mt-1">{capa.description}</p>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Footer */}
                <div className="border-t pt-4 text-sm text-muted-foreground print:text-xs">
                    <p>This report is generated automatically by SmartLab LIMS.</p>
                    <p>Generated on: {new Date().toLocaleString()}</p>
                </div>
            </div>
        </div>
    );
}

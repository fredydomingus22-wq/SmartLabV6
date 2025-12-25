import { getSampleForCoA } from "@/lib/queries/reports";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, FileText, CheckCircle, XCircle } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { GenerateCoAButton } from "./generate-coa-button";
import { PrintButton } from "@/components/smart/print-button";

export const dynamic = "force-dynamic";

interface PageProps {
    params: Promise<{ id: string }>;
}

export default async function CoADetailPage({ params }: PageProps) {
    const { id } = await params;
    const { sample, analysis, error } = await getSampleForCoA(id);

    if (!sample || error) {
        notFound();
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/reports/coa">
                        <Button variant="ghost" size="icon">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                            <FileText className="h-8 w-8 text-blue-500" />
                            Certificate of Analysis
                        </h1>
                        <p className="text-muted-foreground">
                            Sample: {sample.code}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2 print:hidden">
                    <PrintButton />
                    <GenerateCoAButton sampleId={id} sampleCode={sample.code} />
                </div>
            </div>

            {/* CoA Preview */}
            <Card className="glass print:shadow-none">
                <CardHeader className="border-b">
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="text-2xl">CERTIFICATE OF ANALYSIS</CardTitle>
                            <CardDescription className="text-lg mt-1">
                                Sample: {sample.code}
                            </CardDescription>
                        </div>
                        <Badge variant="default" className="text-lg px-4 py-1">
                            {sample.status.toUpperCase()}
                        </Badge>
                    </div>
                </CardHeader>
                <CardContent className="pt-6 space-y-6">
                    {/* Sample Info */}
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 p-4 bg-muted/50 rounded-lg">
                        <div>
                            <p className="text-sm text-muted-foreground">Sample Code</p>
                            <p className="font-mono font-semibold">{sample.code}</p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Product</p>
                            <p className="font-medium">{sample.batch?.product?.name || "-"}</p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Type</p>
                            <p className="font-medium">{sample.sample_type?.name || "-"}</p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Batch</p>
                            <p className="font-mono">{sample.batch?.code || "-"}</p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Collection Date</p>
                            <p>{new Date(sample.collected_at).toLocaleDateString()}</p>
                        </div>
                    </div>

                    {/* Analysis Results */}
                    <div>
                        <h3 className="text-lg font-semibold mb-4">Analysis Results</h3>
                        {analysis.length === 0 ? (
                            <p className="text-muted-foreground text-center py-4">
                                No analysis results recorded
                            </p>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full border-collapse">
                                    <thead>
                                        <tr className="border-b bg-muted/50">
                                            <th className="text-left p-3 font-semibold">Parameter</th>
                                            <th className="text-left p-3 font-semibold">Code</th>
                                            <th className="text-center p-3 font-semibold">Min</th>
                                            <th className="text-center p-3 font-semibold">Target</th>
                                            <th className="text-center p-3 font-semibold">Max</th>
                                            <th className="text-right p-3 font-semibold">Result</th>
                                            <th className="text-left p-3 font-semibold">Unit</th>
                                            <th className="text-center p-3 font-semibold">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {analysis.map((result: any) => (
                                            <tr
                                                key={result.id}
                                                className={`border-b hover:bg-muted/30 ${result.is_critical ? "bg-orange-50" : ""}`}
                                            >
                                                <td className="p-3">
                                                    {result.parameter?.name}
                                                    {result.is_critical && (
                                                        <Badge variant="destructive" className="ml-2 text-xs">CCP</Badge>
                                                    )}
                                                </td>
                                                <td className="p-3 font-mono text-sm">{result.parameter?.code}</td>
                                                <td className="p-3 text-center text-muted-foreground font-mono text-sm">
                                                    {result.spec_min ?? "-"}
                                                </td>
                                                <td className="p-3 text-center text-muted-foreground font-mono text-sm">
                                                    {result.spec_target ?? "-"}
                                                </td>
                                                <td className="p-3 text-center text-muted-foreground font-mono text-sm">
                                                    {result.spec_max ?? "-"}
                                                </td>
                                                <td className="p-3 text-right font-mono font-semibold">
                                                    {result.value_numeric ?? result.value_text ?? "-"}
                                                </td>
                                                <td className="p-3 text-muted-foreground">
                                                    {result.parameter?.unit || "-"}
                                                </td>
                                                <td className="p-3 text-center">
                                                    {result.is_conforming === true ? (
                                                        <CheckCircle className="h-5 w-5 text-green-500 mx-auto" />
                                                    ) : result.is_conforming === false ? (
                                                        <XCircle className="h-5 w-5 text-red-500 mx-auto" />
                                                    ) : (
                                                        <span className="text-muted-foreground">-</span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="border-t pt-6 text-sm text-muted-foreground">
                        <p>This certificate is generated automatically by SmartLab LIMS.</p>
                        <p>Generated on: {new Date().toLocaleString()}</p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

import { getMicroReportData } from "@/lib/queries/reports";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Microscope, Printer, CheckCircle, XCircle, Thermometer, Clock } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

interface PageProps {
    params: Promise<{ id: string }>;
}

export default async function MicroReportDetailPage({ params }: PageProps) {
    const { id } = await params;
    const { session, results, error } = await getMicroReportData(id);

    if (!session || error) {
        notFound();
    }

    return (
        <div className="space-y-8 print:space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between print:hidden">
                <div className="flex items-center gap-4">
                    <Link href="/reports/micro">
                        <Button variant="ghost" size="icon">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                            <Microscope className="h-8 w-8 text-purple-500" />
                            Microbiology Report
                        </h1>
                        <p className="text-muted-foreground">
                            Session: {session.session_code}
                        </p>
                    </div>
                </div>
                <Button variant="outline" onClick={() => window.print()}>
                    <Printer className="h-4 w-4 mr-2" />
                    Print
                </Button>
            </div>

            {/* Report Content */}
            <Card className="glass print:shadow-none">
                <CardHeader className="border-b">
                    <CardTitle className="text-2xl">MICROBIOLOGY TEST REPORT</CardTitle>
                    <CardDescription className="text-lg">
                        Session: {session.session_code}
                    </CardDescription>
                </CardHeader>
                <CardContent className="pt-6 space-y-6">
                    {/* Session Info */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-muted/50 rounded-lg">
                        <div>
                            <p className="text-sm text-muted-foreground">Session Code</p>
                            <p className="font-mono font-semibold">{session.session_code}</p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Test Type</p>
                            <p className="font-medium">{session.test_type || "-"}</p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Incubator</p>
                            <p className="flex items-center gap-1">
                                <Thermometer className="h-4 w-4" />
                                {session.incubator?.name || "-"}
                            </p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Started</p>
                            <p className="flex items-center gap-1">
                                <Clock className="h-4 w-4" />
                                {session.started_at
                                    ? new Date(session.started_at).toLocaleDateString()
                                    : "-"}
                            </p>
                        </div>
                    </div>

                    {/* Temperature */}
                    {session.incubator?.temperature_setpoint && (
                        <div className="p-4 bg-blue-50 rounded-lg">
                            <p className="text-sm text-muted-foreground">Temperature Setpoint</p>
                            <p className="text-2xl font-bold text-blue-600">
                                {session.incubator.temperature_setpoint}°C
                            </p>
                        </div>
                    )}

                    {/* Results */}
                    <div>
                        <h3 className="text-lg font-semibold mb-4">Test Results</h3>
                        {results.length === 0 ? (
                            <p className="text-muted-foreground text-center py-4">
                                No results recorded
                            </p>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full border-collapse">
                                    <thead>
                                        <tr className="border-b bg-muted/50">
                                            <th className="text-left p-3 font-semibold">Media</th>
                                            <th className="text-left p-3 font-semibold">Media Code</th>
                                            <th className="text-right p-3 font-semibold">Result</th>
                                            <th className="text-center p-3 font-semibold">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {results.map((result: any) => (
                                            <tr key={result.id} className="border-b hover:bg-muted/30">
                                                <td className="p-3">{result.media?.name || "-"}</td>
                                                <td className="p-3 font-mono text-sm">{result.media?.code || "-"}</td>
                                                <td className="p-3 text-right font-mono">
                                                    {result.result ?? result.cfu_count ?? "-"}
                                                </td>
                                                <td className="p-3 text-center">
                                                    {result.is_conforming === true ? (
                                                        <CheckCircle className="h-5 w-5 text-green-500 mx-auto" />
                                                    ) : result.is_conforming === false ? (
                                                        <XCircle className="h-5 w-5 text-red-500 mx-auto" />
                                                    ) : (
                                                        <Badge variant="outline">Pending</Badge>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                    {/* Summary */}
                    <div className="grid grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
                        <div className="text-center">
                            <p className="text-2xl font-bold">{results.length}</p>
                            <p className="text-sm text-muted-foreground">Total Tests</p>
                        </div>
                        <div className="text-center">
                            <p className="text-2xl font-bold text-green-600">
                                {results.filter((r: any) => r.is_conforming === true).length}
                            </p>
                            <p className="text-sm text-muted-foreground">Conforming</p>
                        </div>
                        <div className="text-center">
                            <p className="text-2xl font-bold text-red-600">
                                {results.filter((r: any) => r.is_conforming === false).length}
                            </p>
                            <p className="text-sm text-muted-foreground">Non-Conforming</p>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="border-t pt-6 text-sm text-muted-foreground">
                        <p>This report is generated automatically by SmartLab LIMS.</p>
                        <p>Generated on: {new Date().toLocaleString()}</p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

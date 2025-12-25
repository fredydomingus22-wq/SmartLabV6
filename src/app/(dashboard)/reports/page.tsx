import { getReportHistory, getBatchesForReport, getSamplesForCoA } from "@/lib/queries/reports";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Package, Microscope, Download, Clock, CheckCircle } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function ReportsPage() {
    const { data: recentReports } = await getReportHistory({ limit: 10 });
    const { data: samples } = await getSamplesForCoA();
    const { data: batches } = await getBatchesForReport();

    const reportTypeIcons: Record<string, any> = {
        coa: FileText,
        batch_report: Package,
        micro_report: Microscope,
    };

    return (
        <div className="space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                    <FileText className="h-8 w-8 text-primary" />
                    Reports & Exports
                </h1>
                <p className="text-muted-foreground">
                    Generate CoA, production reports, and export data
                </p>
            </div>

            {/* Quick Actions */}
            <div className="grid gap-4 md:grid-cols-4">
                <Link href="/reports/coa">
                    <Card className="glass hover:border-primary/50 transition-colors cursor-pointer">
                        <CardHeader className="pb-2">
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <FileText className="h-5 w-5 text-blue-500" />
                                CoA
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground">
                                Certificate of Analysis
                            </p>
                            <p className="text-2xl font-bold mt-2">{samples.length}</p>
                            <p className="text-xs text-muted-foreground">samples ready</p>
                        </CardContent>
                    </Card>
                </Link>

                <Link href="/reports/batch">
                    <Card className="glass hover:border-primary/50 transition-colors cursor-pointer">
                        <CardHeader className="pb-2">
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <Package className="h-5 w-5 text-green-500" />
                                Batch Report
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground">
                                Production + Traceability
                            </p>
                            <p className="text-2xl font-bold mt-2">{batches.length}</p>
                            <p className="text-xs text-muted-foreground">batches available</p>
                        </CardContent>
                    </Card>
                </Link>

                <Link href="/reports/micro">
                    <Card className="glass hover:border-primary/50 transition-colors cursor-pointer">
                        <CardHeader className="pb-2">
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <Microscope className="h-5 w-5 text-purple-500" />
                                Micro Report
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground">
                                Microbiology sessions
                            </p>
                        </CardContent>
                    </Card>
                </Link>

                <Link href="/reports/export">
                    <Card className="glass hover:border-primary/50 transition-colors cursor-pointer">
                        <CardHeader className="pb-2">
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <Download className="h-5 w-5 text-orange-500" />
                                Export Data
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground">
                                CSV / Excel export
                            </p>
                        </CardContent>
                    </Card>
                </Link>
            </div>

            {/* Recent Reports */}
            <Card className="glass">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Clock className="h-5 w-5" />
                        Recent Reports
                    </CardTitle>
                    <CardDescription>Recently generated reports</CardDescription>
                </CardHeader>
                <CardContent>
                    {recentReports.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                            <p>No reports generated yet</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {recentReports.map((report: any) => {
                                const Icon = reportTypeIcons[report.report_type] || FileText;
                                return (
                                    <div
                                        key={report.id}
                                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50"
                                    >
                                        <div className="flex items-center gap-3">
                                            <Icon className="h-5 w-5 text-muted-foreground" />
                                            <div>
                                                <p className="font-mono font-semibold">
                                                    {report.report_number}
                                                </p>
                                                <p className="text-sm text-muted-foreground">
                                                    {report.title}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <Badge variant={report.status === "signed" ? "default" : "outline"}>
                                                {report.status}
                                            </Badge>
                                            <span className="text-sm text-muted-foreground">
                                                {new Date(report.generated_at).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

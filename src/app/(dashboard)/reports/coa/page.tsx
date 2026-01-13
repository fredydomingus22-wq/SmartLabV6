import { getSamplesForCoA } from "@/lib/queries/reports";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, FileText, FlaskConical, CheckCircle } from "lucide-react";
import Link from "next/link";

import { PageHeader } from "@/components/layout/page-header";

export const dynamic = "force-dynamic";

export default async function CoAListPage() {
    const { data: samples } = await getSamplesForCoA();

    const statusColors: Record<string, "default" | "secondary" | "outline"> = {
        approved: "default",
        reviewed: "secondary",
    };

    return (
        <div className="space-y-10">
            <PageHeader
                title="Certificate of Analysis"
                overline="CoA Generation"
                description="Geração de Certificados de Análise para amostras aprovadas."
                icon={<FileText className="h-4 w-4" />}
                backHref="/reports"
                variant="blue"
            />

            {/* Samples List */}
            <Card className="glass">
                <CardHeader>
                    <CardTitle>Available Samples</CardTitle>
                    <CardDescription>
                        Samples ready for CoA generation ({samples.length})
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {samples.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            <FlaskConical className="h-8 w-8 mx-auto mb-2 opacity-50" />
                            <p>No approved samples available</p>
                            <p className="text-sm">Approve samples in the Lab module first</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {samples.map((sample: any) => (
                                <Link href={`/reports/coa/${sample.id}`} key={sample.id}>
                                    <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 cursor-pointer">
                                        <div className="flex items-center gap-4">
                                            <FlaskConical className="h-5 w-5 text-blue-500" />
                                            <div>
                                                <p className="font-mono font-semibold">
                                                    {sample.code}
                                                </p>
                                                <p className="text-sm text-muted-foreground">
                                                    {sample.sample_type?.name}
                                                    {sample.batch && ` • ${sample.batch.code}`}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <Badge variant={statusColors[sample.status] || "outline"}>
                                                {sample.status}
                                            </Badge>
                                            <span className="text-sm text-muted-foreground">
                                                {new Date(sample.collected_at).toLocaleDateString()}
                                            </span>
                                            <Button size="sm">
                                                Generate CoA
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

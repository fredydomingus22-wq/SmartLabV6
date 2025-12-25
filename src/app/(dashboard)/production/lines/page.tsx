import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Factory } from "lucide-react";
import Link from "next/link";
import { ProductionLineDialog } from "./line-dialog";

export const dynamic = "force-dynamic";

export default async function ProductionLinesPage() {
    const supabase = await createClient();

    const { data: lines } = await supabase
        .from("production_lines")
        .select("*")
        .order("name");

    // Get batch counts
    const { data: batchCounts } = await supabase
        .from("production_batches")
        .select("production_line_id");

    const countByLine: Record<string, number> = {};
    batchCounts?.forEach(b => {
        if (b.production_line_id) {
            countByLine[b.production_line_id] = (countByLine[b.production_line_id] || 0) + 1;
        }
    });

    const getStatusBadge = (status: string) => {
        const styles: Record<string, string> = {
            active: "bg-green-100 text-green-700",
            maintenance: "bg-yellow-100 text-yellow-700",
            inactive: "bg-gray-100 text-gray-700",
        };
        const labels: Record<string, string> = {
            active: "Active",
            maintenance: "Maintenance",
            inactive: "Inactive",
        };
        return <Badge className={styles[status] || styles.inactive}>{labels[status] || status}</Badge>;
    };

    return (
        <div className="container py-8 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <Link href="/production">
                            <Button variant="ghost" size="sm">
                                <ArrowLeft className="h-4 w-4 mr-1" />
                                Production
                            </Button>
                        </Link>
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                        <Factory className="h-8 w-8 text-blue-500" />
                        Production Lines
                    </h1>
                    <p className="text-muted-foreground">
                        Manage plant production lines.
                    </p>
                </div>
                <ProductionLineDialog mode="create" />
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {lines?.map((line) => (
                    <Card key={line.id} className="glass hover:shadow-lg transition-shadow">
                        <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-lg">{line.name}</CardTitle>
                                <Badge variant="outline" className="font-mono">
                                    {line.code}
                                </Badge>
                            </div>
                            <CardDescription className="flex items-center gap-2">
                                {getStatusBadge(line.status)}
                                <span>• {countByLine[line.id] || 0} batches</span>
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center justify-end">
                                <ProductionLineDialog mode="edit" line={line} />
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {(!lines || lines.length === 0) && (
                <Card className="glass">
                    <CardContent className="py-12 text-center">
                        <Factory className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                        <h3 className="font-semibold mb-2">No production lines</h3>
                        <p className="text-muted-foreground mb-4">
                            Create the first line to get started.
                        </p>
                        <ProductionLineDialog mode="create" />
                    </CardContent>
                </Card>
            )}
        </div>
    );
}

import { createClient } from "@/lib/supabase/server";
import { getSafeUser } from "@/lib/auth.server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Droplets, CheckCircle, XCircle } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

async function getCIPData() {
    const supabase = await createClient();
    const user = await getSafeUser();

    // Get CIP cycles
    const { data: cycles } = await supabase
        .from("cip_executions")
        .select(`
            *,
            executed_by:user_profiles!cip_executions_performed_by_fkey(full_name),
            recipe:cip_recipes(name)
        `)
        .eq("organization_id", user.organization_id)
        .order("start_time", { ascending: false })
        .limit(50);

    return { cycles: cycles || [] };
}

export default async function CIPReportPage() {
    const { cycles } = await getCIPData();

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link href="/reports">
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                        <Droplets className="h-8 w-8 text-cyan-500" />
                        CIP Cycle Reports
                    </h1>
                    <p className="text-muted-foreground">
                        Clean-in-Place cycle documentation and compliance
                    </p>
                </div>
            </div>

            {/* Cycles List */}
            <Card className="glass">
                <CardHeader>
                    <CardTitle>Recent CIP Cycles</CardTitle>
                    <CardDescription>
                        Select a cycle to generate a detailed report ({cycles.length} cycles)
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {cycles.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            <Droplets className="h-8 w-8 mx-auto mb-2 opacity-50" />
                            <p>No CIP cycles recorded</p>
                            <p className="text-sm">Complete CIP cycles in the CIP module first</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {cycles.map((cycle: any) => (
                                <Link href={`/reports/cip/${cycle.id}`} key={cycle.id}>
                                    <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 cursor-pointer">
                                        <div className="flex items-center gap-4">
                                            <Droplets className="h-5 w-5 text-cyan-500" />
                                            <div>
                                                <p className="font-mono font-semibold">
                                                    {cycle.cycle_code || `CIP-${cycle.id.substring(0, 8)}`}
                                                </p>
                                                <p className="text-sm text-muted-foreground">
                                                    {cycle.recipe?.name || "Standard Cycle"}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            {cycle.status === "completed" ? (
                                                <Badge variant="default" className="gap-1">
                                                    <CheckCircle className="h-3 w-3" />
                                                    Completed
                                                </Badge>
                                            ) : cycle.status === "failed" ? (
                                                <Badge variant="destructive" className="gap-1">
                                                    <XCircle className="h-3 w-3" />
                                                    Failed
                                                </Badge>
                                            ) : (
                                                <Badge variant="secondary">{cycle.status}</Badge>
                                            )}
                                            <span className="text-sm text-muted-foreground">
                                                {cycle.start_time
                                                    ? new Date(cycle.start_time).toLocaleDateString()
                                                    : "-"}
                                            </span>
                                            <Button size="sm">View Report</Button>
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

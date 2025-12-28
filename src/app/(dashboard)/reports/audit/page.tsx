import { createClient } from "@/lib/supabase/server";
import { getSafeUser } from "@/lib/auth.server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ClipboardCheck, AlertTriangle, CheckCircle } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

async function getAuditData() {
    const supabase = await createClient();
    const user = await getSafeUser();

    // Get audits
    const { data: audits } = await supabase
        .from("audits")
        .select(`
            *,
            lead_auditor:user_profiles!audits_lead_auditor_fkey(full_name)
        `)
        .eq("organization_id", user.organization_id)
        .order("scheduled_start", { ascending: false })
        .limit(50);

    return { audits: audits || [] };
}

export default async function AuditReportPage() {
    const { audits } = await getAuditData();

    const statusColors: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
        completed: "default",
        in_progress: "secondary",
        scheduled: "outline",
        cancelled: "destructive",
    };

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
                        <ClipboardCheck className="h-8 w-8 text-purple-500" />
                        Audit Summary Reports
                    </h1>
                    <p className="text-muted-foreground">
                        Generate audit findings and CAPA summary reports
                    </p>
                </div>
            </div>

            {/* Audits List */}
            <Card className="glass">
                <CardHeader>
                    <CardTitle>Available Audits</CardTitle>
                    <CardDescription>
                        Select an audit to generate a summary report ({audits.length} audits)
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {audits.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            <ClipboardCheck className="h-8 w-8 mx-auto mb-2 opacity-50" />
                            <p>No audits recorded</p>
                            <p className="text-sm">Create audits in the QMS module first</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {audits.map((audit: any) => (
                                <Link href={`/reports/audit/${audit.id}`} key={audit.id}>
                                    <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 cursor-pointer">
                                        <div className="flex items-center gap-4">
                                            <ClipboardCheck className="h-5 w-5 text-purple-500" />
                                            <div>
                                                <p className="font-semibold">
                                                    {audit.title}
                                                </p>
                                                <p className="text-sm text-muted-foreground">
                                                    {audit.audit_type} • Lead: {audit.lead_auditor?.full_name || "-"}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <Badge variant={statusColors[audit.status] || "outline"}>
                                                {audit.status}
                                            </Badge>
                                            <span className="text-sm text-muted-foreground">
                                                {audit.scheduled_start
                                                    ? new Date(audit.scheduled_start).toLocaleDateString()
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

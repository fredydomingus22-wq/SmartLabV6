import { createClient } from "@/lib/supabase/server";
import { AuditLogsGrid } from "./audit-logs-grid";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { History } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AuditLogsPage() {
    const supabase = await createClient();

    // Fetch audit logs
    const { data: logs } = await supabase
        .from("audit_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);

    return (
        <div className="container py-8 space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Audit Logs</h1>
                    <p className="text-muted-foreground">21 CFR Part 11 compliant audit trail.</p>
                </div>
            </div>

            <Card className="glass">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <History className="h-5 w-5" />
                        Recent Activity (Last 100)
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <AuditLogsGrid logs={logs || []} />
                </CardContent>
            </Card>
        </div>
    );
}

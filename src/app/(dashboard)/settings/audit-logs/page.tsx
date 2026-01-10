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
            <div className="glass p-8 rounded-[2.5rem] border-none shadow-2xl bg-gradient-to-br from-slate-500/10 via-slate-900/50 to-transparent relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-slate-500/10 blur-[100px] -mr-32 -mt-32 rounded-full" />
                <div className="relative z-10">
                    <div className="flex items-center gap-4 mb-2">
                        <div className="p-3 rounded-2xl bg-slate-500/20 border border-slate-500/30">
                            <History className="h-6 w-6 text-slate-400" />
                        </div>
                        <div>
                            <h1 className="text-4xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400">
                                Audit Logs
                            </h1>
                            <p className="text-slate-400 font-medium tracking-wide">
                                21 CFR Part 11 compliant industrial audit trail.
                            </p>
                        </div>
                    </div>
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

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Microscope } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function MicroReportListPage() {
    const supabase = await createClient();

    const { data: sessions } = await supabase
        .from("micro_test_sessions")
        .select("id, session_code, test_type, status, started_at")
        .order("started_at", { ascending: false })
        .limit(50);

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
                        <Microscope className="h-8 w-8 text-purple-500" />
                        Microbiology Reports
                    </h1>
                    <p className="text-muted-foreground">
                        Test session reports
                    </p>
                </div>
            </div>

            {/* Sessions List */}
            <Card className="glass">
                <CardHeader>
                    <CardTitle>Test Sessions</CardTitle>
                    <CardDescription>
                        Microbiology test sessions ({sessions?.length || 0})
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {!sessions || sessions.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            <Microscope className="h-8 w-8 mx-auto mb-2 opacity-50" />
                            <p>No microbiology sessions available</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {sessions.map((session: any) => (
                                <Link href={`/reports/micro/${session.id}`} key={session.id}>
                                    <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 cursor-pointer">
                                        <div className="flex items-center gap-4">
                                            <Microscope className="h-5 w-5 text-purple-500" />
                                            <div>
                                                <p className="font-mono font-semibold">
                                                    {session.session_code}
                                                </p>
                                                <p className="text-sm text-muted-foreground">
                                                    {session.test_type}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <span className="text-sm text-muted-foreground">
                                                {session.started_at
                                                    ? new Date(session.started_at).toLocaleDateString()
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

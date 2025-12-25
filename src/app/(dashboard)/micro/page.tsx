import { Microscope, ThermometerSun, ClipboardCheck, History } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getMicroKPIs, getRecentMicroActivities } from "@/lib/queries/micro";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function MicroDashboardPage() {
    const kpis = await getMicroKPIs();
    const activities = await getRecentMicroActivities();

    return (
        <div className="container py-8 space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Microscope className="h-10 w-10 text-primary" />
                    <div>
                        <h1 className="text-3xl font-bold">Microbiology Dashboard</h1>
                        <p className="text-muted-foreground">Overview of microbiological testing</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Link href="/micro/samples">
                        <Button>New Sample</Button>
                    </Link>
                </div>
            </div>

            {/* KPIs */}
            <div className="grid gap-6 md:grid-cols-3">
                <Card className="glass">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">In Incubation</CardTitle>
                        <ThermometerSun className="h-4 w-4 text-orange-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{kpis.incubating}</div>
                        <p className="text-xs text-muted-foreground">Active sessions</p>
                    </CardContent>
                </Card>
                <Card className="glass">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Pending Reading</CardTitle>
                        <ClipboardCheck className="h-4 w-4 text-red-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{kpis.pendingReading}</div>
                        <p className="text-xs text-muted-foreground">Incubation completed</p>
                    </CardContent>
                </Card>
                <Card className="glass">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Completed Today</CardTitle>
                        <History className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{kpis.completedToday}</div>
                        <p className="text-xs text-muted-foreground">Results registered</p>
                    </CardContent>
                </Card>
            </div>

            {/* Recent Activity */}
            <div className="grid gap-6 md:grid-cols-2">
                <Card className="glass">
                    <CardHeader>
                        <CardTitle>Recent Sessions</CardTitle>
                        <CardDescription>Latest started incubation sessions</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {activities.length === 0 ? (
                            <p className="text-sm text-muted-foreground">No recent activity.</p>
                        ) : (
                            <div className="space-y-4">
                                {activities.map((activity: any) => (
                                    <div key={activity.id} className="flex items-center justify-between border-b pb-2 last:border-0">
                                        <div>
                                            <div className="font-medium text-sm">
                                                Incubator: {activity.micro_incubators?.name || "Unknown"}
                                            </div>
                                            <div className="text-xs text-muted-foreground">
                                                Started: {new Date(activity.created_at).toLocaleString()}
                                            </div>
                                        </div>
                                        <Badge variant="outline" className="capitalize">
                                            {activity.status.replace("_", " ")}
                                        </Badge>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

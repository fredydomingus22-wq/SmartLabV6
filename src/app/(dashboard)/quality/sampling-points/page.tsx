import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, ArrowLeft, Plus } from "lucide-react";
import Link from "next/link";
import { SamplingPointDialog } from "./sampling-point-dialog";

export const dynamic = "force-dynamic";

interface PageProps {
    searchParams: Promise<{ status?: string }>;
}

export default async function SamplingPointsPage({ searchParams }: PageProps) {
    const params = await searchParams;
    const supabase = await createClient();

    let query = supabase
        .from("sampling_points")
        .select("*")
        .order("name");

    if (params.status) {
        query = query.eq("status", params.status);
    }

    const { data: points } = await query;

    return (
        <div className="container py-8 space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/quality">
                        <Button variant="ghost" size="icon">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                            <MapPin className="h-8 w-8 text-orange-500" />
                            Sampling Points
                        </h1>
                        <p className="text-muted-foreground">
                            Physical locations where samples are collected
                        </p>
                    </div>
                </div>
                <SamplingPointDialog mode="create" />
            </div>

            {/* Filter */}
            <Card className="glass">
                <CardContent className="pt-6">
                    <div className="flex gap-2">
                        <Link href="/quality/sampling-points">
                            <Button variant={!params.status ? "default" : "outline"} size="sm">
                                All
                            </Button>
                        </Link>
                        <Link href="/quality/sampling-points?status=active">
                            <Button variant={params.status === "active" ? "default" : "outline"} size="sm">
                                Active
                            </Button>
                        </Link>
                        <Link href="/quality/sampling-points?status=inactive">
                            <Button variant={params.status === "inactive" ? "default" : "outline"} size="sm">
                                Inactive
                            </Button>
                        </Link>
                    </div>
                </CardContent>
            </Card>

            {/* Points Table */}
            <Card className="glass">
                <CardHeader>
                    <CardTitle>Sampling Points</CardTitle>
                    <CardDescription>
                        {points?.length || 0} points found
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {!points || points.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                            <MapPin className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p>No sampling points defined.</p>
                            <p className="text-sm">Create sampling points to track where samples are collected.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b">
                                        <th className="text-left py-3 px-2">Code</th>
                                        <th className="text-left py-3 px-2">Name</th>
                                        <th className="text-left py-3 px-2">Location</th>
                                        <th className="text-left py-3 px-2">Status</th>
                                        <th className="text-right py-3 px-2">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {points.map((point) => (
                                        <tr key={point.id} className="border-b hover:bg-muted/50">
                                            <td className="py-3 px-2 font-mono font-medium">
                                                {point.code}
                                            </td>
                                            <td className="py-3 px-2 font-medium">
                                                {point.name}
                                            </td>
                                            <td className="py-3 px-2 text-muted-foreground">
                                                {point.location || "-"}
                                            </td>
                                            <td className="py-3 px-2">
                                                <Badge variant={point.status === "active" ? "default" : "secondary"}>
                                                    {point.status}
                                                </Badge>
                                            </td>
                                            <td className="py-3 px-2 text-right">
                                                <SamplingPointDialog mode="edit" point={point} />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

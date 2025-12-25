import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TestTube, ArrowLeft, Plus } from "lucide-react";
import Link from "next/link";
import { SampleTypeDialog } from "./sample-type-dialog";

export const dynamic = "force-dynamic";

export default async function SampleTypesPage() {
    const supabase = await createClient();

    const { data: sampleTypes } = await supabase
        .from("sample_types")
        .select("*")
        .order("name");

    // Get usage counts
    const { data: usageCounts } = await supabase
        .from("samples")
        .select("sample_type_id");

    const countByType: Record<string, number> = {};
    usageCounts?.forEach(s => {
        countByType[s.sample_type_id] = (countByType[s.sample_type_id] || 0) + 1;
    });

    return (
        <div className="container py-8 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <Link href="/lab">
                            <Button variant="ghost" size="sm">
                                <ArrowLeft className="h-4 w-4 mr-1" />
                                Lab
                            </Button>
                        </Link>
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                        <TestTube className="h-8 w-8 text-purple-500" />
                        Sample Types
                    </h1>
                    <p className="text-muted-foreground">
                        Manage sample types for lab registration.
                    </p>
                </div>
                <SampleTypeDialog mode="create" />
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {sampleTypes?.map((type) => (
                    <Card key={type.id} className="glass hover:shadow-lg transition-shadow">
                        <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-lg">{type.name}</CardTitle>
                                <Badge variant="outline" className="font-mono">
                                    {type.code}
                                </Badge>
                            </div>
                            <CardDescription>
                                {countByType[type.id] || 0} samples registered
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center justify-between">
                                <span className="text-xs text-muted-foreground">
                                    Created {new Date(type.created_at).toLocaleDateString()}
                                </span>
                                <SampleTypeDialog mode="edit" sampleType={type} />
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {(!sampleTypes || sampleTypes.length === 0) && (
                <Card className="glass">
                    <CardContent className="py-12 text-center">
                        <TestTube className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                        <h3 className="font-semibold mb-2">No sample types</h3>
                        <p className="text-muted-foreground mb-4">
                            Create the first sample type to get started.
                        </p>
                        <SampleTypeDialog mode="create" />
                    </CardContent>
                </Card>
            )}
        </div>
    );
}

import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { History, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { HistoryListClient } from "./history-list-client";

export const dynamic = "force-dynamic";

export default async function LabHistoryPage() {
    const supabase = await createClient();

    // Fetch all analysis results ordered by date
    const { data: results, error } = await supabase
        .from("lab_analysis")
        .select(`
            id,
            value_numeric,
            value_text,
            is_conforming,
            is_valid,
            is_retest,
            analyzed_at,
            sample:samples(id, code, status, batch:production_batches(code, product:products(name))),
            parameter:qa_parameters(name, code, unit),
            signed_transaction_hash
        `)
        .order("analyzed_at", { ascending: false })
        .limit(100);

    if (error) {
        console.error("Error fetching history:", error);
    }

    return (
        <div className="container py-8 space-y-8">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/lab">
                        <Button variant="ghost" size="icon">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                            <History className="h-8 w-8 text-purple-500" />
                            Analysis History
                        </h1>
                        <p className="text-muted-foreground">
                            View all analysis results ordered by date
                        </p>
                    </div>
                </div>
            </div>

            <Card className="glass">
                <CardHeader>
                    <CardTitle>Recent Results</CardTitle>
                    <CardDescription>
                        Last 100 analysis results, most recent first.
                        Non-conforming results can be retested.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <HistoryListClient results={results || []} />
                </CardContent>
            </Card>
        </div>
    );
}


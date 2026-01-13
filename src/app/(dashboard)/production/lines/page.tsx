import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Factory } from "lucide-react";
import Link from "next/link";
import { ProductionLineDialog } from "./line-dialog";
import { PageHeader } from "@/components/layout/page-header";

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

    return (
        <div className="space-y-10">
            <PageHeader
                variant="indigo"
                icon={<Factory className="h-4 w-4" />}
                overline="MES Infrastructure"
                title="Production Lines"
                description="Manage and monitor plant filling and processing units."
                backHref="/production"
                actions={<ProductionLineDialog mode="create" />}
            />

            <main className="w-full">
                <ProductionLinesUX
                    lines={lines || []}
                    countByLine={countByLine}
                />
            </main>
        </div>
    );
}

import { cn } from "@/lib/utils";
import { ProductionLinesUX } from "./production-lines-ux";

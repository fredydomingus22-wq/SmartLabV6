import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Factory } from "lucide-react";
import Link from "next/link";
import { ProductionLineDialog } from "./line-dialog";

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
        <div className="flex-1 flex flex-col min-h-screen bg-[#020617] text-slate-100 selection:bg-blue-500/30">
            {/* 🏙️ PREMIUM HEADER */}
            <header className="sticky top-0 z-40 bg-slate-950/60 backdrop-blur-2xl border-b border-white/5 px-8 py-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 max-w-[1700px] mx-auto">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2 mb-2">
                            <Link href="/production">
                                <Button variant="ghost" size="sm" className="h-7 px-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-white hover:bg-white/5 rounded-full">
                                    <ArrowLeft className="h-3 w-3 mr-1" />
                                    Back
                                </Button>
                            </Link>
                            <span className="text-xs font-bold uppercase tracking-widest opacity-70 text-primary">MES Infrastructure</span>
                        </div>
                        <h1 className="text-4xl font-extrabold tracking-tight">
                            Production Lines
                        </h1>
                        <p className="text-muted-foreground text-lg">
                            Manage and monitor plant filling and processing units.
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <ProductionLineDialog mode="create" />
                    </div>
                </div>
            </header>

            <main className="flex-1 p-8 max-w-[1600px] mx-auto w-full">
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

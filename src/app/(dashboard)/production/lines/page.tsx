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
            <header className="sticky top-0 z-40 bg-[#020617]/80 backdrop-blur-xl border-b border-white/5 px-8 py-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 max-w-[1600px] mx-auto">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2 mb-2">
                            <Link href="/production">
                                <Button variant="ghost" size="sm" className="h-7 px-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-white hover:bg-white/5 rounded-full border border-white/5">
                                    <ArrowLeft className="h-3 w-3 mr-1" />
                                    Production Area
                                </Button>
                            </Link>
                            <Badge variant="outline" className="h-7 px-3 text-[10px] font-black uppercase tracking-tighter bg-blue-500/10 text-blue-400 border-blue-500/20 rounded-full animate-pulse-slow">
                                MES Infrastructure
                            </Badge>
                        </div>
                        <h1 className="text-4xl font-black tracking-tighter uppercase flex items-center gap-4">
                            <div className="h-10 w-1 pt-1 bg-gradient-to-b from-blue-500 to-indigo-600 rounded-full" />
                            Production <span className="text-slate-500">Lines</span>
                        </h1>
                        <p className="text-sm text-slate-400 font-medium tracking-tight flex items-center gap-2">
                            <Factory className="h-4 w-4 text-blue-500/50" />
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

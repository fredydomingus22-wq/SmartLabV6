import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Container, Droplets, Settings2 } from "lucide-react";
import Link from "next/link";
import { TankDialog } from "./_components/tank-dialog";
import { TankUX } from "./tank-ux";
import { ArrowLeft } from "lucide-react";

export const dynamic = "force-dynamic";

interface Tank {
    id: string;
    name: string;
    code: string;
    capacity: number | null;
    capacity_unit: string | null;
    status: string;
    created_at: string;
    description: string | null;
}

interface TankContent {
    id: string;
    code: string;
    status: string;
    volume: number | null;
    unit: string | null;
    equipment_id: string;
    batch: { id: string; code: string; product: { id: string; name: string } | null } | null;
}

const statusColors: Record<string, string> = {
    active: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    cleaning: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    maintenance: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    decommissioned: "bg-slate-500/10 text-slate-400 border-slate-500/20",
};

export default async function TanksPage() {
    const supabase = await createClient();

    const { data: tanks } = await supabase
        .from("tanks")
        .select("*")
        .order("code");

    // Get current contents for all tanks
    const { data: contents } = await supabase
        .from("intermediate_products")
        .select(`
            id, code, status, volume, unit, equipment_id,
            batch:production_batches(id, code, product:products(id, name))
        `)
        .in("status", ["pending", "approved", "in_use"]);

    const contentMap = new Map<string, TankContent>();
    contents?.forEach((c: any) => {
        if (c.equipment_id) contentMap.set(c.equipment_id, c);
    });

    return (
        <div className="flex-1 flex flex-col min-h-screen bg-[#020617] text-slate-100 selection:bg-blue-500/30">
            {/* 🌊 PREMIUM TANK MONITORING HEADER */}
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
                            <span className="text-xs font-bold uppercase tracking-widest opacity-70 text-primary">Real-time Telemetry</span>
                        </div>
                        <h1 className="text-4xl font-extrabold tracking-tight">
                            Tank Monitoring
                        </h1>
                        <p className="text-muted-foreground text-lg">
                            Live visualization of storage capacity, contents, and industrial batches.
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <TankDialog />
                    </div>
                </div>
            </header>

            <main className="flex-1 p-8 max-w-[1700px] mx-auto w-full">
                <TankUX
                    tanks={tanks || []}
                    contentMap={contentMap}
                    statusColors={statusColors}
                />
            </main>
        </div>
    );
}

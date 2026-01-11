"use server";

import { createClient } from "@/lib/supabase/server";
import { requirePermission } from "@/lib/permissions.server";
import { getShiftsAction } from "@/app/actions/shifts";

import { CreateOrderWizard } from "./_components/create-order-wizard";
import { OrderPlanningConsole } from "./_components/order-planning-console";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, CalendarRange } from "lucide-react";

export default async function ProductionOrdersPage() {
    const user = await requirePermission('production', 'read');
    const supabase = await createClient();

    const { data: orders } = await supabase
        .from("production_orders")
        .select("*, product:products(name, sku)")
        .order('created_at', { ascending: false });

    const { data: products } = await supabase.from("products").select("id, name, sku").eq('status', 'active');

    // Fetch shifts using the server action to ensure consistency and correct table usage
    let shifts: any[] = [];
    let lines: any[] = [];
    try {
        shifts = await getShiftsAction();
        const { data: linesData } = await supabase.from('production_lines').select('id, code, name').eq('status', 'active');
        lines = linesData || [];
    } catch (e) {
        console.error("Failed to fetch auxiliary data:", e);
    }

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
                            <span className="text-xs font-bold uppercase tracking-widest opacity-70 text-primary">MES Planning</span>
                        </div>
                        <h1 className="text-4xl font-extrabold tracking-tight">
                            Production Planning
                        </h1>
                        <p className="text-muted-foreground text-lg">
                            Gestão de Ordens e Lotes (MES).
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <CreateOrderWizard products={products || []} />
                    </div>
                </div>
            </header>

            <main className="flex-1 p-8 max-w-[1700px] mx-auto w-full">

                <div className="min-h-[500px]">
                    <OrderPlanningConsole
                        orders={orders || []}
                        shifts={shifts || []}
                        availableLines={lines || []}
                    />
                </div>
            </main>
        </div>
    );
}

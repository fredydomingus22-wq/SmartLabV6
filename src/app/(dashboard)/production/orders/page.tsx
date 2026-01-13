import { createClient } from "@/lib/supabase/server";
import { requirePermission } from "@/lib/permissions.server";
import { getShiftsAction } from "@/app/actions/shifts";

import { CreateOrderWizard } from "./_components/create-order-wizard";
import { OrderPlanningConsole } from "./_components/order-planning-console";
import { PageHeader } from "@/components/layout/page-header";
import { CalendarRange } from "lucide-react";

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
        <div className="space-y-10">
            <PageHeader
                variant="indigo"
                icon={<CalendarRange className="h-4 w-4" />}
                overline="MES Planning"
                title="Production Planning"
                description="Gestão de Ordens e Lotes (MES). Orquestração de recursos, linhas e prazos de entrega."
                backHref="/production"
                actions={<CreateOrderWizard products={products || []} />}
            />

            <main className="relative">
                <OrderPlanningConsole
                    orders={orders || []}
                    shifts={shifts || []}
                    availableLines={lines || []}
                />
            </main>

            {/* Global Status Footer */}
            <footer className="flex items-center justify-between pt-10 border-t border-white/5 opacity-50">
                <span className="text-[10px] font-mono tracking-widest uppercase">Planning Engine • SmartLab MES</span>
                <div className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-indigo-500 animate-pulse shadow-[0_0_8px_rgba(99,102,241,0.5)]" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-indigo-500">Resource Allocation Sync</span>
                </div>
            </footer>
        </div>
    );
}

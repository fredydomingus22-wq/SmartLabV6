import { createClient } from "@/lib/supabase/server";
import { CIPRegisterForm } from "./cip-register-form";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { History, RefreshCw } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function CIPRegisterPage() {
    const supabase = await createClient();

    // Fetch all CIP-eligible targets (tanks, production lines, process equipment)
    const { data: tanks } = await supabase
        .from("tanks")
        .select("id, name, code")
        .eq("status", "active")
        .order("code");

    const { data: lines } = await supabase
        .from("production_lines")
        .select("id, name, code")
        .eq("status", "active")
        .order("code");

    const { data: processEquipment } = await supabase
        .from("process_equipment")
        .select("id, name, code, equipment_category")
        .eq("status", "active")
        .order("code");

    // Build unified equipment list with target_type
    const equipments = [
        ...(tanks || []).map(t => ({ id: t.id, name: t.name, code: t.code, equipment_type: "tank", target_type: "tank" })),
        ...(lines || []).map(l => ({ id: l.id, name: l.name, code: l.code, equipment_type: "production_line", target_type: "production_line" })),
        ...(processEquipment || []).map(e => ({ id: e.id, name: e.name, code: e.code, equipment_type: e.equipment_category, target_type: "process_equipment" })),
    ];

    // Fetch all CIP programs
    const { data: programs } = await supabase
        .from("cip_programs")
        .select("id, name, target_equipment_type");

    // Fetch all program steps
    const { data: programSteps } = await supabase
        .from("cip_program_steps")
        .select("id, program_id, step_order, name, target_temp_c, target_duration_sec, target_conductivity")
        .order("step_order");

    return (
        <div className="container py-8 space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-100 flex items-center gap-3">
                        <RefreshCw className="h-8 w-8 text-cyan-400" />
                        Registar CIP
                    </h1>
                    <p className="text-slate-400 mt-1">
                        Registe um ciclo de limpeza completado para tanques, linhas ou equipamentos.
                    </p>
                </div>
                <Link href="/cip/history">
                    <Button variant="outline" className="glass border-slate-800">
                        <History className="mr-2 h-4 w-4" /> Histórico
                    </Button>
                </Link>
            </div>

            <CIPRegisterForm
                equipments={equipments}
                programs={programs || []}
                programSteps={programSteps || []}
            />
        </div>
    );
}

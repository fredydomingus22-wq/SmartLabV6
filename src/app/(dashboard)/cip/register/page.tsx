import { createClient } from "@/lib/supabase/server";
import { CIPRegisterForm } from "./cip-register-form";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { History, RefreshCw } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";

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
        <div className="space-y-10">
            <PageHeader
                variant="cyan"
                icon={<RefreshCw className="h-4 w-4" />}
                overline="Saneamento Industrial • Registo de Operações"
                title="Registar CIP"
                description="Registe um ciclo de limpeza completado para tanques, linhas ou equipamentos."
                backHref="/cip"
                actions={
                    <Link href="/cip/history">
                        <Button variant="outline" className="h-9 bg-slate-900/50 border-slate-800 rounded-xl text-[10px] font-black uppercase tracking-widest px-4 transition-all">
                            <History className="mr-2 h-4 w-4" /> Histórico
                        </Button>
                    </Link>
                }
            />

            <CIPRegisterForm
                equipments={equipments}
                programs={programs || []}
                programSteps={programSteps || []}
            />
        </div>
    );
}

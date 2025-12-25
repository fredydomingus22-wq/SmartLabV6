import { createClient } from "@/lib/supabase/server";
import { CIPRegisterForm } from "./cip-register-form";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { History } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function CIPRegisterPage() {
    const supabase = await createClient();

    // Fetch all equipment
    const { data: equipments } = await supabase
        .from("equipments")
        .select("id, name, code, equipment_type")
        .order("code");

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
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Registar CIP</h1>
                    <p className="text-muted-foreground">Registe um ciclo de limpeza completado.</p>
                </div>
                <Link href="/cip/history">
                    <Button variant="outline">
                        <History className="mr-2 h-4 w-4" /> Histórico
                    </Button>
                </Link>
            </div>

            <CIPRegisterForm
                equipments={equipments || []}
                programs={programs || []}
                programSteps={programSteps || []}
            />
        </div>
    );
}

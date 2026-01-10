import { createClient } from "@/lib/supabase/server";
import { RoutineCheckForm } from "./routine-check-form";
import { FlaskConical, History, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function LabRoutineChecksPage() {
    const supabase = await createClient();

    // Get lab assets (instruments) from new table
    const { data: instruments } = await supabase
        .from("lab_assets")
        .select("id, name, code, asset_category, verification_config, last_verification_at, last_verification_result")
        .eq("status", "active")
        .order("name");

    const filteredInstruments = instruments?.filter(inst => {
        const config = inst.verification_config as any;
        // Show if explicitly true or if the field doesn't exist (default)
        return config?.daily_verification_enabled !== false;
    });

    return (
        <div className="container py-8 space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-100 flex items-center gap-3">
                        <FlaskConical className="h-8 w-8 text-emerald-400" />
                        Verificações de Rotina
                    </h1>
                    <p className="text-slate-400 mt-1">
                        Registo diário/semanal de conformidade dos equipamentos de laboratório.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Link href="/production/equipment">
                        <Button variant="outline" className="glass border-slate-800">
                            <Settings2 className="h-4 w-4 mr-2" />
                            Gestão de Ativos
                        </Button>
                    </Link>
                    <Link href="/lab/equipment/routine-checks/history">
                        <Button variant="ghost" className="text-slate-400">
                            <History className="h-4 w-4 mr-2" />
                            Histórico
                        </Button>
                    </Link>
                </div>
            </div>

            {filteredInstruments && filteredInstruments.length > 0 ? (
                <RoutineCheckForm equipments={filteredInstruments} />
            ) : (
                <div className="text-center py-20 bg-slate-900/40 rounded-3xl border border-dashed border-slate-800">
                    <FlaskConical className="h-12 w-12 text-slate-700 mx-auto mb-4 opacity-20" />
                    <p className="text-slate-500 italic">Nenhum instrumento de laboratório configurado para verificação.</p>
                </div>
            )}
        </div>
    );
}

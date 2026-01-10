import { createClient } from "@/lib/supabase/server";
import { FlaskConical, History, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { VerificationHistoryList } from "./verification-history-list";

export const dynamic = "force-dynamic";

export default async function LabVerificationHistoryPage() {
    const supabase = await createClient();

    // Fetch maintenance logs specifically for lab_assets and verification
    const { data: logs, error } = await supabase
        .from("maintenance_logs")
        .select(`
            *,
            asset:lab_assets(name, code),
            performer:user_profiles(full_name)
        `)
        .eq("asset_type", "lab_asset")
        .eq("maintenance_type", "verification")
        .order("performed_at", { ascending: false })
        .limit(100);

    if (error) {
        console.error("Error fetching verification history:", error);
    }

    return (
        <div className="container py-8 space-y-8">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/lab/equipment/routine-checks">
                        <Button variant="ghost" size="icon" className="glass">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-slate-100 flex items-center gap-3">
                            <History className="h-8 w-8 text-emerald-400" />
                            Histórico de Verificações
                        </h1>
                        <p className="text-slate-400 mt-1">
                            Registo completo de todas as verificações diárias de calibração.
                        </p>
                    </div>
                </div>
            </div>

            <VerificationHistoryList logs={logs || []} />
        </div>
    );
}

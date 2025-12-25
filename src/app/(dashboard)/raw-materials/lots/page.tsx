import { createClient } from "@/lib/supabase/server";
import { getLots, getRawMaterialStats } from "@/lib/queries/raw-materials";
import { LotsPageClient } from "./lots-page-client";
import { ReceiveLotDialog } from "./receive-lot-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, AlertTriangle, CheckCircle, Clock } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function RawMaterialsLotsPage() {
    const supabase = await createClient();

    // Fetch lots
    const lots = await getLots({ limit: 50 });

    // Fetch stats
    const stats = await getRawMaterialStats();

    // Fetch metadata for dialogs
    const { data: materials } = await supabase
        .from("raw_materials")
        .select("id, name, code, unit")
        .eq("status", "active")
        .order("name");

    const { data: suppliers } = await supabase
        .from("suppliers")
        .select("id, name, code")
        .eq("status", "active")
        .order("name");

    const { data: plants } = await supabase.from("plants").select("id").limit(1);
    const plantId = plants?.[0]?.id || "";

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Lotes de Matéria-Prima</h1>
                    <p className="text-muted-foreground">Receber e gerir o inventário de matérias-primas.</p>
                </div>
                <ReceiveLotDialog
                    materials={materials || []}
                    suppliers={suppliers || []}
                    plantId={plantId}
                />
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card className="glass">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Total de Lotes</CardTitle>
                        <Package className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalLots}</div>
                    </CardContent>
                </Card>
                <Card className="glass">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Em Quarentena</CardTitle>
                        <Clock className="h-4 w-4 text-yellow-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-yellow-500">{stats.inQuarantine}</div>
                    </CardContent>
                </Card>
                <Card className="glass">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Aprovados</CardTitle>
                        <CheckCircle className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-500">{stats.approved}</div>
                    </CardContent>
                </Card>
                <Card className="glass">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">A Expirar</CardTitle>
                        <AlertTriangle className="h-4 w-4 text-orange-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-orange-500">{stats.expiringSoon}</div>
                    </CardContent>
                </Card>
            </div>

            {/* Lots Table */}
            <div className="glass rounded-xl p-6">
                <LotsPageClient lots={lots || []} />
            </div>
        </div>
    );
}


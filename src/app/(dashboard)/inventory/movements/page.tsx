import { createClient } from "@/lib/supabase/server";
import { MovementsPageClient } from "./movements-page-client";

export const dynamic = "force-dynamic";

export default async function MovementsPage() {
    const supabase = await createClient();

    // Fetch Movements with Reagent Name
    const { data: movements } = await supabase
        .from("reagent_movements")
        .select(`
        *,
        reagent:reagents(name, unit)
    `)
        .order("created_at", { ascending: false })
        .limit(100);

    return (
        <div className="container py-8 space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Stock Movements</h1>
                <p className="text-muted-foreground">Audit log of all chemical transactions.</p>
            </div>

            <div className="glass rounded-xl p-6">
                <MovementsPageClient movements={movements || []} />
            </div>
        </div>
    );
}


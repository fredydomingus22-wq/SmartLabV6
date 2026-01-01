import { createClient } from "@/lib/supabase/server";
import { HazardDialog } from "./hazard-dialog";
import { HazardsPageClient } from "./hazards-page-client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { VersionsList } from "./_components/versions-list";

export const dynamic = "force-dynamic";

export default async function HazardsPage() {
    const supabase = await createClient();

    const { data: hazards } = await supabase
        .from("haccp_hazards")
        .select("*")
        .order("process_step");

    const { data: versions } = await supabase
        .from("haccp_plan_versions")
        .select("*")
        .order("created_at", { ascending: false });

    const { data: plants } = await supabase.from("plants").select("id").limit(1);
    const plantId = plants?.[0]?.id || "";

    return (
        <div className="container py-8 space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">HACCP Management</h1>
                    <p className="text-muted-foreground">Análise de perigos e ciclo de vida do plano de segurança alimentar.</p>
                </div>
                <div className="flex gap-2">
                    <HazardDialog plantId={plantId} />
                </div>
            </div>

            <Tabs defaultValue="hazards" className="space-y-6">
                <TabsList className="glass p-1">
                    <TabsTrigger value="hazards">Análise de Perigos</TabsTrigger>
                    <TabsTrigger value="versions">Versões do Plano</TabsTrigger>
                </TabsList>

                <TabsContent value="hazards" className="space-y-4">
                    <div className="glass rounded-xl p-6">
                        <HazardsPageClient hazards={hazards || []} />
                    </div>
                </TabsContent>

                <TabsContent value="versions">
                    <div className="glass rounded-xl p-6">
                        <VersionsList versions={versions || []} />
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}



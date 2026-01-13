import { createClient } from "@/lib/supabase/server";
import { HazardDialog } from "./hazard-dialog";
import { HazardsPageClient } from "./hazards-page-client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { VersionsList } from "./_components/versions-list";
import { PageHeader } from "@/components/layout/page-header";
import { ShieldCheck, FileText } from "lucide-react";

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
        <div className="space-y-10">
            <PageHeader
                variant="indigo"
                icon={<ShieldCheck className="h-4 w-4" />}
                overline="Safety Protocol • Food Defense"
                title="HACCP Management"
                description="Análise de perigos e ciclo de vida do plano de segurança alimentar."
                backHref="/haccp"
                actions={<HazardDialog plantId={plantId} />}
            />

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



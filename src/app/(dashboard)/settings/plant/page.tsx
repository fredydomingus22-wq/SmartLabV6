import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, MapPin, Globe } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function PlantConfigPage() {
    const supabase = await createClient();

    // Fetch organization and plant data
    const { data: org } = await supabase.from("organizations").select("*").limit(1).single();
    const { data: plant } = await supabase.from("plants").select("*").limit(1).single();

    return (
        <div className="container py-8 space-y-8">
            <div className="glass p-8 rounded-[2.5rem] border-none shadow-2xl bg-gradient-to-br from-emerald-500/10 via-slate-900/50 to-transparent relative overflow-hidden mb-8">
                <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 blur-[100px] -mr-32 -mt-32 rounded-full" />
                <div className="relative z-10">
                    <div className="flex items-center gap-4 mb-2">
                        <div className="p-3 bg-emerald-500/20 rounded-2xl border border-emerald-500/30">
                            <Building2 className="h-6 w-6 text-emerald-400" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400">
                                Configuração da Unidade
                            </h1>
                            <p className="text-slate-400 font-medium">Configurações da organização e da planta industrial.</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                {/* Organization Card */}
                <Card className="glass">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Building2 className="h-5 w-5" />
                            Organization
                        </CardTitle>
                        <CardDescription>Your company information</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Name</span>
                            <span className="font-medium">{org?.name || "N/A"}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Country</span>
                            <span className="font-medium">{org?.country || "N/A"}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Subscription</span>
                            <span className="font-medium">{org?.subscription_plan || "Free"}</span>
                        </div>
                    </CardContent>
                </Card>

                {/* Plant Card */}
                <Card className="glass">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <MapPin className="h-5 w-5" />
                            Plant
                        </CardTitle>
                        <CardDescription>Active facility</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Name</span>
                            <span className="font-medium">{plant?.name || "N/A"}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Location</span>
                            <span className="font-medium">{plant?.location || "N/A"}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Timezone</span>
                            <span className="font-medium">{plant?.timezone || "UTC"}</span>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

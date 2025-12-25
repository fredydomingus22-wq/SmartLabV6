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
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Plant Configuration</h1>
                <p className="text-muted-foreground">Organization and plant settings.</p>
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

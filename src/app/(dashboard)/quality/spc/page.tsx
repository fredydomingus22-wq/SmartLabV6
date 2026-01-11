import { createClient } from "@/lib/supabase/server";
import { getSafeUser } from "@/lib/auth.server";
import { SPCClient } from "./spc-client";
import { getActiveSPCAlerts } from "@/lib/queries/spc-alerts";
import { Sparkles, TrendingUp, AlertTriangle, Activity, Workflow } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { PremiumAnalyticsCard } from "@/components/dashboard/premium-analytics-card";

export const dynamic = "force-dynamic";

function generateSeries(start: number, variance: number) {
    return Array.from({ length: 15 }, (_, i) => ({
        date: new Date(Date.now() - (14 - i) * 24 * 60 * 60 * 1000).toISOString(),
        value: start + (Math.random() * variance * 2 - variance)
    }));
}

export default async function SPCPage() {
    const supabase = await createClient();
    const user = await getSafeUser();

    // 1. Fetch QA Parameters available for the tenant
    const paramsQuery = supabase
        .from("qa_parameters")
        .select("id, name, code, unit")
        .eq("organization_id", user.organization_id);

    if (user.plant_id) {
        paramsQuery.eq("plant_id", user.plant_id);
    }
    const { data: parameters } = await paramsQuery;

    // 2. Fetch Products available for the tenant - Using SKU as per schema
    const productsQuery = supabase
        .from("products")
        .select("id, name, sku")
        .eq("organization_id", user.organization_id)
        .eq("status", "active");

    if (user.plant_id) {
        productsQuery.eq("plant_id", user.plant_id);
    }
    const { data: products } = await productsQuery;

    // 3. Fetch Sample Types (Master Table - No org_id filter)
    const { data: sampleTypes } = await supabase
        .from("sample_types")
        .select("id, name")
        .order("name");

    // 4. Fetch Active SPC Alerts
    let activeAlerts: any[] = [];
    try {
        activeAlerts = await getActiveSPCAlerts(10);
    } catch (err) {
        console.warn("Could not fetch SPC alerts:", err);
    }

    // 5. Fetch Initial Data (last 30 days for the first parameter found)
    let initialSPCResult: any = null;

    if (parameters && parameters.length > 0) {
        const { getSPCData } = await import("@/lib/queries/spc");
        initialSPCResult = await getSPCData(parameters[0].id, 30, {
            productId: products && products.length > 0 ? products[0].id : undefined
        });
    }

    return (
        <div className="space-y-10 pb-10">
            {/* Header with Sparkles */}
            <div className="flex justify-between items-end">
                <div className="space-y-1">
                    <div className="flex items-center gap-2 text-primary">
                        <Sparkles className="h-4 w-4" />
                        <span className="text-xs font-bold uppercase tracking-widest opacity-70">Industrial Intelligence</span>
                    </div>
                    <h1 className="text-4xl font-extrabold tracking-tight">
                        Statistical Process Control
                    </h1>
                    <p className="text-muted-foreground text-lg">
                        Monitoramento avançado de estabilidade, capacidade (Cp/Cpk) e desvios.
                    </p>
                </div>
                <div className="hidden md:flex gap-3">
                    <Badge variant="outline" className="h-10 px-4 glass border-emerald-500/20 text-emerald-500 bg-emerald-500/5">
                        <Activity className="h-4 w-4 mr-2" />
                        Engine: Python SPC 3.0
                    </Badge>
                </div>
            </div>

            {/* Trending Insights - Top Level Stats */}
            <div className="grid gap-6 md:grid-cols-3">
                <PremiumAnalyticsCard
                    title="Capacidade Global (Cpk)"
                    value="1.33"
                    description="Média ponderada dos processos críticos"
                    trend={{ value: 0.05, isPositive: true }}
                    data={generateSeries(1.30, 0.1)}
                    dataKey="value"
                    color="#10b981"
                />
                <PremiumAnalyticsCard
                    title="Estabilidade do Processo"
                    value="96.5%"
                    description="Lotes sem violação de regras de Nelson"
                    trend={{ value: 1.2, isPositive: true }}
                    data={generateSeries(95, 2)}
                    dataKey="value"
                    color="#3b82f6"
                />
                <PremiumAnalyticsCard
                    title="Alertas Críticos"
                    value={activeAlerts.length.toString()}
                    description="Ocorrências ativas (Nelson Rules)"
                    trend={{ value: activeAlerts.length > 0 ? 1 : 0, isPositive: activeAlerts.length === 0 }}
                    data={generateSeries(5, 2)}
                    dataKey="value"
                    color="#f59e0b"
                />
            </div>

            {/* Main SPC Client */}
            <div className="relative">
                <SPCClient
                    user={user}
                    parameters={parameters || []}
                    products={products || []}
                    sampleTypes={sampleTypes || []}
                    initialSPCResult={initialSPCResult}
                    alerts={activeAlerts}
                />
            </div>
        </div>
    );
}

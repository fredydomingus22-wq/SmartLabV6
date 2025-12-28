import { createClient } from "@/lib/supabase/server";
import { getSafeUser } from "@/lib/auth.server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, TrendingUp, LineChart } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

async function getTrendingData() {
    const supabase = await createClient();
    const user = await getSafeUser();

    // Get products for filter
    const { data: products } = await supabase
        .from("products")
        .select("id, name, code")
        .eq("organization_id", user.organization_id)
        .order("name");

    // Get parameters for filter
    const { data: parameters } = await supabase
        .from("qa_parameters")
        .select("id, name, code, unit")
        .eq("organization_id", user.organization_id)
        .eq("status", "active")
        .order("name");

    return { products: products || [], parameters: parameters || [] };
}

export default async function TrendingReportPage() {
    const { products, parameters } = await getTrendingData();

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link href="/reports">
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                        <TrendingUp className="h-8 w-8 text-blue-500" />
                        Trending Report
                    </h1>
                    <p className="text-muted-foreground">
                        Parameter trends and SPC analysis over time
                    </p>
                </div>
            </div>

            {/* Filters */}
            <Card className="glass">
                <CardHeader>
                    <CardTitle>Report Configuration</CardTitle>
                    <CardDescription>Select product, parameter, and date range</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                            <label className="text-sm font-medium mb-2 block">Product</label>
                            <select className="w-full p-2 border rounded-lg bg-background">
                                <option value="">All Products</option>
                                {products.map((p: any) => (
                                    <option key={p.id} value={p.id}>{p.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="text-sm font-medium mb-2 block">Parameter</label>
                            <select className="w-full p-2 border rounded-lg bg-background">
                                <option value="">Select Parameter</option>
                                {parameters.map((p: any) => (
                                    <option key={p.id} value={p.id}>{p.name} ({p.unit})</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="text-sm font-medium mb-2 block">Start Date</label>
                            <input
                                type="date"
                                className="w-full p-2 border rounded-lg bg-background"
                                defaultValue={new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]}
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium mb-2 block">End Date</label>
                            <input
                                type="date"
                                className="w-full p-2 border rounded-lg bg-background"
                                defaultValue={new Date().toISOString().split("T")[0]}
                            />
                        </div>
                    </div>
                    <div className="mt-6 flex justify-end">
                        <Button>
                            <LineChart className="h-4 w-4 mr-2" />
                            Generate Trending Report
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Placeholder for Charts */}
            <Card className="glass">
                <CardHeader>
                    <CardTitle>Parameter Trend</CardTitle>
                    <CardDescription>Select filters above to view trend data</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="h-64 flex items-center justify-center border border-dashed rounded-lg text-muted-foreground">
                        <div className="text-center">
                            <TrendingUp className="h-12 w-12 mx-auto mb-2 opacity-30" />
                            <p>Select a product and parameter to view trends</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

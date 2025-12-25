"use client";

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Archive, BarChart3, FlaskConical, TrendingDown, LayoutDashboard } from "lucide-react"; // Import LayoutDashboard here
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from "recharts";

interface InventoryDashboardProps {
    totalReagents: number;
    lowStockCount: number;
    activeReagents: number;
    mostUsed: { name: string; quantity: number }[];
    lowStockItems: { name: string; current: number; min: number; unit: string }[];
    expiringBatches: { reagent: string; batch: string; expiry: string }[];
}

export function InventoryDashboard({
    totalReagents,
    lowStockCount,
    activeReagents,
    mostUsed,
    lowStockItems,
    expiringBatches,
}: InventoryDashboardProps) {
    return (
        <div className="space-y-4 mb-8">
            <div className="flex items-center gap-2 mb-4">
                <LayoutDashboard className="h-5 w-5 text-custom-teal-500" />
                <h2 className="text-xl font-semibold tracking-tight">Stock Analytics</h2>
            </div>

            {/* KPI Cards */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Total Reagents
                        </CardTitle>
                        <Archive className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalReagents}</div>
                        <p className="text-xs text-muted-foreground">
                            Registered chemicals
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Active Stock
                        </CardTitle>
                        <FlaskConical className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{activeReagents}</div>
                        <p className="text-xs text-muted-foreground">
                            With quantity {'>'} 0
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Low Stock Alerts
                        </CardTitle>
                        <AlertCircle className={`h-4 w-4 ${lowStockCount > 0 ? "text-destructive" : "text-muted-foreground"}`} />
                    </CardHeader>
                    <CardContent>
                        <div className={`text-2xl font-bold ${lowStockCount > 0 ? "text-destructive" : ""}`}>{lowStockCount}</div>
                        <p className="text-xs text-muted-foreground">
                            Below minimum level
                        </p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                {/* Usage Chart */}
                <Card className="col-span-4">
                    <CardHeader>
                        <CardTitle>Top Consumed Reagents</CardTitle>
                        <CardDescription>
                            Most used chemicals by quantity (all time)
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="pl-2">
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={mostUsed}>
                                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                                <XAxis
                                    dataKey="name"
                                    stroke="#888888"
                                    fontSize={12}
                                    tickLine={false}
                                    axisLine={false}
                                />
                                <YAxis
                                    stroke="#888888"
                                    fontSize={12}
                                    tickLine={false}
                                    axisLine={false}
                                    tickFormatter={(value) => `${value}`}
                                />
                                <Tooltip
                                    contentStyle={{ background: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }}
                                    cursor={{ fill: 'transparent' }}
                                />
                                <Bar dataKey="quantity" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Low Stock List */}
                <Card className="col-span-3">
                    <CardHeader>
                        <CardTitle>Critical Stock Levels</CardTitle>
                        <CardDescription>
                            Items needing resupply immediate
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {lowStockItems.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
                                    <TrendingDown className="h-8 w-8 mb-2 opacity-50" />
                                    <p>Stock levels are healthy</p>
                                </div>
                            ) : (
                                lowStockItems.map((item, i) => (
                                    <Alert key={i} variant="destructive">
                                        <AlertCircle className="h-4 w-4" />
                                        <AlertTitle className="text-sm font-semibold">{item.name}</AlertTitle>
                                        <AlertDescription className="flex justify-between items-center text-xs">
                                            <span>Current: {item.current} {item.unit}</span>
                                            <span className="font-medium">Min: {item.min}</span>
                                        </AlertDescription>
                                    </Alert>
                                ))
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Expiring Soon List */}
                <Card className="col-span-4 lg:col-span-7 mt-4">
                    <CardHeader>
                        <CardTitle className="text-amber-600 flex items-center gap-2">
                            <AlertCircle className="h-5 w-5" />
                            Expiring Soon (Next 30 Days)
                        </CardTitle>
                        <CardDescription>
                            Batches approaching expiration date
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {expiringBatches.length === 0 ? (
                                <p className="text-muted-foreground text-sm col-span-full text-center py-4">No items expiring soon.</p>
                            ) : (
                                expiringBatches.map((item, i) => (
                                    <div key={i} className="flex items-center justify-between p-3 border rounded-lg bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800">
                                        <div>
                                            <p className="font-medium text-sm">{item.reagent}</p>
                                            <p className="text-xs text-muted-foreground">{item.batch}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs font-bold text-amber-700 dark:text-amber-500">
                                                {new Date(item.expiry).toLocaleDateString('pt-BR')}
                                            </p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

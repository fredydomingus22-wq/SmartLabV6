"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, AlertTriangle, CheckCircle, Zap, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { DashboardTrendsClient } from "@/components/dashboard/dashboard-trends-client";

interface ManagerOverviewProps {
    stats: any;
    products: any[];
    parameters: any[];
    initialTrendData: any[];
    initialSpecs: any;
}

export function ManagerOverview({ stats, products, parameters, initialTrendData, initialSpecs }: ManagerOverviewProps) {
    return (
        <div className="space-y-6">
            {/* KPI Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="glass border-emerald-500/20">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Taxa de Conformidade</CardTitle>
                        <CheckCircle className="h-4 w-4 text-emerald-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.complianceRate.toFixed(1)}%</div>
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                            <ArrowUpRight className="h-3 w-3 text-emerald-500" /> +2.1% vs última semana
                        </p>
                    </CardContent>
                </Card>
                <Card className="glass border-red-500/20">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Desvios de CCP</CardTitle>
                        <AlertTriangle className="h-4 w-4 text-red-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.recentDeviations}</div>
                        <p className="text-xs text-muted-foreground mt-1">Últimos 7 dias</p>
                    </CardContent>
                </Card>
                <Card className="glass">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Lotes Ativos</CardTitle>
                        <Zap className="h-4 w-4 text-yellow-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.activeBatches}</div>
                        <p className="text-xs text-muted-foreground mt-1">Em processamento</p>
                    </CardContent>
                </Card>
                <Card className="glass border-orange-500/20">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Stock Crítico</CardTitle>
                        <ArrowDownRight className="h-4 w-4 text-orange-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.expiringSoon}</div>
                        <p className="text-xs text-muted-foreground mt-1">Lotes a expirar</p>
                    </CardContent>
                </Card>
            </div>

            {/* Quality Trends */}
            <DashboardTrendsClient
                products={products}
                parameters={parameters}
                initialData={initialTrendData}
                initialSpecs={initialSpecs}
            />
        </div>
    );
}

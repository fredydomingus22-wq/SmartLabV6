import { getQualityKPIs, getNCTrends, getTopDefects } from "@/lib/queries/quality";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    BarChart3,
    AlertTriangle,
    CheckCircle,
    TrendingUp,
    ClipboardList,
    Target
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function QualityDashboardPage() {
    const { kpis } = await getQualityKPIs();
    const { trends } = await getNCTrends(30);
    const { defects } = await getTopDefects(5);

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl sm:text-3xl font-bold tracking-tight flex items-center gap-3">
                        <BarChart3 className="h-6 w-6 sm:h-8 sm:w-8 text-blue-500" />
                        Painel de Qualidade
                    </h1>
                    <p className="text-muted-foreground">
                        Métricas e tendências de qualidade em tempo real
                    </p>
                </div>
                <div className="flex flex-wrap gap-2 justify-end">
                    <Link href="/quality/spc">
                        <Button size="sm" className="h-8 sm:h-10 text-[10px] sm:text-sm">
                            <TrendingUp className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                            Gráficos SPC
                        </Button>
                    </Link>
                    <Link href="/quality/qms">
                        <Button variant="outline" size="sm" className="h-8 sm:h-10 text-[10px] sm:text-sm">
                            <ClipboardList className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                            Desvios
                        </Button>
                    </Link>
                    <Link href="/quality/qms/capa">
                        <Button variant="outline" size="sm" className="h-8 sm:h-10 text-[10px] sm:text-sm">
                            <Target className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                            CAPAs
                        </Button>
                    </Link>
                </div>
            </div>

            {/* KPI Cards Row */}
            <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
                {/* First Pass Yield */}
                <Card className="glass">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">First Pass Yield (FPY)</CardTitle>
                        <CheckCircle className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-500">{kpis.fpy}%</div>
                        <p className="text-xs text-muted-foreground">
                            {kpis.totalAnalysis} análises (30 dias)
                        </p>
                    </CardContent>
                </Card>

                {/* Open NCs */}
                <Card className="glass">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Desvios Abertos</CardTitle>
                        <AlertTriangle className="h-4 w-4 text-red-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-500">{kpis.openNCs}</div>
                        <p className="text-xs text-muted-foreground">
                            {kpis.inProgressNCs} em curso
                        </p>
                    </CardContent>
                </Card>

                {/* Open CAPAs */}
                <Card className="glass">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">CAPAs Abertas</CardTitle>
                        <Target className="h-4 w-4 text-orange-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-orange-500">{kpis.openCAPAs}</div>
                        <p className="text-xs text-muted-foreground">
                            {kpis.totalCAPAs} ações totais
                        </p>
                    </CardContent>
                </Card>

                {/* NC Rate */}
                <Card className="glass">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Taxa de Desvio</CardTitle>
                        <TrendingUp className="h-4 w-4 text-purple-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{kpis.ncRate}%</div>
                        <p className="text-xs text-muted-foreground">
                            por 100 análises
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Charts Row */}
            <div className="grid gap-6 lg:grid-cols-2">
                {/* NC Trend */}
                <Card className="glass">
                    <CardHeader>
                        <CardTitle>Tendência de NC (30 dias)</CardTitle>
                        <CardDescription>Contagem diária de não conformidades</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {trends.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                                Sem NCs nos últimos 30 dias
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {trends.slice(-10).map((day) => (
                                    <div key={day.date} className="flex items-center gap-2">
                                        <span className="text-xs text-muted-foreground w-24">{day.date}</span>
                                        <div className="flex-1 bg-muted rounded-full h-4 overflow-hidden">
                                            <div
                                                className="bg-red-500 h-full transition-all"
                                                style={{ width: `${Math.min(day.count * 20, 100)}%` }}
                                            />
                                        </div>
                                        <Badge variant={day.critical > 0 ? "destructive" : "secondary"}>
                                            {day.count}
                                        </Badge>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Top Defects (Pareto) */}
                <Card className="glass">
                    <CardHeader>
                        <CardTitle>Principais Tipos de Defeito</CardTitle>
                        <CardDescription>Análise de Pareto dos tipos de NC</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {defects.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                                Sem dados de defeitos disponíveis
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {defects.map((defect, i) => (
                                    <div key={defect.type} className="flex items-center gap-3">
                                        <span className="text-sm font-medium w-8">#{i + 1}</span>
                                        <div className="flex-1">
                                            <div className="flex justify-between mb-1">
                                                <span className="text-sm capitalize">{defect.type.replace(/_/g, " ")}</span>
                                                <span className="text-sm font-bold">{defect.count}</span>
                                            </div>
                                            <div className="bg-muted rounded-full h-2 overflow-hidden">
                                                <div
                                                    className="bg-blue-500 h-full transition-all"
                                                    style={{ width: `${(defect.count / (defects[0]?.count || 1)) * 100}%` }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Quick Stats */}
            <Card className="glass">
                <CardHeader>
                    <CardTitle>Resumo Informativo</CardTitle>
                </CardHeader>
                <CardContent className="p-4 sm:p-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                        <div>
                            <div className="text-xl sm:text-3xl font-bold">{kpis.totalNCs}</div>
                            <div className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-widest font-bold">Total NCs</div>
                        </div>
                        <div>
                            <div className="text-xl sm:text-3xl font-bold text-green-500">{kpis.closedNCs}</div>
                            <div className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-widest font-bold">Encerradas</div>
                        </div>
                        <div>
                            <div className="text-xl sm:text-3xl font-bold">{kpis.totalCAPAs}</div>
                            <div className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-widest font-bold">CAPAs</div>
                        </div>
                        <div>
                            <div className="text-xl sm:text-3xl font-bold">{kpis.totalAnalysis}</div>
                            <div className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-widest font-bold">Análises</div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}


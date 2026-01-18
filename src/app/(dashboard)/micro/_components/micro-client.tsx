"use client";

import { motion } from "framer-motion";
import { ThermometerSun, ClipboardCheck, History, Beaker, Database, Target, ArrowRight } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { KPICard } from "@/components/defaults/kpi-card";

interface MicroDashboardProps {
    kpis: {
        incubating: number;
        pendingReading: number;
        completedToday: number;
    };
    activities: any[];
}

export function MicroDashboardClient({ kpis, activities }: MicroDashboardProps) {
    return (
        <div className="space-y-6 animate-in fade-in duration-700">
            {/* Standard KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <KPICard
                    title="Em Incubação"
                    value={kpis.incubating}
                    icon={ThermometerSun}
                    description="Amostras em estufa"
                    trend="Active"
                    trendDirection="up"
                />
                <KPICard
                    title="Pendentes Leitura"
                    value={kpis.pendingReading}
                    icon={ClipboardCheck}
                    description="A aguardar verificação"
                    trend="Pending"
                    trendDirection="neutral"
                />
                <KPICard
                    title="Concluídas Hoje"
                    value={kpis.completedToday}
                    icon={History}
                    description="Amostras finalizadas"
                    trend="Daily"
                    trendDirection="neutral"
                />
            </div>

            {/* Activities Table/List */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2 border-border shadow-md">
                    <CardHeader className="border-b border-border bg-muted/30">
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="text-lg font-bold">Incubações Recentes</CardTitle>
                                <CardDescription>Últimas sessões iniciadas no laboratório</CardDescription>
                            </div>
                            <Button asChild variant="ghost" size="sm" className="text-muted-foreground hover:text-purple-600">
                                <Link href="/micro/incubators">Ver Todas</Link>
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        {activities.length === 0 ? (
                            <div className="p-12 text-center">
                                <Database className="h-10 w-10 mx-auto mb-4 text-muted-foreground/50" />
                                <p className="text-muted-foreground font-medium italic">Sem incubações ativas no momento.</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-border">
                                {activities.map((activity: any) => (
                                    <div key={activity.id} className="p-4 hover:bg-muted/50 transition-colors flex items-center justify-between group">
                                        <div className="flex items-center gap-4">
                                            <div className="p-2 rounded-lg bg-muted border border-border group-hover:border-purple-500/30 transition-colors">
                                                <Beaker className="h-4 w-4 text-purple-600/70" />
                                            </div>
                                            <div>
                                                <div className="font-bold text-foreground text-sm">
                                                    Incubadora: {activity.micro_incubators?.name || "N/D"}
                                                </div>
                                                <div className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider mt-0.5">
                                                    Início: {new Date(activity.created_at).toLocaleString('pt-PT')}
                                                </div>
                                            </div>
                                        </div>
                                        <Badge variant="secondary" className="bg-purple-500/10 text-purple-600 border-none capitalize px-3 rounded-md font-bold text-[10px]">
                                            {activity.status.replace("_", " ")}
                                        </Badge>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                <div className="space-y-6">
                    <Card className="border-border shadow-md bg-gradient-to-br from-muted/50 to-card">
                        <CardHeader>
                            <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                <Target className="h-4 w-4" />
                                Acesso Rápido
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="grid gap-2 pt-0">
                            {[
                                { label: "Leituras Pendentes", path: "/micro/reading", icon: ClipboardCheck },
                                { label: "Gestão de Meios", path: "/micro/media", icon: Beaker },
                                { label: "Configuração", path: "/micro/configuration/media-types", icon: Database }
                            ].map((item, idx) => (
                                <Link key={idx} href={item.path}>
                                    <Button variant="outline" className="w-full justify-between h-12 rounded-xl border-border hover:bg-background hover:border-purple-500/30 group">
                                        <div className="flex items-center">
                                            <item.icon className="h-4 w-4 mr-3 text-muted-foreground group-hover:text-purple-600 transition-colors" />
                                            <span className="font-bold text-muted-foreground group-hover:text-foreground">{item.label}</span>
                                        </div>
                                        <ArrowRight className="h-4 w-4 text-muted-foreground/50 group-hover:text-purple-600" />
                                    </Button>
                                </Link>
                            ))}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}

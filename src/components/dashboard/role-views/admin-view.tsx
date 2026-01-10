"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Settings, Database, Shield, Activity, FileJson, ArrowRight, TrendingUp } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

interface AdminViewProps {
    stats: any;
    activity: any;
}

export function AdminView({ stats, activity }: AdminViewProps) {
    return (
        <div className="space-y-6">
            {/* Admin Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Link href="/admin/users">
                    <Card className="glass border-indigo-500/20 bg-indigo-500/5 hover:bg-indigo-500/10 transition-colors cursor-pointer group h-full">
                        <CardContent className="p-6 flex items-center justify-between">
                            <div className="flex flex-col gap-1">
                                <span className="text-sm font-medium text-indigo-100 group-hover:text-white">Utilizadores</span>
                                <span className="text-xs text-indigo-400">Gerir Acessos</span>
                            </div>
                            <Users className="h-8 w-8 text-indigo-500 group-hover:scale-110 transition-transform text-indigo-400" />
                        </CardContent>
                    </Card>
                </Link>
                <Link href="/admin/master-data">
                    <Card className="glass border-pink-500/20 bg-pink-500/5 hover:bg-pink-500/10 transition-colors cursor-pointer group h-full">
                        <CardContent className="p-6 flex items-center justify-between">
                            <div className="flex flex-col gap-1">
                                <span className="text-sm font-medium text-pink-100 group-hover:text-white">Master Data</span>
                                <span className="text-xs text-pink-400">Produtos & Specs</span>
                            </div>
                            <Database className="h-8 w-8 text-pink-500 group-hover:scale-110 transition-transform text-pink-400" />
                        </CardContent>
                    </Card>
                </Link>
                <Link href="/admin/reports">
                    <Card className="glass border-amber-500/20 bg-amber-500/5 hover:bg-amber-500/10 transition-colors cursor-pointer group h-full">
                        <CardContent className="p-6 flex items-center justify-between">
                            <div className="flex flex-col gap-1">
                                <span className="text-sm font-medium text-amber-100 group-hover:text-white">Relatórios</span>
                                <span className="text-xs text-amber-400">Auditoria Global</span>
                            </div>
                            <FileJson className="h-8 w-8 text-amber-500 group-hover:scale-110 transition-transform text-amber-400" />
                        </CardContent>
                    </Card>
                </Link>
                <Link href="/settings">
                    <Card className="glass border-slate-700 hover:border-slate-600 transition-colors cursor-pointer group h-full">
                        <CardContent className="p-6 flex items-center justify-between">
                            <div className="flex flex-col gap-1">
                                <span className="text-sm font-medium text-slate-300 group-hover:text-white">Configurações</span>
                                <span className="text-xs text-slate-500">Planta & Sistema</span>
                            </div>
                            <Settings className="h-8 w-8 text-slate-600 group-hover:text-slate-400 transition-colors" />
                        </CardContent>
                    </Card>
                </Link>
            </div>

            {/* Plant Health & KPIs (Reusing Manager Stats) */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {/* Similar to Manager but maybe focused on Operational Health */}
                <Card className="glass border-emerald-500/20">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Taxa de Conformidade</CardTitle>
                        <Activity className="h-4 w-4 text-emerald-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.complianceRate.toFixed(1)}%</div>
                        <p className="text-xs text-muted-foreground mt-1">Geral da Planta</p>
                    </CardContent>
                </Card>
                <Card className="glass border-blue-500/20">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Lotes Ativos</CardTitle>
                        <Activity className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.activeBatches}</div>
                        <p className="text-xs text-muted-foreground mt-1">Em produção</p>
                    </CardContent>
                </Card>
                <Card className="glass border-amber-500/20">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Amostras Pendentes</CardTitle>
                        <Activity className="h-4 w-4 text-amber-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.pendingSamples + stats.inAnalysis}</div>
                        <p className="text-xs text-muted-foreground mt-1">Lab + Micro</p>
                    </CardContent>
                </Card>
                <Card className="glass border-red-500/20">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Desvios Recentes</CardTitle>
                        <Shield className="h-4 w-4 text-red-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.recentDeviations}</div>
                        <p className="text-xs text-muted-foreground mt-1">Requerem atenção</p>
                    </CardContent>
                </Card>
            </div>

            {/* Recent System Activity */}
            <div className="grid gap-4 md:grid-cols-2">
                <Card className="glass">
                    <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                            <TrendingUp className="h-4 w-4 text-blue-400" /> Atividade Recente (Global)
                        </CardTitle>
                        <CardDescription>Últimas operações registadas no sistema.</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="divide-y divide-slate-800/50">
                            {activity.recentSamples.map((sample: any) => (
                                <div key={sample.id} className="flex items-center justify-between p-4 hover:bg-slate-900/30">
                                    <div className="flex flex-col gap-0.5">
                                        <span className="font-medium text-sm text-slate-200">{sample.code}</span>
                                        <span className="text-[10px] text-slate-500 uppercase">Amostra</span>
                                    </div>
                                    <Badge variant="outline" className="text-[10px]">{sample.status}</Badge>
                                </div>
                            ))}
                            {activity.recentBatches.map((batch: any) => (
                                <div key={batch.id} className="flex items-center justify-between p-4 hover:bg-slate-900/30">
                                    <div className="flex flex-col gap-0.5">
                                        <span className="font-medium text-sm text-slate-200">{batch.code}</span>
                                        <span className="text-[10px] text-slate-500 uppercase">Lote de Produção</span>
                                    </div>
                                    <Badge variant="outline" className="text-[10px] border-blue-500/20 text-blue-400">{batch.status}</Badge>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                <Card className="glass bg-slate-950/30 border-dashed">
                    <CardHeader>
                        <CardTitle className="text-base">Atalhos de Sistema</CardTitle>
                        <CardDescription>Links rápidos para configuração.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <Button variant="outline" className="w-full justify-between bg-transparent border-slate-800 hover:bg-slate-800" asChild>
                            <Link href="/settings">
                                Configurações Gerais <ArrowRight className="h-4 w-4 ml-2 opacity-50" />
                            </Link>
                        </Button>
                        <Button variant="outline" className="w-full justify-between bg-transparent border-slate-800 hover:bg-slate-800" asChild>
                            <Link href="/audit-logs">
                                Logs de Auditoria <ArrowRight className="h-4 w-4 ml-2 opacity-50" />
                            </Link>
                        </Button>
                        <Button variant="outline" className="w-full justify-between bg-transparent border-slate-800 hover:bg-slate-800" asChild>
                            <Link href="/integrations">
                                Integrações (ERP/IoT) <ArrowRight className="h-4 w-4 ml-2 opacity-50" />
                            </Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

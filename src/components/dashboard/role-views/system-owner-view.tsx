"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Globe, Building2, Users, Database, ArrowRight, ShieldCheck, Zap } from "lucide-react";
import Link from "next/link";

interface SystemOwnerViewProps {
    stats: {
        totalOrgs: number;
        totalPlants: number;
        totalUsers: number;
        activeSessions: number;
    };
}

export function SystemOwnerView({ stats }: SystemOwnerViewProps) {
    return (
        <div className="space-y-6">
            {/* SaaS Overview Stats */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="glass border-blue-500/20">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Organizações</CardTitle>
                        <Building2 className="h-4 w-4 text-blue-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalOrgs}</div>
                        <p className="text-xs text-muted-foreground mt-1">Empresas registadas</p>
                    </CardContent>
                </Card>
                <Card className="glass border-purple-500/20">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total de Plantas</CardTitle>
                        <Globe className="h-4 w-4 text-purple-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalPlants}</div>
                        <p className="text-xs text-muted-foreground mt-1">Unidades fabris ativas</p>
                    </CardContent>
                </Card>
                <Card className="glass border-emerald-500/20">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Utilizadores Globais</CardTitle>
                        <Users className="h-4 w-4 text-emerald-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalUsers}</div>
                        <p className="text-xs text-muted-foreground mt-1">Contas ativas no ecossistema</p>
                    </CardContent>
                </Card>
                <Card className="glass border-orange-500/20">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Estado do Sistema</CardTitle>
                        <Database className="h-4 w-4 text-orange-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">Saudável</div>
                        <p className="text-xs text-emerald-400 flex items-center gap-1 mt-1">
                            <ShieldCheck className="h-3 w-3" /> Todos os serviços online
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Quick Management Actions */}
            <div className="grid gap-6 md:grid-cols-2">
                <Card className="glass">
                    <CardHeader>
                        <CardTitle className="text-base">Gestão de Infraestrutura</CardTitle>
                        <CardDescription>Configurações globais do SaaS</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Link href="/saas" className="flex items-center justify-between p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-all group">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded bg-blue-500/10 text-blue-400">
                                    <Globe className="h-5 w-5" />
                                </div>
                                <div className="flex flex-col">
                                    <span className="font-bold text-sm">Consola Global SaaS</span>
                                    <span className="text-xs text-slate-500">Gerir organizações e planos</span>
                                </div>
                            </div>
                            <ArrowRight className="h-4 w-4 text-slate-600 group-hover:text-white transition-colors" />
                        </Link>
                        <Link href="/admin/users" className="flex items-center justify-between p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-all group">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded bg-purple-500/10 text-purple-400">
                                    <Users className="h-5 w-5" />
                                </div>
                                <div className="flex flex-col">
                                    <span className="font-bold text-sm">Controlo de Utilizadores</span>
                                    <span className="text-xs text-slate-500">Permissões e roles globais</span>
                                </div>
                            </div>
                            <ArrowRight className="h-4 w-4 text-slate-600 group-hover:text-white transition-colors" />
                        </Link>
                    </CardContent>
                </Card>

                <Card className="glass border-indigo-500/10 bg-indigo-500/5">
                    <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                            <Zap className="h-4 w-4 text-indigo-400" />
                            Saúde da Plataforma
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="p-3 rounded-lg border border-indigo-500/20 bg-indigo-500/5">
                            <div className="flex justify-between items-center mb-1">
                                <span className="text-xs text-indigo-300 font-bold tracking-wider uppercase">Uptime Mensal</span>
                                <span className="text-xs font-bold text-indigo-400">99.98%</span>
                            </div>
                            <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden">
                                <div className="h-full bg-indigo-500" style={{ width: '99.98%' }} />
                            </div>
                        </div>
                        <div className="text-[10px] text-slate-500 italic text-center">
                            Monitorização global de base de dados e triggers ativa.
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

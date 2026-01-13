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
        <div className="space-y-10">
            {/* Admin Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Link href="/admin/users">
                    <Card className="bg-card border-slate-800 shadow-lg hover:bg-slate-900/40 transition-all cursor-pointer group h-full overflow-hidden">
                        <CardContent className="p-6 flex items-center justify-between">
                            <div className="flex flex-col gap-1">
                                <span className="text-[11px] font-black uppercase tracking-widest text-indigo-400 group-hover:text-indigo-300 transition-colors">Utilizadores</span>
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Gerir Acessos</span>
                            </div>
                            <div className="h-10 w-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-500 group-hover:scale-110 transition-transform shadow-inner">
                                <Users className="h-5 w-5" />
                            </div>
                        </CardContent>
                    </Card>
                </Link>
                <Link href="/admin/master-data">
                    <Card className="bg-card border-slate-800 shadow-lg hover:bg-slate-900/40 transition-all cursor-pointer group h-full overflow-hidden">
                        <CardContent className="p-6 flex items-center justify-between">
                            <div className="flex flex-col gap-1">
                                <span className="text-[11px] font-black uppercase tracking-widest text-pink-400 group-hover:text-pink-300 transition-colors">Master Data</span>
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Produtos & Specs</span>
                            </div>
                            <div className="h-10 w-10 rounded-xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center text-pink-500 group-hover:scale-110 transition-transform shadow-inner">
                                <Database className="h-5 w-5" />
                            </div>
                        </CardContent>
                    </Card>
                </Link>
                <Link href="/admin/reports">
                    <Card className="bg-card border-slate-800 shadow-lg hover:bg-slate-900/40 transition-all cursor-pointer group h-full overflow-hidden">
                        <CardContent className="p-6 flex items-center justify-between">
                            <div className="flex flex-col gap-1">
                                <span className="text-[11px] font-black uppercase tracking-widest text-amber-400 group-hover:text-amber-300 transition-colors">Relatórios</span>
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Auditoria Global</span>
                            </div>
                            <div className="h-10 w-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 group-hover:scale-110 transition-transform shadow-inner">
                                <FileJson className="h-5 w-5" />
                            </div>
                        </CardContent>
                    </Card>
                </Link>
                <Link href="/settings">
                    <Card className="bg-card border-slate-800 shadow-lg hover:bg-slate-900/40 transition-all cursor-pointer group h-full overflow-hidden">
                        <CardContent className="p-6 flex items-center justify-between">
                            <div className="flex flex-col gap-1">
                                <span className="text-[11px] font-black uppercase tracking-widest text-slate-300 group-hover:text-white transition-colors">Configurações</span>
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Planta & Sistema</span>
                            </div>
                            <div className="h-10 w-10 rounded-xl bg-slate-500/10 border border-slate-700 flex items-center justify-center text-slate-400 group-hover:text-white transition-colors shadow-inner">
                                <Settings className="h-5 w-5" />
                            </div>
                        </CardContent>
                    </Card>
                </Link>
            </div>

            {/* Plant Health & KPIs */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <Card className="bg-card border-slate-800 shadow-xl overflow-hidden">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-slate-900/20">
                        <CardTitle className="text-[10px] font-black uppercase tracking-widest text-slate-500 italic">Taxa de Conformidade</CardTitle>
                        <Activity className="h-3.5 w-3.5 text-emerald-500 opacity-70" />
                    </CardHeader>
                    <CardContent className="pt-4">
                        <div className="text-3xl font-black italic tracking-tight text-white mb-1">{stats.complianceRate.toFixed(1)}%</div>
                        <p className="text-[9px] font-bold text-slate-600 uppercase tracking-[0.2em]">Geral da Planta</p>
                    </CardContent>
                </Card>
                <Card className="bg-card border-slate-800 shadow-xl overflow-hidden">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-slate-900/20">
                        <CardTitle className="text-[10px] font-black uppercase tracking-widest text-slate-500 italic">Lotes Ativos</CardTitle>
                        <Activity className="h-3.5 w-3.5 text-blue-500 opacity-70" />
                    </CardHeader>
                    <CardContent className="pt-4">
                        <div className="text-3xl font-black italic tracking-tight text-white mb-1">{stats.activeBatches}</div>
                        <p className="text-[9px] font-bold text-slate-600 uppercase tracking-[0.2em]">Em produção</p>
                    </CardContent>
                </Card>
                <Card className="bg-card border-slate-800 shadow-xl overflow-hidden">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-slate-900/20">
                        <CardTitle className="text-[10px] font-black uppercase tracking-widest text-slate-500 italic">Amostras Pendentes</CardTitle>
                        <Activity className="h-3.5 w-3.5 text-amber-500 opacity-70" />
                    </CardHeader>
                    <CardContent className="pt-4">
                        <div className="text-3xl font-black italic tracking-tight text-white mb-1">{stats.pendingSamples + stats.inAnalysis}</div>
                        <p className="text-[9px] font-bold text-slate-600 uppercase tracking-[0.2em]">Lab + Micro</p>
                    </CardContent>
                </Card>
                <Card className="bg-card border-slate-800 shadow-xl overflow-hidden">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-slate-900/20">
                        <CardTitle className="text-[10px] font-black uppercase tracking-widest text-slate-500 italic">Desvios Recentes</CardTitle>
                        <Shield className="h-3.5 w-3.5 text-red-500 opacity-70" />
                    </CardHeader>
                    <CardContent className="pt-4">
                        <div className="text-3xl font-black italic tracking-tight text-white mb-1">{stats.recentDeviations}</div>
                        <p className="text-[9px] font-bold text-red-500/60 uppercase tracking-[0.2em]">Requerem atenção</p>
                    </CardContent>
                </Card>
            </div>

            {/* Recent System Activity */}
            <div className="grid gap-8 md:grid-cols-2">
                <Card className="bg-card border-slate-800 shadow-xl overflow-hidden">
                    <CardHeader className="border-b border-slate-800 bg-slate-900/50 pb-4">
                        <CardTitle className="text-[11px] font-black uppercase tracking-[0.2em] text-white flex items-center gap-2">
                            <TrendingUp className="h-3.5 w-3.5 text-blue-400" />
                            Atividade Recente (Global)
                        </CardTitle>
                        <CardDescription className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Últimas operações registadas no sistema.</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="divide-y divide-slate-800/50">
                            {activity.recentSamples.map((sample: any) => (
                                <div key={sample.id} className="flex items-center justify-between p-4 hover:bg-slate-900/40 transition-colors">
                                    <div className="flex flex-col gap-0.5">
                                        <span className="text-xs font-black text-white italic uppercase tracking-tight">{sample.code}</span>
                                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Amostra</span>
                                    </div>
                                    <Badge variant="outline" className="text-[9px] font-black uppercase tracking-widest border-slate-800 text-slate-400 bg-slate-900/50">{sample.status}</Badge>
                                </div>
                            ))}
                            {activity.recentBatches.map((batch: any) => (
                                <div key={batch.id} className="flex items-center justify-between p-4 hover:bg-slate-900/40 transition-colors">
                                    <div className="flex flex-col gap-0.5">
                                        <span className="text-xs font-black text-white italic uppercase tracking-tight">{batch.code}</span>
                                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Lote de Produção</span>
                                    </div>
                                    <Badge variant="outline" className="text-[9px] font-black uppercase tracking-widest border-blue-500/20 text-blue-400 bg-blue-500/5">{batch.status}</Badge>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-slate-950/20 border-slate-800 border-2 border-dashed shadow-xl overflow-hidden">
                    <CardHeader className="bg-slate-900/20 border-b border-slate-800 pb-4">
                        <CardTitle className="text-[11px] font-black uppercase tracking-[0.2em] text-white italic">Atalhos de Sistema</CardTitle>
                        <CardDescription className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Links rápidos para configuração.</CardDescription>
                    </CardHeader>
                    <CardContent className="p-6 space-y-3">
                        <Button variant="outline" className="h-10 w-full justify-between bg-card border-slate-800 hover:bg-slate-800 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all shadow-lg" asChild>
                            <Link href="/settings">
                                Configurações Gerais <ArrowRight className="h-3.5 w-3.5 opacity-50" />
                            </Link>
                        </Button>
                        <Button variant="outline" className="h-10 w-full justify-between bg-card border-slate-800 hover:bg-slate-800 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all shadow-lg" asChild>
                            <Link href="/audit-logs">
                                Logs de Auditoria <ArrowRight className="h-3.5 w-3.5 opacity-50" />
                            </Link>
                        </Button>
                        <Button variant="outline" className="h-10 w-full justify-between bg-card border-slate-800 hover:bg-slate-800 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all shadow-lg" asChild>
                            <Link href="/integrations">
                                Integrações (ERP/IoT) <ArrowRight className="h-3.5 w-3.5 opacity-50" />
                            </Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

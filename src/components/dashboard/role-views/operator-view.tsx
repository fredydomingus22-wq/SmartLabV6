"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    Factory,
    ClipboardCheck,
    Thermometer,
    Plus,
    Package,
    AlertCircle,
    ArrowRight
} from "lucide-react";
import Link from "next/link";

interface OperatorViewProps {
    stats: any;
    activity: any;
}

export function OperatorView({ stats, activity }: OperatorViewProps) {
    return (
        <div className="space-y-6">
            {/* Quick Action Grid - Large Buttons for Industrial UI */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Link href="/production/batches/new" className="group">
                    <Card className="glass hover:bg-emerald-500/5 transition-all duration-300 border-none h-full">
                        <CardHeader className="pb-2">
                            <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                                <Plus className="h-6 w-6 text-emerald-400" />
                            </div>
                            <CardTitle className="text-lg">Novo Lote</CardTitle>
                            <CardDescription>Iniciar ordem de produção</CardDescription>
                        </CardHeader>
                    </Card>
                </Link>
                <Link href="/haccp/readings/new" className="group">
                    <Card className="glass hover:bg-orange-500/5 transition-all duration-300 border-none h-full">
                        <CardHeader className="pb-2">
                            <div className="h-12 w-12 rounded-2xl bg-orange-500/10 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                                <Thermometer className="h-6 w-6 text-orange-400" />
                            </div>
                            <CardTitle className="text-lg">Registar CCP</CardTitle>
                            <CardDescription>Leitura de segurança alimentar</CardDescription>
                        </CardHeader>
                    </Card>
                </Link>
                <Link href="/lab/create" className="group">
                    <Card className="glass hover:bg-blue-500/5 transition-all duration-300 border-none h-full">
                        <CardHeader className="pb-2">
                            <div className="h-12 w-12 rounded-2xl bg-blue-500/10 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                                <ClipboardCheck className="h-6 w-6 text-blue-400" />
                            </div>
                            <CardTitle className="text-lg">Nova Amostra</CardTitle>
                            <CardDescription>Recolha de amostra para lab</CardDescription>
                        </CardHeader>
                    </Card>
                </Link>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
                {/* Active Batches Focus */}
                <Card className="glass">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle className="text-base">Lotes Ativos</CardTitle>
                            <CardDescription>O que está em linha agora</CardDescription>
                        </div>
                        <Factory className="h-5 w-5 text-slate-500" />
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="divide-y divide-slate-800/50">
                            {activity.recentBatches.filter((b: any) => b.status === 'open').map((batch: any) => (
                                <div key={batch.id} className="flex items-center justify-between p-4">
                                    <div className="flex flex-col">
                                        <span className="font-bold">{batch.code}</span>
                                        <span className="text-xs text-muted-foreground">{new Date(batch.start_date).toLocaleTimeString()}</span>
                                    </div>
                                    <Link href={`/production/${batch.id}`}>
                                        <Badge variant="outline" className="cursor-pointer hover:bg-white/5">
                                            Controlar <ArrowRight className="ml-1 h-3 w-3" />
                                        </Badge>
                                    </Link>
                                </div>
                            ))}
                            {activity.recentBatches.filter((b: any) => b.status === 'open').length === 0 && (
                                <div className="p-8 text-center text-slate-500 text-sm italic">Nenhum lote em produção.</div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Critical Alerts */}
                <Card className="glass border-red-500/10 bg-red-500/5">
                    <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                            <AlertCircle className="h-4 w-4 text-red-400" />
                            Alertas Críticos
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {stats.recentDeviations > 0 && (
                            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-xs flex items-center justify-between">
                                <span>{stats.recentDeviations} Desvios CCP detetados no turno</span>
                                <Link href="/haccp/deviations" className="font-bold underline">Resolver</Link>
                            </div>
                        )}
                        {stats.expiringSoon > 0 && (
                            <div className="p-3 rounded-lg bg-orange-500/10 border border-orange-500/20 text-xs">
                                {stats.expiringSoon} Lotes de material próximo de expirar.
                            </div>
                        )}
                        {stats.recentDeviations === 0 && stats.expiringSoon === 0 && (
                            <div className="text-center py-4 text-emerald-400 text-sm font-medium">Tudo operacional. Sem alertas críticos.</div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

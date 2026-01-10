"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ClipboardCheck, Clock, FlaskConical, Microscope, Beaker, Factory, RefreshCw, ShieldAlert, Plus, ArrowRight, Package } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface AnalystViewProps {
    user: any;
    stats: any;
    assignments: any[];
    activity: any;
}

export function AnalystView({ user, stats, assignments, activity }: AnalystViewProps) {
    const isMicro = user.role === 'micro_analyst';
    const isLab = user.role === 'lab_analyst';

    return (
        <div className="space-y-6">
            {/* Quick Actions Bar */}
            <div className="flex flex-wrap gap-2">
                <Button asChild size="sm" className="glass-primary">
                    <Link href="/lab?create=true">
                        <Plus className="h-4 w-4 mr-1" /> Nova Amostra
                    </Link>
                </Button>
                {isLab && (
                    <>
                        <Button asChild size="sm" variant="outline" className="glass border-blue-500/20 hover:bg-blue-500/10">
                            <Link href="/production">
                                <Factory className="h-4 w-4 mr-1" /> Produção
                            </Link>
                        </Button>
                        <Button asChild size="sm" variant="outline" className="glass border-cyan-500/20 hover:bg-cyan-500/10">
                            <Link href="/cip/register">
                                <RefreshCw className="h-4 w-4 mr-1" /> Registar CIP
                            </Link>
                        </Button>
                        <Button asChild size="sm" variant="outline" className="glass border-orange-500/20 hover:bg-orange-500/10">
                            <Link href="/haccp/pcc">
                                <ShieldAlert className="h-4 w-4 mr-1" /> Monitorar PCC
                            </Link>
                        </Button>
                    </>
                )}
            </div>

            {/* Stats Grid - Lab Analyst Specific */}
            <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
                <Card className="glass border-orange-500/20 bg-orange-500/5">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-medium flex items-center gap-2 text-muted-foreground">
                            <Clock className="h-3.5 w-3.5 text-orange-400" />
                            Pendentes
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <span className="text-2xl font-bold text-orange-400">{stats.roleAlerts || stats.pendingSamples}</span>
                    </CardContent>
                </Card>
                <Card className="glass border-blue-500/20">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-medium flex items-center gap-2 text-muted-foreground">
                            <Beaker className="h-3.5 w-3.5 text-blue-400" />
                            Em Análise
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <span className="text-2xl font-bold text-blue-400">{stats.inAnalysis}</span>
                    </CardContent>
                </Card>
                {isLab && (
                    <>
                        <Card className="glass border-cyan-500/20">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-xs font-medium flex items-center gap-2 text-muted-foreground">
                                    <RefreshCw className="h-3.5 w-3.5 text-cyan-400" />
                                    CIP Pendente
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <span className="text-2xl font-bold text-cyan-400">{stats.cipActive || 0}</span>
                            </CardContent>
                        </Card>
                        <Card className={cn("glass", stats.recentDeviations > 0 ? "border-red-500/30 bg-red-500/5" : "border-emerald-500/20")}>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-xs font-medium flex items-center gap-2 text-muted-foreground">
                                    <ShieldAlert className={cn("h-3.5 w-3.5", stats.recentDeviations > 0 ? "text-red-400" : "text-emerald-400")} />
                                    Desvios PCC
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <span className={cn("text-2xl font-bold", stats.recentDeviations > 0 ? "text-red-400" : "text-emerald-400")}>{stats.recentDeviations || 0}</span>
                            </CardContent>
                        </Card>
                    </>
                )}
            </div>

            {/* Assignments List */}
            <Card className="glass overflow-hidden">
                <CardHeader className="border-b border-slate-800/50 bg-slate-900/20 flex flex-row items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                        <ClipboardCheck className="h-4 w-4 text-orange-400" />
                        Minha Fila de Trabalho
                    </CardTitle>
                    <Button asChild variant="ghost" size="sm" className="text-xs">
                        <Link href={isMicro ? "/micro/samples" : "/lab"}>
                            Ver Todas <ArrowRight className="h-3 w-3 ml-1" />
                        </Link>
                    </Button>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="divide-y divide-slate-800/50">
                        {assignments.length === 0 && (
                            <div className="p-6 text-center text-muted-foreground text-sm">
                                Sem tarefas pendentes. Bom trabalho! 🎉
                            </div>
                        )}
                        {assignments.map((task: any) => (
                            <Link
                                key={task.id}
                                href={task.type === 'micro' ? `/micro/reading` : `/lab/samples/${task.id}`}
                                className="flex items-center justify-between p-4 hover:bg-slate-900/30 transition-colors group"
                            >
                                <div className="flex items-center gap-4">
                                    <div className={cn(
                                        "p-2 rounded-lg",
                                        task.type === 'micro' ? "bg-purple-500/10" :
                                            task.type === 'batch' ? "bg-emerald-500/10" : "bg-blue-500/10"
                                    )}>
                                        {task.type === 'micro' ? <Microscope className="h-4 w-4 text-purple-400" /> :
                                            task.type === 'batch' ? <Package className="h-4 w-4 text-emerald-400" /> : <Beaker className="h-4 w-4 text-blue-400" />}
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <span className="font-bold text-slate-100">{task.title}</span>
                                        <span className="text-xs text-slate-400">{task.subtitle}</span>
                                    </div>
                                </div>
                                <Clock className="h-4 w-4 text-slate-600 group-hover:text-orange-400 transition-colors" />
                            </Link>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Recent Samples */}
            <Card className="glass overflow-hidden">
                <CardHeader className="border-b border-slate-800/50">
                    <CardTitle className="text-sm">Atividade Recente</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="divide-y divide-slate-800/50">
                        {activity.recentSamples.map((sample: any) => (
                            <div key={sample.id} className="flex items-center justify-between p-3 px-4">
                                <span className="font-mono text-xs">{sample.code}</span>
                                <Badge variant="outline" className="text-[10px] capitalize">
                                    {sample.status.replace("_", " ")}
                                </Badge>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ClipboardCheck, Clock, FlaskConical, Microscope, Beaker } from "lucide-react";
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

    return (
        <div className="space-y-6">
            {/* Task Summary Card */}
            <div className="grid gap-4 md:grid-cols-2">
                <Card className="glass border-orange-500/20 bg-orange-500/5">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-semibold flex items-center gap-2">
                            <Clock className="h-4 w-4 text-orange-400" />
                            Ações Pendentes Hoje
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                            <span className="text-3xl font-bold text-orange-400">{stats.roleAlerts}</span>
                            <Badge variant="outline" className="border-orange-500/20">Urgente</Badge>
                        </div>
                    </CardContent>
                </Card>
                <Card className="glass border-blue-500/20">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-semibold flex items-center gap-2">
                            <ClipboardCheck className="h-4 w-4 text-blue-400" />
                            Progresso do Turno
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                            <span className="text-3xl font-bold text-blue-400">{stats.inAnalysis}</span>
                            <span className="text-xs text-muted-foreground uppercase">Amostras em Análise</span>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Assignments List */}
            <Card className="glass overflow-hidden">
                <CardHeader className="border-b border-slate-800/50 bg-slate-900/20">
                    <CardTitle className="text-base flex items-center gap-2">
                        <ClipboardCheck className="h-4 w-4 text-orange-400" />
                        Minha Fila de Trabalho
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="divide-y divide-slate-800/50">
                        {assignments.map((task: any) => (
                            <Link
                                key={task.id}
                                href={task.type === 'micro' ? `/micro/reading` : `/lab/samples/${task.id}`}
                                className="flex items-center justify-between p-4 hover:bg-slate-900/30 transition-colors group"
                            >
                                <div className="flex items-center gap-4">
                                    <div className={cn(
                                        "p-2 rounded-lg",
                                        task.type === 'micro' ? "bg-purple-500/10" : "bg-blue-500/10"
                                    )}>
                                        {task.type === 'micro' ? <Microscope className="h-4 w-4 text-purple-400" /> : <Beaker className="h-4 w-4 text-blue-400" />}
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

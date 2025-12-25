"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Trophy, Target, Activity, Users, ArrowUpRight, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface LabMetricsProps {
    stats: {
        pending: number;
        inAnalysis: number;
        reviewed: number;
        approved: number;
        rejected: number;
        todayResultsCount: number;
    };
    advanced: {
        rft: number;
        analystRanking: {
            name: string;
            count: number;
            successRate: number;
        }[];
    };
}

export function LabMetrics({ stats, advanced }: LabMetricsProps) {
    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
            {/* RFT - Right First Time */}
            <Card className="glass border-primary/20 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <Target className="h-16 w-16 text-primary" />
                </div>
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                        <Target className="h-4 w-4 text-primary" /> Right First Time (RFT)
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-end justify-between">
                        <div>
                            <div className="text-3xl font-bold">{advanced.rft}%</div>
                            <p className="text-xs text-muted-foreground mt-1">Últimos 30 dias</p>
                        </div>
                        <div className="w-16 h-16 relative flex items-center justify-center">
                            <svg className="w-full h-full transform -rotate-90">
                                <circle
                                    cx="32"
                                    cy="32"
                                    r="28"
                                    stroke="currentColor"
                                    strokeWidth="4"
                                    fill="transparent"
                                    className="text-muted/20"
                                />
                                <circle
                                    cx="32"
                                    cy="32"
                                    r="28"
                                    stroke="currentColor"
                                    strokeWidth="4"
                                    fill="transparent"
                                    strokeDasharray={175.9}
                                    strokeDashoffset={175.9 * (1 - advanced.rft / 100)}
                                    className="text-primary transition-all duration-1000"
                                />
                            </svg>
                            <span className="absolute text-[10px] font-bold">🎯</span>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Performance Global */}
            <Card className="glass border-blue-500/20">
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                        <Activity className="h-4 w-4 text-blue-500" /> Atividade diária
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-3xl font-bold">{stats.todayResultsCount}</div>
                    <div className="flex items-center gap-2 mt-2">
                        <Badge variant="secondary" className="bg-blue-500/10 text-blue-400 border-none text-[10px]">
                            <TrendingUp className="h-3 w-3 mr-1" /> Resultados Hoje
                        </Badge>
                    </div>
                </CardContent>
            </Card>

            {/* Queue Status */}
            <Card className="glass border-amber-500/20 col-span-1 md:col-span-2">
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                        <Users className="h-4 w-4 text-amber-500" /> Ranking de Analistas (Top 3)
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {advanced.analystRanking.slice(0, 3).map((analyst, idx) => (
                            <div key={idx} className="flex items-center gap-3 p-2 rounded-lg bg-slate-900/40 border border-slate-800/50">
                                <div className={cn(
                                    "h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold",
                                    idx === 0 ? "bg-yellow-500/20 text-yellow-500" :
                                        idx === 1 ? "bg-slate-400/20 text-slate-300" :
                                            "bg-amber-700/20 text-amber-600"
                                )}>
                                    {idx + 1}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate">{analyst.name}</p>
                                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                                        <span>{analyst.count} testes</span>
                                        <span className="text-emerald-500 font-bold">{Math.round(analyst.successRate)}% RFT</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {advanced.analystRanking.length === 0 && (
                            <div className="col-span-3 text-center py-2 text-xs text-muted-foreground italic">
                                Sem dados de performance disponíveis.
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Brain, Sparkles, TrendingUp, AlertTriangle, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

interface AIInsight {
    id: string;
    insight_type: "risk_warning" | "optimization" | "anomaly" | "prediction";
    content: string;
    severity: "low" | "medium" | "high";
    created_at: string;
}

interface AIIntelligencePanelProps {
    insights: AIInsight[];
}

export function AIIntelligencePanel({ insights }: AIIntelligencePanelProps) {
    if (!insights || insights.length === 0) {
        return (
            <Card className="glass h-full border-blue-500/20">
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Brain className="h-5 w-5 text-blue-400" />
                        IA Food Safety
                    </CardTitle>
                    <CardDescription>Inteligência preditiva para análise de riscos</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col items-center justify-center py-10 text-center space-y-4">
                    <div className="p-4 rounded-full bg-blue-500/5 animate-pulse">
                        <Sparkles className="h-10 w-10 text-blue-400/50" />
                    </div>
                    <p className="text-xs text-muted-foreground uppercase tracking-widest leading-loose">
                        A IA está a analisar os seus logs de PCC recentes... <br />
                        Insights serão gerados assim que houver massa de dados suficiente.
                    </p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="glass h-full border-blue-500/30 overflow-hidden">
            <CardHeader className="bg-blue-500/5 pb-4">
                <CardTitle className="text-lg flex items-center gap-2">
                    <Brain className="h-5 w-5 text-blue-400" />
                    Inteligência Preditiva
                </CardTitle>
                <CardDescription>Insights baseados em tendências e desvios históricos</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
                <div className="divide-y divide-white/5">
                    {insights.map((insight) => (
                        <div key={insight.id} className="p-4 hover:bg-blue-500/5 transition-colors space-y-2">
                            <div className="flex justify-between items-start">
                                <Badge variant="outline" className={cn(
                                    "text-[9px] font-bold uppercase tracking-tight px-2",
                                    insight.insight_type === 'risk_warning' ? "border-amber-500/50 text-amber-500" :
                                        insight.insight_type === 'anomaly' ? "border-rose-500/50 text-rose-500" :
                                            "border-blue-500/50 text-blue-400"
                                )}>
                                    {insight.insight_type === 'risk_warning' && <AlertTriangle className="h-3 w-3 mr-1" />}
                                    {insight.insight_type === 'optimization' && <TrendingUp className="h-3 w-3 mr-1" />}
                                    {insight.insight_type === 'anomaly' && <AlertTriangle className="h-3 w-3 mr-1" />}
                                    {insight.insight_type === 'prediction' && <Sparkles className="h-3 w-3 mr-1" />}
                                    {insight.insight_type}
                                </Badge>
                                <span className="text-[10px] text-muted-foreground">
                                    {new Date(insight.created_at).toLocaleDateString()}
                                </span>
                            </div>
                            <p className="text-xs leading-relaxed text-slate-300">
                                {insight.content}
                            </p>
                        </div>
                    ))}
                </div>
                <div className="p-4 bg-muted/20 items-center justify-between flex">
                    <span className="text-[9px] uppercase font-bold text-muted-foreground">Score de Risco AI</span>
                    <div className="flex items-center gap-2">
                        <div className="w-24 h-1.5 bg-white/10 rounded-full overflow-hidden">
                            <div className="bg-emerald-500 h-full w-[85%]" />
                        </div>
                        <span className="text-[10px] font-bold text-emerald-500">Baixo</span>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

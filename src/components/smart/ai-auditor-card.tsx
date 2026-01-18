"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    Sparkles,
    AlertTriangle,
    TrendingUp,
    Lightbulb,
    ShieldCheck,
    Loader2,
    RefreshCw
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface AIAuditorResult {
    summary: string;
    trends: string[];
    risks: string[];
    recommendations: string[];
    status: 'stable' | 'unstable' | 'critical';
}

interface AIAuditorCardProps {
    onAnalyze: () => Promise<AIAuditorResult>;
    initialData?: AIAuditorResult | null;
}

export function AIAuditorCard({ onAnalyze, initialData }: AIAuditorCardProps) {
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<AIAuditorResult | null>(initialData || null);

    const handleAnalyze = async () => {
        setLoading(true);
        try {
            const data = await onAnalyze();
            setResult(data);
        } catch (error) {
            console.error("AI Analysis failed", error);
        } finally {
            setLoading(false);
        }
    };

    const statusConfig = {
        stable: { color: "bg-success/10 text-success", icon: ShieldCheck, label: "ESTÁVEL" },
        unstable: { color: "bg-warning/10 text-warning", icon: TrendingUp, label: "INSTÁVEL" },
        critical: { color: "bg-destructive/10 text-destructive", icon: AlertTriangle, label: "CRÍTICO" }
    };

    const StatusIcon = result ? statusConfig[result.status].icon : Sparkles;

    return (
        <Card className="border-success/20 bg-card overflow-hidden relative group">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <Sparkles className="h-24 w-24 text-success" />
            </div>

            <CardHeader className="pb-4 relative z-10">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-success/10 border border-success/20">
                            <Sparkles className="h-5 w-5 text-success " />
                        </div>
                        <div>
                            <CardTitle className="text-lg font-bold text-white">Auditor SPC (IA)</CardTitle>
                            <CardDescription className="text-sm text-slate-400">Análise cognitiva de tendências e riscos.</CardDescription>
                        </div>
                    </div>
                    {result && (
                        <Badge className={cn("border-none px-3 py-1", statusConfig[result.status].color)}>
                            <StatusIcon className="h-3 w-3 mr-1.5" />
                            {statusConfig[result.status].label}
                        </Badge>
                    )}
                </div>
            </CardHeader>

            <CardContent className="space-y-6 relative z-10">
                {!result && !loading ? (
                    <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
                        <div className="h-16 w-16 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center">
                            <RefreshCw className="h-8 w-8 text-slate-600" />
                        </div>
                        <div className="max-w-[280px]">
                            <p className="text-sm text-slate-400 font-medium">A IA está pronta para processar os dados atuais e identificar padrões invisíveis.</p>
                        </div>
                        <Button
                            onClick={handleAnalyze}
                            className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold gap-2 px-8"
                        >
                            <Sparkles className="h-4 w-4" />
                            Iniciar Auditoria IA
                        </Button>
                    </div>
                ) : loading ? (
                    <div className="py-12 flex flex-col items-center justify-center space-y-4">
                        <Loader2 className="h-10 w-10 text-emerald-500 animate-spin" />
                        <div className="space-y-1 text-center">
                            <p className="text-sm font-bold text-white animate-pulse">Auditando padrões estatísticos...</p>
                            <p className="text-[10px] text-slate-500 uppercase tracking-widest">Processando via GPT-4o-Mini</p>
                        </div>
                    </div>
                ) : result ? (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-700">
                        {/* Summary Section */}
                        <div className="p-4 rounded-lg bg-slate-900/50 border border-border">
                            <p className="text-sm text-slate-300 leading-relaxed italic">"{result.summary}"</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Trends & Risks */}
                            <div className="space-y-4">
                                <div>
                                    <h4 className="flex items-center gap-2 text-[10px] font-bold text-primary uppercase tracking-widest mb-2">
                                        <TrendingUp className="h-3 w-3" /> Tendências Detectadas
                                    </h4>
                                    <ul className="space-y-2">
                                        {result.trends.map((t, idx) => (
                                            <li key={idx} className="text-xs text-slate-400 flex gap-2">
                                                <span className="text-blue-500 mt-1">•</span> {t}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                                <div>
                                    <h4 className="flex items-center gap-2 text-[10px] font-bold text-red-400 uppercase tracking-widest mb-2">
                                        <AlertTriangle className="h-3 w-3" /> Fatores de Risco
                                    </h4>
                                    <ul className="space-y-2">
                                        {result.risks.map((r, idx) => (
                                            <li key={idx} className="text-xs text-slate-400 flex gap-2">
                                                <span className="text-red-500 mt-1">•</span> {r}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>

                            {/* Recommendations */}
                            <div className="p-4 rounded-lg bg-success/5 border border-success/10">
                                <h4 className="flex items-center gap-2 text-[10px] font-bold text-success uppercase tracking-widest mb-3">
                                    <Lightbulb className="h-3 w-3" /> Recomendações Táticas
                                </h4>
                                <ul className="space-y-3">
                                    {result.recommendations.map((rec, idx) => (
                                        <li key={idx} className="text-xs text-slate-200 leading-relaxed flex gap-2">
                                            <div className="h-4 w-4 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
                                                <span className="text-[10px] font-bold text-emerald-500">{idx + 1}</span>
                                            </div>
                                            {rec}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>

                        <div className="pt-4 border-t border-slate-800 flex justify-end">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleAnalyze}
                                className="text-slate-500 hover:text-emerald-400 text-[10px] font-bold uppercase tracking-widest"
                            >
                                <RefreshCw className="h-3 w-3 mr-2" /> Recalcular Auditoria
                            </Button>
                        </div>
                    </div>
                ) : null}
            </CardContent>
        </Card>
    );
}

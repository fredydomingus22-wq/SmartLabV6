"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, BrainCircuit, ShieldAlert, ListChecks, Loader2 } from "lucide-react";
import { getNCAnalysisAIAction } from "@/app/actions/qms";
import { Badge } from "@/components/ui/badge";
import { useEffect } from "react";

interface NCInsightsProps {
    ncId: string;
}

export function NCInsights({ ncId }: NCInsightsProps) {
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);
    const [analysis, setAnalysis] = useState<any>(null);
    const [isCached, setIsCached] = useState(false);

    async function handleAnalyze() {
        setLoading(true);
        const result = await getNCAnalysisAIAction(ncId);
        if (result.success) {
            setAnalysis(result.analysis);
            setIsCached(!!result.cached);
        }
        setLoading(false);
        setInitialLoading(false);
    }

    useEffect(() => {
        handleAnalyze();
    }, [ncId]);

    if (initialLoading && !analysis) {
        return (
            <Card className="glass border-none shadow-xl bg-gradient-to-br from-indigo-500/5 to-purple-500/5">
                <CardContent className="p-12 flex flex-col items-center justify-center space-y-4">
                    <Loader2 className="h-8 w-8 text-indigo-400 animate-spin" />
                    <p className="text-sm text-muted-foreground animate-pulse">Obtendo insights da IA...</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="glass border-none shadow-xl overflow-hidden bg-gradient-to-br from-indigo-500/5 to-purple-500/5">
            <CardHeader className="flex flex-row items-center justify-between pb-2 border-b border-border/50">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-indigo-400" />
                    Insights de Inteligência Artificial
                    {isCached && (
                        <Badge variant="outline" className="text-[10px] h-4 bg-indigo-500/10 text-indigo-400 border-none">
                            Persistido
                        </Badge>
                    )}
                </CardTitle>
                <Button
                    onClick={() => handleAnalyze()}
                    disabled={loading}
                    variant="ghost"
                    size="sm"
                    className="text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10 text-xs h-8 rounded-full"
                >
                    {loading ? (
                        <Loader2 className="h-3 w-3 animate-spin mr-2" />
                    ) : (
                        <BrainCircuit className="h-3 w-3 mr-2" />
                    )}
                    Atualizar Análise
                </Button>
            </CardHeader>
            <CardContent className="p-6">
                {!analysis ? (
                    <div className="flex flex-col items-center justify-center py-8 text-center space-y-3">
                        <div className="p-4 rounded-full bg-indigo-500/10 text-indigo-400">
                            <BrainCircuit className="h-8 w-8" />
                        </div>
                        <div className="max-w-[280px]">
                            <p className="text-sm font-medium">Análise de Causa Raiz Assistida</p>
                            <p className="text-xs text-muted-foreground mt-1">
                                Use a nossa IA para obter sugestões baseadas na descrição e histórico de falhas semelhantes.
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-6 animate-in fade-in slide-in-from-top-2 duration-500">
                        {/* Risk Analysis */}
                        <div className="p-4 rounded-2xl bg-rose-500/5 border border-rose-500/10">
                            <div className="flex items-center gap-2 mb-2">
                                <ShieldAlert className="h-4 w-4 text-rose-400" />
                                <span className="text-xs font-bold uppercase tracking-wider text-rose-400">Análise de Risco</span>
                            </div>
                            <p className="text-sm text-foreground/90 leading-relaxed italic">
                                "{analysis.riskAnalysis}"
                            </p>
                        </div>

                        <div className="grid md:grid-cols-2 gap-6">
                            {/* Root Causes */}
                            <div className="space-y-3">
                                <div className="flex items-center gap-2">
                                    <ListChecks className="h-4 w-4 text-indigo-400" />
                                    <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Causas Prováveis</span>
                                </div>
                                <div className="space-y-2">
                                    {analysis.rootCauses.map((cause: string, i: number) => (
                                        <div key={i} className="flex gap-3 text-sm p-3 rounded-xl bg-white/5 border border-white/5">
                                            <span className="text-indigo-400 font-mono text-xs">0{i + 1}</span>
                                            <span>{cause}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="space-y-3">
                                <div className="flex items-center gap-2">
                                    <Sparkles className="h-4 w-4 text-emerald-400" />
                                    <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Ações Sugeridas</span>
                                </div>
                                <div className="space-y-2">
                                    {analysis.suggestedActions.map((action: string, i: number) => (
                                        <div key={i} className="flex gap-3 text-sm p-3 rounded-xl bg-white/5 border border-white/5">
                                            <Badge variant="outline" className="h-5 w-5 p-0 justify-center rounded-full text-[10px] border-emerald-500/30 text-emerald-400">
                                                {i + 1}
                                            </Badge>
                                            <span>{action}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="pt-4 border-t border-border/50 flex justify-end">
                            <Button
                                variant="ghost"
                                size="sm"
                                className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground hover:text-indigo-400"
                                onClick={() => setAnalysis(null)}
                            >
                                Limpar Análise
                            </Button>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

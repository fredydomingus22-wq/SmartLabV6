"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Save, AlertTriangle, ThumbsUp, Lightbulb, ClipboardCheck, AlertCircle, Sparkles, Wand2, Loader2, FileText, Target } from "lucide-react";
import { updateAuditEvaluationAction, generateAuditReportDraftAction } from "@/app/actions/audits";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface AuditGeneralEvaluationProps {
    audit: any;
}

export function AuditGeneralEvaluation({ audit }: AuditGeneralEvaluationProps) {
    const [strongPoints, setStrongPoints] = useState(audit.strong_points || "");
    const [improvementAreas, setImprovementAreas] = useState(audit.improvement_areas || "");
    const [conclusions, setConclusions] = useState(audit.conclusions || "");
    const [auditObjective, setAuditObjective] = useState(audit.audit_objective || "");
    const [executiveSummary, setExecutiveSummary] = useState(audit.executive_summary || "");
    const [isSaving, setIsSaving] = useState(false);
    const [isAIProcessing, setIsAIProcessing] = useState(false);
    const [activeAIField, setActiveAIField] = useState<string | null>(null);

    const handleGranularSuggest = async (field: string) => {
        if (isAIProcessing) return;
        setIsAIProcessing(true);
        setActiveAIField(field);
        toast.info(`Analisando dados para ${field}...`);

        try {
            const res = await generateAuditReportDraftAction(audit.id, field);
            if (res.success && res.data) {
                const suggestion = res.data.suggestion;

                switch (field) {
                    case 'audit_objective': setAuditObjective(suggestion); break;
                    case 'executive_summary': setExecutiveSummary(suggestion); break;
                    case 'conclusions': setConclusions(suggestion); break;
                    case 'strong_points':
                        setStrongPoints((prev: string) => prev ? `${prev}\n\nSugestão IA:\n${suggestion}` : suggestion);
                        break;
                    case 'improvement_areas':
                        setImprovementAreas((prev: string) => prev ? `${prev}\n\nSugestão IA:\n${suggestion}` : suggestion);
                        break;
                }
                toast.success("Sugestão aplicada!");
            } else {
                toast.error("IA não retornou sugestão válida");
            }
        } catch (error) {
            toast.error("Erro ao contactar a IA");
        } finally {
            setIsAIProcessing(false);
            setActiveAIField(null);
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const res = await updateAuditEvaluationAction({
                id: audit.id,
                strong_points: strongPoints,
                improvement_areas: improvementAreas,
                conclusions: conclusions,
                audit_objective: auditObjective,
                executive_summary: executiveSummary,
            });

            if (res.success) {
                toast.success("Avaliação global guardada");
            } else {
                toast.error(res.message);
            }
        } catch (error) {
            toast.error("Erro ao guardar avaliação");
        } finally {
            setIsSaving(false);
        }
    };

    const handleAISuggest = async () => {
        if (isAIProcessing) return;
        setIsAIProcessing(true);
        toast.info("A IA está a analisar os dados da auditoria...");

        try {
            const res = await generateAuditReportDraftAction(audit.id);
            if (res.success && res.data) {
                const draft = res.data;
                setExecutiveSummary(draft.executive_summary || executiveSummary);
                setConclusions(draft.conclusions || conclusions);

                if (draft.strong_points_suggestion) {
                    setStrongPoints((prev: string) => prev ? `${prev}\n\nSugestão IA:\n${draft.strong_points_suggestion}` : draft.strong_points_suggestion);
                }

                if (draft.improvement_areas_suggestion) {
                    setImprovementAreas((prev: string) => prev ? `${prev}\n\nSugestão IA:\n${draft.improvement_areas_suggestion}` : draft.improvement_areas_suggestion);
                }

                toast.success("Sugestão da IA gerada com sucesso!");
            } else {
                toast.error("Não foi possível gerar sugestão da IA");
            }
        } catch (error) {
            toast.error("Erro ao processar sugestão da IA");
        } finally {
            setIsAIProcessing(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-500/10 rounded-lg">
                        <FileText className="h-6 w-6 text-indigo-400" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-slate-100">Avaliação Global</h2>
                        <p className="text-sm text-slate-400">Resumo executivo e conclusões da auditoria (ISO 19011)</p>
                    </div>
                </div>

                <div className="flex gap-2">
                    <Button
                        onClick={handleAISuggest}
                        disabled={isAIProcessing}
                        variant="outline"
                        className="bg-slate-900/50 border-slate-700 hover:bg-indigo-500/10 text-slate-300 hover:text-indigo-400 gap-2 px-6"
                    >
                        {isAIProcessing && !activeAIField ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <Wand2 className="h-4 w-4" />
                        )}
                        {isAIProcessing && !activeAIField ? "A analisar..." : "Gerar Rascunho (IA)"}
                    </Button>
                    <Button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/20 px-6"
                    >
                        {isSaving ? "A guardar..." : "Guardar Relatório"}
                        <Save className="ml-2 h-4 w-4" />
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Audit Objective */}
                <Card className="glass border-slate-800/50 shadow-none lg:col-span-1">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base font-semibold flex items-center justify-between text-indigo-400">
                            <div className="flex items-center gap-2">
                                <ClipboardCheck className="h-5 w-5" />
                                Objetivo da Auditoria
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 text-[10px] gap-1.5 hover:bg-indigo-500/10 hover:text-indigo-400 transition-all font-black uppercase tracking-widest"
                                onClick={() => handleGranularSuggest('audit_objective')}
                                disabled={isAIProcessing}
                            >
                                {activeAIField === 'audit_objective' ? (
                                    <Sparkles className="h-3 w-3 animate-spin" />
                                ) : (
                                    <Sparkles className="h-3 w-3" />
                                )}
                                IA Assist
                            </Button>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Textarea
                            value={auditObjective}
                            onChange={(e) => setAuditObjective(e.target.value)}
                            placeholder="Descreva o propósito da auditoria (ex: Verificar conformidade com ISO 9001:2015)..."
                            className="min-h-[100px] bg-slate-900/30 border-slate-800 focus:border-indigo-500/50 resize-none text-sm leading-relaxed"
                        />
                    </CardContent>
                </Card>

                {/* Executive Summary */}
                <Card className="glass border-slate-800/50 shadow-none lg:col-span-1">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base font-semibold flex items-center justify-between text-amber-400">
                            <div className="flex items-center gap-2 font-mono tracking-tighter uppercase text-[12px]">
                                <AlertCircle className="h-5 w-5" />
                                Resumo Executivo
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 text-[10px] gap-1.5 hover:bg-amber-500/10 hover:text-amber-400 transition-all font-black uppercase tracking-widest"
                                onClick={() => handleGranularSuggest('executive_summary')}
                                disabled={isAIProcessing}
                            >
                                {activeAIField === 'executive_summary' ? (
                                    <Sparkles className="h-3 w-3 animate-spin" />
                                ) : (
                                    <Sparkles className="h-3 w-3" />
                                )}
                                IA Assist
                            </Button>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Textarea
                            value={executiveSummary}
                            onChange={(e) => setExecutiveSummary(e.target.value)}
                            placeholder="Visão geral rápida para a gestão de topo..."
                            className="min-h-[100px] bg-slate-900/30 border-slate-800 focus:border-amber-500/50 resize-none text-sm leading-relaxed font-italic"
                        />
                    </CardContent>
                </Card>

                {/* Strong Points */}
                <Card className="glass border-slate-800/50 shadow-none">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base font-semibold flex items-center justify-between text-emerald-400">
                            <div className="flex items-center gap-2">
                                <ThumbsUp className="h-5 w-5" />
                                Pontos Fortes
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 text-[10px] gap-1.5 hover:bg-emerald-500/10 hover:text-emerald-400 transition-all font-black uppercase tracking-widest"
                                onClick={() => handleGranularSuggest('strong_points')}
                                disabled={isAIProcessing}
                            >
                                {activeAIField === 'strong_points' ? (
                                    <Sparkles className="h-3 w-3 animate-spin" />
                                ) : (
                                    <Sparkles className="h-3 w-3" />
                                )}
                                IA Assist
                            </Button>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Textarea
                            value={strongPoints}
                            onChange={(e) => setStrongPoints(e.target.value)}
                            placeholder="Descreva as boas práticas e pontos positivos identificados..."
                            className="min-h-[150px] bg-slate-900/30 border-slate-800 focus:border-emerald-500/50 resize-none text-sm leading-relaxed"
                        />
                    </CardContent>
                </Card>

                {/* Improvement Areas */}
                <Card className="glass border-slate-800/50 shadow-none">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base font-semibold flex items-center justify-between text-rose-400">
                            <div className="flex items-center gap-2">
                                <Lightbulb className="h-5 w-5" />
                                Áreas de Melhoria
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 text-[10px] gap-1.5 hover:bg-rose-500/10 hover:text-rose-400 transition-all font-black uppercase tracking-widest"
                                onClick={() => handleGranularSuggest('improvement_areas')}
                                disabled={isAIProcessing}
                            >
                                {activeAIField === 'improvement_areas' ? (
                                    <Sparkles className="h-3 w-3 animate-spin" />
                                ) : (
                                    <Sparkles className="h-3 w-3" />
                                )}
                                IA Assist
                            </Button>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Textarea
                            value={improvementAreas}
                            onChange={(e) => setImprovementAreas(e.target.value)}
                            placeholder="Áreas que podem ser otimizadas mas não constituem não conformidades..."
                            className="min-h-[150px] bg-slate-900/30 border-slate-800 focus:border-rose-500/50 resize-none text-sm leading-relaxed"
                        />
                    </CardContent>
                </Card>

                <Card className="glass border-slate-800/50 shadow-none lg:col-span-2">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base font-semibold flex items-center justify-between text-blue-400 w-full">
                            <div className="flex items-center gap-2">
                                <FileText className="h-5 w-5" />
                                Conclusões Gerais
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 text-[10px] gap-1.5 hover:bg-blue-500/10 hover:text-blue-400 transition-all font-black uppercase tracking-widest"
                                onClick={() => handleGranularSuggest('conclusions')}
                                disabled={isAIProcessing}
                            >
                                {activeAIField === 'conclusions' ? (
                                    <Sparkles className="h-3 w-3 animate-spin" />
                                ) : (
                                    <Sparkles className="h-3 w-3" />
                                )}
                                IA Assist
                            </Button>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Textarea
                            value={conclusions}
                            onChange={(e) => setConclusions(e.target.value)}
                            placeholder="Resumo final sobre a conformidade do sistema e recomendação de certificação (se aplicável)..."
                            className="min-h-[120px] bg-slate-900/30 border-slate-800 focus:border-blue-500/50 resize-none text-sm leading-relaxed"
                        />
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}


"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Clock, User } from "lucide-react";
import { format } from "date-fns";
import { AIValidationBadge } from "@/components/lab/ai-validation-badge";
import { validateAnalysisWithAI } from "@/app/actions/ai";
import { toast } from "sonner";

interface AnalysisCardProps {
    analysis: {
        id: string;
        value_numeric: number | null;
        value_text: string | null;
        is_conforming: boolean | null;
        analyzed_at: string | null;
        analyzed_by: string | null;
        final_value?: string | number | null;
        parameter: { id: string; name: string; code: string; unit: string | null } | null;
        analyst?: { full_name: string } | null;
    };
    spec: { min_value?: number; max_value?: number; target_value?: number } | null;
    productName?: string;
    aiInsight?: {
        status: 'approved' | 'warning' | 'blocked';
        message: string;
        confidence: number;
    } | null;
}

export function AnalysisCard({ analysis, spec, productName, aiInsight }: AnalysisCardProps) {
    const [isValidating, setIsValidating] = useState(false);
    const [localInsight, setLocalInsight] = useState(aiInsight);

    const param = analysis.parameter;
    const isValuePresent = analysis.final_value !== null && analysis.final_value !== undefined;
    const displayValue = analysis.final_value;

    const handleAIValidation = async () => {
        if (!param || !isValuePresent) {
            toast.error("Não é possível validar sem um valor numérico.");
            return;
        }

        setIsValidating(true);
        try {
            const result = await validateAnalysisWithAI(
                analysis.id,
                param.name,
                typeof displayValue === 'number' ? displayValue : parseFloat(String(displayValue)),
                param.unit || '',
                spec?.min_value ?? null,
                spec?.max_value ?? null,
                productName
            );

            if (result.success && result.data) {
                setLocalInsight({
                    status: result.data.status,
                    message: result.data.message,
                    confidence: result.data.confidence,
                });
                toast.success("Validação IA concluída");
            } else {
                toast.error(result.message || "Erro na validação");
            }
        } catch (error) {
            toast.error("Falha ao comunicar com OpenAI");
        } finally {
            setIsValidating(false);
        }
    };

    return (
        <div className="relative p-5 rounded-2xl border bg-slate-900/40 border-slate-800 shadow-xl hover:shadow-2xl transition-all group overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent pointer-events-none" />

            <div className="flex justify-between items-start mb-4 relative z-10">
                <div className="space-y-1">
                    <p className="text-[10px] font-bold text-blue-400 uppercase tracking-[0.2em]">{param?.code}</p>
                    <h4 className="font-bold text-base text-slate-100 leading-tight pr-8">{param?.name}</h4>
                </div>
                <div className="absolute top-0 right-0 flex items-center gap-2">
                    {/* AI Validation Badge */}
                    <AIValidationBadge
                        status={localInsight?.status || null}
                        message={localInsight?.message}
                        confidence={localInsight?.confidence}
                        isLoading={isValidating}
                        onValidate={isValuePresent && !localInsight ? handleAIValidation : undefined}
                    />

                    {/* Conformity Status */}
                    {analysis.is_conforming === true && <div className="bg-green-500/10 p-1.5 rounded-full"><CheckCircle className="h-5 w-5 text-green-400" /></div>}
                    {analysis.is_conforming === false && <div className="bg-red-500/10 p-1.5 rounded-full"><XCircle className="h-5 w-5 text-red-400" /></div>}
                    {analysis.is_conforming === null && isValuePresent && <div className="bg-amber-500/10 p-1.5 rounded-full"><Clock className="h-5 w-5 text-amber-400" /></div>}
                </div>
            </div>

            <div className="mt-2 flex flex-col gap-4 relative z-10">
                <div className="flex items-baseline gap-2">
                    <span className={`text-3xl font-black tracking-tighter ${analysis.is_conforming === false ? 'text-red-400' : 'text-white'}`}>
                        {displayValue ?? "—"}
                    </span>
                    <span className="text-xs font-semibold text-slate-400">
                        {param?.unit}
                    </span>
                </div>

                {spec && (
                    <div className="flex flex-wrap gap-2 py-2 px-3 bg-slate-950/50 rounded-lg border border-slate-800/50">
                        {spec.min_value !== undefined && (
                            <div className="text-[10px] text-slate-400 font-medium">
                                Min: <span className="text-slate-200 font-bold">{spec.min_value}</span>
                            </div>
                        )}
                        {spec.target_value !== undefined && (
                            <div className="text-[10px] text-blue-400 font-medium italic">
                                Target: <span className="font-bold">{spec.target_value}</span>
                            </div>
                        )}
                        {spec.max_value !== undefined && (
                            <div className="text-[10px] text-slate-400 font-medium">
                                Max: <span className="text-slate-200 font-bold">{spec.max_value}</span>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {(analysis.analyzed_at || analysis.analyst) && (
                <div className="mt-6 pt-4 border-t border-slate-800/50 flex flex-col gap-2 relative z-10">
                    <div className="flex items-center gap-2 text-[10px] text-slate-400 font-bold tracking-tight uppercase">
                        <User className="h-3 w-3 text-blue-500" />
                        <span className="text-slate-300 font-bold">
                            {analysis.analyst?.full_name || (analysis.analyzed_by ? `ID: ${String(analysis.analyzed_by).substring(0, 8).toUpperCase()}` : "Not signed")}
                        </span>
                    </div>
                    {analysis.analyzed_at && (
                        <div className="flex items-center gap-2 text-[9px] text-slate-500 font-medium">
                            <Clock className="h-2.5 w-2.5" />
                            {format(new Date(analysis.analyzed_at), "dd/MM/yyyy HH:mm:ss")}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

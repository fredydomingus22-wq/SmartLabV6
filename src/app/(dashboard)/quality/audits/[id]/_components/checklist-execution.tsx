"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SearchableSelect } from "@/components/smart/searchable-select";
import { Button } from "@/components/ui/button";
import { Save, CheckCircle2, AlertCircle, HelpCircle, MinusCircle, FileClock } from "lucide-react";
import { submitAuditResponseAction } from "@/app/actions/audits";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ChecklistExecutionProps {
    auditId: string;
    checklist: any;
    responses: any[];
    readOnly?: boolean;
}

export function ChecklistExecution({ auditId, checklist, responses, readOnly }: ChecklistExecutionProps) {
    const [savingId, setSavingId] = useState<string | null>(null);

    const getResponseForQuestion = (questionId: string) => {
        return responses.find(r => r.question_id === questionId);
    };

    const handleSaveResponse = async (questionId: string, result: string, evidence: string, notes: string) => {
        setSavingId(questionId);
        try {
            const res = await submitAuditResponseAction({
                audit_id: auditId,
                question_id: questionId,
                result: result as any,
                evidence,
                notes
            });
            if (res.success) {
                toast.success("Resposta guardada");
            } else {
                toast.error(res.message);
            }
        } finally {
            setSavingId(null);
        }
    };

    return (
        <div className="space-y-8 pb-20">
            {checklist.sections?.map((section: any) => (
                <div key={section.id} className="space-y-4">
                    <h3 className="text-lg font-semibold text-slate-200 border-l-4 border-emerald-500 pl-3">
                        {section.name}
                    </h3>

                    <div className="grid gap-4">
                        {section.questions?.map((question: any) => {
                            const response = getResponseForQuestion(question.id);
                            return (
                                <QuestionCard
                                    key={question.id}
                                    question={question}
                                    response={response}
                                    onSave={(result, evidence, notes) => handleSaveResponse(question.id, result, evidence, notes)}
                                    isSaving={savingId === question.id}
                                    readOnly={readOnly}
                                />
                            );
                        })}
                    </div>
                </div>
            ))}
        </div>
    );
}

function QuestionCard({ question, response, onSave, isSaving, readOnly }: any) {
    const [result, setResult] = useState(response?.result || "compliant");
    const [evidence, setEvidence] = useState(response?.evidence || "");
    const [notes, setNotes] = useState(response?.notes || "");
    const [isDirty, setIsDirty] = useState(false);

    const resultOptions = [
        { value: "compliant", label: "Conforme", icon: CheckCircle2, color: "text-emerald-400" },
        { value: "minor_nc", label: "NC Menor", icon: AlertCircle, color: "text-amber-400" },
        { value: "major_nc", label: "NC Maior", icon: AlertCircle, color: "text-rose-500" },
        { value: "observation", label: "Observação", icon: HelpCircle, color: "text-blue-400" },
        { value: "ofi", label: "Oportunidade Melhoria", icon: PlayCircle, color: "text-emerald-500" },
        { value: "na", label: "N/A", icon: MinusCircle, color: "text-slate-500" },
    ];

    const currentResult = resultOptions.find(o => o.value === result);

    return (
        <Card className={cn(
            "glass border-slate-800/50 overflow-hidden transition-all duration-300",
            result === 'compliant' ? "hover:border-emerald-500/20" :
                ['minor_nc', 'major_nc'].includes(result) ? "border-rose-500/20" : ""
        )}>
            <div className="p-5 flex flex-col md:flex-row gap-6">
                <div className="flex-1 space-y-3">
                    <div className="flex items-start justify-between gap-4">
                        <div className="space-y-1">
                            {question.requirement_reference && (
                                <span className="text-[10px] uppercase font-bold tracking-widest text-emerald-400 px-2 py-0.5 rounded bg-emerald-500/10">
                                    Requisito {question.requirement_reference}
                                </span>
                            )}
                            <h4 className="font-medium text-slate-100 italic leading-relaxed">
                                {question.question_text}
                            </h4>
                        </div>
                    </div>

                    <div className="grid gap-2">
                        <Label className="text-xs text-slate-500 uppercase font-bold tracking-wider">Evidências / Observações</Label>
                        <Textarea
                            value={evidence}
                            onChange={(e) => { setEvidence(e.target.value); setIsDirty(true); }}
                            placeholder="Descrever evidências objetivas observadas..."
                            className="bg-slate-900/50 border-slate-800 focus:border-emerald-500/50 resize-none min-h-[80px]"
                            readOnly={readOnly}
                        />
                    </div>
                </div>

                <div className="w-full md:w-64 space-y-4 flex flex-col justify-between">
                    <div className="space-y-2">
                        <Label className="text-xs text-slate-500 uppercase font-bold tracking-wider">Resultado</Label>
                        <SearchableSelect
                            value={result}
                            onValueChange={(val) => { setResult(val); setIsDirty(true); }}
                            options={resultOptions.map(o => ({ value: o.value, label: o.label }))}
                            className="glass"
                            disabled={readOnly}
                        />
                    </div>

                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            {currentResult && (
                                <currentResult.icon className={cn("h-5 w-5", currentResult.color)} />
                            )}
                            <span className={cn("text-sm font-medium", currentResult?.color)}>
                                {currentResult?.label}
                            </span>
                        </div>

                        {!readOnly && (
                            <Button
                                size="sm"
                                variant={isDirty ? "default" : "ghost"}
                                className={cn(
                                    "h-8 transition-all",
                                    isDirty ? "bg-emerald-600 hover:bg-emerald-500" : "text-slate-500"
                                )}
                                onClick={() => {
                                    onSave(result, evidence, notes);
                                    setIsDirty(false);
                                }}
                                disabled={isSaving || !isDirty}
                            >
                                {isSaving ? "A guardar..." : "Guardar"}
                                <Save className="ml-2 h-3.5 w-3.5" />
                            </Button>
                        )}

                        {readOnly && response?.updated_at && (
                            <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
                                <FileClock className="h-3 w-3" />
                                {new Date(response.updated_at).toLocaleDateString()}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </Card>
    );
}

import { pt } from "date-fns/locale";
import { PlayCircle } from "lucide-react";

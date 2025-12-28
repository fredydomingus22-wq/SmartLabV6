"use client";

import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SearchableSelect } from "@/components/smart/searchable-select";
import { Button } from "@/components/ui/button";
import { Save, CheckCircle2, AlertCircle, HelpCircle, MinusCircle, FileClock, Upload, Paperclip, X, FileText, ImageIcon, ChevronRight, Edit3, PlayCircle } from "lucide-react";
import { submitAuditResponseAction } from "@/app/actions/audits";
import { uploadAuditEvidenceAction } from "@/app/actions/upload-evidence";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ChecklistExecutionProps {
    auditId: string;
    checklist: any;
    responses: any[];
    readOnly?: boolean;
}

export function ChecklistExecution({ auditId, checklist, responses, readOnly }: ChecklistExecutionProps) {
    const [activeQuestionId, setActiveQuestionId] = useState<string | null>(null);
    const [savingId, setSavingId] = useState<string | null>(null);

    // Initialize active question
    useEffect(() => {
        if (!activeQuestionId && checklist.sections?.[0]?.questions?.[0]) {
            setActiveQuestionId(checklist.sections[0].questions[0].id);
        }
    }, [checklist, activeQuestionId]);

    const getResponseForQuestion = (questionId: string) => {
        return responses.find(r => r.question_id === questionId);
    };

    const handleSaveResponse = async (questionId: string, result: string, evidence: string, notes: string, attachments: any[]) => {
        setSavingId(questionId);
        try {
            const res = await submitAuditResponseAction({
                audit_id: auditId,
                question_id: questionId,
                result: result as any,
                evidence,
                notes,
                attachments
            });
            if (res.success) {
                toast.success("Resposta guardada");
                // Auto-advance logic
                if (result === 'compliant' && activeQuestionId === questionId) {
                    goToNextQuestion(questionId);
                }
            } else {
                toast.error(res.message);
            }
        } finally {
            setSavingId(null);
        }
    };

    const goToNextQuestion = (currentId: string) => {
        let foundCurrent = false;
        for (const section of checklist.sections) {
            for (const question of section.questions) {
                if (foundCurrent) {
                    setActiveQuestionId(question.id);
                    return;
                }
                if (question.id === currentId) {
                    foundCurrent = true;
                }
            }
        }
    };

    // Flatten logic for navigation sidebar
    const getAllQuestions = () => {
        const questions: any[] = [];
        checklist.sections?.forEach((s: any) => {
            s.questions?.forEach((q: any) => {
                questions.push({ ...q, sectionName: s.name });
            });
        });
        return questions;
    };

    const activeQuestion = getAllQuestions().find(q => q.id === activeQuestionId);
    const activeResponse = activeQuestionId ? getResponseForQuestion(activeQuestionId) : null;

    return (
        <div className="flex h-[calc(100vh-250px)] gap-6">
            {/* Sidebar Navigation */}
            <div className="w-80 flex-shrink-0 flex flex-col bg-slate-950/30 border border-slate-800 rounded-2xl overflow-hidden glass">
                <div className="p-4 bg-slate-900/50 border-b border-slate-800">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Navegação</h3>
                </div>
                <div className="flex-1 overflow-y-auto p-2 space-y-6">
                    {checklist.sections?.map((section: any) => (
                        <div key={section.id}>
                            <div className="px-3 py-1.5 mb-1 text-[10px] uppercase font-bold text-emerald-500/70 tracking-widest sticky top-0 bg-slate-950/90 backdrop-blur-sm z-10 border-b border-emerald-500/10">
                                {section.name}
                            </div>
                            <div className="space-y-0.5">
                                {section.questions?.map((question: any) => {
                                    const response = getResponseForQuestion(question.id);
                                    const isCompleted = !!response;
                                    const isActive = activeQuestionId === question.id;

                                    return (
                                        <button
                                            key={question.id}
                                            onClick={() => setActiveQuestionId(question.id)}
                                            className={cn(
                                                "w-full text-left px-3 py-2.5 rounded-lg text-xs transition-all border border-transparent",
                                                isActive
                                                    ? "bg-indigo-500/20 text-indigo-300 border-indigo-500/30 shadow-[0_0_10px_-4px_rgba(99,102,241,0.5)]"
                                                    : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200",
                                                isCompleted && !isActive && "text-emerald-400/70"
                                            )}
                                        >
                                            <div className="flex items-start gap-2">
                                                <div className={cn(
                                                    "mt-0.5 h-1.5 w-1.5 rounded-full flex-shrink-0",
                                                    isActive ? "bg-indigo-400 animate-pulse" :
                                                        isCompleted ? "bg-emerald-500" : "bg-slate-700"
                                                )} />
                                                <span className="line-clamp-2 leading-relaxed">{question.question_text}</span>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Main Focus Area */}
            <div className="flex-1 flex flex-col min-h-0 bg-slate-950/20 rounded-2xl border border-slate-800/50 relative overflow-hidden">
                {activeQuestion ? (
                    <div className="flex-1 overflow-y-auto p-8">
                        {/* Header */}
                        <div className="mb-8">
                            <div className="flex items-center gap-3 mb-4">
                                <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-1 rounded font-mono uppercase">
                                    {activeQuestion.sectionName}
                                </span>
                                {activeQuestion.requirement_reference && (
                                    <span className="text-[10px] bg-emerald-950/30 text-emerald-400 border border-emerald-500/20 px-2 py-1 rounded font-bold tracking-widest uppercase">
                                        ISO {activeQuestion.requirement_reference}
                                    </span>
                                )}
                            </div>
                            <h2 className="text-2xl font-bold text-slate-100 leading-snug">
                                {activeQuestion.question_text}
                            </h2>
                        </div>

                        {/* Interactive Card */}
                        <QuestionFocusCard
                            key={activeQuestion.id} // Re-mount on change to reset state
                            question={activeQuestion}
                            response={activeResponse}
                            auditId={auditId}
                            onSave={(result: string, evidence: string, notes: string, attachments: string[]) =>
                                handleSaveResponse(activeQuestion.id, result, evidence, notes, attachments)
                            }
                            isSaving={savingId === activeQuestion.id}
                            readOnly={readOnly}
                        />

                    </div>
                ) : (
                    <div className="flex-1 flex items-center justify-center text-slate-500">
                        Selecione uma questão para começar
                    </div>
                )}
            </div>
        </div>
    );
}

function QuestionFocusCard({ question, response, auditId, onSave, isSaving, readOnly }: any) {
    // Mode Logic: If there is a response (and not saving), defaulting to View Mode
    const [isEditing, setIsEditing] = useState(!response);

    // Form State
    const [result, setResult] = useState(response?.result || "compliant");
    const [evidence, setEvidence] = useState(response?.evidence || "");
    const [notes, setNotes] = useState(response?.notes || "");
    const [attachments, setAttachments] = useState<any[]>(response?.attachments || []);
    const [isUploading, setIsUploading] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);

    // If response exists and not editing mode, we are in View Mode
    const isViewMode = !!response && !isEditing;

    const resultOptions = [
        { value: "compliant", label: "Conforme", icon: CheckCircle2, color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
        { value: "minor_nc", label: "NC Menor", icon: AlertCircle, color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20" },
        { value: "major_nc", label: "NC Maior", icon: AlertCircle, color: "text-rose-500", bg: "bg-rose-500/10", border: "border-rose-500/20" },
        { value: "observation", label: "Observação", icon: HelpCircle, color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/20" },
        { value: "ofi", label: "Oportunidade Melhoria", icon: PlayCircle, color: "text-emerald-500", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
        { value: "na", label: "N/A", icon: MinusCircle, color: "text-slate-500", bg: "bg-slate-500/10", border: "border-slate-500/20" },
    ];

    const currentResult = resultOptions.find(o => o.value === result);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        try {
            const maxSize = 2 * 1024 * 1024; // 2MB
            if (file.size > maxSize) {
                toast.error("O ficheiro excede o tamanho máximo de 2MB");
                if (fileInputRef.current) fileInputRef.current.value = "";
                return;
            }

            const formData = new FormData();
            formData.append("file", file);
            formData.append("auditId", auditId);
            formData.append("questionId", question.id);

            const res = await uploadAuditEvidenceAction(formData);

            if (res.success) {
                const newAttachment = {
                    name: res.name,
                    url: res.url,
                    type: res.type,
                    uploadedAt: new Date().toISOString()
                };
                setAttachments([...attachments, newAttachment]);
                toast.success("Ficheiro anexado");
            } else {
                toast.error(res.message);
            }
        } catch (error) {
            toast.error("Erro no upload");
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    const removeAttachment = (index: number) => {
        const newAttachments = [...attachments];
        newAttachments.splice(index, 1);
        setAttachments(newAttachments);
    };

    const handleSave = () => {
        onSave(result, evidence, notes, attachments);
        setIsEditing(false); // Switch to View Mode after save
    };

    // --- VIEW MODE ---
    if (isViewMode) {
        return (
            <div className="space-y-6 animate-in fade-in duration-300">
                {/* Result Banner */}
                <div className={cn(
                    "p-4 rounded-xl border flex items-center justify-between",
                    currentResult?.bg, currentResult?.border
                )}>
                    <div className="flex items-center gap-3">
                        {currentResult && <currentResult.icon className={cn("h-6 w-6", currentResult.color)} />}
                        <div>
                            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Resultado</p>
                            <p className={cn("text-lg font-bold", currentResult?.color)}>{currentResult?.label}</p>
                        </div>
                    </div>
                    {!readOnly && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setIsEditing(true)}
                            className="bg-slate-900/50 hover:bg-slate-800 text-slate-300 border border-slate-700/50"
                        >
                            <Edit3 className="h-4 w-4 mr-2" />
                            Editar Resposta
                        </Button>
                    )}
                </div>

                {/* Evidence View */}
                <div className="bg-slate-900/40 rounded-xl border border-slate-800 p-6 space-y-4">
                    <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        Evidências Registadas
                    </h4>
                    <p className="text-slate-200 text-sm leading-relaxed whitespace-pre-wrap font-light">
                        {evidence || <span className="text-slate-600 italic">Sem evidências descritas.</span>}
                    </p>

                    {/* Attachments List */}
                    {attachments.length > 0 && (
                        <div className="pt-4 mt-4 border-t border-slate-800/50">
                            <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Anexos</h5>
                            <div className="flex flex-wrap gap-2">
                                {attachments.map((file, idx) => (
                                    <ViewAttachmentBadge key={idx} file={file} />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // --- EDIT MODE ---
    return (
        <div className="space-y-8 animate-in slide-in-from-right-2 duration-300">

            {/* 1. Decision Area */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                {resultOptions.map((option) => (
                    <button
                        key={option.value}
                        onClick={() => setResult(option.value)}
                        className={cn(
                            "flex flex-col items-center justify-center p-3 rounded-xl border transition-all duration-200 gap-2",
                            result === option.value
                                ? cn(option.bg, option.border, "shadow-[0_0_15px_-4px_rgba(0,0,0,0.5)]")
                                : "bg-slate-900/30 border-slate-800 hover:border-slate-700 hover:bg-slate-900/50 opacity-70 hover:opacity-100"
                        )}
                    >
                        <option.icon className={cn("h-6 w-6", result === option.value ? option.color : "text-slate-500")} />
                        <span className={cn("text-xs font-medium", result === option.value ? "text-slate-200" : "text-slate-500")}>
                            {option.label}
                        </span>
                    </button>
                ))}
            </div>

            {/* 2. Evidence Input */}
            <div className="space-y-3">
                <div className="flex justify-between items-end">
                    <Label className="text-sm font-semibold text-slate-300">Evidências Objetivas</Label>
                    <span className="text-xs text-slate-500">Descreva o que foi verificado</span>
                </div>
                <Textarea
                    value={evidence}
                    onChange={(e) => setEvidence(e.target.value)}
                    placeholder="Ex: Auditado registo XYZ, verificado calibração do equipamento..."
                    className="min-h-[120px] bg-slate-950/50 border-slate-800 focus:border-indigo-500/50 text-base shadow-inner resize-none p-4"
                />
            </div>

            {/* 3. Attachments */}
            <div className="bg-slate-900/20 rounded-xl border border-slate-800/50 p-4 border-dashed">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2 text-slate-400">
                        <Paperclip className="h-4 w-4" />
                        <span className="text-sm font-medium">Anexos</span>
                        <span className="text-xs bg-slate-800 px-2 py-0.5 rounded text-slate-500">{attachments.length}</span>
                    </div>
                    <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        onChange={handleFileUpload}
                        accept="image/*,.pdf"
                    />
                    <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading}
                        className="text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10"
                    >
                        <Upload className="h-4 w-4 mr-2" />
                        {isUploading ? "A carregar..." : "Carregar Ficheiro"}
                    </Button>
                </div>

                {attachments.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                        {attachments.map((file, idx) => (
                            <div key={idx} className="group relative flex items-center gap-2 bg-slate-900 border border-slate-800 pl-3 pr-8 py-2 rounded-lg text-sm">
                                {file.type?.includes("image") ? <ImageIcon className="h-4 w-4 text-purple-400" /> : <FileText className="h-4 w-4 text-blue-400" />}
                                <span className="text-slate-300 truncate max-w-[200px]">{file.name}</span>
                                <button
                                    onClick={() => removeAttachment(idx)}
                                    className="absolute right-2 text-slate-500 hover:text-rose-400"
                                >
                                    <X className="h-3.5 w-3.5" />
                                </button>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div
                        onClick={() => fileInputRef.current?.click()}
                        className="h-20 flex flex-col items-center justify-center text-slate-600 hover:text-slate-500 cursor-pointer transition-colors"
                    >
                        <span className="text-xs">Arraste ficheiros ou clique para adicionar</span>
                    </div>
                )}
            </div>

            {/* 4. Action Bar */}
            <div className="flex items-center justify-end pt-4 border-t border-slate-800/50">
                <Button
                    size="lg"
                    onClick={handleSave}
                    disabled={isSaving}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white shadow-[0_0_20px_-5px_rgba(79,70,229,0.5)] transition-all px-8"
                >
                    {isSaving ? "A guardar..." : "Guardar Resposta"}
                    <Save className="ml-2 h-4 w-4" />
                </Button>
            </div>
        </div>
    );
}

function ViewAttachmentBadge({ file }: { file: any }) {
    return (
        <a
            href={file.url}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-lg text-xs hover:border-slate-700 hover:bg-slate-900 transition-all group"
        >
            {file.type?.includes("image") ? <ImageIcon className="h-3.5 w-3.5 text-purple-400" /> : <FileText className="h-3.5 w-3.5 text-blue-400" />}
            <span className="text-slate-400 group-hover:text-slate-200 transition-colors">{file.name}</span>
            <ChevronRight className="h-3 w-3 text-slate-600 group-hover:text-emerald-400 ml-1 opacity-0 group-hover:opacity-100 transition-all" />
        </a>
    )
}

"use client";

import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { IndustrialAnalysisForm } from "./IndustrialAnalysisForm";
import { IndustrialOOSDialog } from "@/components/shared/industrial-oos-dialog";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import {
    FlaskConical,
    ChevronLeft,
    ChevronRight,
    CheckCircle2,
    Fingerprint,
    ShieldCheck,
    AlertTriangle,
    Loader2
} from "lucide-react";
import { finalizeBatchAnalysisAction } from "@/app/actions/lab_modules/execution";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface ExecutionWizardProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    analyses: any[];
    specs: Record<string, any>;
    sample: any;
}

export function IndustrialExecutionWizard({ open, onOpenChange, analyses, specs, sample }: ExecutionWizardProps) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFinalStep, setIsFinalStep] = useState(false);
    const [password, setPassword] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [oosOpen, setOosOpen] = useState(false);

    // Local state for all results (The "Batch Cache")
    const [localResults, setLocalResults] = useState<Record<string, {
        value: string;
        notes: string;
        equipmentId: string;
        deviationType: string;
        isValid: boolean;
    }>>(() => {
        const initial: Record<string, any> = {};
        analyses.forEach(a => {
            initial[a.id] = {
                value: a.value_numeric?.toString() || a.value_text || "",
                notes: a.notes || "",
                equipmentId: a.equipment_id || "",
                deviationType: a.deviation_type || "",
                isValid: false // Will be updated on first render/interaction
            };
        });
        return initial;
    });

    const router = useRouter();

    const activeAnalysis = analyses[currentIndex];
    const totalSteps = analyses.length + 1; // Parameters + Signature Step
    const currentStepNumber = isFinalStep ? analyses.length + 1 : currentIndex + 1;
    const progress = (currentStepNumber / totalSteps) * 100;

    // Get correct spec for active parameter
    const activeSpec = activeAnalysis?.parameter ? specs[activeAnalysis.parameter.id] : {};

    const checkConformity = (val: string, spec: any) => {
        const num = parseFloat(val);
        if (isNaN(num)) return true; // Assume text is complying or handled elsewhere
        if (spec.min_value !== undefined && spec.min_value !== null && num < spec.min_value) return false;
        if (spec.max_value !== undefined && spec.max_value !== null && num > spec.max_value) return false;
        return true;
    };

    const handleNext = () => {
        if (isFinalStep) return;

        if (!activeAnalysis) return;
        const currentResult = localResults[activeAnalysis.id];
        const isConforming = checkConformity(currentResult.value, activeSpec);

        // If OOS and no notes, FORCE Dialog
        if (!isConforming && !currentResult.notes) {
            setOosOpen(true);
            return;
        }

        if (currentIndex < analyses.length - 1) {
            setCurrentIndex(prev => prev + 1);
        } else {
            setIsFinalStep(true);
        }
    };

    const handleOOSConfirm = async (reason: string) => {
        if (!activeAnalysis) return;
        // Update local result with reason
        setLocalResults(prev => ({
            ...prev,
            [activeAnalysis.id]: {
                ...prev[activeAnalysis.id],
                notes: reason,
                deviationType: "real_oos" // Default classification for now
            }
        }));
        setOosOpen(false);

        // Proceed to next step after state update
        // We use setTimeout to allow state to settle, or just rely on user clicking Next again? 
        // Better UX: Auto-advance.
        if (currentIndex < analyses.length - 1) {
            setCurrentIndex(prev => prev + 1);
        } else {
            setIsFinalStep(true);
        }
    };

    const handlePrev = () => {
        if (isFinalStep) {
            setIsFinalStep(false);
        } else if (currentIndex > 0) {
            setCurrentIndex(prev => prev - 1);
        }
    };

    const handleFormChange = (analysisId: string, newData: any) => {
        setLocalResults(prev => ({
            ...prev,
            [analysisId]: newData
        }));
    };

    const handleFinalSign = async () => {
        if (!password) {
            toast.error("A senha é obrigatória para a assinatura eletrónica.");
            return;
        }

        // Validate all results are filled/valid according to Industrial Standards
        const invalidAnalyses = analyses.filter(a => !localResults[a.id]?.isValid);
        if (invalidAnalyses.length > 0) {
            toast.error(`Existem ${invalidAnalyses.length} parâmetros com preenchimento incompleto.`);
            return;
        }

        setIsSubmitting(true);
        try {
            // Prepare payload
            const payload = analyses.map(a => ({
                analysisId: a.id,
                ...localResults[a.id]
            }));

            const result = await finalizeBatchAnalysisAction(sample.id, password, payload);

            if (result.success) {
                toast.success("Ciclo de análise concluído e assinado com sucesso!");
                onOpenChange(false);
                router.refresh();
            } else {
                toast.error(result.message);
            }
        } catch (error) {
            console.error(error);
            toast.error("Erro técnico ao processar assinatura em lote.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-6xl h-[90vh] bg-slate-950 border-slate-800 p-0 overflow-hidden flex flex-col shadow-[0_0_50px_rgba(0,0,0,0.5)]">
                {/* Header with Step Guidance */}
                <div className="p-6 border-b border-white/5 bg-slate-900/50">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-xl bg-blue-500/20 shadow-inner">
                                <FlaskConical className="h-6 w-6 text-blue-400" />
                            </div>
                            <div>
                                <DialogTitle className="text-2xl font-black text-white tracking-tighter uppercase italic">
                                    Execução Controlada
                                </DialogTitle>
                                <DialogDescription className="text-slate-500 font-mono text-xs">
                                    Amostra: {sample?.code} | {isFinalStep ? "Finalização & Assinatura" : `Passo ${currentIndex + 1} de ${analyses.length}`}
                                </DialogDescription>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            {Array.from({ length: totalSteps }).map((_, i) => (
                                <div
                                    key={i}
                                    className={cn(
                                        "w-2 h-2 rounded-full transition-all duration-300",
                                        i === (isFinalStep ? analyses.length : currentIndex) ? "bg-blue-500 w-8" : i < (isFinalStep ? analyses.length : currentIndex) ? "bg-emerald-500" : "bg-slate-800"
                                    )}
                                />
                            ))}
                        </div>
                    </div>
                    <Progress value={progress} className="h-1 bg-slate-800" />
                </div>

                {/* Main Execution Area */}
                <div className="flex-1 overflow-y-auto p-8 bg-black/20">
                    {!isFinalStep ? (
                        analyses.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-center space-y-4 animate-in fade-in duration-500">
                                <div className="p-4 rounded-full bg-slate-900 border border-slate-800">
                                    <AlertTriangle className="h-10 w-10 text-amber-500" />
                                </div>
                                <div className="space-y-1">
                                    <h3 className="text-xl font-bold text-white uppercase tracking-tight">Nenhuma Análise Pendente</h3>
                                    <p className="text-slate-500 max-w-md mx-auto text-sm">
                                        Não existem parâmetros de análise registados para esta amostra que correspondam ao seu perfil ou especificações do produto.
                                    </p>
                                </div>
                                <Button
                                    variant="outline"
                                    onClick={() => onOpenChange(false)}
                                    className="border-slate-800 text-slate-400 hover:text-white"
                                >
                                    Fechar Ambiente
                                </Button>
                            </div>
                        ) : (
                            activeAnalysis && (
                                <IndustrialAnalysisForm
                                    key={activeAnalysis.id}
                                    analysis={activeAnalysis}
                                    sample={sample}
                                    spec={activeSpec}
                                    data={localResults[activeAnalysis.id]}
                                    onChange={(newData) => handleFormChange(activeAnalysis.id, newData)}
                                />
                            )
                        )
                    ) : (
                        <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in zoom-in-95 duration-500">
                            <div className="text-center space-y-4">
                                <div className="inline-flex p-4 rounded-3xl bg-emerald-500/10 border border-emerald-500/20 shadow-[0_0_30px_rgba(16,185,129,0.1)]">
                                    <ShieldCheck className="h-12 w-12 text-emerald-400" />
                                </div>
                                <h2 className="text-3xl font-black text-white uppercase tracking-tighter">Fim do Ciclo de Análise</h2>
                                <p className="text-slate-400 font-medium">
                                    Todas as medições foram registradas. Por favor, revise os dados e forneça sua assinatura eletrónica para validar o lote.
                                </p>
                            </div>

                            <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 space-y-6">
                                <div className="flex items-center gap-3 pb-4 border-b border-slate-800">
                                    <Fingerprint className="h-6 w-6 text-blue-400" />
                                    <h3 className="text-lg font-bold text-slate-200">Assinatura Digital (21 CFR Part 11)</h3>
                                </div>

                                <div className="space-y-4">
                                    <Label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Confirmação de Identidade</Label>
                                    <Input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="Digite sua senha para assinar..."
                                        className="h-14 bg-black/40 border-slate-700 text-xl focus:ring-blue-500/20"
                                        autoFocus
                                    />
                                    <div className="flex items-start gap-2 p-3 rounded-lg bg-blue-500/5 border border-blue-500/10">
                                        <AlertTriangle className="h-4 w-4 text-blue-400 mt-0.5" />
                                        <p className="text-[10px] text-blue-300 leading-relaxed font-medium">
                                            Ao assinar, você declara que os resultados acima são verídicos e foram obtidos seguindo os procedimentos operacionais padrão (SOP) da unidade. Esta ação será registrada permanentemente na trilha de auditoria.
                                        </p>
                                    </div>
                                </div>

                                <Button
                                    onClick={handleFinalSign}
                                    disabled={!password || isSubmitting}
                                    className="w-full h-14 bg-emerald-600 hover:bg-emerald-500 text-white font-black uppercase tracking-widest shadow-[0_0_20px_rgba(16,185,129,0.2)]"
                                >
                                    {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : "Assinar & Validar Amostra"}
                                </Button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Navigation */}
                <div className="p-6 border-t border-white/5 bg-slate-900/50 flex items-center justify-between">
                    <Button
                        variant="ghost"
                        onClick={handlePrev}
                        disabled={currentIndex === 0 && !isFinalStep}
                        className="text-slate-400 hover:text-white"
                    >
                        <ChevronLeft className="h-4 w-4 mr-2" />
                        {isFinalStep ? "Voltar às Análises" : "Análise Anterior"}
                    </Button>

                    {!isFinalStep && (
                        <div className="flex items-center gap-6">
                            <div className="hidden md:flex flex-col items-end">
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Próxima Atividade</span>
                                <span className="text-sm font-bold text-slate-300">
                                    {currentIndex < analyses.length - 1 && analyses[currentIndex + 1]?.parameter
                                        ? analyses[currentIndex + 1].parameter.name
                                        : "Finalização & Assinatura"}
                                </span>
                            </div>
                            <Button
                                onClick={handleNext}
                                disabled={!activeAnalysis || !localResults[activeAnalysis.id]?.isValid}
                                className={cn(
                                    "h-12 px-8 font-bold uppercase tracking-widest transition-all",
                                    !activeAnalysis || !localResults[activeAnalysis.id]?.isValid
                                        ? "bg-slate-800 text-slate-500 border-slate-700"
                                        : "bg-blue-600 hover:bg-blue-500 text-white shadow-[0_0_15px_rgba(37,99,235,0.3)]"
                                )}
                            >
                                <div className="flex items-center gap-2">
                                    <span>{currentIndex < analyses.length - 1 ? "Próximo" : "Ir para Assinatura"}</span>
                                    <ChevronRight className="h-4 w-4" />
                                </div>
                            </Button>
                        </div>
                    )}
                </div>
            </DialogContent>

            {activeAnalysis && (
                <IndustrialOOSDialog
                    isOpen={oosOpen}
                    onClose={() => setOosOpen(false)}
                    onConfirm={handleOOSConfirm}
                    measuredValue={activeAnalysis ? localResults[activeAnalysis.id]?.value : ""}
                    specMin={activeSpec?.min_value}
                    specMax={activeSpec?.max_value}
                    unit={activeAnalysis.parameter?.unit}
                    productName={sample?.code}
                    testName={activeAnalysis.parameter?.name}
                />
            )}
        </Dialog>
    );
}

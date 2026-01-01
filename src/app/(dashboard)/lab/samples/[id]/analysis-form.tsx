"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Save, CheckCircle, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SignatureDialog } from "./signature-dialog";
import { signAndSaveResultsAction, startAnalysisAction } from "@/app/actions/lab_modules/results";
import { RealtimeAIBadge } from "@/components/lab/realtime-ai-badge";
import { AnalysisStatus } from "@/domain/lab/analysis.fsm";
import { IndustrialExecutionWizard } from "./_components/IndustrialExecutionWizard";
import { Activity, Beaker, ShieldCheck, Zap } from "lucide-react";

// Handle Supabase returning nested relations as arrays
interface ParameterInfo {
    id: string;
    name: string;
    code: string;
    unit: string | null;
}

interface Analysis {
    id: string;
    value_numeric: number | null;
    value_text: string | null;
    is_conforming: boolean | null;
    notes: string | null;
    analyzed_by: string | null;
    analyzed_at: string | null;
    analysis_method: string | null;
    equipment_id: string | null;
    status: 'pending' | 'started' | 'completed' | 'reviewed' | 'validated' | 'invalidated';
    parameter: ParameterInfo | ParameterInfo[] | null;
    analyst?: { full_name: string } | null;
    equipment?: { id: string; name: string; code: string; next_calibration_date: string; status: string } | null;
    final_value?: string | number | null;
    ai_insight?: { status: 'approved' | 'warning' | 'blocked' | 'info'; message: string; confidence: number } | null;
}

// Helper to normalize parameter (Supabase may return array or object)
const getParameter = (param: ParameterInfo | ParameterInfo[] | null): ParameterInfo | null => {
    if (!param) return null;
    return Array.isArray(param) ? param[0] : param;
};

interface Spec {
    min_value?: number;
    max_value?: number;
    target_value?: number;
    haccp?: { is_pcc?: boolean; category?: string };
}

interface AnalysisFormProps {
    sample: any;
    analyses: Analysis[];
    specs: Record<string, Spec>;
    isValidated: boolean;
}

export function AnalysisForm({ sample, analyses, specs, isValidated }: AnalysisFormProps) {
    const sampleId = sample.id;
    const sampleCode = sample.code;
    const [wizardOpen, setWizardOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [signatureOpen, setSignatureOpen] = useState(false);
    const [results, setResults] = useState<Record<string, string>>(() => {
        const initial: Record<string, string> = {};
        analyses.forEach(a => {
            if (a.value_numeric !== null && a.value_numeric !== undefined) {
                initial[a.id] = a.value_numeric.toString();
            } else if (a.value_text !== null && a.value_text !== undefined) {
                initial[a.id] = a.value_text;
            }
        });
        return initial;
    });
    const [equipmentIds, setEquipmentIds] = useState<Record<string, string>>(() => {
        const initial: Record<string, string> = {};
        analyses.forEach(a => {
            if (a.equipment_id) initial[a.id] = a.equipment_id;
        });
        return initial;
    });
    const [notes, setNotes] = useState<Record<string, string>>(() => {
        const initial: Record<string, string> = {};
        analyses.forEach(a => {
            if (a.notes) initial[a.id] = a.notes;
        });
        return initial;
    });
    const router = useRouter();

    // Sync state with props when analyses change (e.g. after router.refresh())
    useEffect(() => {
        const resultSync: Record<string, string> = {};
        const noteSync: Record<string, string> = {};
        const equipmentSync: Record<string, string> = {};

        analyses.forEach(a => {
            if (a.value_numeric !== null && a.value_numeric !== undefined) {
                resultSync[a.id] = a.value_numeric.toString();
            } else if (a.value_text !== null && a.value_text !== undefined) {
                resultSync[a.id] = a.value_text;
            }
            if (a.notes) noteSync[a.id] = a.notes;
            if (a.equipment_id) equipmentSync[a.id] = a.equipment_id;
        });

        setResults(resultSync);
        setNotes(noteSync);
        setEquipmentIds(equipmentSync);
    }, [analyses]);

    const handleResultChange = (analysisId: string, value: string) => {
        // Strict numeric validation: Only digits and points allowed.
        // Replace commas with points first, then filter out non-numeric characters.
        const normalized = value.replace(/,/g, '.');
        const filtered = normalized.replace(/[^0-9.]/g, '');

        // Prevent multiple points
        const pointCount = (filtered.match(/\./g) || []).length;
        if (pointCount > 1) return;

        setResults(prev => ({ ...prev, [analysisId]: filtered }));
    };

    const handleEquipmentChange = (analysisId: string, value: string) => {
        setEquipmentIds(prev => ({ ...prev, [analysisId]: value }));
    };

    const handleNoteChange = (analysisId: string, value: string) => {
        setNotes(prev => ({ ...prev, [analysisId]: value }));
    };

    const handleOpenSignature = () => {
        // Enforce OOS Justification
        const oosWithoutNotes = analyses.some(a => {
            const val = results[a.id] || "";
            const status = checkSpec(a, val);
            const note = notes[a.id]?.trim() || "";
            return status === "fail" && !note;
        });

        if (oosWithoutNotes) {
            toast.error("Resultados fora de especificação requerem uma nota de desvio.");
            return;
        }

        // Enforce Equipment Selection for provided results
        const missingEquipment = analyses.some(a => {
            const val = results[a.id] || "";
            const eqId = equipmentIds[a.id];
            return val !== "" && !eqId;
        });

        if (missingEquipment) {
            toast.error("Obrigatório: Selecione o instrumento utilizado para todos os resultados preenchidos.");
            return;
        }

        setSignatureOpen(true);
    };

    const handleSignAndSave = async (password: string) => {
        setLoading(true);

        const resultsArray = Object.entries(results).map(([analysisId, value]) => {
            const analysis = analyses.find(a => a.id === analysisId);
            const specStatus = analysis ? checkSpec(analysis, value) : "unknown";

            return {
                analysisId,
                value: value.trim() === "" ? null : value,
                notes: notes[analysisId] || undefined,
                equipmentId: equipmentIds[analysisId] || undefined,
                is_conforming: specStatus === "pass"
            };
        });

        const result = await signAndSaveResultsAction(sampleId, resultsArray, password);
        setLoading(false);

        if (result.success) {
            toast.success(result.message);
            setSignatureOpen(false);
            router.refresh();
        } else {
            toast.error(result.message);
        }
    };

    const checkSpec = (analysis: Analysis, value: string): "pass" | "fail" | "unknown" => {
        // If we have a saved value and it matches the current input, use the server's conformity status
        if (analysis.is_conforming !== null && (
            (analysis.value_numeric?.toString() === value) ||
            (analysis.value_text === value) ||
            (value === "" && analysis.value_numeric === null)
        )) {
            return analysis.is_conforming ? "pass" : "fail";
        }

        // Otherwise calculate real-time
        const param = getParameter(analysis.parameter);
        if (!param || !value) return "unknown";

        const spec = specs[param.id];
        if (!spec) return "unknown";

        const numValue = parseFloat(value);
        if (isNaN(numValue)) return "unknown";

        // Handle numeric limits correctly even if one side is null/undefined
        const isMinViolated = (spec.min_value !== undefined && spec.min_value !== null) && numValue < spec.min_value;
        const isMaxViolated = (spec.max_value !== undefined && spec.max_value !== null) && numValue > spec.max_value;

        if (isMinViolated || isMaxViolated) return "fail";

        return "pass";
    };

    const formatSpec = (parameterId: string): string => {
        const spec = specs[parameterId];
        if (!spec) return "—";

        if (spec.min_value !== undefined && spec.max_value !== undefined) {
            return `${spec.min_value} - ${spec.max_value}`;
        }
        if (spec.min_value !== undefined) return `≥ ${spec.min_value}`;
        if (spec.max_value !== undefined) return `≤ ${spec.max_value}`;
        if (spec.target_value !== undefined) return `= ${spec.target_value}`;
        return "—";
    };

    const getAnalysisStatusBadge = (status: string) => {
        const configs: Record<string, { label: string, className: string }> = {
            pending: { label: "Pendente", className: "bg-slate-900 text-slate-500 border-slate-800" },
            started: { label: "Em Curso", className: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
            completed: { label: "Concluída", className: "bg-amber-500/10 text-amber-500 border-amber-500/20" },
            reviewed: { label: "Revisada", className: "bg-purple-500/10 text-purple-400 border-purple-500/20" },
            validated: { label: "Validada", className: "bg-green-500/10 text-green-400 border-green-500/20" },
            invalidated: { label: "Inválida", className: "bg-red-500/10 text-red-400 border-red-500/20" },
        };
        const config = configs[status] || configs.pending;
        return <Badge variant="outline" className={cn("text-[9px] font-bold uppercase", config.className)}>{config.label}</Badge>;
    };

    const handleStartAnalysis = async (analysisId: string) => {
        setLoading(true);
        const res = await startAnalysisAction(analysisId);
        setLoading(false);
        if (res.success) {
            toast.success(res.message);
            router.refresh();
        } else {
            toast.error(res.message);
        }
    };

    // Stats calculation
    const totalParams = analyses.length;
    const completedParams = analyses.filter(a => {
        const val = results[a.id] || "";
        return val !== "";
    }).length;

    const conformingParams = analyses.filter(a => {
        const val = results[a.id] || "";
        return val !== "" && checkSpec(a, val) === "pass";
    }).length;

    const nonConformingParams = analyses.filter(a => {
        const val = results[a.id] || "";
        return val !== "" && checkSpec(a, val) === "fail";
    }).length;



    if (analyses.length === 0) {
        return (
            <div className="text-center py-8 text-muted-foreground">
                No parameters defined for this sample.
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <Card className="bg-slate-900/40 border-slate-800 shadow-2xl backdrop-blur-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-5">
                    <Activity className="h-32 w-32" />
                </div>

                <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between space-y-4 md:space-y-0 pb-8 border-b border-white/5 relative z-10">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-2xl bg-blue-500/10 border border-blue-500/20">
                            <Beaker className="h-6 w-6 text-blue-400" />
                        </div>
                        <div>
                            <CardTitle className="text-2xl font-black text-white tracking-tighter uppercase italic">Quadro Analítico</CardTitle>
                            <CardDescription className="text-slate-500 font-medium">Controle de parâmetros e especificações industriais</CardDescription>
                        </div>
                    </div>

                    <div className="flex items-center gap-6">
                        <div className="flex gap-4">
                            <StatBox label="Progress" value={`${completedParams}/${totalParams}`} />
                            <StatBox label="Conforming" value={conformingParams} color="text-emerald-400" />
                            <StatBox label="OOS" value={nonConformingParams} color="text-rose-400" />
                        </div>

                        {!isValidated && (
                            <Button
                                onClick={() => setWizardOpen(true)}
                                className="h-12 px-6 bg-blue-600 hover:bg-blue-500 text-white font-black uppercase tracking-widest shadow-lg shadow-blue-900/20 transition-all hover:scale-[1.02]"
                            >
                                <Zap className="h-4 w-4 mr-2" />
                                Iniciar Execução Guiada
                            </Button>
                        )}
                    </div>
                </CardHeader>

                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-white/5 bg-slate-900/60">
                                    <th className="text-left p-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Parâmetro</th>
                                    <th className="text-center p-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Alvo / Spec</th>
                                    <th className="text-center p-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Último Valor</th>
                                    <th className="text-center p-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Status IA</th>
                                    <th className="text-center p-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Lote FSM</th>
                                    <th className="text-center p-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Decisão</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {analyses.map((analysis) => {
                                    const value = results[analysis.id] || "";
                                    const specStatus = checkSpec(analysis, value);
                                    const param = getParameter(analysis.parameter);

                                    return (
                                        <tr key={analysis.id} className="group hover:bg-white/[0.02] transition-colors">
                                            <td className="p-6">
                                                <div className="flex items-center gap-3">
                                                    <div className={cn(
                                                        "w-1 h-8 rounded-full",
                                                        specStatus === "pass" ? "bg-emerald-500" : specStatus === "fail" ? "bg-rose-500" : "bg-slate-800"
                                                    )} />
                                                    <div>
                                                        <div className="font-black text-slate-100 uppercase tracking-tight">{param?.name}</div>
                                                        <div className="text-[10px] font-mono text-slate-500">{param?.code}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-6 text-center">
                                                <Badge variant="outline" className="font-mono text-[10px] bg-black/40 border-slate-800 text-blue-400">
                                                    {formatSpec(param?.id || "")}
                                                </Badge>
                                            </td>
                                            <td className="p-6 text-center">
                                                <div className={cn(
                                                    "text-lg font-black font-mono",
                                                    specStatus === "fail" ? "text-rose-400" : "text-white"
                                                )}>
                                                    {value || "—"}
                                                    <span className="text-[10px] text-slate-600 ml-1 font-bold">{param?.unit}</span>
                                                </div>
                                            </td>
                                            <td className="p-6 text-center">
                                                <RealtimeAIBadge
                                                    analysisId={analysis.id}
                                                    initialInsight={analysis.ai_insight || null}
                                                />
                                            </td>
                                            <td className="p-6 text-center">
                                                {getAnalysisStatusBadge(analysis.status)}
                                            </td>
                                            <td className="p-6 text-center">
                                                <div className="flex justify-center">
                                                    {specStatus === "pass" && (
                                                        <div className="flex items-center gap-1.5 text-emerald-400 text-[10px] font-black uppercase">
                                                            <CheckCircle className="h-3 w-3" />
                                                            Conforme
                                                        </div>
                                                    )}
                                                    {specStatus === "fail" && (
                                                        <div className="flex items-center gap-1.5 text-rose-400 text-[10px] font-black uppercase">
                                                            <XCircle className="h-3 w-3" />
                                                            OOS
                                                        </div>
                                                    )}
                                                    {specStatus === "unknown" && (
                                                        <div className="text-slate-600 text-[10px] font-bold uppercase">Pendente</div>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>

            <IndustrialExecutionWizard
                open={wizardOpen}
                onOpenChange={setWizardOpen}
                analyses={analyses}
                specs={specs}
                sample={sample}
            />

            <SignatureDialog
                open={signatureOpen}
                onOpenChange={setSignatureOpen}
                loading={loading}
                onConfirm={handleSignAndSave}
            />
        </div>
    );
}

function StatBox({ label, value, color = "text-white" }: { label: string, value: string | number, color?: string }) {
    return (
        <div className="text-center px-4 md:px-6 border-r border-white/5 last:border-0">
            <div className={cn("text-2xl font-black tracking-tighter", color)}>{value}</div>
            <div className="text-[9px] text-slate-500 font-black uppercase tracking-widest">{label}</div>
        </div>
    );
}

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
import { signAndSaveResultsAction } from "@/app/actions/lab";

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
    qa_parameter_id: string;
    parameter: ParameterInfo | ParameterInfo[] | null;
    analyst?: { full_name: string } | null;
    final_value?: string | number | null;
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
}

interface AnalysisFormProps {
    sampleId: string;
    sampleCode: string;
    analyses: Analysis[];
    specs: Record<string, Spec>;
    isValidated: boolean;
}

export function AnalysisForm({ sampleId, sampleCode, analyses, specs, isValidated }: AnalysisFormProps) {
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

        analyses.forEach(a => {
            if (a.value_numeric !== null && a.value_numeric !== undefined) {
                resultSync[a.id] = a.value_numeric.toString();
            } else if (a.value_text !== null && a.value_text !== undefined) {
                resultSync[a.id] = a.value_text;
            }
            if (a.notes) noteSync[a.id] = a.notes;
        });

        setResults(resultSync);
        setNotes(noteSync);
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

        setSignatureOpen(true);
    };

    const handleSignAndSave = async (password: string) => {
        setLoading(true);

        const resultsArray = Object.entries(results).map(([analysisId, value]) => ({
            analysisId,
            value: value.trim() === "" ? null : value,
            notes: notes[analysisId] || undefined
        }));

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
            (analysis.value_text === value)
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

        if (spec.min_value !== undefined && numValue < spec.min_value) return "fail";
        if (spec.max_value !== undefined && numValue > spec.max_value) return "fail";

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
        <div className="space-y-4">
            <Card className="bg-slate-900/50 border-slate-800 shadow-2xl backdrop-blur-md">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-6 border-b border-slate-800/50">
                    <div>
                        <CardTitle className="text-xl font-bold text-white tracking-tight">Analysis Results</CardTitle>
                        <CardDescription className="text-slate-400">
                            Enter results for all parameters. Spec limits are shown for reference.
                        </CardDescription>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="text-center px-4 border-r border-slate-800">
                            <div className="text-2xl font-black text-white">{completedParams}/{totalParams}</div>
                            <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Progress</div>
                        </div>
                        <div className="text-center px-4 border-r border-slate-800">
                            <div className="text-2xl font-black text-green-400">{conformingParams}</div>
                            <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Pass</div>
                        </div>
                        <div className="text-center px-4">
                            <div className="text-2xl font-black text-red-500">{nonConformingParams}</div>
                            <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Fail</div>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="pt-6">
                    <div className="rounded-xl border border-slate-800 bg-slate-950/20 overflow-hidden">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-slate-800 bg-slate-900/40">
                                    <th className="text-left p-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Parameter</th>
                                    <th className="text-left p-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Result</th>
                                    <th className="text-left p-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Unit</th>
                                    <th className="text-left p-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Spec</th>
                                    <th className="text-left p-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Notes</th>
                                    <th className="text-center p-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {analyses.map((analysis) => {
                                    const value = results[analysis.id] || "";
                                    const specStatus = checkSpec(analysis, value);
                                    const param = getParameter(analysis.parameter);

                                    return (
                                        <tr key={analysis.id} className="border-b border-slate-800/50 hover:bg-slate-800/20 transition-colors">
                                            <td className="p-4">
                                                <div className="font-bold text-slate-200">
                                                    {param?.name || "Unknown"}
                                                </div>
                                                <div className="text-[10px] font-mono text-slate-500">
                                                    {param?.code}
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <Input
                                                    type="text"
                                                    value={value}
                                                    onChange={(e) => handleResultChange(analysis.id, e.target.value)}
                                                    placeholder="0.00"
                                                    className={cn(
                                                        "w-28 bg-slate-900/50 border-slate-700 text-slate-100 placeholder:text-slate-600 focus:ring-blue-500/20",
                                                        specStatus === "fail" && "border-red-500/50 bg-red-500/5 text-red-200"
                                                    )}
                                                    disabled={isValidated}
                                                />
                                            </td>
                                            <td className="p-4 text-xs font-semibold text-slate-400">
                                                {param?.unit || "-"}
                                            </td>
                                            <td className="p-4">
                                                <Badge variant="outline" className="text-[10px] bg-slate-900 border-slate-800 text-slate-300 font-mono">
                                                    {formatSpec(param?.id || "")}
                                                </Badge>
                                            </td>
                                            <td className="p-4">
                                                <Input
                                                    type="text"
                                                    value={notes[analysis.id] || ""}
                                                    onChange={(e) => handleNoteChange(analysis.id, e.target.value)}
                                                    placeholder="Add note..."
                                                    className={cn(
                                                        "w-48 text-[11px] bg-slate-900/30 border-slate-800 text-slate-300 placeholder:text-slate-700",
                                                        specStatus === "fail" && (notes[analysis.id] || "").trim() === "" && "border-amber-500/50 bg-amber-500/5 placeholder:text-amber-500/40"
                                                    )}
                                                    disabled={isValidated}
                                                />
                                            </td>
                                            <td className="p-4 text-center">
                                                {specStatus === "pass" && (
                                                    <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/20 gap-1 px-2.5 py-0.5 text-[10px] font-bold">
                                                        <CheckCircle className="h-3 w-3" />
                                                        PASS
                                                    </Badge>
                                                )}
                                                {specStatus === "fail" && (
                                                    <Badge variant="outline" className="bg-red-500/10 text-red-400 border-red-500/20 gap-1 px-2.5 py-0.5 text-[10px] font-bold">
                                                        <XCircle className="h-3 w-3" />
                                                        FAIL
                                                    </Badge>
                                                )}
                                                {specStatus === "unknown" && (
                                                    <Badge variant="outline" className="text-slate-600 border-slate-800 bg-slate-900/50 px-2.5 py-0.5 text-[10px]">
                                                        PENDING
                                                    </Badge>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {!isValidated && (
                        <div className="flex justify-end gap-3 items-center mt-8">
                            <Button
                                onClick={handleOpenSignature}
                                disabled={loading}
                                className="bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20 px-8 py-6 rounded-xl font-bold transition-all hover:scale-[1.02] active:scale-[0.98]"
                            >
                                {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Save className="mr-2 h-5 w-5" />}
                                SIGN & FINALIZE RESULTS
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>

            <SignatureDialog
                open={signatureOpen}
                onOpenChange={setSignatureOpen}
                loading={loading}
                onConfirm={handleSignAndSave}
            />
        </div>
    );
}

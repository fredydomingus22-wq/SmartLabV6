"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Eye, AlertTriangle, CheckCircle, XCircle, FlaskConical } from "lucide-react";
import { ActionForm } from "@/components/smart/action-form";
import { registerMicroResultAction } from "@/app/actions/micro";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface ResultFormDialogProps {
    resultId: string;
    sampleCode?: string;
    parameterName?: string;
    maxColonyCount?: number | null;
}

export function ResultFormDialog({ resultId, sampleCode, parameterName, maxColonyCount }: ResultFormDialogProps) {
    const [open, setOpen] = useState(false);
    const [tntc, setTntc] = useState(false);
    const [colonyCount, setColonyCount] = useState<string>("");

    // Real-time conformity check
    const getConformityStatus = (): "conforming" | "non_conforming" | "unknown" => {
        if (tntc && maxColonyCount !== null && maxColonyCount !== undefined) {
            return "non_conforming";
        }
        if (!tntc && colonyCount) {
            const count = parseInt(colonyCount, 10);
            if (!isNaN(count) && maxColonyCount !== null && maxColonyCount !== undefined) {
                return count <= maxColonyCount ? "conforming" : "non_conforming";
            }
        }
        return "unknown";
    };

    const status = getConformityStatus();

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button size="sm" className="bg-slate-800 hover:bg-blue-600 text-slate-200 hover:text-white border border-slate-700 transition-all font-bold tracking-wide">
                    <Eye className="mr-2 h-4 w-4" />
                    Registar
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] glass border-slate-800 bg-slate-950/90 shadow-2xl backdrop-blur-xl">
                <DialogHeader className="border-b border-slate-800 pb-4">
                    <DialogTitle className="flex items-center gap-3 text-xl font-black tracking-tight text-white">
                        <div className="p-2 rounded-lg bg-blue-500/20 border border-blue-500/30">
                            <FlaskConical className="h-5 w-5 text-blue-400" />
                        </div>
                        {sampleCode}
                    </DialogTitle>
                    <p className="text-sm font-medium text-slate-400 pl-1">{parameterName}</p>
                </DialogHeader>

                {/* Spec Limit Display */}
                {maxColonyCount !== null && maxColonyCount !== undefined && (
                    <div className="flex items-center gap-3 p-3 bg-blue-500/10 rounded-xl border border-blue-500/20 mt-2">
                        <AlertTriangle className="h-4 w-4 text-blue-400" />
                        <span className="text-sm text-blue-200">
                            <strong className="text-blue-400 uppercase text-xs tracking-wider mr-2">Limite Máx:</strong>
                            {maxColonyCount} CFU
                        </span>
                    </div>
                )}

                <ActionForm
                    action={registerMicroResultAction}
                    onSuccess={() => setOpen(false)}
                    submitText="Confirmar Resultado"
                    className="space-y-6 pt-2"
                >
                    <input type="hidden" name="result_id" value={resultId} />

                    <div className="space-y-4">
                        <div className="flex items-center space-x-3 p-3 rounded-xl border border-slate-800 bg-slate-900/50">
                            <Checkbox
                                id="is_tntc"
                                name="is_tntc"
                                checked={tntc}
                                onCheckedChange={(c: boolean | "indeterminate") => setTntc(c === true)}
                                className="border-slate-600 data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500"
                            />
                            <Label htmlFor="is_tntc" className="font-bold text-slate-300 cursor-pointer">
                                Incontável (TNTC)
                            </Label>
                        </div>

                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="colony_count" className="text-right text-slate-400 font-medium text-xs uppercase tracking-wide">Contagem (CFU)</Label>
                            <Input
                                id="colony_count"
                                name="colony_count"
                                type="text"
                                className="col-span-3 bg-slate-900/80 border-slate-700 text-white font-mono text-lg focus:border-blue-500/50 focus:ring-blue-500/20"
                                disabled={tntc}
                                required={!tntc}
                                value={colonyCount}
                                onChange={(e) => {
                                    const val = e.target.value.replace(/[^0-9]/g, '');
                                    setColonyCount(val);
                                }}
                                placeholder="0"
                            />
                        </div>
                    </div>

                    {/* Real-time Conformity Indicator */}
                    {status !== "unknown" && (
                        <div className={cn(
                            "flex items-center justify-center gap-3 p-3 rounded-xl border font-bold text-sm tracking-wide transition-all",
                            status === "conforming"
                                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 shadow-lg shadow-emerald-500/10"
                                : "bg-rose-500/10 border-rose-500/30 text-rose-400 shadow-lg shadow-rose-500/10"
                        )}>
                            {status === "conforming" ? (
                                <>
                                    <CheckCircle className="h-5 w-5" />
                                    CONFORME
                                </>
                            ) : (
                                <>
                                    <XCircle className="h-5 w-5" />
                                    NÃO CONFORME
                                </>
                            )}
                        </div>
                    )}

                    <div className="grid grid-cols-4 items-start gap-4">
                        <Label htmlFor="result_text" className="text-right text-slate-400 font-medium text-xs uppercase tracking-wide pt-3">
                            Notas {status === "non_conforming" && <span className="text-rose-500">*</span>}
                        </Label>
                        <div className="col-span-3">
                            <Input
                                id="result_text"
                                name="result_text"
                                placeholder={status === "non_conforming" ? "Justificação obrigatória..." : "Observações..."}
                                className={cn(
                                    "bg-slate-900/80 border-slate-700 text-white",
                                    status === "non_conforming" && "border-rose-500/50 bg-rose-500/5 focus:border-rose-500"
                                )}
                                required={status === "non_conforming"}
                            />
                        </div>
                    </div>
                </ActionForm>
            </DialogContent>
        </Dialog>
    );
}

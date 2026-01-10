"use client";

import { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"; // Fixed import
import { Textarea } from "@/components/ui/textarea";  // Fixed import
import { CheckCircle2, XCircle, AlertTriangle, Scale } from "lucide-react";
import { toast } from "sonner";
import { logLabAssetActivityAction } from "@/app/actions/lab-assets";
import { cn } from "@/lib/utils";

interface DailyVerificationDialogProps {
    asset: {
        id: string;
        name: string;
        code: string;
        asset_category: string;
        verification_config?: {
            unit: string;
            standards: {
                id: string;
                name: string;
                nominal: number;
                tolerance: number;
            }[];
        };
    };
    onSuccess: () => void;
    trigger?: React.ReactNode;
}

const FALLBACK_STANDARDS = {
    balance: {
        unit: "g",
        standards: [
            { id: "std_100g_e2", name: "100g - Classe E2", nominal: 100.0000, tolerance: 0.0005 }, // Tolerance example
            { id: "std_50g_f1", name: "50g - Classe F1", nominal: 50.0000, tolerance: 0.0010 },
        ]
    },
    ph_meter: {
        unit: "pH",
        standards: [
            { id: "buf_4_01", name: "Buffer pH 4.01", nominal: 4.01, tolerance: 0.05 },
            { id: "buf_7_00", name: "Buffer pH 7.00", nominal: 7.00, tolerance: 0.05 },
        ]
    },
    general: {
        unit: "u",
        standards: [
            { id: "generic", name: "Padrão de Referência", nominal: 100, tolerance: 1 },
        ]
    }
};

export function DailyVerificationDialog({ asset, onSuccess, trigger }: DailyVerificationDialogProps) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    // Form State
    const [standardId, setStandardId] = useState<string>("");
    const [measuredValue, setMeasuredValue] = useState<string>("");
    const [notes, setNotes] = useState("");

    // Use asset-specific config or fall back to defaults
    const config = asset.verification_config ||
        FALLBACK_STANDARDS[asset.asset_category as keyof typeof FALLBACK_STANDARDS] ||
        FALLBACK_STANDARDS.general;

    const availableStandards = config.standards;
    const unit = config.unit;
    const selectedStandard = availableStandards.find(s => s.id === standardId);

    const numericMeasured = parseFloat(measuredValue.replace(',', '.'));
    const deviation = selectedStandard && !isNaN(numericMeasured)
        ? numericMeasured - selectedStandard.nominal
        : null;

    const isConforming = selectedStandard && deviation !== null
        ? Math.abs(deviation) <= selectedStandard.tolerance
        : null;

    const handleSubmit = async () => {
        if (!selectedStandard || isNaN(numericMeasured)) return;
        if (isConforming === false && !notes) {
            toast.error("Justificativa obrigatória para resultado Não Conforme.");
            return;
        }

        setLoading(true);
        const formData = new FormData();
        formData.append("asset_id", asset.id);
        formData.append("maintenance_type", "verification");
        formData.append("result", isConforming ? "pass" : "fail");
        formData.append("performed_at", new Date().toISOString());

        // Structured description for audit
        const description = `Verificação Diária: ${isConforming ? "CONFORME" : "NÃO CONFORME"}`;
        formData.append("description", description);

        // Serialize technical details into notes (or dedicated metadata if available)
        const technicalDetails = {
            standard: selectedStandard.name,
            nominal: selectedStandard.nominal,
            measured: numericMeasured,
            unit: unit,
            deviation: deviation?.toFixed(5),
            tolerance: selectedStandard.tolerance,
            user_notes: notes
        };
        formData.append("notes", JSON.stringify(technicalDetails, null, 2));

        const result = await logLabAssetActivityAction(formData);

        if (result.success) {
            toast.success(isConforming ? "Verificação registada com sucesso!" : "Não conformidade registada. Equipamento bloqueado.");
            setOpen(false);
            onSuccess();
        } else {
            toast.error(result.message);
        }
        setLoading(false);
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || <Button>Verificação Diária</Button>}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] bg-slate-950 border-slate-800 text-slate-100 p-0 overflow-hidden flex flex-col max-h-[90vh]">
                <div className="p-6 border-b border-slate-800">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Scale className="h-5 w-5 text-emerald-400" />
                            Verificação Diária
                        </DialogTitle>
                        <DialogDescription className="text-slate-400">
                            {asset.name} ({asset.code})
                            <br />
                            <span className="text-[10px] uppercase">Registo interno de verificação antes do uso.</span>
                        </DialogDescription>
                    </DialogHeader>
                </div>

                <div className="flex-1 overflow-y-auto px-6 py-4 scrollbar-thin scrollbar-thumb-slate-800">
                    <div className="grid gap-6">
                        {/* Standard Selection */}
                        <div className="grid gap-2">
                            <Label htmlFor="standard">Padrão Utilizado</Label>
                            <Select onValueChange={setStandardId} value={standardId}>
                                <SelectTrigger className="bg-slate-900 border-slate-700">
                                    <SelectValue placeholder="Selecione o padrão..." />
                                </SelectTrigger>
                                <SelectContent className="bg-slate-900 border-slate-700 text-slate-100">
                                    {availableStandards.map((std) => (
                                        <SelectItem key={std.id} value={std.id}>
                                            {std.name} (Nominal: {std.nominal} {unit})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Values Grid */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label className="text-xs text-slate-500">Valor Nominal ({unit})</Label>
                                <div className="h-10 px-3 py-2 rounded-md bg-slate-900/50 border border-slate-800 text-slate-400 font-mono text-sm flex items-center">
                                    {selectedStandard ? selectedStandard.nominal.toFixed(4) : "-"}
                                </div>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="measured" className="text-xs text-emerald-400">Valor Medido ({unit})</Label>
                                <Input
                                    id="measured"
                                    value={measuredValue}
                                    onChange={(e) => setMeasuredValue(e.target.value)}
                                    className="bg-slate-900 border-slate-700 font-mono"
                                    placeholder="0.0000"
                                    autoComplete="off"
                                />
                            </div>
                        </div>

                        {/* Results Display */}
                        {selectedStandard && deviation !== null && (
                            <div className={`rounded-lg border p-3 ${isConforming ? "bg-emerald-500/10 border-emerald-500/20" : "bg-red-500/10 border-red-500/20"}`}>
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-xs font-medium uppercase tracking-wider text-slate-400">Desvio Calculado</span>
                                    <span className={`font-mono font-bold ${isConforming ? "text-emerald-400" : "text-red-400"}`}>
                                        {deviation > 0 ? "+" : ""}{deviation.toFixed(5)} {unit}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-xs font-medium uppercase tracking-wider text-slate-400">Status</span>
                                    <div className="flex items-center gap-1.5">
                                        {isConforming ? (
                                            <>
                                                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                                                <span className="text-sm font-bold text-emerald-500">CONFORME</span>
                                            </>
                                        ) : (
                                            <>
                                                <XCircle className="h-4 w-4 text-red-500" />
                                                <span className="text-sm font-bold text-red-500">NÃO CONFORME</span>
                                            </>
                                        )}
                                    </div>
                                </div>
                                <div className="text-[10px] text-right text-slate-500 mt-1">
                                    Critério: ± {selectedStandard.tolerance} {unit}
                                </div>
                            </div>
                        )}

                        {/* Notes Field */}
                        <div className="grid gap-2">
                            <Label htmlFor="notes" className={isConforming === false ? "text-red-400" : ""}>
                                Observações {isConforming === false && "*"}
                            </Label>
                            <Textarea
                                id="notes"
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder={isConforming === false ? "Descreva a causa da não conformidade..." : "Observações adicionais (opcional)"}
                                className="bg-slate-900 border-slate-700 min-h-[80px]"
                            />
                        </div>
                    </div>
                </div>

                <div className="p-6 border-t border-slate-800">
                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button variant="ghost" onClick={() => setOpen(false)} disabled={loading}>Cancelar</Button>
                        <Button
                            onClick={handleSubmit}
                            disabled={loading || !selectedStandard || isNaN(numericMeasured)}
                            variant={isConforming === false ? "destructive" : "default"}
                            className={isConforming ? "bg-emerald-600 hover:bg-emerald-500" : ""}
                        >
                            {loading ? "A registar..." : (isConforming === false ? "Registar Não Conformidade" : "Registar Conforme")}
                        </Button>
                    </DialogFooter>
                </div>
            </DialogContent>
        </Dialog>
    );
}

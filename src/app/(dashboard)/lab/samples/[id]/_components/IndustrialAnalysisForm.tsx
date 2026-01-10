"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import { IndustrialEquipmentSelect } from "@/components/shared/industrial-equipment-select";
import {
    Activity,
    Beaker,
    Calendar,
    CheckCircle2,
    AlertTriangle,
    Lock,
    Fingerprint,
    FlaskConical,
    ClipboardCheck,
    HardDrive,
    Info,
    ShieldCheck,
    ChevronRight,
    Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { submitAnalysisAction, getExecutionContextAction } from "@/app/actions/lab_modules/execution";
import { startAnalysisAction } from "@/app/actions/lab_modules/results";
import { LabInstrumentSelect } from "@/components/lab/lab-instrument-select";
import { IndustrialContextRow as ContextRow, IndustrialSpecBox as SpecBox, IndustrialStatusBadge as StatusBadge } from "@/components/lab/industrial-ui";

interface IndustrialAnalysisFormProps {
    analysis: any;
    sample: any;
    spec: {
        min_value?: number;
        max_value?: number;
        target_value?: number;
        unit?: string
    };
    data: {
        value: string;
        notes: string;
        equipmentId: string;
        deviationType: string;
    };
    onChange: (newData: { value: string; notes: string; equipmentId: string; deviationType: string; isValid: boolean }) => void;
}

export function IndustrialAnalysisForm({ analysis, sample, spec, data, onChange }: IndustrialAnalysisFormProps) {
    // Local derived state for validation visual feedback
    const numericValue = parseFloat(data.value);
    const isOutOfSpec = !isNaN(numericValue) && (
        (spec.min_value !== undefined && spec.min_value !== null && numericValue < spec.min_value) ||
        (spec.max_value !== undefined && spec.max_value !== null && numericValue > spec.max_value)
    );

    // Validation: Value and Equipment are mandatory. OOS justification is now handled by the Wizard Dialog.
    const isValid = !!(data.value && data.equipmentId);

    const handleChange = (field: string, newValue: string) => {
        let processedValue = newValue;

        // Strict Numeric Validation for Value Field
        if (field === 'value') {
            // Replace commas with dots and strip invalid chars
            processedValue = newValue.replace(/,/g, '.').replace(/[^0-9.]/g, '');
            // Prevent multiple dots
            if ((processedValue.match(/\./g) || []).length > 1) return;
        }

        const nextData = { ...data, [field]: processedValue };
        const nextIsValid = !!(nextData.value && nextData.equipmentId);
        onChange({ ...nextData, isValid: nextIsValid });
    };

    // Auto-start analysis if pending (Only side effect remaining)
    useEffect(() => {
        if (analysis.status === 'pending') {
            startAnalysisAction(analysis.id);
        }
    }, [analysis.id, analysis.status]);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

            {/* ZONE A: Analysis Context (Read-Only) */}
            <div className="lg:col-span-4 space-y-4">
                <Card className="border-slate-800 bg-slate-900/50 overflow-hidden shadow-2xl">
                    <CardHeader className="border-b border-slate-800 bg-slate-900/80 p-4">
                        <div className="flex items-center gap-2">
                            <div className="p-2 rounded-lg bg-blue-500/10">
                                <Activity className="h-5 w-5 text-blue-400" />
                            </div>
                            <div>
                                <CardTitle className="text-sm font-black uppercase tracking-tighter text-slate-200">
                                    Estação de Controle
                                </CardTitle>
                                <CardDescription className="text-[10px] text-slate-500 font-mono">
                                    REF: {analysis.id.slice(0, 8)}
                                </CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="divide-y divide-slate-800/50">
                            <ContextRow label="Amostra" value={sample?.code} icon={<FlaskConical className="h-3 w-3" />} />
                            <ContextRow label="Produto" value={sample?.batch?.product?.name || "N/A"} icon={<Beaker className="h-3 w-3" />} />
                            <ContextRow label="Lote" value={sample?.batch?.code || "N/A"} icon={<ClipboardCheck className="h-3 w-3" />} />
                            <ContextRow label="Parâmetro" value={analysis.parameter?.name} highlight />
                            <ContextRow label="Método" value={analysis.parameter?.method_code || "Standard"} />
                            <ContextRow
                                label="Equipamento"
                                value={analysis.equipment?.name || "Manual / Bancada"}
                                status={analysis.equipment ? (new Date(analysis.equipment.next_calibration_date) > new Date() ? "calibrated" : "expired") : undefined}
                                icon={<HardDrive className="h-3 w-3" />}
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Specification Summary Badge */}
                <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/50 space-y-3">
                    <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1">
                        <ShieldCheck className="h-3 w-3" /> Especificação Aplicada
                    </h4>
                    <div className="grid grid-cols-3 gap-2">
                        <SpecBox label="Min" value={spec.min_value} />
                        <SpecBox label="Target" value={spec.target_value} color="text-blue-400" />
                        <SpecBox label="Max" value={spec.max_value} />
                    </div>
                </div>
            </div>

            {/* ZONE B & C: Result Entry & Controls */}
            <div className="lg:col-span-8 space-y-6">
                <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 shadow-xl relative overflow-hidden">
                    {/* Visual Status Indicator */}
                    <div className={cn(
                        "absolute top-0 right-0 w-1 h-full",
                        isOutOfSpec ? "bg-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.5)]" : "bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)]"
                    )} />

                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <h3 className="text-xl font-black text-white flex items-center gap-2">
                                <ChevronRight className="h-5 w-5 text-blue-500" />
                                Registro de Resultados
                            </h3>
                            <StatusBadge status={isOutOfSpec ? "non_conforming" : "conforming"} />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-4">
                                <Label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Resultado ({spec.unit || 'UN'})</Label>
                                <div className="relative">
                                    <Input
                                        type="text"
                                        value={data.value}
                                        onChange={(e) => handleChange('value', e.target.value)}
                                        className={cn(
                                            "h-14 text-2xl font-black bg-slate-950/50 border-slate-700 focus:ring-2 transition-all",
                                            isOutOfSpec ? "border-rose-500/50 text-rose-400 focus:ring-rose-500/20" : "focus:ring-blue-500/20"
                                        )}
                                        placeholder="0.00"
                                    />
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600 font-mono text-xs">
                                        {spec.unit}
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <Label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Instrumento Utilizado</Label>
                                <IndustrialEquipmentSelect
                                    value={data.equipmentId}
                                    onChange={(val) => handleChange('equipmentId', val)}
                                    className="h-14"
                                    table="lab_assets"
                                />
                            </div>
                        </div>

                        {!isOutOfSpec && (
                            <div className="space-y-3">
                                <Label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Observações Adicionais</Label>
                                <Textarea
                                    value={data.notes}
                                    onChange={(e) => handleChange('notes', e.target.value)}
                                    placeholder="Notas internas (opcional)..."
                                    className="min-h-[80px] bg-slate-950/50 border-slate-800 focus:border-slate-700 text-slate-200"
                                />
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SearchableSelect } from "@/components/smart/searchable-select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle, XCircle, Clock } from "lucide-react";
import { registerCompletedCIPAction } from "@/app/actions/cip";
import { toast } from "sonner";

interface Equipment {
    id: string;
    name: string;
    code: string;
    equipment_type: string;
    target_type?: string; // 'tank', 'production_line', 'process_equipment'
}

interface Program {
    id: string;
    name: string;
    target_equipment_type: string;
}

interface ProgramStep {
    id: string;
    program_id: string;
    step_order: number;
    name: string;
    target_temp_c?: number;
    target_duration_sec?: number;
    target_conductivity?: number;
}

interface CIPRegisterFormProps {
    equipments: Equipment[];
    programs: Program[];
    programSteps: ProgramStep[];
}

interface StepEntry {
    program_step_id: string;
    actual_duration_min: number;
    actual_temp_c?: number;
    actual_conductivity?: number;
    actual_ph?: number;
    concentration?: number;
    status: "pass" | "fail";
}

export function CIPRegisterForm({ equipments, programs, programSteps }: CIPRegisterFormProps) {
    const [loading, setLoading] = useState(false);
    const [selectedEquipment, setSelectedEquipment] = useState("");
    const [selectedProgram, setSelectedProgram] = useState("");
    const [startTime, setStartTime] = useState("");
    const [endTime, setEndTime] = useState("");
    const [notes, setNotes] = useState("");
    const [stepEntries, setStepEntries] = useState<StepEntry[]>([]);

    // Filter programs by selected equipment type
    const selectedEquipmentData = equipments.find(e => e.id === selectedEquipment);
    const filteredPrograms = selectedEquipmentData
        ? programs.filter(p => p.target_equipment_type === selectedEquipmentData.equipment_type)
        : programs;

    // Load steps when program changes
    useEffect(() => {
        if (selectedProgram) {
            const steps = programSteps
                .filter(s => s.program_id === selectedProgram)
                .sort((a, b) => a.step_order - b.step_order);

            setStepEntries(steps.map(s => ({
                program_step_id: s.id,
                actual_duration_min: Math.round((s.target_duration_sec || 0) / 60),
                actual_temp_c: s.target_temp_c,
                actual_conductivity: s.target_conductivity,
                status: "pass",
            })));
        } else {
            setStepEntries([]);
        }
    }, [selectedProgram, programSteps]);

    const updateStep = (index: number, field: keyof StepEntry, value: any) => {
        setStepEntries(prev => {
            const updated = [...prev];
            updated[index] = { ...updated[index], [field]: value };
            return updated;
        });
    };

    const getStepName = (stepId: string) => {
        return programSteps.find(s => s.id === stepId)?.name || "Step";
    };

    const getStepTarget = (stepId: string) => {
        return programSteps.find(s => s.id === stepId);
    };

    // Check if step is a rinse step (needs pH field)
    const isRinseStep = (stepName: string) => {
        const lower = stepName.toLowerCase();
        return lower.includes("rinse") || lower.includes("enxague") || lower.includes("final rinse") || lower.includes("enxague final");
    };

    // Check if step is a chemical step (needs concentration field)
    const isChemicalStep = (stepName: string) => {
        const lower = stepName.toLowerCase();
        return lower.includes("soda") || lower.includes("caustic") || lower.includes("acid") || lower.includes("ácido") || lower.includes("naoh") || lower.includes("hno3");
    };

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();

        if (!selectedEquipment || !selectedProgram || !startTime || !endTime) {
            toast.error("Preencha todos os campos obrigatórios");
            return;
        }

        setLoading(true);

        const formData = new FormData();
        formData.set("equipment_id", selectedEquipment);
        formData.set("program_id", selectedProgram);
        formData.set("start_time", new Date(startTime).toISOString());
        formData.set("end_time", new Date(endTime).toISOString());
        formData.set("notes", notes);

        // Find selected equipment type to help backend find the record
        const selectedEqData = equipments.find(e => e.id === selectedEquipment);
        if (selectedEqData?.target_type) {
            formData.set("target_table", selectedEqData.target_type);
        }

        formData.set("steps_json", JSON.stringify(stepEntries));

        const result = await registerCompletedCIPAction(formData);
        setLoading(false);

        if (result.success) {
            toast.success(result.message);
            // Reset form
            setSelectedEquipment("");
            setSelectedProgram("");
            setStartTime("");
            setEndTime("");
            setNotes("");
            setStepEntries([]);
        } else {
            toast.error(result.message);
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* Equipment & Program Selection */}
            <Card>
                <CardHeader>
                    <CardTitle>Informações Gerais</CardTitle>
                    <CardDescription>Selecione o equipamento e programa de limpeza</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                        <Label>Equipamento *</Label>
                        <SearchableSelect
                            options={equipments.map(eq => ({
                                value: eq.id,
                                label: `${eq.code} - ${eq.name}`
                            }))}
                            placeholder="Selecionar equipamento..."
                            value={selectedEquipment}
                            onValueChange={setSelectedEquipment}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Programa CIP *</Label>
                        <SearchableSelect
                            options={filteredPrograms.map(prog => ({
                                value: prog.id,
                                label: prog.name
                            }))}
                            placeholder="Selecionar programa..."
                            value={selectedProgram}
                            onValueChange={setSelectedProgram}
                            disabled={!selectedEquipment}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Início *</Label>
                        <Input
                            type="datetime-local"
                            value={startTime}
                            onChange={e => setStartTime(e.target.value)}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Fim *</Label>
                        <Input
                            type="datetime-local"
                            value={endTime}
                            onChange={e => setEndTime(e.target.value)}
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Step Entry */}
            {stepEntries.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Passos do Ciclo</CardTitle>
                        <CardDescription>Registe a duração real e parâmetros de cada passo</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {stepEntries.map((entry, index) => {
                            const target = getStepTarget(entry.program_step_id);
                            return (
                                <div key={entry.program_step_id} className="p-4 border rounded-lg space-y-3">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Badge variant="outline">{index + 1}</Badge>
                                            <span className="font-medium">{getStepName(entry.program_step_id)}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Button
                                                type="button"
                                                size="sm"
                                                variant={entry.status === "pass" ? "default" : "outline"}
                                                onClick={() => updateStep(index, "status", "pass")}
                                            >
                                                <CheckCircle className="h-4 w-4 mr-1" /> OK
                                            </Button>
                                            <Button
                                                type="button"
                                                size="sm"
                                                variant={entry.status === "fail" ? "destructive" : "outline"}
                                                onClick={() => updateStep(index, "status", "fail")}
                                            >
                                                <XCircle className="h-4 w-4 mr-1" /> Falha
                                            </Button>
                                        </div>
                                    </div>

                                    <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
                                        <div className="space-y-1">
                                            <Label className="text-xs text-muted-foreground flex items-center gap-1">
                                                <Clock className="h-3 w-3" />
                                                Duração (min)
                                                {target?.target_duration_sec && (
                                                    <span className="text-blue-500">
                                                        [Alvo: {Math.round(target.target_duration_sec / 60)}]
                                                    </span>
                                                )}
                                            </Label>
                                            <Input
                                                type="number"
                                                min={0}
                                                value={entry.actual_duration_min}
                                                onChange={e => updateStep(index, "actual_duration_min", parseFloat(e.target.value) || 0)}
                                            />
                                        </div>

                                        <div className="space-y-1">
                                            <Label className="text-xs text-muted-foreground">
                                                Temp. (°C)
                                                {target?.target_temp_c && (
                                                    <span className="text-blue-500 ml-1">
                                                        [Alvo: {target.target_temp_c}]
                                                    </span>
                                                )}
                                            </Label>
                                            <Input
                                                type="number"
                                                step="0.1"
                                                value={entry.actual_temp_c || ""}
                                                onChange={e => updateStep(index, "actual_temp_c", parseFloat(e.target.value) || undefined)}
                                                placeholder="Opcional"
                                            />
                                        </div>

                                        {/* pH field for rinse steps */}
                                        {isRinseStep(getStepName(entry.program_step_id)) && (
                                            <div className="space-y-1">
                                                <Label className="text-xs text-muted-foreground">
                                                    pH
                                                    <span className="text-emerald-500 ml-1">[Alvo: 6.5-7.5]</span>
                                                </Label>
                                                <Input
                                                    type="number"
                                                    step="0.1"
                                                    min={0}
                                                    max={14}
                                                    value={entry.actual_ph || ""}
                                                    onChange={e => updateStep(index, "actual_ph", parseFloat(e.target.value) || undefined)}
                                                    placeholder="pH"
                                                />
                                            </div>
                                        )}

                                        {/* Concentration field for chemical steps */}
                                        {isChemicalStep(getStepName(entry.program_step_id)) && (
                                            <div className="space-y-1">
                                                <Label className="text-xs text-muted-foreground">
                                                    Concentração (%)
                                                </Label>
                                                <Input
                                                    type="number"
                                                    step="0.1"
                                                    min={0}
                                                    value={entry.concentration || ""}
                                                    onChange={e => updateStep(index, "concentration", parseFloat(e.target.value) || undefined)}
                                                    placeholder="%"
                                                />
                                            </div>
                                        )}

                                        <div className="space-y-1">
                                            <Label className="text-xs text-muted-foreground">
                                                Condutividade
                                                {target?.target_conductivity && (
                                                    <span className="text-blue-500 ml-1">
                                                        [Alvo: {target.target_conductivity}]
                                                    </span>
                                                )}
                                            </Label>
                                            <Input
                                                type="number"
                                                step="0.1"
                                                value={entry.actual_conductivity || ""}
                                                onChange={e => updateStep(index, "actual_conductivity", parseFloat(e.target.value) || undefined)}
                                                placeholder="Opcional"
                                            />
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </CardContent>
                </Card>
            )}

            {/* Notes */}
            <Card>
                <CardHeader>
                    <CardTitle>Observações</CardTitle>
                </CardHeader>
                <CardContent>
                    <Textarea
                        value={notes}
                        onChange={e => setNotes(e.target.value)}
                        placeholder="Observações adicionais..."
                        rows={3}
                    />
                </CardContent>
            </Card>

            {/* Submit */}
            <div className="flex justify-end">
                <Button type="submit" size="lg" disabled={loading || stepEntries.length === 0}>
                    {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Registar CIP
                </Button>
            </div>
        </form>
    );
}

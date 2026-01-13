"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
    Play,
    Square,
    AlertTriangle,
    RefreshCcw,
    Settings,
    Clock,
    LogOut
} from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import { logProductionEventAction, startBatchExecutionAction } from "@/app/actions/production";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { HygieneGateBadge } from "./hygiene-gate-badge";

interface ProductionEventControlsProps {
    batchId: string;
    currentStatus: string;
    lastEventType?: string;
    hygieneStatus?: {
        isValid: boolean;
        lastCipDate?: string | null;
    };
}

const REASON_CODES = [
    { value: "MECHANICAL", label: "Falha Mecânica" },
    { value: "ELECTRICAL", label: "Falha Elétrica" },
    { value: "MATERIAL", label: "Falta de Matéria-Prima" },
    { value: "QUALITY", label: "Problema de Qualidade" },
    { value: "CLEANING", label: "Limpeza Planeada" },
    { value: "OPERATOR", label: "Troca de Operador" },
    { value: "WAITING", label: "Aguardando Análise" },
];

export function ProductionEventControls({ batchId, currentStatus, lastEventType, hygieneStatus }: ProductionEventControlsProps) {
    const [isPending, startTransition] = useTransition();
    const [stopDialogOpen, setStopDialogOpen] = useState(false);
    const [selectedReason, setSelectedReason] = useState("");
    const [stopType, setStopType] = useState<"stop" | "breakdown" | "maintenance">("stop");

    const isRunning = currentStatus === 'in_progress' && !['stop', 'breakdown', 'maintenance'].includes(lastEventType || "");
    const isPaused = currentStatus === 'in_progress' && ['stop', 'breakdown', 'maintenance'].includes(lastEventType || "");
    const isPlanned = currentStatus === 'planned' || currentStatus === 'open';

    const canStart = hygieneStatus ? hygieneStatus.isValid : true;

    const handleStart = () => {
        if (!canStart) {
            toast.error("Equipamento não libertado para produção", {
                description: "Necessário CIP válido (< 72h) para iniciar."
            });
            return;
        }

        startTransition(async () => {
            const result = await startBatchExecutionAction(batchId);
            if (result.success) {
                toast.success("Produção iniciada com sucesso.");
            } else {
                toast.error("Erro ao iniciar produção", {
                    description: result.message
                });
            }
        });
    };

    const handleStopClick = (type: "stop" | "breakdown" | "maintenance") => {
        setStopType(type);
        setStopDialogOpen(true);
    };

    const handleConfirmStop = () => {
        if (!selectedReason) {
            toast.error("Selecione um motivo para a paragem.");
            return;
        }

        startTransition(async () => {
            const formData = new FormData();
            formData.append("production_batch_id", batchId);
            formData.append("event_type", stopType);
            formData.append("reason_code", selectedReason);

            const result = await logProductionEventAction(formData);
            if (result.success) {
                toast.success(`Paragem (${stopType}) registada.`);
                setStopDialogOpen(false);
                setSelectedReason("");
            } else {
                toast.error("Erro ao registar paragem.");
            }
        });
    };

    const handleResume = () => {
        startTransition(async () => {
            const formData = new FormData();
            formData.append("production_batch_id", batchId);
            formData.append("event_type", "resume");

            const result = await logProductionEventAction(formData);
            if (result.success) {
                toast.success("Produção retomada.");
            } else {
                toast.error("Erro ao retomar produção.");
            }
        });
    };

    return (
        <div className="flex flex-wrap gap-3 items-center p-4 bg-white/5 border border-white/10 rounded-xl backdrop-blur-md">
            {/* HYGIENE STATUS BADGE */}
            {isPlanned && hygieneStatus && (
                <HygieneGateBadge
                    isValid={hygieneStatus.isValid}
                    lastCipDate={hygieneStatus.lastCipDate}
                />
            )}

            {/* START BUTTON */}
            {isPlanned && (
                <Button
                    onClick={handleStart}
                    disabled={isPending || !canStart}
                    className={cn(
                        "gap-2 shadow-lg",
                        canStart
                            ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-900/20"
                            : "bg-slate-700 text-slate-400 cursor-not-allowed"
                    )}
                >
                    <Play className="w-4 h-4 fill-current" />
                    Iniciar Produção
                </Button>
            )}

            {/* RUNNING CONTROLS */}
            {isRunning && (
                <>
                    <Button
                        onClick={() => handleStopClick("stop")}
                        variant="secondary"
                        disabled={isPending}
                        className="gap-2 bg-amber-600/20 hover:bg-amber-600/30 text-amber-500 border-amber-600/30"
                    >
                        <Square className="w-4 h-4 fill-current" />
                        Parar (Pausa)
                    </Button>
                    <Button
                        onClick={() => handleStopClick("breakdown")}
                        variant="destructive"
                        disabled={isPending}
                        className="gap-2"
                    >
                        <AlertTriangle className="w-4 h-4" />
                        Avaria / Emergência
                    </Button>
                    <Button
                        onClick={() => handleStopClick("maintenance")}
                        variant="outline"
                        disabled={isPending}
                        className="gap-2 border-slate-700 hover:bg-slate-800"
                    >
                        <Settings className="w-4 h-4" />
                        Manutenção
                    </Button>
                </>
            )}

            {/* PAUSED CONTROLS */}
            {isPaused && (
                <Button
                    onClick={handleResume}
                    disabled={isPending}
                    className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
                >
                    <RefreshCcw className={cn("w-4 h-4", isPending && "animate-spin")} />
                    Retomar Produção
                </Button>
            )}

            {/* SHIFT CHANGE - Always available if running/paused */}
            {(isRunning || isPaused) && (
                <Button
                    variant="ghost"
                    className="gap-2 text-slate-400 hover:text-white"
                    onClick={() => {
                        const formData = new FormData();
                        formData.append("production_batch_id", batchId);
                        formData.append("event_type", "shift_change");
                        startTransition(async () => {
                            await logProductionEventAction(formData);
                            toast.success("Turno alterado com sucesso.");
                        });
                    }}
                >
                    <Clock className="w-4 h-4" />
                    Troca de Turno
                </Button>
            )}

            {/* STOP DIALOG */}
            <Dialog open={stopDialogOpen} onOpenChange={setStopDialogOpen}>
                <DialogContent className="bg-slate-900 border-slate-800 text-white">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            {stopType === 'breakdown' ? <AlertTriangle className="text-red-500" /> : <Clock className="text-amber-500" />}
                            Registar Paragem de Produção
                        </DialogTitle>
                        <DialogDescription className="text-slate-400">
                            Selecione o motivo da paragem para fins de análise de OEE e eficiência.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="py-4 space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-300">Motivo da Paragem</label>
                            <Select onValueChange={setSelectedReason} value={selectedReason}>
                                <SelectTrigger className="bg-slate-950 border-slate-800">
                                    <SelectValue placeholder="Selecione o motivo..." />
                                </SelectTrigger>
                                <SelectContent className="bg-slate-900 border-slate-800 text-white">
                                    {REASON_CODES.map(code => (
                                        <SelectItem key={code.value} value={code.value}>
                                            {code.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setStopDialogOpen(false)}>Cancelar</Button>
                        <Button
                            onClick={handleConfirmStop}
                            disabled={isPending || !selectedReason}
                            className={cn(
                                stopType === 'breakdown' ? "bg-red-600 hover:bg-red-700" : "bg-amber-600 hover:bg-amber-700"
                            )}
                        >
                            Confirmar Paragem
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

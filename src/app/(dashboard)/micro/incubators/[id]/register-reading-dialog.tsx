"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Beaker, AlertCircle, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

interface MicroResult {
    id: string;
    qa_parameter: {
        id: string;
        name: string;
        analysis_time_minutes?: number;
    } | null;
    sample: {
        id: string;
        code: string;
    } | null;
}

interface RegisterReadingDialogProps {
    sessionId: string;
    results: MicroResult[];
    sampleCode: string;
    trigger?: React.ReactNode;
    onSuccess?: () => void;
}

export function RegisterReadingDialog({
    sessionId,
    results,
    sampleCode,
    trigger,
    onSuccess
}: RegisterReadingDialogProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [readings, setReadings] = useState<Record<string, { value: string; unit: string; notes: string }>>({});
    const router = useRouter();

    const handleSubmit = async () => {
        setIsSubmitting(true);

        try {
            // For now, we'll call a server action (to be created)
            // This should update each micro_result with the reading value
            // and update the session status to 'completed'
            const response = await fetch('/api/micro/complete-session', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sessionId,
                    readings: Object.entries(readings).map(([resultId, data]) => ({
                        resultId,
                        value: data.value,
                        unit: data.unit,
                        notes: data.notes
                    }))
                })
            });

            if (!response.ok) throw new Error('Failed to save readings');

            setIsOpen(false);
            onSuccess?.();
            router.refresh();
        } catch (error) {
            console.error('Error saving readings:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const updateReading = (resultId: string, field: 'value' | 'unit' | 'notes', value: string) => {
        setReadings(prev => ({
            ...prev,
            [resultId]: {
                ...prev[resultId] || { value: '', unit: 'ufc/g', notes: '' },
                [field]: value
            }
        }));
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button size="sm" variant="outline">
                        Registrar Leitura
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Beaker className="h-5 w-5 text-primary" />
                        Registrar Leitura
                    </DialogTitle>
                    <DialogDescription>
                        Amostra: <span className="font-mono text-foreground font-medium">{sampleCode}</span>
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto custom-scrollbar">
                    {results.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                            <p>Nenhum parâmetro encontrado para esta sessão.</p>
                        </div>
                    ) : (
                        results.map((result) => (
                            <div
                                key={result.id}
                                className="p-4 rounded-xl border border-border bg-card space-y-3"
                            >
                                <div className="flex items-center justify-between">
                                    <Label className="text-sm font-bold">
                                        {result.qa_parameter?.name || "Parâmetro Desconhecido"}
                                    </Label>
                                    {readings[result.id]?.value && (
                                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                                    )}
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1.5">
                                        <Label htmlFor={`value-${result.id}`} className="text-xs text-muted-foreground">
                                            Contagem / Resultado
                                        </Label>
                                        <Input
                                            id={`value-${result.id}`}
                                            type="text"
                                            placeholder="Ex: 100, <10, Ausência"
                                            value={readings[result.id]?.value || ''}
                                            onChange={(e) => updateReading(result.id, 'value', e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label htmlFor={`unit-${result.id}`} className="text-xs text-muted-foreground">
                                            Unidade
                                        </Label>
                                        <Select
                                            value={readings[result.id]?.unit || 'ufc/g'}
                                            onValueChange={(value) => updateReading(result.id, 'unit', value)}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Unidade" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="ufc/g">UFC/g</SelectItem>
                                                <SelectItem value="ufc/ml">UFC/mL</SelectItem>
                                                <SelectItem value="ufc/100ml">UFC/100mL</SelectItem>
                                                <SelectItem value="nmp/g">NMP/g</SelectItem>
                                                <SelectItem value="presence">Presença/Ausência</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <Label htmlFor={`notes-${result.id}`} className="text-xs text-muted-foreground">
                                        Observações (opcional)
                                    </Label>
                                    <Textarea
                                        id={`notes-${result.id}`}
                                        placeholder="Notas adicionais..."
                                        value={readings[result.id]?.notes || ''}
                                        onChange={(e) => updateReading(result.id, 'notes', e.target.value)}
                                        className="min-h-[60px]"
                                    />
                                </div>
                            </div>
                        ))
                    )}
                </div>

                <DialogFooter className="flex gap-2 sm:gap-0">
                    <Button
                        variant="ghost"
                        onClick={() => setIsOpen(false)}
                    >
                        Cancelar
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={isSubmitting || results.length === 0}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
                    >
                        {isSubmitting ? "A guardar..." : "Finalizar Incubação"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

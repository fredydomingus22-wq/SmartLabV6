"use client";

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { TestTube2, Upload, Loader2, AlertCircle } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { getSampleDetailsAction, saveAllResultsAction } from "@/app/actions/lab";
import { cn } from "@/lib/utils";

interface ResultEntryModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    sampleId: string | null;
    onSuccess: () => void;
}

interface Parameter {
    id: string; // analysis ID
    parameter: {
        id: string;
        name: string;
        unit: string | null;
        code: string;
    };
    value_numeric: number | null;
    value_text: string | null;
    is_conforming: boolean | null;
    spec?: {
        min_value?: number;
        max_value?: number;
        is_critical?: boolean;
    };
}

export function ResultEntryModal({ open, onOpenChange, sampleId, onSuccess }: ResultEntryModalProps) {
    const [loading, setLoading] = useState(false);
    const [initializing, setInitializing] = useState(false);
    const [sample, setSample] = useState<any>(null);
    const [parameters, setParameters] = useState<Parameter[]>([]);

    // Form state: Map analysis ID -> value string
    const [formValues, setFormValues] = useState<Record<string, string>>({});
    const [notes, setNotes] = useState("");

    const fetchDetails = useCallback(async (id: string) => {
        setInitializing(true);
        try {
            const res = await getSampleDetailsAction(id);
            if (res.success && res.data) {
                setSample(res.data.sample);

                // Map results to parameters list
                const params = res.data.results.map((r: any) => ({
                    id: r.id,
                    parameter: r.parameter,
                    value_numeric: r.value_numeric,
                    value_text: r.value_text,
                    is_conforming: r.is_conforming,
                    spec: r.spec
                }));
                setParameters(params);

                // Pre-fill form values
                const initialValues: Record<string, string> = {};
                params.forEach((p: Parameter) => {
                    if (p.value_numeric !== null) initialValues[p.id] = String(p.value_numeric);
                    else if (p.value_text !== null) initialValues[p.id] = p.value_text;
                    else initialValues[p.id] = "";
                });
                setFormValues(initialValues);
                setNotes(res.data.sample.notes || "");
            } else {
                toast.error("Erro ao carregar detalhes da amostra");
                onOpenChange(false);
            }
        } catch (error) {
            console.error(error);
            toast.error("Erro de comunicação");
        } finally {
            setInitializing(false);
        }
    }, [onOpenChange]);

    useEffect(() => {
        if (open && sampleId) {
            fetchDetails(sampleId);
        } else {
            setSample(null);
            setParameters([]);
            setFormValues({});
            setNotes("");
        }
    }, [open, sampleId, fetchDetails]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!sampleId) return;

        setLoading(true);

        // Prepare payload
        const resultsToSave = parameters.map(p => ({
            analysisId: p.id,
            value: formValues[p.id] || null,
        }));

        const res = await saveAllResultsAction(sampleId, resultsToSave, notes);

        if (res.success) {
            toast.success(res.message);
            onOpenChange(false);
            onSuccess();
        } else {
            toast.error(res.message || "Erro ao guardar resultados");
        }
        setLoading(false);
    };

    if (!open) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden bg-background">
                <DialogHeader className="p-6 pb-4 bg-muted/30 border-b border-border">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900/40 rounded-lg">
                            <TestTube2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                            <DialogTitle className="text-xl text-foreground">Inserir Resultados</DialogTitle>
                            <DialogDescription className="text-muted-foreground">
                                Registo de análise laboratorial
                            </DialogDescription>
                        </div>
                    </div>

                    {initializing ? (
                        <div className="h-12 w-full animate-pulse bg-muted rounded-lg mt-4" />
                    ) : sample ? (
                        <div className="flex flex-wrap gap-4 mt-4 text-sm bg-card p-3 rounded-lg border border-border shadow-sm">
                            <div>
                                <span className="text-[10px] text-muted-foreground uppercase font-bold block mb-0.5">Código</span>
                                <span className="font-mono font-medium text-foreground">{sample.code}</span>
                            </div>
                            <div className="h-full w-px bg-border mx-1 hidden sm:block" />
                            <div>
                                <span className="text-[10px] text-muted-foreground uppercase font-bold block mb-0.5">Tipo</span>
                                <span className="font-medium text-foreground">{sample.sample_type?.name}</span>
                            </div>
                            {(sample.batch || sample.intermediate) && (
                                <>
                                    <div className="h-full w-px bg-border mx-1 hidden sm:block" />
                                    <div>
                                        <span className="text-[10px] text-muted-foreground uppercase font-bold block mb-0.5">Lote/Origem</span>
                                        <Badge variant="secondary" className="font-mono text-xs">
                                            {sample.batch?.code || sample.intermediate?.code || "N/A"}
                                        </Badge>
                                    </div>
                                </>
                            )}
                        </div>
                    ) : null}
                </DialogHeader>

                <ScrollArea className="flex-1 p-6">
                    {initializing ? (
                        <div className="flex flex-col items-center justify-center py-12 space-y-4">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            <p className="text-sm text-muted-foreground">A carregar parâmetros...</p>
                        </div>
                    ) : (
                        <form id="results-form" onSubmit={handleSubmit} className="space-y-8">

                            {parameters.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                                    {parameters.map((p) => {
                                        const currentValue = formValues[p.id];
                                        const numValue = currentValue ? parseFloat(currentValue) : null;
                                        let isOOS = p.is_conforming === false; // Server-side check

                                        // Client-side predictive check
                                        if (currentValue && !isNaN(Number(currentValue)) && p.spec) {
                                            if (p.spec.min_value !== undefined && p.spec.min_value !== null && Number(currentValue) < p.spec.min_value) isOOS = true;
                                            if (p.spec.max_value !== undefined && p.spec.max_value !== null && Number(currentValue) > p.spec.max_value) isOOS = true;
                                        }

                                        return (
                                            <div key={p.id} className="space-y-2">
                                                <div className="flex justify-between items-end">
                                                    <Label className={cn(
                                                        "text-xs uppercase font-bold",
                                                        isOOS ? "text-destructive" : "text-muted-foreground"
                                                    )}>
                                                        {p.parameter.name}
                                                    </Label>
                                                    {isOOS && (
                                                        <span className="text-[10px] font-bold text-destructive flex items-center gap-1 animate-in fade-in zoom-in">
                                                            <AlertCircle className="h-3 w-3" /> OOS
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex gap-2 items-center">
                                                    <div className="relative flex-1">
                                                        <Input
                                                            type="number"
                                                            step="any"
                                                            placeholder="Valor"
                                                            className={cn(
                                                                "font-mono transition-all bg-background border-input pr-16",
                                                                isOOS && "border-destructive/50 bg-destructive/10 focus-visible:ring-destructive/30"
                                                            )}
                                                            value={formValues[p.id] || ""}
                                                            onChange={(e) => setFormValues({ ...formValues, [p.id]: e.target.value })}
                                                        />
                                                        {p.spec && (p.spec.min_value !== undefined || p.spec.max_value !== undefined) && (
                                                            <div className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground font-mono bg-muted/50 px-1 rounded pointer-events-none">
                                                                {p.spec.min_value ?? "-"}-{p.spec.max_value ?? "-"}
                                                            </div>
                                                        )}
                                                    </div>
                                                    {p.parameter.unit && (
                                                        <span className="text-sm text-muted-foreground font-medium w-12 shrink-0">
                                                            {p.parameter.unit}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="text-center py-8 text-muted-foreground bg-muted/40 rounded-lg border border-dashed border-border">
                                    <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                    <p>Nenhum parâmetro de análise encontrado para esta amostra.</p>
                                </div>
                            )}

                            <div className="space-y-4 pt-4 border-t border-border">
                                <div className="flex items-center gap-2">
                                    <h3 className="font-semibold text-foreground">Observações</h3>
                                </div>

                                <div className="grid gap-4">
                                    <Textarea
                                        placeholder="Observações relevantes sobre a análise..."
                                        className="resize-none min-h-[80px] bg-background border-input"
                                        value={notes}
                                        onChange={(e) => setNotes(e.target.value)}
                                    />
                                </div>
                            </div>

                        </form>
                    )}
                </ScrollArea>

                <DialogFooter className="p-6 pt-4 border-t border-border bg-muted/50">
                    <Button variant="ghost" type="button" onClick={() => onOpenChange(false)} className="hover:bg-background">Cancelar</Button>
                    <Button type="submit" form="results-form" disabled={loading || initializing || parameters.length === 0} className="min-w-[120px]">
                        {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                        {loading ? "A guardar..." : "Guardar Resultados"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

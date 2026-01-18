"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FlaskConical, ThermometerSun, AlertCircle, CheckCircle2 } from "lucide-react";
import { Label } from "@/components/ui/label";
import { SearchableSelect } from "@/components/smart/searchable-select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

interface PendingParameter {
    resultId: string;
    parameterId: string;
    parameterName: string;
    incubationTempC: number | null;
}

interface AssignSampleDialogProps {
    incubatorId: string;
    incubatorName: string;
    incubatorTempC: number;
    samples: any[];
    mediaLots: any[];
}

export function AssignSampleDialog({
    incubatorId,
    incubatorName,
    incubatorTempC,
    samples,
    mediaLots
}: AssignSampleDialogProps) {
    const [open, setOpen] = useState(false);
    const [selectedSampleId, setSelectedSampleId] = useState<string>("");
    const [selectedMediaLotId, setSelectedMediaLotId] = useState<string>("");
    const [pendingParams, setPendingParams] = useState<PendingParameter[]>([]);
    const [selectedResultIds, setSelectedResultIds] = useState<Set<string>>(new Set());
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const router = useRouter();

    // Fetch pending parameters when sample changes
    useEffect(() => {
        if (!selectedSampleId) {
            setPendingParams([]);
            setSelectedResultIds(new Set());
            return;
        }

        const fetchPendingParams = async () => {
            setIsLoading(true);
            try {
                const response = await fetch(`/api/micro/pending-params?sampleId=${selectedSampleId}`);
                if (response.ok) {
                    const data = await response.json();
                    setPendingParams(data.params || []);

                    // Auto-select compatible parameters (temp within ±5°C)
                    const compatible = new Set<string>();
                    data.params?.forEach((p: PendingParameter) => {
                        if (p.incubationTempC === null || Math.abs(p.incubationTempC - incubatorTempC) <= 5) {
                            compatible.add(p.resultId);
                        }
                    });
                    setSelectedResultIds(compatible);
                }
            } catch (error) {
                console.error("Error fetching pending params:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchPendingParams();
    }, [selectedSampleId, incubatorTempC]);

    const toggleParam = (resultId: string) => {
        setSelectedResultIds(prev => {
            const next = new Set(prev);
            if (next.has(resultId)) {
                next.delete(resultId);
            } else {
                next.add(resultId);
            }
            return next;
        });
    };

    const handleSubmit = async () => {
        if (!selectedSampleId || !selectedMediaLotId || selectedResultIds.size === 0) return;

        setIsSubmitting(true);
        try {
            const response = await fetch('/api/micro/start-incubation', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    incubatorId,
                    sampleId: selectedSampleId,
                    mediaLotId: selectedMediaLotId,
                    resultIds: Array.from(selectedResultIds)
                })
            });

            if (response.ok) {
                setOpen(false);
                router.refresh();
            }
        } catch (error) {
            console.error("Error starting incubation:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const isCompatible = (tempC: number | null) => {
        if (tempC === null) return true; // No temp defined = compatible
        return Math.abs(tempC - incubatorTempC) <= 2;
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="w-full border-dashed border-border hover:border-primary hover:bg-primary/5 hover:text-primary transition-all group font-bold">
                    <ThermometerSun className="mr-2 h-4 w-4 group-hover:animate-pulse" />
                    Incubar Amostra
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader className="pb-4 border-b border-border">
                    <DialogTitle className="flex items-center gap-3">
                        <FlaskConical className="h-5 w-5 text-primary" />
                        Incubar em {incubatorName}
                    </DialogTitle>
                    <DialogDescription>
                        Temperatura atual: <span className="text-foreground font-bold">{incubatorTempC}°C</span>
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 pt-4">
                    {/* Sample Selection */}
                    <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground pl-1">Amostra</Label>
                        <SearchableSelect
                            name="sample_id"
                            required
                            placeholder="Selecione a Amostra..."
                            value={selectedSampleId}
                            onValueChange={setSelectedSampleId}
                            options={samples.map((s) => ({
                                label: `${s.code} (${s.status})`,
                                value: s.id
                            }))}
                        />
                    </div>

                    {/* Media Lot Selection */}
                    <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground pl-1">Meio de Cultura</Label>
                        <SearchableSelect
                            name="media_lot_id"
                            required
                            placeholder="Selecione o Lote..."
                            value={selectedMediaLotId}
                            onValueChange={setSelectedMediaLotId}
                            options={mediaLots.map((l) => ({
                                label: `${l.lot_code} (Exp: ${l.expiry_date})`,
                                value: l.id
                            }))}
                        />
                    </div>

                    {/* Parameter Selection */}
                    {selectedSampleId && (
                        <div className="space-y-3">
                            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground pl-1">
                                Parâmetros a Incubar
                            </Label>

                            {isLoading ? (
                                <div className="py-8 text-center text-muted-foreground">A carregar parâmetros...</div>
                            ) : pendingParams.length === 0 ? (
                                <div className="py-8 text-center text-muted-foreground bg-muted/20 rounded-lg border border-border">
                                    <AlertCircle className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
                                    <p>Sem parâmetros pendentes para esta amostra.</p>
                                </div>
                            ) : (
                                <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
                                    {pendingParams.map((param) => {
                                        const compatible = isCompatible(param.incubationTempC);
                                        const isSelected = selectedResultIds.has(param.resultId);

                                        return (
                                            <div
                                                key={param.resultId}
                                                onClick={() => toggleParam(param.resultId)}
                                                className={cn(
                                                    "flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all",
                                                    isSelected
                                                        ? "bg-primary/5 border-primary/30"
                                                        : "bg-card border-border hover:border-primary/20",
                                                    !compatible && "opacity-75"
                                                )}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <Checkbox
                                                        checked={isSelected}
                                                        onCheckedChange={() => toggleParam(param.resultId)}
                                                        className="data-[state=checked]:bg-primary"
                                                    />
                                                    <div>
                                                        <div className="text-sm font-medium">
                                                            {param.parameterName}
                                                        </div>
                                                        {param.incubationTempC && (
                                                            <div className="text-xs text-muted-foreground">
                                                                Temp: {param.incubationTempC}°C
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                {compatible ? (
                                                    <Badge variant="outline" className="border-emerald-500/30 text-emerald-500 text-[10px]">
                                                        <CheckCircle2 className="h-3 w-3 mr-1" />
                                                        Compatível
                                                    </Badge>
                                                ) : (
                                                    <Badge variant="outline" className="border-yellow-500/30 text-yellow-500 text-[10px]">
                                                        <AlertCircle className="h-3 w-3 mr-1" />
                                                        Temp. Diferente
                                                    </Badge>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Submit Button */}
                    <DialogFooter>
                        <Button
                            onClick={handleSubmit}
                            disabled={isSubmitting || !selectedSampleId || !selectedMediaLotId || selectedResultIds.size === 0}
                            className="w-full sm:w-auto font-bold"
                        >
                            {isSubmitting ? "A iniciar..." : `Iniciar Incubação (${selectedResultIds.size} param.)`}
                        </Button>
                    </DialogFooter>
                </div>
            </DialogContent>
        </Dialog>
    );
}

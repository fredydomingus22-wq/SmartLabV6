"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
    CheckCircle2, ArchiveX, Droplet,
    FlaskConical, Pipette, Info, AlertTriangle, ShieldCheck,
    Loader2
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { IngredientDialog } from "./ingredient-dialog";
import { CreateIntermediateSampleDialog } from "./create-intermediate-sample-dialog";
import { approveIntermediateAction, updateIntermediateStatusAction, startUsageAction } from "@/app/actions/production";

interface Ingredient {
    id: string;
    raw_material_lot_code: string;
    raw_material_lot_id?: string;
    quantity: number;
    unit: string;
    added_at: string;
    lot?: {
        id: string;
        lot_code: string;
        raw_material: { name: string; code: string } | { name: string; code: string }[];
    } | null;
}

interface Intermediate {
    id: string;
    code: string;
    status: string;
    approval_status: string;
    volume: number | null;
    unit: string;
    created_at: string;
    ingredients: Ingredient[];
    samples?: any[];
}

interface IntermediatesTableProps {
    intermediates: Intermediate[];
    sampleTypes: { id: string; name: string; code: string; }[];
    samplingPoints: { id: string; name: string; code: string; }[];
    plantId: string;
    batchCode: string;
    availableLots: any[];
}

export function IntermediatesTable({ intermediates, sampleTypes, samplingPoints, plantId, batchCode, availableLots }: IntermediatesTableProps) {
    const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
    const [isApproveDialogOpen, setIsApproveDialogOpen] = useState(false);
    const [selectedIntermediate, setSelectedIntermediate] = useState<string | null>(null);
    const [password, setPassword] = useState("");
    const [isApproving, setIsApproving] = useState(false);

    const toggleRow = (id: string) => {
        const newSet = new Set(expandedRows);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setExpandedRows(newSet);
    };

    const statusColors: Record<string, string> = {
        pending: "bg-amber-500/10 text-amber-700 border-none",
        sampling: "bg-amber-500/10 text-amber-700 border-none",
        in_analysis: "bg-blue-500/10 text-blue-700 border-none",
        approved: "bg-emerald-500/10 text-emerald-700 border-none",
        rejected: "bg-rose-500/10 text-rose-700 border-none",
        in_use: "bg-indigo-500/10 text-indigo-700 border-none",
        consumed: "bg-muted text-muted-foreground/50 border-none",
    };

    const handleApprove = async () => {
        if (!selectedIntermediate || !password) return;
        setIsApproving(true);
        try {
            const formData = new FormData();
            formData.set("intermediate_id", selectedIntermediate);
            formData.set("password", password);

            const result = await approveIntermediateAction(formData);
            if (result.success) {
                toast.success(result.message);
                setIsApproveDialogOpen(false);
                setPassword("");
            } else {
                toast.error(result.message);
            }
        } finally {
            setIsApproving(false);
        }
    };

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {intermediates.map((intermediate) => {
                const isExpanded = expandedRows.has(intermediate.id);
                const ingredients = intermediate.ingredients || [];
                const samples = intermediate.samples || [];

                const approvedSamplesCount = samples.filter(s => ['approved', 'released', 'validated'].includes(s.status)).length;
                const totalSamplesCount = samples.length;
                const isApprovedByLab = totalSamplesCount > 0 && approvedSamplesCount === totalSamplesCount;

                return (
                    <div key={intermediate.id} className="glass rounded-2xl border-none shadow-sm flex flex-col overflow-hidden">
                        <div className="p-5 flex-1 space-y-4">
                            <div className="flex items-start justify-between">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <h3 className="text-sm font-bold tracking-tight">{intermediate.code}</h3>
                                        {isApprovedByLab && <ShieldCheck className="h-3 w-3 text-emerald-500" />}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Badge className={cn("text-[8px] font-bold uppercase tracking-widest px-2 h-4", statusColors[intermediate.status] || "bg-muted")}>
                                            {intermediate.status === 'in_use' ? 'EM USO' : intermediate.status.toUpperCase()}
                                        </Badge>
                                        <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-tight">
                                            {intermediate.volume} {intermediate.unit}
                                        </span>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="flex flex-col items-end gap-1">
                                        <Badge variant="outline" className={cn(
                                            "text-[9px] font-bold border-none h-5 px-2",
                                            isApprovedByLab ? "bg-emerald-500/10 text-emerald-600" : "bg-amber-500/10 text-amber-600"
                                        )}>
                                            LIMS: {approvedSamplesCount}/{totalSamplesCount}
                                        </Badge>
                                        {!isApprovedByLab && totalSamplesCount > 0 && (
                                            <span className="text-[8px] font-bold text-muted-foreground uppercase flex items-center gap-1">
                                                <AlertTriangle className="h-2 w-2" /> Aguardando Lab
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Guided Sample Buttons */}
                            <div className="grid grid-cols-2 gap-2">
                                <CreateIntermediateSampleDialog
                                    intermediateId={intermediate.id}
                                    intermediateCode={intermediate.code}
                                    batchCode={batchCode}
                                    sampleTypes={sampleTypes}
                                    samplingPoints={samplingPoints}
                                    plantId={plantId}
                                    category="FQ"
                                />
                                <CreateIntermediateSampleDialog
                                    intermediateId={intermediate.id}
                                    intermediateCode={intermediate.code}
                                    batchCode={batchCode}
                                    sampleTypes={sampleTypes}
                                    samplingPoints={samplingPoints}
                                    plantId={plantId}
                                    category="MICRO"
                                />
                            </div>
                        </div>

                        {/* Footer Actions */}
                        <div className="px-5 py-3 bg-muted/20 border-t border-border/5 flex items-center justify-between">
                            <Button
                                variant="ghost"
                                size="sm"
                                className="text-[10px] font-bold uppercase tracking-widest h-7 px-2 text-muted-foreground hover:text-primary transition-none"
                                onClick={() => toggleRow(intermediate.id)}
                            >
                                <Info className="h-3 w-3 mr-1.5 opacity-50" />
                                {isExpanded ? 'Ocultar' : `${ingredients.length} Matérias`}
                            </Button>

                            <div className="flex items-center gap-1">
                                {intermediate.status !== "consumed" && intermediate.status !== "in_use" && intermediate.status !== "approved" && (
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className={cn(
                                                        "h-7 w-7 transition-colors",
                                                        isApprovedByLab ? "text-emerald-600 hover:bg-emerald-50" : "text-muted-foreground opacity-30 cursor-not-allowed"
                                                    )}
                                                    onClick={() => {
                                                        if (isApprovedByLab) {
                                                            setSelectedIntermediate(intermediate.id);
                                                            setIsApproveDialogOpen(true);
                                                        } else {
                                                            toast.error("Resultados laboratoriais incompletos.");
                                                        }
                                                    }}
                                                >
                                                    <CheckCircle2 className="h-4 w-4" />
                                                </Button>
                                            </TooltipTrigger>
                                            {!isApprovedByLab && (
                                                <TooltipContent className="bg-rose-600 text-white border-none text-[10px] font-bold uppercase">
                                                    Aguardando Resultados do Lab
                                                </TooltipContent>
                                            )}
                                        </Tooltip>
                                    </TooltipProvider>
                                )}

                                {intermediate.status === "approved" && (
                                    <form action={async (formData) => {
                                        const result = await startUsageAction(formData);
                                        if (result.success) toast.success(result.message);
                                        else toast.error(result.message);
                                    }}>
                                        <input type="hidden" name="intermediate_id" value={intermediate.id} />
                                        <Button variant="outline" size="sm" className="h-7 text-[9px] font-bold uppercase tracking-widest border-indigo-500/20 text-indigo-600 hover:bg-indigo-50">
                                            Iniciar Uso
                                        </Button>
                                    </form>
                                )}

                                {intermediate.status === "in_use" && (
                                    <form action={async (formData) => {
                                        const result = await updateIntermediateStatusAction(formData);
                                        if (result.success) toast.success(result.message);
                                        else toast.error(result.message);
                                    }}>
                                        <input type="hidden" name="intermediate_id" value={intermediate.id} />
                                        <input type="hidden" name="status" value="consumed" />
                                        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-rose-600">
                                            <ArchiveX className="h-4 w-4" />
                                        </Button>
                                    </form>
                                )}
                            </div>
                        </div>

                        {/* Expanded Ingredients List */}
                        {isExpanded && (
                            <div className="p-5 bg-background/50 border-t border-border/5 space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Composição do Tanque</span>
                                    <IngredientDialog
                                        intermediateId={intermediate.id}
                                        intermediateName={intermediate.code}
                                        availableLots={availableLots}
                                    />
                                </div>
                                {ingredients.length > 0 ? (
                                    <div className="space-y-2">
                                        {ingredients.map((ing) => {
                                            const lot = ing.lot;
                                            const material = lot?.raw_material;
                                            const materialName = Array.isArray(material) ? material[0]?.name : material?.name;
                                            return (
                                                <div key={ing.id} className="flex items-center justify-between text-[10px] py-1 border-b border-border/10 last:border-0 pb-1">
                                                    <div className="flex flex-col max-w-[70%]">
                                                        <span className="font-bold truncate">{materialName || "-"}</span>
                                                        <span className="text-[8px] font-mono text-muted-foreground">{lot?.lot_code || ing.raw_material_lot_code}</span>
                                                    </div>
                                                    <span className="font-bold text-primary/80">{ing.quantity} {ing.unit}</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <p className="text-[9px] text-muted-foreground uppercase text-center py-2 opacity-30">Sem matérias registadas</p>
                                )}
                            </div>
                        )}
                    </div>
                );
            })}
            {/* Industrial Signature Dialog */}
            <Dialog open={isApproveDialogOpen} onOpenChange={setIsApproveDialogOpen}>
                <DialogContent className="sm:max-w-md glass">
                    <DialogHeader>
                        <DialogTitle className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
                            <ShieldCheck className="h-4 w-4 text-emerald-500" />
                            Assinatura de Aprovação Técnica
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <Alert className="bg-emerald-500/5 border-emerald-500/20 py-2">
                            <Info className="h-3 w-3 text-emerald-600" />
                            <AlertDescription className="text-[10px] text-muted-foreground">
                                Ao assinar, confirma que todos os parâmetros laboratoriais estão em conformidade com as especificações.
                            </AlertDescription>
                        </Alert>
                        <div className="space-y-2">
                            <Label htmlFor="sig_pass" className="text-[10px] font-bold uppercase opacity-50">Palavra-passe do Analista</Label>
                            <Input
                                id="sig_pass"
                                type="password"
                                placeholder="Insira a sua palavra-passe..."
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="h-9"
                            />
                        </div>
                        <Button
                            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white h-9 text-[10px] font-bold uppercase tracking-widest"
                            onClick={handleApprove}
                            disabled={isApproving || !password}
                        >
                            {isApproving && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
                            Confirmar Aprovação
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}

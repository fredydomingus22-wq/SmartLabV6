"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
    CheckCircle2, ArchiveX, Droplet,
    FlaskConical, Pipette, Info
} from "lucide-react";
import { IngredientDialog } from "./ingredient-dialog";
import { CreateIntermediateSampleDialog } from "./create-intermediate-sample-dialog";
import { approveIntermediateAction, updateIntermediateStatusAction } from "@/app/actions/production";

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
    volume: number | null;
    unit: string;
    created_at: string;
    ingredients: Ingredient[];
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

    const toggleRow = (id: string) => {
        const newSet = new Set(expandedRows);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setExpandedRows(newSet);
    };

    const statusColors: Record<string, string> = {
        pending: "bg-amber-500/10 text-amber-700 border-none",
        approved: "bg-emerald-500/10 text-emerald-700 border-none",
        rejected: "bg-rose-500/10 text-rose-700 border-none",
        in_use: "bg-blue-500/10 text-blue-700 border-none",
        consumed: "bg-muted text-muted-foreground/50 border-none",
    };

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {intermediates.map((intermediate) => {
                const isExpanded = expandedRows.has(intermediate.id);
                const ingredients = intermediate.ingredients || [];

                return (
                    <div key={intermediate.id} className="glass rounded-2xl border-none shadow-sm flex flex-col overflow-hidden">
                        <div className="p-5 flex-1 space-y-4">
                            <div className="flex items-start justify-between">
                                <div className="space-y-1">
                                    <h3 className="text-sm font-bold tracking-tight">{intermediate.code}</h3>
                                    <div className="flex items-center gap-2">
                                        <Badge className={cn("text-[8px] font-bold uppercase tracking-widest px-2 h-4", statusColors[intermediate.status] || "bg-muted")}>
                                            {intermediate.status === 'in_use' ? 'EM USO' : intermediate.status.toUpperCase()}
                                        </Badge>
                                        <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-tight">
                                            {intermediate.volume} {intermediate.unit}
                                        </span>
                                    </div>
                                </div>
                                <div className="h-10 w-10 rounded-xl bg-primary/5 flex items-center justify-center">
                                    <Droplet className="h-5 w-5 text-primary/40" />
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
                                {intermediate.status === "pending" && (
                                    <form action={async (formData) => {
                                        const result = await approveIntermediateAction(formData);
                                        if (result.success) toast.success(result.message);
                                        else toast.error(result.message);
                                    }}>
                                        <input type="hidden" name="intermediate_id" value={intermediate.id} />
                                        <Button variant="ghost" size="icon" className="h-7 w-7 text-emerald-600 hover:bg-emerald-50">
                                            <CheckCircle2 className="h-4 w-4" />
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
        </div>
    );
}

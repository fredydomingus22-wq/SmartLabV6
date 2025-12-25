"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { IngredientDialog } from "./ingredient-dialog";
import { ChevronDown, ChevronRight, Package, CheckCircle2, ArchiveX } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { approveIntermediateAction, updateIntermediateStatusAction } from "@/app/actions/production";

import { CreateIntermediateSampleDialog } from "./create-intermediate-sample-dialog";

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
}

export function IntermediatesTable({ intermediates, sampleTypes, samplingPoints, plantId, batchCode }: IntermediatesTableProps) {
    const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

    const toggleRow = (id: string) => {
        const newSet = new Set(expandedRows);
        if (newSet.has(id)) {
            newSet.delete(id);
        } else {
            newSet.add(id);
        }
        setExpandedRows(newSet);
    };

    const statusColor: Record<string, string> = {
        pending: "bg-yellow-100 text-yellow-800",
        approved: "bg-green-100 text-green-800",
        rejected: "bg-red-100 text-red-800",
        in_use: "bg-blue-100 text-blue-800",
        consumed: "bg-gray-100 text-gray-800 line-through",
    };

    return (
        <div className="space-y-2">
            {intermediates.map((intermediate) => {
                const isExpanded = expandedRows.has(intermediate.id);
                const ingredients = intermediate.ingredients || [];

                return (
                    <div key={intermediate.id} className="border rounded-lg overflow-hidden">
                        {/* Main Row */}
                        <div
                            className="flex items-center justify-between p-4 bg-muted/30 cursor-pointer hover:bg-muted/50 transition-colors"
                            onClick={() => toggleRow(intermediate.id)}
                        >
                            <div className="flex items-center gap-3">
                                {isExpanded ? (
                                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                ) : (
                                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                )}
                                <Package className="h-5 w-5 text-primary" />
                                <div>
                                    <span className="font-medium">{intermediate.code}</span>
                                    {intermediate.volume && (
                                        <span className="text-muted-foreground ml-2">
                                            ({intermediate.volume} {intermediate.unit})
                                        </span>
                                    )}
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                {/* Sample Button */}
                                <div onClick={(e) => e.stopPropagation()}>
                                    <CreateIntermediateSampleDialog
                                        intermediateId={intermediate.id}
                                        intermediateCode={intermediate.code}
                                        batchCode={batchCode}
                                        sampleTypes={sampleTypes}
                                        samplingPoints={samplingPoints}
                                        plantId={plantId}
                                    />
                                </div>

                                {intermediate.status === "pending" && (
                                    <form
                                        action={async (formData) => {
                                            const result = await approveIntermediateAction(formData);
                                            if (result.success) {
                                                toast.success(result.message);
                                            } else {
                                                toast.error(result.message);
                                            }
                                        }}
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <input type="hidden" name="intermediate_id" value={intermediate.id} />
                                        <Button size="sm" variant="outline" className="h-7 text-green-600 border-green-200 hover:bg-green-50">
                                            <CheckCircle2 className="mr-1 h-3 w-3" />
                                            Approve
                                        </Button>
                                    </form>
                                )}
                                {intermediate.status === "in_use" && (
                                    <form
                                        action={async (formData) => {
                                            const result = await updateIntermediateStatusAction(formData);
                                            if (result.success) {
                                                toast.success(result.message);
                                            } else {
                                                toast.error(result.message);
                                            }
                                        }}
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <input type="hidden" name="intermediate_id" value={intermediate.id} />
                                        <input type="hidden" name="status" value="consumed" />
                                        <Button size="sm" variant="outline" className="h-7 text-gray-600 border-gray-200 hover:bg-gray-50">
                                            <ArchiveX className="mr-1 h-3 w-3" />
                                            Finalize
                                        </Button>
                                    </form>
                                )}
                                <Badge className={statusColor[intermediate.status] || "bg-gray-100"}>
                                    {intermediate.status}
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                    {ingredients.length} ingredients
                                </span>
                            </div>                        </div>

                        {/* Expanded Content - Ingredients */}
                        {isExpanded && (
                            <div className="p-4 bg-background border-t">
                                <div className="flex items-center justify-between mb-4">
                                    <h4 className="font-medium text-sm">Ingredients / Raw Materials</h4>
                                    <IngredientDialog
                                        intermediateId={intermediate.id}
                                        intermediateName={intermediate.code}
                                    />
                                </div>

                                {ingredients.length > 0 ? (
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="text-left text-muted-foreground border-b">
                                                <th className="pb-2">Lot Code</th>
                                                <th className="pb-2">Raw Material</th>
                                                <th className="pb-2">Quantity</th>
                                                <th className="pb-2">Unit</th>
                                                <th className="pb-2">Added</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {ingredients.map((ing) => {
                                                const lot = ing.lot;
                                                const material = lot?.raw_material;
                                                const materialName = Array.isArray(material) ? material[0]?.name : material?.name;
                                                return (
                                                    <tr key={ing.id} className="border-b last:border-0">
                                                        <td className="py-2 font-mono">{lot?.lot_code || ing.raw_material_lot_code}</td>
                                                        <td className="py-2">{materialName || "-"}</td>
                                                        <td className="py-2">{ing.quantity}</td>
                                                        <td className="py-2">{ing.unit}</td>
                                                        <td className="py-2 text-muted-foreground">
                                                            {new Date(ing.added_at).toLocaleDateString()}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                ) : (
                                    <p className="text-sm text-muted-foreground text-center py-4">
                                        No ingredients added yet.
                                    </p>
                                )}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}

"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { SearchableSelect } from "@/components/smart/searchable-select";
import { FlaskConical, Loader2, AlertTriangle, CheckCircle } from "lucide-react";
import { registerResultAction } from "@/app/actions/lab";

interface Spec {
    id: string;
    qa_parameter_id: string;
    min_value?: number | null;
    max_value?: number | null;
    target_value?: number | null;
    is_critical: boolean;
    parameter: {
        id: string;
        name: string;
        code: string;
        unit: string | null;
        category: string | null;
    } | null;
    hasResult?: boolean;
}

interface ResultDialogProps {
    sample: {
        id: string;
        code: string;
        status: string;
    };
    specifications?: Spec[];
    existingResults?: { qa_parameter_id: string }[];
}

export function ResultDialog({ sample, specifications = [], existingResults = [] }: ResultDialogProps) {
    const [open, setOpen] = useState(false);
    const [isPending, startTransition] = useTransition();
    const [selectedParam, setSelectedParam] = useState<string>("");
    const [value, setValue] = useState<string>("");
    const [isConforming, setIsConforming] = useState<boolean | null>(null);
    const router = useRouter();

    // Mark specs that already have results
    const specsWithStatus = specifications.map(spec => ({
        ...spec,
        hasResult: existingResults.some(r => r.qa_parameter_id === spec.qa_parameter_id)
    }));

    // Get available specs (not yet tested)
    const availableSpecs = specsWithStatus.filter(s => !s.hasResult);
    const currentSpec = specsWithStatus.find(s => s.qa_parameter_id === selectedParam);

    const [notes, setNotes] = useState<string>("");

    // Auto-calculate conforming when value changes
    useEffect(() => {
        if (!currentSpec || !value) {
            setIsConforming(null);
            return;
        }

        const numValue = parseFloat(value);
        if (isNaN(numValue)) {
            setIsConforming(null);
            return;
        }

        const min = currentSpec.min_value;
        const max = currentSpec.max_value;

        let conforming = true;
        if (min !== null && min !== undefined && numValue < min) conforming = false;
        if (max !== null && max !== undefined && numValue > max) conforming = false;

        setIsConforming(conforming);
    }, [value, currentSpec]);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (!selectedParam) {
            toast.error("Please select a parameter");
            return;
        }

        // Validate that notes are present if non-conforming
        if (isConforming === false && !notes.trim()) {
            toast.error("Explanation required", {
                description: "You must provide a comment/justification for Out-of-Spec results."
            });
            return;
        }

        startTransition(async () => {
            const formData = new FormData();
            formData.set("sample_id", sample.id);
            formData.set("qa_parameter_id", selectedParam);
            formData.set("value_numeric", value);
            formData.set("is_conforming", String(isConforming ?? true));
            if (notes) formData.set("notes", notes);

            const result = await registerResultAction(formData);

            if (result.success) {
                toast.success(result.message);
                if (!isConforming) {
                    toast.warning("⚠️ Non-conforming result registered!", {
                        description: currentSpec?.is_critical
                            ? "This is a CRITICAL parameter. Consider creating a Nonconformity."
                            : "Review the result and determine next steps."
                    });
                }
                setSelectedParam("");
                setValue("");
                setNotes("");
                setIsConforming(null);
                router.refresh();

                // Close if all specs are done
                if (availableSpecs.length <= 1) {
                    setOpen(false);
                }
            } else {
                toast.error(result.message);
            }
        });
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button size="sm" variant="outline">
                    <FlaskConical className="mr-2 h-4 w-4" />
                    Analyze
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <FlaskConical className="h-5 w-5 text-blue-500" />
                        Register Result - {sample.code}
                    </DialogTitle>
                    <DialogDescription>
                        {availableSpecs.length > 0
                            ? `${availableSpecs.length} parameters remaining`
                            : "All parameters analyzed"}
                    </DialogDescription>
                </DialogHeader>

                {availableSpecs.length === 0 ? (
                    <div className="py-8 text-center">
                        {existingResults.length > 0 ? (
                            <>
                                <CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-4" />
                                <p className="text-muted-foreground">All parameters have been analyzed.</p>
                            </>
                        ) : (
                            <>
                                <AlertTriangle className="h-12 w-12 mx-auto text-amber-500 mb-4" />
                                <p className="text-muted-foreground">No specifications found for this product category.</p>
                                <p className="text-xs text-muted-foreground mt-2">Please check the product configuration.</p>
                            </>
                        )}
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Parameter Selection */}
                        <div className="grid gap-2">
                            <Label>Parameter *</Label>
                            <SearchableSelect
                                value={selectedParam}
                                onValueChange={setSelectedParam}
                                placeholder="Select parameter..."
                                options={availableSpecs.map((spec) => ({
                                    value: spec.qa_parameter_id,
                                    label: `${spec.parameter?.name}${spec.is_critical ? " (Critical)" : ""}`
                                }))}
                            />
                        </div>

                        {/* Spec Limits Display */}
                        {currentSpec && (
                            <div className="rounded-lg bg-muted/50 p-3 space-y-1 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Unit:</span>
                                    <span className="font-medium">{currentSpec.parameter?.unit || "-"}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Min:</span>
                                    <span className="font-medium">{currentSpec.min_value ?? "-"}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Target:</span>
                                    <span className="font-medium text-blue-500">{currentSpec.target_value ?? "-"}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Max:</span>
                                    <span className="font-medium">{currentSpec.max_value ?? "-"}</span>
                                </div>
                            </div>
                        )}

                        {/* Value Input */}
                        <div className="grid gap-2">
                            <Label htmlFor="value">Value *</Label>
                            <div className="relative">
                                <Input
                                    id="value"
                                    type="number"
                                    step="0.001"
                                    value={value}
                                    onChange={(e) => setValue(e.target.value)}
                                    placeholder="Enter result..."
                                    required
                                    className={
                                        isConforming === false
                                            ? "border-red-500 focus:ring-red-500 pr-10"
                                            : isConforming === true
                                                ? "border-green-500 focus:ring-green-500 pr-10"
                                                : "pr-10"
                                    }
                                />
                                {isConforming !== null && (
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                                        {isConforming ? (
                                            <CheckCircle className="h-5 w-5 text-green-500" />
                                        ) : (
                                            <AlertTriangle className="h-5 w-5 text-red-500" />
                                        )}
                                    </div>
                                )}
                            </div>
                            {isConforming === false && (
                                <p role="alert" className="text-xs text-red-500 flex items-center gap-1 font-medium animate-in fade-in slide-in-from-top-1">
                                    <AlertTriangle className="h-3 w-3" />
                                    Result is Out-of-Spec (OOS)! Justification required.
                                </p>
                            )}
                        </div>

                        {/* Justification Textarea (Only for OOS) */}
                        {isConforming === false && (
                            <div className="grid gap-2 animate-in fade-in slide-in-from-top-2">
                                <Label htmlFor="notes" className="text-red-500">Justification / Comment *</Label>
                                <Input
                                    id="notes"
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    placeholder="Explain why this result is acceptable or describe the deviation..."
                                    required
                                    className="border-red-200 focus:border-red-500"
                                />
                            </div>
                        )}

                        <div className="flex justify-end gap-2 pt-4">
                            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                                Close
                            </Button>
                            <Button type="submit" disabled={isPending || !selectedParam || (isConforming === false && !notes.trim())} variant={isConforming === false ? "destructive" : "default"}>
                                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {isConforming === false ? "Confirm OOS Result" : "Save Result"}
                            </Button>
                        </div>
                    </form>
                )}
            </DialogContent>
        </Dialog>
    );
}

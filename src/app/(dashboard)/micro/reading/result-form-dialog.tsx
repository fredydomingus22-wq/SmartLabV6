"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Eye, AlertTriangle } from "lucide-react";
import { ActionForm } from "@/components/smart/action-form";
import { registerMicroResultAction } from "@/app/actions/micro";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface ResultFormDialogProps {
    resultId: string;
    sampleCode?: string;
    parameterName?: string;
    maxColonyCount?: number | null;
}

export function ResultFormDialog({ resultId, sampleCode, parameterName, maxColonyCount }: ResultFormDialogProps) {
    const [open, setOpen] = useState(false);
    const [tntc, setTntc] = useState(false);
    const [colonyCount, setColonyCount] = useState<string>("");

    // Real-time conformity check
    const getConformityStatus = (): "conforming" | "non_conforming" | "unknown" => {
        if (tntc && maxColonyCount !== null && maxColonyCount !== undefined) {
            return "non_conforming";
        }
        if (!tntc && colonyCount) {
            const count = parseInt(colonyCount, 10);
            if (!isNaN(count) && maxColonyCount !== null && maxColonyCount !== undefined) {
                return count <= maxColonyCount ? "conforming" : "non_conforming";
            }
        }
        return "unknown";
    };

    const status = getConformityStatus();

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button size="sm">
                    <Eye className="mr-2 h-4 w-4" />
                    Read
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] glass">
                <DialogHeader>
                    <DialogTitle>Reading: {sampleCode}</DialogTitle>
                    <p className="text-sm text-muted-foreground">{parameterName}</p>
                </DialogHeader>

                {/* Spec Limit Display */}
                {maxColonyCount !== null && maxColonyCount !== undefined && (
                    <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <AlertTriangle className="h-4 w-4 text-blue-600" />
                        <span className="text-sm">
                            <strong>Limit:</strong> {maxColonyCount} CFU max
                        </span>
                    </div>
                )}

                <ActionForm
                    action={registerMicroResultAction}
                    onSuccess={() => setOpen(false)}
                    submitText="Confirm Result"
                >
                    <div className="grid gap-4 py-4">
                        <input type="hidden" name="result_id" value={resultId} />

                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="is_tntc"
                                name="is_tntc"
                                checked={tntc}
                                onCheckedChange={(c: boolean | "indeterminate") => setTntc(c === true)}
                            />
                            <Label htmlFor="is_tntc">TNTC (Too Numerous To Count)</Label>
                        </div>

                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="colony_count" className="text-right">CFU Count</Label>
                            <Input
                                id="colony_count"
                                name="colony_count"
                                type="text"
                                className="col-span-3"
                                disabled={tntc}
                                required={!tntc}
                                value={colonyCount}
                                onChange={(e) => {
                                    const val = e.target.value.replace(/[^0-9]/g, '');
                                    setColonyCount(val);
                                }}
                                placeholder="Enter CFU count"
                            />
                        </div>

                        {/* Real-time Conformity Indicator */}
                        {status !== "unknown" && (
                            <div className={`p-3 rounded-lg text-center ${status === "conforming"
                                ? "bg-green-100 text-green-700 border border-green-300"
                                : "bg-red-100 text-red-700 border border-red-300"
                                }`}>
                                {status === "conforming" ? (
                                    <span className="font-semibold">✓ CONFORMING</span>
                                ) : (
                                    <span className="font-semibold">✗ NON-CONFORMING</span>
                                )}
                            </div>
                        )}

                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="result_text" className="text-right">
                                Notes {status === "non_conforming" && <span className="text-red-500">*</span>}
                            </Label>
                            <Input
                                id="result_text"
                                name="result_text"
                                placeholder={status === "non_conforming" ? "Justification required..." : "Observations..."}
                                className={cn(
                                    "col-span-3",
                                    status === "non_conforming" && "border-orange-500 bg-orange-50/10"
                                )}
                                required={status === "non_conforming"}
                            />
                        </div>

                    </div>
                </ActionForm>
            </DialogContent>
        </Dialog>
    );
}

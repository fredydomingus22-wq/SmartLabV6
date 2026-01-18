"use client";

import { useState, useActionState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Eye, AlertTriangle, FlaskConical } from "lucide-react";
import { registerMicroResultAction } from "@/app/actions/micro";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { IndustrialStatusBadge as StatusBadge } from "@/components/lab/industrial-ui";
import { toast } from "sonner";
import { IndustrialConfirmDialog } from "@/components/shared/industrial-confirm-dialog";
import { IndustrialOOSDialog } from "@/components/shared/industrial-oos-dialog";

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

    const [password, setPassword] = useState("");
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [oosOpen, setOosOpen] = useState(false);

    // Server Action State
    const [state, formAction, isPending] = useActionState(async (_prev: any, formData: FormData) => {
        const result = await registerMicroResultAction(formData);
        if (result.success) {
            toast.success("Resultado registado com sucesso.");
            setOpen(false);
        } else {
            toast.error(result.message || "Erro ao registar resultado.");
        }
        return result;
    }, null);

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

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (status === 'non_conforming') {
            setOosOpen(true);
        } else {
            setConfirmOpen(true);
        }
    };

    const handleConfirm = async (reason?: string, pwd?: string) => {
        const formData = new FormData();
        formData.append("result_id", resultId);
        if (tntc) formData.append("is_tntc", "on");
        if (colonyCount) formData.append("colony_count", colonyCount);

        // In this manual flow, we append the validation data
        if (reason) formData.append("reason", reason); // Notes/Justification
        if (pwd) formData.append("password", pwd);

        formAction(formData);
        setConfirmOpen(false);
        setOosOpen(false);
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button size="sm" variant="default" className="font-bold tracking-wide">
                    <Eye className="mr-2 h-4 w-4" />
                    Registar
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <div className="flex items-center justify-between border-b pb-4 mb-2">
                        <div className="space-y-1">
                            <DialogTitle className="flex items-center gap-2">
                                <FlaskConical className="h-5 w-5 text-primary" />
                                {sampleCode}
                            </DialogTitle>
                            <div className="text-sm font-medium text-muted-foreground">{parameterName}</div>
                        </div>
                    </div>
                </DialogHeader>

                {/* Spec Limit Display */}
                {maxColonyCount !== null && maxColonyCount !== undefined && (
                    <div className="flex items-center gap-3 p-3 bg-muted rounded-xl border mt-2">
                        <AlertTriangle className="h-4 w-4 text-primary" />
                        <span className="text-sm text-foreground">
                            <strong className="text-primary uppercase text-xs tracking-wider mr-2">Limite Máx:</strong>
                            {maxColonyCount} CFU
                        </span>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6 pt-2">
                    <div className="space-y-4">
                        <div className="flex items-center space-x-3 p-3 rounded-xl border bg-muted/50">
                            <Checkbox
                                id="is_tntc"
                                name="is_tntc"
                                checked={tntc}
                                onCheckedChange={(c: boolean | "indeterminate") => setTntc(c === true)}
                            />
                            <Label htmlFor="is_tntc" className="font-medium cursor-pointer">
                                Incontável (TNTC)
                            </Label>
                        </div>

                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="colony_count" className="text-right text-muted-foreground font-medium text-xs uppercase tracking-wide">Contagem (CFU)</Label>
                            <Input
                                id="colony_count"
                                name="colony_count"
                                type="text"
                                className="col-span-3 font-mono text-lg"
                                disabled={tntc}
                                required={!tntc}
                                value={colonyCount}
                                onChange={(e) => {
                                    const val = e.target.value.replace(/[^0-9]/g, '');
                                    setColonyCount(val);
                                }}
                                placeholder="0"
                            />
                        </div>
                    </div>

                    {/* Real-time Conformity Indicator */}
                    {status !== "unknown" && (
                        <div className="flex justify-center p-2">
                            <StatusBadge status={status} className="text-xs px-4 py-1.5 h-auto text-center" />
                        </div>
                    )}

                    <div className="flex justify-end pt-4">
                        <Button type="submit" disabled={isPending}>
                            {isPending ? "A processar..." : "Assinar e Confirmar"}
                        </Button>
                    </div>
                </form>

                {/* Standard Confirmation (For Compliant Results) */}
                <IndustrialConfirmDialog
                    isOpen={confirmOpen}
                    onClose={() => setConfirmOpen(false)}
                    onConfirm={(reason, pwd) => handleConfirm(reason, pwd || "")} // Adapter
                    title="Confirmar Resultado Microbiológico"
                    description="Esta ação será registada permanentemente."
                    requireReason={false} // Clean path doesn't need reason
                    requireSignature={true}
                    variant="success"
                />

                {/* OOS Dialog (For Non-Conforming Results) */}
                <IndustrialOOSDialog
                    isOpen={oosOpen}
                    onClose={() => setOosOpen(false)}
                    onConfirm={(reason, pwd) => handleConfirm(reason, pwd)}
                    // IndustrialOOSDialog doesn't ask for password currently? 
                    // Let's check IndustrialOOSDialog spec. 
                    measuredValue={tntc ? "TNTC" : colonyCount}
                    specMin={0}
                    specMax={maxColonyCount || 0}
                    unit="CFU"
                    productName={sampleCode}
                    testName={parameterName}
                />
            </DialogContent>
        </Dialog>
    );
}

// Helper needed? IndustrialStatusBadge is imported.

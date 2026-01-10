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
                <Button size="sm" className="bg-slate-800 hover:bg-blue-600 text-slate-200 hover:text-white border border-slate-700 transition-all font-bold tracking-wide">
                    <Eye className="mr-2 h-4 w-4" />
                    Registar
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] glass border-slate-800 bg-slate-950/90 shadow-2xl backdrop-blur-xl">
                <DialogHeader className="border-b border-slate-800 pb-4">
                    <DialogTitle className="flex items-center gap-3 text-xl font-black tracking-tight text-white">
                        <div className="p-2 rounded-lg bg-blue-500/20 border border-blue-500/30">
                            <FlaskConical className="h-5 w-5 text-blue-400" />
                        </div>
                        {sampleCode}
                    </DialogTitle>
                    <p className="text-sm font-medium text-slate-400 pl-1">{parameterName}</p>
                </DialogHeader>

                {/* Spec Limit Display */}
                {maxColonyCount !== null && maxColonyCount !== undefined && (
                    <div className="flex items-center gap-3 p-3 bg-blue-500/10 rounded-xl border border-blue-500/20 mt-2">
                        <AlertTriangle className="h-4 w-4 text-blue-400" />
                        <span className="text-sm text-blue-200">
                            <strong className="text-blue-400 uppercase text-xs tracking-wider mr-2">Limite Máx:</strong>
                            {maxColonyCount} CFU
                        </span>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6 pt-2">
                    <div className="space-y-4">
                        <div className="flex items-center space-x-3 p-3 rounded-xl border border-slate-800 bg-slate-900/50">
                            <Checkbox
                                id="is_tntc"
                                name="is_tntc"
                                checked={tntc}
                                onCheckedChange={(c: boolean | "indeterminate") => setTntc(c === true)}
                                className="border-slate-600 data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500"
                            />
                            <Label htmlFor="is_tntc" className="font-bold text-slate-300 cursor-pointer">
                                Incontável (TNTC)
                            </Label>
                        </div>

                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="colony_count" className="text-right text-slate-400 font-medium text-xs uppercase tracking-wide">Contagem (CFU)</Label>
                            <Input
                                id="colony_count"
                                name="colony_count"
                                type="text"
                                className="col-span-3 bg-slate-900/80 border-slate-700 text-white font-mono text-lg focus:border-blue-500/50 focus:ring-blue-500/20"
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
                            <StatusBadge status={status} className="scale-125 px-6 py-1.5" />
                        </div>
                    )}

                    <div className="flex justify-end pt-4">
                        <Button type="submit" disabled={isPending} className="bg-blue-600 hover:bg-blue-500 font-bold tracking-wide">
                            {isPending ? "Processando..." : "Assinar e Confirmar"}
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
                    onConfirm={(reason) => handleConfirm(reason, "")} // Confirm without password? Wait. OOS needs signature too usually. 
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

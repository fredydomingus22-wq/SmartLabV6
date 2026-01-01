"use client";

import { useState } from "react";
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
import { Loader2, CheckCircle, ShieldCheck } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { approveSampleAction } from "@/app/actions/lab_modules/approvals";

interface ValidateDialogProps {
    sampleId: string;
    sampleCode: string;
}

export function ValidateDialog({ sampleId, sampleCode }: ValidateDialogProps) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<'approved' | 'rejected'>('approved');
    const [reason, setReason] = useState("");
    const [password, setPassword] = useState("");
    const router = useRouter();

    const handleConfirm = async () => {
        if (!password) {
            toast.error("Assinatura eletrónica obrigatória.");
            return;
        }

        setLoading(true);
        const formData = new FormData();
        formData.append("sample_id", sampleId);
        formData.append("status", status);
        formData.append("reason", reason);
        formData.append("password", password);

        const result = await approveSampleAction(formData);
        setLoading(false);

        if (result.success) {
            toast.success(result.message);
            setOpen(false);
            router.refresh();
        } else {
            toast.error(result.message);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-500/20">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Decisão de Qualidade
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <CheckCircle className={cn("h-5 w-5", status === 'approved' ? 'text-emerald-500' : 'text-rose-500')} />
                        Revisão de Qualidade: {sampleCode}
                    </DialogTitle>
                    <DialogDescription>
                        Emitir veredito final para a amostra baseando-se nos resultados laboratoriais.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="flex gap-2 p-1 bg-slate-100 rounded-lg">
                        <Button
                            variant={status === 'approved' ? 'default' : 'ghost'}
                            className={cn("flex-1", status === 'approved' && "bg-emerald-600 hover:bg-emerald-700")}
                            onClick={() => setStatus('approved')}
                        >
                            Aprovar
                        </Button>
                        <Button
                            variant={status === 'rejected' ? 'destructive' : 'ghost'}
                            className="flex-1"
                            onClick={() => setStatus('rejected')}
                        >
                            Rejeitar
                        </Button>
                    </div>

                    <div className="space-y-2">
                        <Label>Observações / Justificação (Obrigatório se Rejeitado)</Label>
                        <Textarea
                            placeholder="Descreva o motivo da decisão ou notas de desvio..."
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            className="min-h-[100px]"
                        />
                    </div>

                    <div className="space-y-2 p-4 bg-slate-50 border rounded-xl">
                        <Label className="flex items-center gap-2 mb-2">
                            <ShieldCheck className="h-4 w-4 text-blue-600" />
                            Assinatura Eletrónica (Confirmar Identidade)
                        </Label>
                        <Input
                            type="password"
                            placeholder="Insira sua senha..."
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                        <p className="text-[10px] text-slate-500 mt-2">
                            Esta ação será auditada conforme as normas 21 CFR Part 11 e ISO 17025.
                        </p>
                    </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t">
                    <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
                        Cancelar
                    </Button>
                    <Button
                        onClick={handleConfirm}
                        disabled={loading}
                        className={cn(
                            "px-8 shadow-lg transition-all",
                            status === 'approved' ? "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20" : "bg-rose-600 hover:bg-rose-700 shadow-rose-500/20"
                        )}
                    >
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Confirmar e Assinar
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}

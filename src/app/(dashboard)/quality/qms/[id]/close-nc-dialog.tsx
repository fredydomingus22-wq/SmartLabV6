"use client";

import { useState, useTransition } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { CheckCircle, Loader2, ShieldCheck, Lock } from "lucide-react";
import { closeNCWithSignatureAction } from "@/app/actions/qms";

interface CloseNCDialogProps {
    ncId: string;
    ncNumber: string;
}

export function CloseNCDialog({ ncId, ncNumber }: CloseNCDialogProps) {
    const [open, setOpen] = useState(false);
    const [password, setPassword] = useState("");
    const [closureNotes, setClosureNotes] = useState("");
    const [isPending, startTransition] = useTransition();
    const router = useRouter();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!password) {
            toast.error("Password required for electronic signature");
            return;
        }

        startTransition(async () => {
            const formData = new FormData();
            formData.set("id", ncId);
            formData.set("password", password);
            formData.set("closure_notes", closureNotes);

            const result = await closeNCWithSignatureAction(formData);

            if (result.success) {
                toast.success(result.message);
                setOpen(false);
                setPassword("");
                setClosureNotes("");
                router.refresh();
            } else {
                toast.error(result.message);
                setPassword("");
            }
        });
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="gap-2 glass-primary">
                    <CheckCircle className="h-4 w-4" />
                    Fechar NC
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[450px] glass">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <ShieldCheck className="h-5 w-5 text-green-500" />
                        Fechar Não Conformidade
                    </DialogTitle>
                    <DialogDescription>
                        Fechar <strong>{ncNumber}</strong> com assinatura eletrónica (21 CFR Part 11)
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                    <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 p-4">
                        <p className="text-sm text-amber-500 flex items-start gap-2">
                            <Lock className="h-4 w-4 mt-0.5 flex-shrink-0" />
                            <span>
                                Esta ação requer a sua palavra-passe para verificar a sua identidade.
                                A sua assinatura será registada.
                            </span>
                        </p>
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="closure_notes">Notas de Encerramento</Label>
                        <Textarea
                            id="closure_notes"
                            value={closureNotes}
                            onChange={(e) => setClosureNotes(e.target.value)}
                            placeholder="Descreva a resolução, verificação realizada, eficácia..."
                            rows={3}
                            className="glass"
                        />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="password">Palavra-passe (Assinatura Eletrónica) *</Label>
                        <Input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Introduza a sua palavra-passe"
                            required
                            autoComplete="current-password"
                            className="glass"
                        />
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                        <Button type="button" variant="outline" onClick={() => setOpen(false)} className="glass">
                            Cancelar
                        </Button>
                        <Button
                            type="submit"
                            disabled={isPending || !password}
                            className="glass-primary"
                        >
                            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Assinar & Fechar NC
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}


"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileSignature, Loader2, ShieldCheck } from "lucide-react";
import { acknowledgeDocumentReadingAction } from "@/app/actions/dms";
import { toast } from "sonner";

interface ReadingAcknowledgmentProps {
    versionId: string;
    userId: string;
    hasAcknowledged: boolean;
}

export function ReadingAcknowledgment({ versionId, userId, hasAcknowledged }: ReadingAcknowledgmentProps) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [password, setPassword] = useState("");

    const handleAcknowledge = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const formData = new FormData();
        formData.append("versionId", versionId);
        formData.append("password", password);

        const result = await acknowledgeDocumentReadingAction(formData);

        if (result.success) {
            toast.success(result.message);
            setOpen(false);
            setPassword("");
        } else {
            toast.error(result.error || "Erro ao confirmar leitura");
        }
        setLoading(false);
    };

    if (hasAcknowledged) {
        return (
            <div className="flex items-center gap-2 text-emerald-400 bg-emerald-500/10 px-4 py-2 rounded-xl border border-emerald-500/20">
                <FileSignature className="h-4 w-4" />
                <span className="text-sm font-medium">Leitura Confirmada</span>
            </div>
        );
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/20">
                    <FileSignature className="mr-2 h-4 w-4" />
                    Confirmar Leitura e Compreensão
                </Button>
            </DialogTrigger>
            <DialogContent className="glass border-slate-800 bg-slate-950/80 backdrop-blur-xl sm:max-w-[400px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-emerald-400">
                        <ShieldCheck className="h-5 w-5" />
                        Assinatura de Treino
                    </DialogTitle>
                    <DialogDescription className="text-slate-400">
                        Ao confirmar, declara que leu, compreendeu e está apto a seguir os procedimentos deste documento. Requer a sua password.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleAcknowledge} className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="sign-password">Palavra-passe de Confirmação</Label>
                        <Input
                            id="sign-password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="bg-black/20 border-white/10"
                            placeholder="Introduza a sua password"
                            required
                        />
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
                        <Button type="submit" disabled={loading} className="bg-emerald-600 hover:bg-emerald-500">
                            {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                            Assinar e Confirmar
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

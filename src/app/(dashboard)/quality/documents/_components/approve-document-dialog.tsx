"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ShieldCheck, Loader2, FileSignature, AlertCircle } from "lucide-react";
import { processApprovalAction } from "@/app/actions/dms";
import { toast } from "sonner";

interface ApproveDocumentDialogProps {
    approvalId: string;
    documentTitle: string;
    versionNumber: string;
}

export function ApproveDocumentDialog({ approvalId, documentTitle, versionNumber }: ApproveDocumentDialogProps) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [password, setPassword] = useState("");
    const [comments, setComments] = useState("");

    const handleApprove = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const formData = new FormData();
        formData.append("approvalId", approvalId);
        formData.append("status", "approved");
        formData.append("password", password);
        formData.append("comments", comments);

        const result = await processApprovalAction(formData);

        if (result.success) {
            toast.success("Documento assinado digitalmente com sucesso!");
            setOpen(false);
            setPassword("");
            setComments("");
        } else {
            toast.error(result.error || "Palavra-passe incorreta ou erro na assinatura.");
        }
        setLoading(false);
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-500/20">
                    <ShieldCheck className="mr-2 h-4 w-4" />
                    Assinar Digitalmente
                </Button>
            </DialogTrigger>
            <DialogContent className="glass border-slate-800 bg-slate-950/80 backdrop-blur-xl sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="text-xl flex items-center gap-2">
                        <FileSignature className="h-5 w-5 text-emerald-400" />
                        Assinatura Digital de Aprovação
                    </DialogTitle>
                    <DialogDescription className="text-slate-400">
                        Está prestes a aprovar o documento <strong>{documentTitle}</strong> (v{versionNumber}).
                        Esta ação é juridicamente vinculativa e equivalente a uma assinatura manuscrita.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleApprove} className="space-y-4 py-4">
                    <div className="bg-amber-500/10 border border-amber-500/20 p-3 rounded-xl flex gap-3 text-amber-200 text-xs">
                        <AlertCircle className="h-5 w-5 shrink-0" />
                        <p>
                            Ao assinar, confirma que reviu este documento e que o mesmo cumpre todos os requisitos normativos e de segurança alimentar da organização.
                        </p>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="password">Confirmar Palavra-passe</Label>
                        <Input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="bg-black/20 border-white/10"
                            placeholder="Introduza a sua password para assinar"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="comments">Justificação / Comentários (Opcional)</Label>
                        <Textarea
                            id="comments"
                            value={comments}
                            onChange={(e) => setComments(e.target.value)}
                            className="bg-black/20 border-white/10 min-h-[80px] resize-none"
                            placeholder="Notas sobre a revisão e aprovação..."
                        />
                    </div>

                    <DialogFooter className="mt-6">
                        <Button type="button" variant="ghost" onClick={() => setOpen(false)} className="text-slate-400">Cancelar</Button>
                        <Button type="submit" disabled={loading} className="bg-emerald-600 hover:bg-emerald-500">
                            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <ShieldCheck className="h-4 w-4 mr-2" />}
                            Confirmar Assinatura
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}


"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ShieldCheck, Loader2, AlertCircle } from "lucide-react";
import { processApprovalAction } from "@/app/actions/dms";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

interface ApproveDocumentDialogProps {
    approvalId: string;
    documentTitle: string;
    versionNumber: string;
}

export function ApproveDocumentDialog({ approvalId, documentTitle, versionNumber }: ApproveDocumentDialogProps) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<"approved" | "rejected">("approved");
    const [password, setPassword] = useState("");
    const [comments, setComments] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const formData = new FormData();
        formData.append("approvalId", approvalId);
        formData.append("status", status);
        formData.append("password", password);
        formData.append("comments", comments);

        const result = await processApprovalAction(formData);

        if (result.success) {
            toast.success(status === "approved" ? "Documento aprovado!" : "Documento rejeitado.");
            setOpen(false);
            setPassword("");
            setComments("");
        } else {
            toast.error(result.error);
        }
        setLoading(false);
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-500/20 text-white group">
                    <ShieldCheck className="mr-2 h-4 w-4 group-hover:scale-110 transition-transform" />
                    Assinar & Aprovar
                </Button>
            </DialogTrigger>
            <DialogContent className="glass border-slate-800 bg-slate-950/80 backdrop-blur-xl sm:max-w-[425px]">
                <DialogHeader>
                    <div className="flex items-center gap-2 mb-2">
                        <div className="h-8 w-8 rounded-lg bg-indigo-500/20 flex items-center justify-center">
                            <ShieldCheck className="h-5 w-5 text-indigo-400" />
                        </div>
                        <Badge variant="outline" className="border-indigo-500/30 text-indigo-400">21 CFR Part 11</Badge>
                    </div>
                    <DialogTitle className="text-xl">Assinatura Digital</DialogTitle>
                    <DialogDescription className="text-slate-400">
                        Você está prestes a assinar eletronicamente o documento <strong>{documentTitle}</strong> (v{versionNumber}).
                        Esta ação é legalmente vinculativa.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="space-y-4">
                        <div className="flex gap-4 pb-2">
                            <Button
                                type="button"
                                variant={status === "approved" ? "default" : "outline"}
                                onClick={() => setStatus("approved")}
                                className={`flex-1 ${status === "approved" ? "bg-emerald-600 hover:bg-emerald-500" : "border-slate-700 text-slate-400"}`}
                            >
                                Aprovar
                            </Button>
                            <Button
                                type="button"
                                variant={status === "rejected" ? "destructive" : "outline"}
                                onClick={() => setStatus("rejected")}
                                className={`flex-1 ${status === "rejected" ? "bg-rose-600 hover:bg-rose-500" : "border-slate-700 text-slate-400"}`}
                            >
                                Rejeitar
                            </Button>
                        </div>

                        <div className="space-y-2">
                            <Label>Comentários / Justificação</Label>
                            <Textarea
                                placeholder={status === "approved" ? "Comentários opcionais..." : "Motivo da rejeição (obrigatório)..."}
                                value={comments}
                                onChange={(e) => setComments(e.target.value)}
                                required={status === "rejected"}
                                className="bg-black/20 border-white/10"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label className="flex items-center justify-between">
                                <span>Senha de Re-autenticação</span>
                                <span className="text-[10px] uppercase text-indigo-400 font-bold tracking-wider">Obrigatório</span>
                            </Label>
                            <Input
                                type="password"
                                placeholder="Introduza a sua senha..."
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="bg-black/20 border-white/10"
                            />
                            <p className="text-xs text-slate-500 flex items-center gap-1">
                                <AlertCircle className="h-3 w-3" />
                                A senha confirma a sua identidade para o registo de auditoria.
                            </p>
                        </div>
                    </div>

                    <DialogFooter className="mt-6">
                        <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
                        <Button type="submit" disabled={loading || !password} className="bg-indigo-600 hover:bg-indigo-500">
                            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <ShieldCheck className="h-4 w-4 mr-2" />}
                            {status === "approved" ? "Assinar e Aprovar" : "Assinar e Rejeitar"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

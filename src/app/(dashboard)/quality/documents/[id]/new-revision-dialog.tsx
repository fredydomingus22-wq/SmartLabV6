
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FileSignature, Loader2, UploadCloud } from "lucide-react";
import { createDocumentVersionAction } from "@/app/actions/dms";
import { toast } from "sonner";

interface NewRevisionDialogProps {
    documentId: string;
    currentVersion: string;
}

export function NewRevisionDialog({ documentId, currentVersion }: NewRevisionDialogProps) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [versionNumber, setVersionNumber] = useState("");
    const [description, setDescription] = useState("");
    const [filePath, setFilePath] = useState(""); // Simplified for prototype, would be file upload in prod

    // Auto-suggest next version
    const handleOpen = () => {
        setOpen(true);
        // Simple logic: if 1.0 -> 1.1. If 1 -> 2.
        if (currentVersion.includes('.')) {
            const parts = currentVersion.split('.');
            const last = parseInt(parts.pop() || "0");
            setVersionNumber([...parts, last + 1].join('.'));
        } else {
            const num = parseInt(currentVersion) || 1;
            setVersionNumber((num + 1).toString());
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const formData = new FormData();
        formData.append("document_id", documentId);
        formData.append("version_number", versionNumber);
        formData.append("change_description", description);
        formData.append("file_path", filePath);

        const result = await createDocumentVersionAction(formData);

        if (result.success) {
            toast.success("Nova versão criada com sucesso!");
            setOpen(false);
            setDescription("");
            setFilePath("");
        } else {
            toast.error(result.error);
        }
        setLoading(false);
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button onClick={handleOpen} className="bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/20">
                    <FileSignature className="mr-2 h-4 w-4" />
                    Nova Revisão
                </Button>
            </DialogTrigger>
            <DialogContent className="glass border-slate-800 bg-slate-950/80 backdrop-blur-xl sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="text-xl flex items-center gap-2">
                        <UploadCloud className="h-5 w-5 text-indigo-400" />
                        Carregar Nova Versão
                    </DialogTitle>
                    <DialogDescription className="text-slate-400">
                        Crie uma nova versão para este documento. A versão atual é <strong>{currentVersion}</strong>.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Número da Versão</Label>
                            <Input
                                value={versionNumber}
                                onChange={(e) => setVersionNumber(e.target.value)}
                                className="bg-black/20 border-white/10"
                                placeholder="ex: 1.1"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Ficheiro (Caminho/URL)</Label>
                            <Input
                                value={filePath}
                                onChange={(e) => setFilePath(e.target.value)}
                                className="bg-black/20 border-white/10"
                                placeholder="/docs/sop-001-v2.pdf"
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Descrição da Alteração</Label>
                        <Textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="bg-black/20 border-white/10 min-h-[100px]"
                            placeholder="Descreva o que mudou nesta versão..."
                            required
                        />
                    </div>

                    <DialogFooter className="mt-6">
                        <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
                        <Button type="submit" disabled={loading} className="bg-indigo-600 hover:bg-indigo-500">
                            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <UploadCloud className="h-4 w-4 mr-2" />}
                            Criar Versão
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

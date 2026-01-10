"use client";

import { useState, useTransition, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { uploadUserSignatureAction, removeUserSignatureAction } from "@/app/actions/admin/signatures";
import { toast } from "sonner";
import { PenLine, Trash2, Upload, Image as ImageIcon } from "lucide-react";

interface SignatureUploadDialogProps {
    userId: string;
    userName: string;
    currentSignatureUrl?: string | null;
}

export function SignatureUploadDialog({ userId, userName, currentSignatureUrl }: SignatureUploadDialogProps) {
    const [open, setOpen] = useState(false);
    const [isPending, startTransition] = useTransition();
    const [preview, setPreview] = useState<string | null>(currentSignatureUrl || null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // Preview
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleUpload = () => {
        const file = fileInputRef.current?.files?.[0];
        if (!file) {
            toast.error("Selecione um ficheiro de assinatura.");
            return;
        }

        const formData = new FormData();
        formData.append("user_id", userId);
        formData.append("signature", file);

        startTransition(async () => {
            const result = await uploadUserSignatureAction(formData);
            if (result.success) {
                toast.success("Assinatura carregada com sucesso!");
                setOpen(false);
            } else {
                toast.error(result.message);
            }
        });
    };

    const handleRemove = () => {
        const formData = new FormData();
        formData.append("user_id", userId);

        startTransition(async () => {
            const result = await removeUserSignatureAction(formData);
            if (result.success) {
                toast.success("Assinatura removida.");
                setPreview(null);
                setOpen(false);
            } else {
                toast.error(result.message);
            }
        });
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <PenLine className="h-4 w-4" />
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[400px] bg-slate-950/95 border-slate-800">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <PenLine className="h-5 w-5 text-emerald-400" />
                        Assinatura de {userName}
                    </DialogTitle>
                    <DialogDescription>
                        Carregue uma imagem da assinatura digitalizada (PNG, JPEG, SVG).
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {/* Preview */}
                    <div className="flex items-center justify-center p-6 border border-dashed border-slate-700 rounded-lg bg-slate-900/50 min-h-[120px]">
                        {preview ? (
                            <img src={preview} alt="Signature Preview" className="max-h-20 max-w-full object-contain" />
                        ) : (
                            <div className="text-center text-slate-500">
                                <ImageIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                <p className="text-xs">Sem assinatura</p>
                            </div>
                        )}
                    </div>

                    {/* File Input */}
                    <div className="space-y-2">
                        <Label>Ficheiro de Assinatura</Label>
                        <Input
                            ref={fileInputRef}
                            type="file"
                            accept="image/png,image/jpeg,image/svg+xml"
                            onChange={handleFileChange}
                            className="bg-slate-900 border-slate-700"
                        />
                        <p className="text-[10px] text-slate-500">Máximo 500KB. Formatos: PNG, JPEG, SVG.</p>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                        <Button
                            onClick={handleUpload}
                            disabled={isPending}
                            className="flex-1 bg-emerald-600 hover:bg-emerald-500"
                        >
                            <Upload className="h-4 w-4 mr-2" />
                            {isPending ? "A carregar..." : "Carregar"}
                        </Button>
                        {currentSignatureUrl && (
                            <Button
                                variant="destructive"
                                onClick={handleRemove}
                                disabled={isPending}
                                size="icon"
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

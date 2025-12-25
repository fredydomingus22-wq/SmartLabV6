"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileCheck, Loader2 } from "lucide-react";
import { ActionForm } from "@/components/smart/action-form";
import { FileUpload } from "@/components/smart/file-upload";
import { registerCalibrationCertificateAction } from "@/app/actions/metrology";

interface RegisterCertificateDialogProps {
    equipmentId: string;
}

export function RegisterCertificateDialog({ equipmentId }: RegisterCertificateDialogProps) {
    const [open, setOpen] = useState(false);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="border-slate-800 text-slate-300 w-full">
                    <FileCheck className="h-4 w-4 mr-2" />
                    Novo Certificado
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md glass border-slate-800">
                <DialogHeader>
                    <DialogTitle>Registar Certificado de Calibração</DialogTitle>
                    <DialogDescription>
                        Submeta o PDF do certificado e defina a validade oficial.
                    </DialogDescription>
                </DialogHeader>

                <ActionForm
                    action={registerCalibrationCertificateAction}
                    onSuccess={() => setOpen(false)}
                    submitText="Registar Certificado"
                >
                    <input type="hidden" name="equipment_id" value={equipmentId} />

                    <div className="space-y-4">
                        <div className="grid gap-2">
                            <Label htmlFor="certificate_number">Número do Certificado *</Label>
                            <Input
                                id="certificate_number"
                                name="certificate_number"
                                placeholder="ex: CERT-2024-001"
                                required
                                className="glass"
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="issuer">Entidade Emissora *</Label>
                            <Input
                                id="issuer"
                                name="issuer"
                                placeholder="ex: ISQ, IPQ, Metrology Lab"
                                required
                                className="glass"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="issued_at">Data de Emissão *</Label>
                                <Input
                                    id="issued_at"
                                    name="issued_at"
                                    type="date"
                                    required
                                    className="glass"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="valid_until">Válido Até *</Label>
                                <Input
                                    id="valid_until"
                                    name="valid_until"
                                    type="date"
                                    required
                                    className="glass"
                                />
                            </div>
                        </div>

                        <FileUpload
                            name="file_path"
                            label="Cópia Digital (PDF) *"
                            bucket="coa-documents" // Using existing bucket
                            folder="metrology"
                        />
                    </div>
                </ActionForm>
            </DialogContent>
        </Dialog>
    );
}

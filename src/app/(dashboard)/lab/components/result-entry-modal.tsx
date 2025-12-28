"use client";

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { TestTube2, Upload, Loader2, AlertCircle, FlaskConical, Camera, X, Paperclip, Fingerprint, Lock } from "lucide-react";
import { useState, useEffect, useCallback, useRef } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { getSampleDetailsAction, saveAllResultsAction } from "@/app/actions/lab";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

interface ResultEntryModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    sampleId: string | null;
    onSuccess: () => void;
}

interface Parameter {
    id: string; // analysis ID
    parameter: {
        id: string;
        name: string;
        unit: string | null;
        code: string;
    };
    value_numeric: number | null;
    value_text: string | null;
    is_conforming: boolean | null;
    attachment_url?: string | null;
    spec?: {
        min_value?: number;
        max_value?: number;
        is_critical?: boolean;
    };
}

export function ResultEntryModal({ open, onOpenChange, sampleId, onSuccess }: ResultEntryModalProps) {
    const supabase = createClient();
    const [loading, setLoading] = useState(false);
    const [initializing, setInitializing] = useState(false);
    const [sample, setSample] = useState<any>(null);
    const [parameters, setParameters] = useState<Parameter[]>([]);
    const [showPasswordDialog, setShowPasswordDialog] = useState(false);
    const [password, setPassword] = useState("");

    // Form state
    const [formValues, setFormValues] = useState<Record<string, string>>({});
    const [notes, setNotes] = useState("");
    const [attachmentUrl, setAttachmentUrl] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);

    const fetchDetails = useCallback(async (id: string) => {
        setInitializing(true);
        try {
            const res = await getSampleDetailsAction(id);
            if (res.success && res.data) {
                setSample(res.data.sample);

                // Map results
                const params = res.data.results.map((r: any) => ({
                    id: r.id,
                    parameter: r.parameter,
                    value_numeric: r.value_numeric,
                    value_text: r.value_text,
                    is_conforming: r.is_conforming,
                    spec: r.spec
                }));
                setParameters(params);

                // Pre-fill
                const initialValues: Record<string, string> = {};
                params.forEach((p: Parameter) => {
                    if (p.value_numeric !== null) initialValues[p.id] = String(p.value_numeric);
                    else if (p.value_text !== null) initialValues[p.id] = p.value_text;
                    else initialValues[p.id] = "";
                });
                setFormValues(initialValues);
                setNotes(res.data.sample.notes || "");
                setAttachmentUrl(res.data.sample.attachment_url || null);
            } else {
                toast.error("Erro ao carregar detalhes da amostra");
                onOpenChange(false);
            }
        } catch (error) {
            console.error(error);
            toast.error("Erro de comunicação");
        } finally {
            setInitializing(false);
        }
    }, [onOpenChange]);

    useEffect(() => {
        if (open && sampleId) {
            fetchDetails(sampleId);
        } else {
            // Reset
            setSample(null);
            setParameters([]);
            setFormValues({});
            setNotes("");
            setAttachmentUrl(null);
            setPassword("");
            setShowPasswordDialog(false);
        }
    }, [open, sampleId, fetchDetails]);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !sampleId) return;

        setIsUploading(true);
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${sampleId}/evidence-${Date.now()}.${fileExt}`;

            const { error: uploadError } = await supabase.storage
                .from('lab-attachments')
                .upload(fileName, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('lab-attachments')
                .getPublicUrl(fileName);

            setAttachmentUrl(publicUrl);
            toast.success("Anexo carregado com sucesso");
        } catch (error: any) {
            console.error("Upload error:", error);
            toast.error(`Erro ao carregar anexo: ${error.message}`);
        } finally {
            setIsUploading(false);
        }
    };

    const handleRemoveAttachment = () => {
        setAttachmentUrl(null);
    };

    const handleSave = async () => {
        if (!sampleId) return;
        setLoading(true);

        const resultsToSave = parameters.map(p => ({
            analysisId: p.id,
            value: formValues[p.id] || null,
        }));

        const res = await saveAllResultsAction(
            sampleId,
            resultsToSave,
            notes,
            password || undefined,
            attachmentUrl || undefined
        );

        if (res.success) {
            toast.success(res.message);
            onOpenChange(false);
            onSuccess();
        } else {
            toast.error(res.message || "Erro ao guardar resultados");
        }
        setLoading(false);
        setPassword("");
        if (!res.success && password) setShowPasswordDialog(true);
        else setShowPasswordDialog(false);
    };

    if (!open) return null;

    if (showPasswordDialog) {
        return (
            <Dialog open={true} onOpenChange={(v) => !v && setShowPasswordDialog(false)}>
                <DialogContent className="max-w-sm glass border-slate-800 bg-slate-950 shadow-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-white flex items-center gap-2">
                            <Lock className="h-5 w-5 text-blue-400" />
                            Assinatura Digital
                        </DialogTitle>
                        <DialogDescription className="text-slate-400">
                            Confirme a sua senha para assinar e guardar os resultados.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label className="text-slate-300">Senha</Label>
                            <Input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="bg-slate-900 border-slate-700 text-white"
                                placeholder="Sua senha de login..."
                                autoFocus
                            />
                        </div>
                        <div className="rounded-lg bg-slate-900/50 p-3 border border-slate-800 flex items-start gap-2">
                            <Fingerprint className="h-5 w-5 text-slate-500 mt-0.5" />
                            <div className="text-xs text-slate-500">
                                <span className="font-bold text-slate-400">Nota:</span> A validação biométrica (Impressão Digital) está indisponível neste dispositivo. Use a senha (21 CFR Part 11).
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setShowPasswordDialog(false)} className="text-slate-400">Cancelar</Button>
                        <Button onClick={handleSave} disabled={loading || !password} className="bg-blue-600 hover:bg-blue-500 text-white">
                            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : "Assinar e Guardar"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        );
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            {/* Dynamic height handling: h-[90vh] ensures it takes up most of the screen but leaves margins. flex-col for sticky header/footer. */}
            <DialogContent className="max-w-4xl w-full h-[90vh] flex flex-col p-0 gap-0 overflow-hidden glass border-slate-800 bg-slate-950/90 shadow-2xl backdrop-blur-xl">
                <DialogHeader className="p-4 sm:p-6 pb-4 border-b border-slate-800 shrink-0">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-500/20 border border-blue-500/30 rounded-lg hidden sm:block">
                                <FlaskConical className="h-5 w-5 text-blue-400" />
                            </div>
                            <div>
                                <DialogTitle className="text-lg sm:text-xl font-black tracking-tight text-white">Resultados</DialogTitle>
                                <DialogDescription className="text-xs sm:text-sm text-slate-400">
                                    Insira os dados da análise
                                </DialogDescription>
                            </div>
                        </div>
                        <Button variant="ghost" size="icon" className="sm:hidden text-slate-400" onClick={() => onOpenChange(false)}>
                            <X className="h-5 w-5" />
                        </Button>
                    </div>

                    {initializing ? (
                        <div className="h-12 w-full animate-pulse bg-slate-800/50 rounded-lg mt-4" />
                    ) : sample ? (
                        <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 mt-4 text-sm bg-slate-900/50 p-3 rounded-xl border border-slate-800 shadow-inner">
                            <div className="flex justify-between sm:block">
                                <span className="text-[10px] text-slate-500 uppercase font-bold block mb-0.5 tracking-wider">Código</span>
                                <span className="font-mono font-medium text-blue-200">{sample.code}</span>
                            </div>
                            <div className="h-px w-full sm:h-full sm:w-px bg-slate-800 mx-1 hidden sm:block" />
                            <div className="flex justify-between sm:block">
                                <span className="text-[10px] text-slate-500 uppercase font-bold block mb-0.5 tracking-wider">Tipo</span>
                                <span className="font-medium text-slate-200 truncate max-w-[150px]">{sample.sample_type?.name}</span>
                            </div>
                            <div className="h-px w-full sm:h-full sm:w-px bg-slate-800 mx-1 hidden sm:block" />
                            <div className="flex justify-between sm:block items-center">
                                <span className="text-[10px] text-slate-500 uppercase font-bold block mb-0.5 tracking-wider sm:mb-0">Status</span>
                                <Badge variant="outline" className="ml-2 sm:ml-0 border-blue-500/30 text-blue-400">
                                    {sample.status}
                                </Badge>
                            </div>
                        </div>
                    ) : null}
                </DialogHeader>

                {/* Using div with overflow-y-auto instead of ScrollArea for more native scroll behavior on mobile if desired, or ensure ScrollArea has flex-1 */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-6 w-full space-y-8">
                    {initializing ? (
                        <div className="flex flex-col items-center justify-center py-12 space-y-4">
                            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                            <p className="text-sm text-slate-400">A carregar parâmetros...</p>
                        </div>
                    ) : (
                        <>
                            {/* Parameters Grid */}
                            <div className="space-y-4">
                                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                                    <TestTube2 className="h-4 w-4" /> Parâmetros
                                </h3>
                                {parameters.length > 0 ? (
                                    <div className="grid grid-cols-1 gap-4">
                                        {parameters.map((p) => {
                                            const currentValue = formValues[p.id];
                                            const isOOS = (p.is_conforming === false) ||
                                                (currentValue && !isNaN(Number(currentValue)) && p.spec &&
                                                    ((p.spec.min_value !== undefined && Number(currentValue) < p.spec.min_value) ||
                                                        (p.spec.max_value !== undefined && Number(currentValue) > p.spec.max_value)));

                                            return (
                                                <div key={p.id} className="p-4 rounded-xl bg-slate-900/30 border border-slate-800 hover:border-slate-700 transition-colors">
                                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                                                        <Label className={cn(
                                                            "text-sm font-medium",
                                                            isOOS ? "text-rose-400" : "text-slate-200"
                                                        )}>
                                                            {p.parameter.name}
                                                        </Label>
                                                        {isOOS && <span className="text-[10px] font-bold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">FORA DE ESPECIFICAÇÃO</span>}
                                                    </div>

                                                    <div className="flex gap-3 items-center">
                                                        <div className="relative flex-1">
                                                            <Input
                                                                type="number"
                                                                step="any"
                                                                inputMode="decimal"
                                                                placeholder="Valor"
                                                                className={cn(
                                                                    "h-12 text-lg font-mono bg-slate-950/50 border-slate-700 text-white placeholder:text-slate-600 focus:border-blue-500/50",
                                                                    isOOS && "border-rose-500/50 bg-rose-500/5 focus:ring-rose-500/20"
                                                                )}
                                                                value={formValues[p.id] || ""}
                                                                onChange={(e) => setFormValues({ ...formValues, [p.id]: e.target.value })}
                                                            />
                                                            {p.spec && (p.spec.min_value !== undefined || p.spec.max_value !== undefined) && (
                                                                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-500 font-mono bg-slate-900 px-1.5 py-0.5 rounded pointer-events-none border border-slate-800">
                                                                    {p.spec.min_value ?? "0"} - {p.spec.max_value ?? "∞"}
                                                                </div>
                                                            )}
                                                        </div>
                                                        {p.parameter.unit && (
                                                            <div className="h-12 w-12 flex items-center justify-center rounded-lg bg-slate-800/50 border border-slate-800 text-xs font-medium text-slate-400 shrink-0">
                                                                {p.parameter.unit}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className="text-center py-8 text-slate-500 bg-slate-900/20 rounded-lg border border-dashed border-slate-800">
                                        <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                        <p>Nenhum parâmetro de análise encontrado.</p>
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-6 border-t border-slate-800">
                                {/* General Notes */}
                                <div className="space-y-3">
                                    <Label className="text-sm font-bold text-slate-300 flex items-center gap-2">
                                        Observações Gerais
                                    </Label>
                                    <Textarea
                                        placeholder="Observações relevantes sobre a amostra..."
                                        className="resize-none h-[140px] bg-slate-950/50 border-slate-700 text-white placeholder:text-slate-600 focus:border-blue-500/50"
                                        value={notes}
                                        onChange={(e) => setNotes(e.target.value)}
                                    />
                                </div>

                                {/* Single Attachment Section */}
                                <div className="space-y-3">
                                    <Label className="text-sm font-bold text-slate-300 flex items-center gap-2">
                                        <Paperclip className="h-4 w-4" /> Evidência / Anexo
                                    </Label>

                                    <div className="h-[140px] rounded-xl border border-dashed border-slate-700 bg-slate-900/30 flex flex-col items-center justify-center text-center p-4 relative group hover:bg-slate-900/50 transition-colors">
                                        {attachmentUrl ? (
                                            <div className="w-full h-full flex flex-col items-center justify-center gap-2 animate-in fade-in zoom-in">
                                                <div className="h-10 w-10 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-1">
                                                    <Paperclip className="h-5 w-5" />
                                                </div>
                                                <p className="text-xs text-emerald-400 font-medium max-w-full truncate px-4">
                                                    Anexo carregado
                                                </p>
                                                <div className="flex gap-2 mt-1">
                                                    <a
                                                        href={attachmentUrl}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-[10px] bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 px-3 py-1.5 rounded-full border border-emerald-500/20 transition-colors"
                                                    >
                                                        Visualizar
                                                    </a>
                                                    <button
                                                        onClick={handleRemoveAttachment}
                                                        className="text-[10px] bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 px-3 py-1.5 rounded-full border border-rose-500/20 transition-colors"
                                                    >
                                                        Remover
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <>
                                                <div className="flex gap-3 mb-2">
                                                    <Button
                                                        variant="secondary"
                                                        size="sm"
                                                        className="h-8 text-xs bg-slate-800 text-slate-300 hover:text-white border border-slate-700"
                                                        onClick={() => document.getElementById('file-upload')?.click()}
                                                        disabled={isUploading}
                                                    >
                                                        <Upload className="h-3 w-3 mr-2" />
                                                        Upload
                                                    </Button>
                                                    <Button
                                                        variant="secondary"
                                                        size="sm"
                                                        className="h-8 text-xs bg-slate-800 text-slate-300 hover:text-white border border-slate-700"
                                                        onClick={() => document.getElementById('camera-capture')?.click()}
                                                        disabled={isUploading}
                                                    >
                                                        <Camera className="h-3 w-3 mr-2" />
                                                        Foto
                                                    </Button>
                                                </div>
                                                <p className="text-[10px] text-slate-500 max-w-[200px]">
                                                    Carregue uma foto da folha de obra ou relatório do equipamento. (Max 5MB)
                                                </p>
                                                {isUploading && (
                                                    <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center rounded-xl z-10">
                                                        <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
                                                    </div>
                                                )}
                                            </>
                                        )}
                                        <input
                                            id="file-upload"
                                            type="file"
                                            accept="image/*,application/pdf"
                                            className="hidden"
                                            onChange={handleFileUpload}
                                            disabled={isUploading}
                                        />
                                        <input
                                            id="camera-capture"
                                            type="file"
                                            accept="image/*"
                                            capture="environment"
                                            className="hidden"
                                            onChange={handleFileUpload}
                                            disabled={isUploading}
                                        />
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </div>

                <DialogFooter className="p-4 sm:p-6 pt-4 border-t border-slate-800 bg-slate-900/50 backdrop-blur-sm flex-col sm:flex-row gap-3 overflow-hidden shrink-0 z-20">
                    <Button variant="ghost" type="button" onClick={() => onOpenChange(false)} className="w-full sm:w-auto hover:bg-slate-800 hover:text-white order-2 sm:order-1">
                        Cancelar
                    </Button>
                    <div className="w-full sm:w-auto flex gap-2 order-1 sm:order-2">
                        <Button
                            type="button"
                            onClick={handleSave}
                            disabled={loading || initializing || parameters.length === 0}
                            variant="outline"
                            className="flex-1 sm:flex-none border-blue-600/30 text-blue-400 hover:bg-blue-600/10 hover:text-blue-300"
                        >
                            Guardar Rascunho
                        </Button>
                        <Button
                            type="button"
                            onClick={() => setShowPasswordDialog(true)}
                            disabled={loading || initializing || parameters.length === 0}
                            className="flex-1 sm:flex-none bg-blue-600 hover:bg-blue-500 text-white font-bold shadow-lg shadow-blue-600/20 hover:shadow-blue-600/40 transition-all active:scale-95"
                        >
                            <Fingerprint className="h-4 w-4 mr-2" />
                            Assinar e Terminar
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

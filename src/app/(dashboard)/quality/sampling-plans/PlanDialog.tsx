"use client";

import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Plus, Edit2, Loader2, Clock, Zap, Target, Box } from "lucide-react";
import { saveSamplingPlanAction } from "@/app/actions/lab_modules/sampling";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface PlanDialogProps {
    mode?: "create" | "edit";
    plan?: any;
    products: any[];
    sampleTypes: any[];
}

export function PlanDialog({ mode = "create", plan, products, sampleTypes }: PlanDialogProps) {
    const [open, setOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        id: plan?.id,
        name: plan?.name || "",
        description: plan?.description || "",
        product_id: plan?.product_id || "global",
        sample_type_id: plan?.sample_type_id || "",
        trigger_type: plan?.trigger_type || "event_based",
        frequency_minutes: plan?.frequency_minutes || 60,
        event_anchor: plan?.event_anchor || "batch_start",
        is_active: plan?.is_active ?? true
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.sample_type_id) {
            toast.error("Por favor, selecione um tipo de amostra.");
            return;
        }

        setIsSubmitting(true);
        try {
            const payload = {
                ...formData,
                product_id: formData.product_id === "global" ? null : formData.product_id,
                frequency_minutes: formData.trigger_type === 'time_based' ? Number(formData.frequency_minutes) : null,
                event_anchor: formData.trigger_type === 'event_based' ? formData.event_anchor : null
            };

            const result = await saveSamplingPlanAction(payload);

            if (result.success) {
                toast.success(result.message);
                setOpen(false);
                if (mode === 'create') {
                    setFormData({
                        id: undefined,
                        name: "",
                        description: "",
                        product_id: "global",
                        sample_type_id: "",
                        trigger_type: "event_based",
                        frequency_minutes: 60,
                        event_anchor: "batch_start",
                        is_active: true
                    });
                }
            } else {
                toast.error(result.message);
            }
        } catch (error) {
            toast.error("Erro ao salvar o plano.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {mode === "create" ? (
                    <Button className="bg-blue-600 hover:bg-blue-500 text-white font-bold uppercase tracking-widest shadow-[0_0_20px_rgba(37,99,235,0.3)]">
                        <Plus className="h-4 w-4 mr-2" /> Novo Plano
                    </Button>
                ) : (
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-white hover:bg-white/10">
                        <Edit2 className="h-4 w-4" />
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="max-w-2xl bg-slate-950 border-slate-800 shadow-[0_0_50px_rgba(0,0,0,0.5)] p-0 overflow-hidden">
                <DialogHeader className="p-6 border-b border-white/5 bg-slate-900/50">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-blue-500/20">
                            <Plus className="h-6 w-6 text-blue-400" />
                        </div>
                        <div>
                            <DialogTitle className="text-2xl font-black text-white tracking-tighter uppercase italic">
                                {mode === "create" ? "Configurar Novo Plano" : "Editar Plano de Amostragem"}
                            </DialogTitle>
                            <DialogDescription className="text-slate-500 font-mono text-[10px] uppercase tracking-widest">
                                Intelligent Industrial Orchestration
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="p-8 space-y-8 bg-black/20 max-h-[80vh] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Básicos */}
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <Label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Nome do Plano</Label>
                                <Input
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="Ex: Controlo Horário Linha 1"
                                    className="h-12 bg-slate-900/50 border-slate-800 focus:ring-blue-500/20"
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Descrição / SOP</Label>
                                <Textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="Indique o procedimento operacional padrão..."
                                    className="bg-slate-900/50 border-slate-800 focus:ring-blue-500/20 min-h-[100px]"
                                />
                            </div>
                        </div>

                        {/* Scoping and Trigger */}
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <div className="flex items-center gap-2 mb-1">
                                    <Box className="h-3 w-3 text-blue-400" />
                                    <Label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Abrangência (Produto)</Label>
                                </div>
                                <Select
                                    value={formData.product_id || "global"}
                                    onValueChange={(val) => setFormData({ ...formData, product_id: val })}
                                >
                                    <SelectTrigger className="h-12 bg-slate-900/50 border-slate-800">
                                        <SelectValue placeholder="Selecione o produto" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-slate-900 border-slate-800">
                                        <SelectItem value="global" className="font-bold text-blue-400">🌎 Global (Todos os Produtos)</SelectItem>
                                        {products.map(p => (
                                            <SelectItem key={p.id} value={p.id}>{p.name} ({p.sku})</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center gap-2 mb-1">
                                    <Target className="h-3 w-3 text-purple-400" />
                                    <Label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Tipo de Amostra</Label>
                                </div>
                                <Select
                                    value={formData.sample_type_id}
                                    onValueChange={(val) => setFormData({ ...formData, sample_type_id: val })}
                                >
                                    <SelectTrigger className="h-12 bg-slate-900/50 border-slate-800">
                                        <SelectValue placeholder="Selecione o tipo" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-slate-900 border-slate-800">
                                        {sampleTypes.map(t => (
                                            <SelectItem key={t.id} value={t.id}>{t.name} ({t.code})</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>

                    {/* Trigger Configuration */}
                    <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800 space-y-6">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-black text-white uppercase tracking-tighter">Configuração de Gatilho (Trigger)</h3>
                            <div className="flex bg-black/40 p-1 rounded-lg border border-white/5">
                                <Button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, trigger_type: 'event_based' })}
                                    variant="ghost"
                                    className={cn(
                                        "h-8 px-4 text-[10px] font-bold uppercase tracking-widest rounded-md transition-all",
                                        formData.trigger_type === 'event_based' ? "bg-amber-500/20 text-amber-400 shadow-inner" : "text-slate-500"
                                    )}
                                >
                                    <Zap className="h-3 w-3 mr-2" /> Evento
                                </Button>
                                <Button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, trigger_type: 'time_based' })}
                                    variant="ghost"
                                    className={cn(
                                        "h-8 px-4 text-[10px] font-bold uppercase tracking-widest rounded-md transition-all",
                                        formData.trigger_type === 'time_based' ? "bg-blue-500/20 text-blue-400 shadow-inner" : "text-slate-500"
                                    )}
                                >
                                    <Clock className="h-3 w-3 mr-2" /> Tempo
                                </Button>
                            </div>
                        </div>

                        {formData.trigger_type === 'time_based' ? (
                            <div className="flex items-center gap-6 animate-in slide-in-from-left-2 duration-300">
                                <div className="space-y-2 flex-1">
                                    <Label className="text-[10px] font-bold text-slate-500 uppercase">Frequência (Minutos)</Label>
                                    <div className="relative">
                                        <Input
                                            type="number"
                                            value={formData.frequency_minutes || ""}
                                            onChange={(e) => setFormData({ ...formData, frequency_minutes: Number(e.target.value) })}
                                            className="h-14 bg-black/40 border-slate-700 text-2xl font-black text-blue-400 pl-12"
                                        />
                                        <Clock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-600" />
                                    </div>
                                </div>
                                <div className="flex-1 p-4 rounded-xl bg-blue-500/5 border border-blue-500/10 text-[10px] text-blue-300 leading-relaxed italic">
                                    "O sistema gerará um pedido automaticamente a cada {formData.frequency_minutes} minutos enquanto o lote estiver em execução."
                                </div>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 gap-4 animate-in slide-in-from-right-2 duration-300">
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-bold text-slate-500 uppercase">Âncora de Evento</Label>
                                    <Select
                                        value={formData.event_anchor || ""}
                                        onValueChange={(val) => setFormData({ ...formData, event_anchor: val as any })}
                                    >
                                        <SelectTrigger className="h-14 bg-black/40 border-slate-700 font-bold text-amber-400">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="bg-slate-900 border-slate-800">
                                            <SelectItem value="batch_start">🚀 Início de Lote</SelectItem>
                                            <SelectItem value="batch_end">🏁 Fim de Lote</SelectItem>
                                            <SelectItem value="shift_change">🔄 Troca de Turno</SelectItem>
                                            <SelectItem value="process_step">⚙️ Passo de Processo (IP)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/10 text-[10px] text-amber-300 leading-relaxed italic">
                                    "O pedido será gerado assim que o evento MES for disparado no orquestrador de produção."
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Switch
                                id="active-mode"
                                checked={formData.is_active}
                                onCheckedChange={(val) => setFormData({ ...formData, is_active: val })}
                                className="data-[state=checked]:bg-emerald-500"
                            />
                            <Label htmlFor="active-mode" className="text-xs font-bold text-slate-400 uppercase tracking-widest cursor-pointer">
                                Plano Ativado
                            </Label>
                        </div>
                        <DialogFooter className="gap-2">
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={() => setOpen(false)}
                                className="text-slate-500 hover:text-white"
                            >
                                Cancelar
                            </Button>
                            <Button
                                type="submit"
                                disabled={isSubmitting}
                                className="bg-emerald-600 hover:bg-emerald-500 text-white font-black uppercase tracking-widest px-8"
                            >
                                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : mode === 'create' ? "Criar Plano" : "Salvar Alterações"}
                            </Button>
                        </DialogFooter>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}

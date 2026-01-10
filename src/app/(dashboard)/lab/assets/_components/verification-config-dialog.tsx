"use client";

import { useTransition, useState } from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Settings2, Plus, Trash2, RotateCw, Save } from "lucide-react";
import { updateLabAssetAction } from "@/app/actions/lab_modules/assets";

interface VerificationConfigDialogProps {
    asset: any;
    children?: React.ReactNode;
}

export function VerificationConfigDialog({ asset, children }: VerificationConfigDialogProps) {
    const [open, setOpen] = useState(false);
    const [isPending, startTransition] = useTransition();

    const [config, setConfig] = useState(asset.verification_config || {
        unit: "",
        validity_hours: 48,
        daily_verification_enabled: true,
        standards: []
    });

    // Ensure state reflects current asset config including the new field if it exists
    useState(() => {
        if (asset.verification_config && asset.verification_config.daily_verification_enabled === undefined) {
            setConfig({ ...asset.verification_config, daily_verification_enabled: true });
        }
    });

    const handleAddStandard = () => {
        setConfig((prev: any) => ({
            ...prev,
            standards: [
                ...prev.standards,
                { id: crypto.randomUUID(), name: "", nominal: 0, tolerance: 0 }
            ]
        }));
    };

    const handleRemoveStandard = (id: string) => {
        setConfig((prev: any) => ({
            ...prev,
            standards: prev.standards.filter((s: any) => s.id !== id)
        }));
    };

    const handleUpdateStandard = (id: string, field: string, value: any) => {
        setConfig((prev: any) => ({
            ...prev,
            standards: prev.standards.map((s: any) =>
                s.id === id ? { ...s, [field]: value } : s
            )
        }));
    };

    const onSave = () => {
        startTransition(async () => {
            // Prepare the payload for updateLabAssetAction
            // We need to match the Shape of CreateLabAssetFormValues but only for verification_config
            const payload = {
                name: asset.name,
                code: asset.code,
                asset_category: asset.asset_category,
                manufacturer: asset.manufacturer,
                model: asset.model,
                serial_number: asset.serial_number,
                calibration_date: asset.last_calibration_date,
                next_calibration_date: asset.next_calibration_date,
                criticality: asset.criticality,
                status: asset.status,
                plant_id: asset.plant_id,
                verification_config: config
            };

            const result = await updateLabAssetAction(asset.id, payload as any);

            if (result.success) {
                toast.success("Configurações de verificação atualizadas!");
                setOpen(false);
            } else {
                toast.error(result.message || "Erro ao atualizar configurações.");
            }
        });
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {children || (
                    <Button variant="outline" className="glass border-slate-700 hover:border-emerald-500/50">
                        <Settings2 className="h-4 w-4 mr-2 text-emerald-400" />
                        Configurar Verificação
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto glass border-white/10">
                <DialogHeader>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-emerald-500/10 rounded-lg">
                            <Settings2 className="h-5 w-5 text-emerald-400" />
                        </div>
                        <DialogTitle className="text-xl font-bold text-white">
                            Configuração de Verificação
                        </DialogTitle>
                    </div>
                </DialogHeader>

                <div className="space-y-8 py-4">
                    {/* Status Toggle */}
                    <div className="p-4 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label className="text-sm font-semibold text-slate-200">Verificação de Rotina Aplicável</Label>
                            <p className="text-xs text-slate-500">Desative se este equipamento não deve aparecer na lista de verificações diárias.</p>
                        </div>
                        <Button
                            variant={config.daily_verification_enabled !== false ? "default" : "outline"}
                            size="sm"
                            onClick={() => setConfig({ ...config, daily_verification_enabled: config.daily_verification_enabled === false ? true : false })}
                            className={config.daily_verification_enabled !== false
                                ? "bg-emerald-600 hover:bg-emerald-500 text-white"
                                : "border-slate-700 text-slate-400"}
                        >
                            {config.daily_verification_enabled !== false ? "ATIVADO" : "NÃO APLICÁVEL"}
                        </Button>
                    </div>

                    {/* General Settings */}
                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label className="text-slate-300">Unidade de Medida</Label>
                            <Input
                                placeholder="Ex: g, pH, °C"
                                value={config.unit}
                                onChange={(e) => setConfig({ ...config, unit: e.target.value })}
                                className="bg-white/5 border-white/10 text-white"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-slate-300">Validade da Verificação (Horas)</Label>
                            <Input
                                type="number"
                                value={config.validity_hours}
                                onChange={(e) => setConfig({ ...config, validity_hours: parseInt(e.target.value) })}
                                className="bg-white/5 border-white/10 text-white"
                            />
                        </div>
                    </div>

                    {/* Standards Table */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                                Padrões de Verificação
                                <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full font-mono">
                                    {config.standards.length}
                                </span>
                            </h3>
                            <Button size="sm" onClick={handleAddStandard} className="bg-emerald-600/20 hover:bg-emerald-600 text-emerald-400 hover:text-white border border-emerald-500/30">
                                <Plus className="h-3.5 w-3.5 mr-1" />
                                Add Padrão
                            </Button>
                        </div>

                        <div className="border border-white/5 rounded-xl overflow-hidden">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-white/5 text-slate-400 font-medium">
                                    <tr>
                                        <th className="px-4 py-3">Nome</th>
                                        <th className="px-4 py-3 w-28 text-right">Nominal</th>
                                        <th className="px-4 py-3 w-28 text-right">Tolerância</th>
                                        <th className="px-4 py-3 w-12"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {config.standards.length === 0 ? (
                                        <tr>
                                            <td colSpan={4} className="px-4 py-8 text-center text-slate-500 italic">
                                                Nenhum padrão configurado. Adicione o primeiro padrão acima.
                                            </td>
                                        </tr>
                                    ) : (
                                        config.standards.map((std: any) => (
                                            <tr key={std.id} className="group hover:bg-white/[0.02] transition-colors">
                                                <td className="px-4 py-3">
                                                    <Input
                                                        value={std.name}
                                                        onChange={(e) => handleUpdateStandard(std.id, 'name', e.target.value)}
                                                        className="bg-transparent border-transparent focus:border-emerald-500/30 h-8 px-2"
                                                        placeholder="Ex: Peso 100g"
                                                    />
                                                </td>
                                                <td className="px-4 py-3">
                                                    <Input
                                                        type="number"
                                                        value={std.nominal}
                                                        onChange={(e) => handleUpdateStandard(std.id, 'nominal', parseFloat(e.target.value))}
                                                        className="bg-transparent border-transparent focus:border-emerald-500/30 h-8 px-2 text-right font-mono"
                                                    />
                                                </td>
                                                <td className="px-4 py-3">
                                                    <Input
                                                        type="number"
                                                        value={std.tolerance}
                                                        onChange={(e) => handleUpdateStandard(std.id, 'tolerance', parseFloat(e.target.value))}
                                                        className="bg-transparent border-transparent focus:border-emerald-500/30 h-8 px-2 text-right font-mono"
                                                    />
                                                </td>
                                                <td className="px-4 py-3">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => handleRemoveStandard(std.id)}
                                                        className="h-8 w-8 text-rose-500/30 hover:text-rose-500 hover:bg-rose-500/10 opacity-0 group-hover:opacity-100 transition-all"
                                                    >
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                <DialogFooter className="border-t border-white/5 pt-6">
                    <Button variant="ghost" onClick={() => setOpen(false)} disabled={isPending} className="text-slate-400">
                        Cancelar
                    </Button>
                    <Button onClick={onSave} disabled={isPending} className="bg-emerald-600 hover:bg-emerald-500 text-white min-w-[120px]">
                        {isPending ? <RotateCw className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                        Salvar Configurações
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

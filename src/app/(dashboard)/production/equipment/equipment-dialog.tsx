"use client";

import { useState } from "react";
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
import { Label } from "@/components/ui/label";
import { SearchableSelect } from "@/components/smart/searchable-select";
import { Plus, Pencil, Loader2, Trash2 } from "lucide-react";
import {
    createEquipmentAction,
    updateEquipmentAction,
    deleteEquipmentAction,
} from "@/app/actions/equipment";

// Equipment types
const EQUIPMENT_TYPES = [
    { value: "tank", label: "Tank" },
    { value: "mixer", label: "Mixer" },
    { value: "pasteurizer", label: "Pasteurizer" },
    { value: "filler", label: "Filler" },
    { value: "incubator", label: "Incubator" },
    { value: "production_line", label: "Production Line" },
    { value: "other", label: "Other" },
];

interface Equipment {
    id: string;
    name: string;
    code: string;
    equipment_type: string;
    status: string;
    capacity?: number | null;
    capacity_unit?: string | null;
    serial_number?: string | null;
    manufacturer?: string | null;
    model?: string | null;
    installation_date?: string | null;
    last_calibration_date?: string | null;
    next_calibration_date?: string | null;
    calibration_frequency_months?: number | null;
    criticality?: string | null;
}

interface EquipmentDialogProps {
    mode: "create" | "edit";
    equipment?: Equipment;
}

export function EquipmentDialog({ mode, equipment }: EquipmentDialogProps) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    // Core Fields
    const [name, setName] = useState(equipment?.name || "");
    const [code, setCode] = useState(equipment?.code || "");
    const [equipType, setEquipType] = useState(equipment?.equipment_type || "tank");
    const [status, setStatus] = useState(equipment?.status || "active");
    const [capacity, setCapacity] = useState(equipment?.capacity?.toString() || "");
    const [capacityUnit, setCapacityUnit] = useState(equipment?.capacity_unit || "L");

    // Metrology Fields
    const [serialNumber, setSerialNumber] = useState(equipment?.serial_number || "");
    const [manufacturer, setManufacturer] = useState(equipment?.manufacturer || "");
    const [model, setModel] = useState(equipment?.model || "");
    const [installationDate, setInstallationDate] = useState(equipment?.installation_date || "");
    const [lastCalibrationDate, setLastCalibrationDate] = useState(equipment?.last_calibration_date || "");
    const [nextCalibrationDate, setNextCalibrationDate] = useState(equipment?.next_calibration_date || "");
    const [calFrequency, setCalFrequency] = useState(equipment?.calibration_frequency_months?.toString() || "");
    const [criticality, setCriticality] = useState(equipment?.criticality || "medium");

    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);

        const formData = new FormData();
        formData.set("name", name);
        formData.set("code", code);
        formData.set("equipment_type", equipType);
        formData.set("status", status);
        formData.set("capacity", capacity);
        formData.set("capacity_unit", capacityUnit);
        formData.set("serial_number", serialNumber);
        formData.set("manufacturer", manufacturer);
        formData.set("model", model);
        formData.set("installation_date", installationDate);
        formData.set("last_calibration_date", lastCalibrationDate);
        formData.set("next_calibration_date", nextCalibrationDate);
        formData.set("calibration_frequency_months", calFrequency);
        formData.set("criticality", criticality);

        if (mode === "edit" && equipment) {
            formData.set("id", equipment.id);
        }

        const action = mode === "create" ? createEquipmentAction : updateEquipmentAction;
        const result = await action(formData);

        setLoading(false);

        if (result.success) {
            toast.success(result.message);
            setOpen(false);
            if (mode === "create") {
                setName("");
                setCode("");
                setCapacity("");
                setSerialNumber("");
                setManufacturer("");
                setModel("");
                setInstallationDate("");
                setLastCalibrationDate("");
                setNextCalibrationDate("");
                setCalFrequency("");
            }
            router.refresh();
        } else {
            toast.error(result.message);
        }
    };

    const handleDelete = async () => {
        if (!equipment) return;
        if (!confirm("Are you sure you want to delete this equipment?")) return;

        setLoading(true);
        const formData = new FormData();
        formData.set("id", equipment.id);

        const result = await deleteEquipmentAction(formData);
        setLoading(false);

        if (result.success) {
            toast.success(result.message);
            setOpen(false);
            router.refresh();
        } else {
            toast.error(result.message);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {mode === "create" ? (
                    <Button className="relative z-10 bg-amber-600 hover:bg-amber-500 text-white font-bold h-12 px-8 rounded-xl shadow-lg shadow-amber-500/20 active:scale-95 transition-all">
                        <Plus className="h-4 w-4 mr-2" />
                        Novo Equipamento
                    </Button>
                ) : (
                    <Button variant="outline" size="sm">
                        <Pencil className="h-4 w-4" />
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="max-w-xl glass border-slate-800">
                <DialogHeader>
                    <DialogTitle className="text-white">
                        {mode === "create" ? "Novo Equipamento" : "Editar Equipamento"}
                    </DialogTitle>
                    <DialogDescription className="text-slate-400">
                        {mode === "create"
                            ? "Adicione um novo equipamento com controlo metrológico."
                            : "Atualize os metadados e estado de calibração."}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid gap-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="name" className="text-slate-300">Nome *</Label>
                                <Input
                                    id="name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Ex: Tanque 01"
                                    required
                                    className="glass text-white border-white/10"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="code" className="text-slate-300">Código *</Label>
                                <Input
                                    id="code"
                                    value={code}
                                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                                    placeholder="Ex: TQ-001"
                                    className="font-mono glass text-white border-white/10"
                                    required
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="equipment_type" className="text-slate-300">Tipo *</Label>
                                <SearchableSelect
                                    value={equipType}
                                    onValueChange={setEquipType}
                                    options={[
                                        { value: "tank", label: "Tanque" },
                                        { value: "mixer", label: "Misturador" },
                                        { value: "pasteurizer", label: "Pasteurizador" },
                                        { value: "filler", label: "Enchedora" },
                                        { value: "incubator", label: "Incubadora" },
                                        { value: "production_line", label: "Linha de Produção" },
                                        { value: "other", label: "Outro" },
                                    ]}
                                    placeholder="Selecione tipo"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="status" className="text-slate-300">Estado</Label>
                                <SearchableSelect
                                    value={status}
                                    onValueChange={setStatus}
                                    options={[
                                        { value: "active", label: "Ativo" },
                                        { value: "maintenance", label: "Em Manutenção" },
                                        { value: "decommissioned", label: "Desativado" },
                                        { value: "out_of_calibration", label: "Fora de Calibração" },
                                        { value: "retired", label: "Abatido" },
                                    ]}
                                />
                            </div>
                        </div>

                        {/* Metrology Section */}
                        <div className="grid grid-cols-2 gap-4 mt-2">
                            <div className="grid gap-2">
                                <Label htmlFor="serial_number" className="text-slate-300">Nº de Série</Label>
                                <Input
                                    id="serial_number"
                                    value={serialNumber}
                                    onChange={(e) => setSerialNumber(e.target.value)}
                                    placeholder="SN-123456"
                                    className="glass text-white border-white/10"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="manufacturer" className="text-slate-300">Fabricante</Label>
                                <Input
                                    id="manufacturer"
                                    value={manufacturer}
                                    onChange={(e) => setManufacturer(e.target.value)}
                                    placeholder="Ex: IKA, Mettler"
                                    className="glass text-white border-white/10"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="model" className="text-slate-300">Modelo</Label>
                                <Input
                                    id="model"
                                    value={model}
                                    onChange={(e) => setModel(e.target.value)}
                                    placeholder="Ex: MS 3 Digital"
                                    className="glass text-white border-white/10"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="installation_date" className="text-slate-300">Data Instalação</Label>
                                <Input
                                    id="installation_date"
                                    type="date"
                                    value={installationDate}
                                    onChange={(e) => setInstallationDate(e.target.value)}
                                    className="glass text-white border-white/10 [color-scheme:dark]"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="last_calibration" className="text-slate-300">Última Calib.</Label>
                                <Input
                                    id="last_calibration"
                                    type="date"
                                    value={lastCalibrationDate}
                                    onChange={(e) => setLastCalibrationDate(e.target.value)}
                                    className="glass text-white border-white/10 [color-scheme:dark]"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="next_calibration" className="text-slate-300">Próxima Calib.</Label>
                                <Input
                                    id="next_calibration"
                                    type="date"
                                    value={nextCalibrationDate}
                                    onChange={(e) => setNextCalibrationDate(e.target.value)}
                                    className="glass text-white border-white/10 [color-scheme:dark]"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="cal_freq" className="text-slate-300">Freq (Meses)</Label>
                                <Input
                                    id="cal_freq"
                                    type="number"
                                    value={calFrequency}
                                    onChange={(e) => setCalFrequency(e.target.value)}
                                    placeholder="12"
                                    className="glass text-white border-white/10"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="criticality" className="text-slate-300">Criticidade</Label>
                                <SearchableSelect
                                    value={criticality}
                                    onValueChange={setCriticality}
                                    options={[
                                        { value: "low", label: "Baixa" },
                                        { value: "medium", label: "Média" },
                                        { value: "high", label: "Alta" },
                                    ]}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="capacity" className="text-slate-300">Capacidade</Label>
                                <Input
                                    id="capacity"
                                    type="number"
                                    value={capacity}
                                    onChange={(e) => setCapacity(e.target.value)}
                                    placeholder="0"
                                    className="glass text-white border-white/10"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="capacity_unit" className="text-slate-300">Unidade</Label>
                                <SearchableSelect
                                    value={capacityUnit}
                                    onValueChange={setCapacityUnit}
                                    options={[
                                        { value: "L", label: "Litros" },
                                        { value: "kg", label: "Quilogramas" },
                                        { value: "m3", label: "Metros Cúbicos" },
                                        { value: "gal", label: "Galões" },
                                    ]}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-between pt-4">
                        {mode === "edit" && (
                            <Button
                                type="button"
                                variant="destructive"
                                onClick={handleDelete}
                                disabled={loading}
                            >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Apagar
                            </Button>
                        )}
                        <div className={`flex gap-2 ${mode === "create" ? "ml-auto" : ""}`}>
                            <Button type="button" variant="outline" onClick={() => setOpen(false)} className="border-slate-800 text-slate-300 hover:text-white hover:bg-white/10">
                                Cancelar
                            </Button>
                            <Button type="submit" disabled={loading} className="bg-amber-600 hover:bg-amber-500 text-white">
                                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {mode === "create" ? "Criar Equipamento" : "Guardar Alterações"}
                            </Button>
                        </div>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}

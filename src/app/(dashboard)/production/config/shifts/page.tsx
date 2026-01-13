"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Clock, Plus, Edit, Trash2,
    Calendar, Timer, Info, MoreHorizontal,
    LayoutGrid, List, Users, ShieldCheck, Zap
} from "lucide-react";
import Link from "next/link";
import { getShiftsAction, createShiftAction, updateShiftAction, deleteShiftAction } from "@/app/actions/shifts";
import { toast } from "sonner";
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
import { Textarea } from "@/components/ui/textarea";
import { PageHeader } from "@/components/layout/page-header";
import { KPISparkCard } from "@/components/ui/kpi-spark-card";
import { cn } from "@/lib/utils";

export default function ShiftsPage() {
    const [shifts, setShifts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingShift, setEditingShift] = useState<any>(null);
    const [formLoading, setFormLoading] = useState(false);

    useEffect(() => {
        loadShifts();
    }, []);

    async function loadShifts() {
        try {
            const data = await getShiftsAction();
            setShifts(data);
        } catch (error) {
            toast.error("Erro ao carregar turnos");
        } finally {
            setLoading(false);
        }
    }

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setFormLoading(true);
        const formData = new FormData(e.currentTarget);

        try {
            const result = editingShift
                ? await updateShiftAction(editingShift.id, formData)
                : await createShiftAction(formData);

            if (result.success) {
                toast.success(result.message);
                setIsDialogOpen(false);
                setEditingShift(null);
                loadShifts();
            } else {
                toast.error(result.message);
            }
        } catch (error) {
            toast.error("Ocorreu um erro inesperado");
        } finally {
            setFormLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Tem a certeza que deseja eliminar este turno?")) return;

        try {
            const result = await deleteShiftAction(id);
            if (result.success) {
                toast.success(result.message);
                loadShifts();
            } else {
                toast.error(result.message);
            }
        } catch (error) {
            toast.error("Erro ao eliminar turno");
        }
    };

    // Mock data for sparklines
    const mockData1 = [8, 8, 8, 8, 8, 8, 8].map(v => ({ value: v }));
    const mockData2 = [24, 24, 24, 24, 24, 24, 24].map(v => ({ value: v }));
    const mockData3 = [100, 98, 99, 100, 97, 99, 100].map(v => ({ value: v }));

    return (
        <div className="space-y-10 animate-in fade-in duration-700">
            <PageHeader
                title="Gestão de Turnos"
                description="Orquestração de janelas operacionais e escalas de produção"
                icon={<Clock className="h-4 w-4" />}
                backHref="/production"
                variant="blue"
                actions={
                    <Dialog open={isDialogOpen} onOpenChange={(open) => {
                        setIsDialogOpen(open);
                        if (!open) setEditingShift(null);
                    }}>
                        <DialogTrigger asChild>
                            <Button className="bg-blue-600 hover:bg-blue-500 text-white px-6 h-12 rounded-2xl shadow-lg shadow-blue-500/20 transition-all hover:scale-105 active:scale-95 font-black uppercase italic tracking-tighter">
                                <Plus className="w-5 h-5 mr-2" />
                                Configurar Turno
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="bg-slate-900 border-white/5 shadow-2xl sm:max-w-[500px] rounded-[2.5rem] overflow-hidden p-0">
                            <div className="p-8 space-y-6">
                                <DialogHeader>
                                    <DialogTitle className="text-3xl font-black text-white italic tracking-tighter uppercase">
                                        {editingShift ? "Editar Escala" : "Nova Janela Operativa"}
                                    </DialogTitle>
                                    <DialogDescription className="text-slate-500 font-bold uppercase text-[10px] tracking-widest leading-relaxed">
                                        Defina os parâmetros cronológicos para a execução do MES.
                                    </DialogDescription>
                                </DialogHeader>

                                <form onSubmit={handleSubmit} className="space-y-6 pt-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="name" className="text-[10px] font-black uppercase tracking-widest text-slate-500 italic ml-1">Identificação do Turno</Label>
                                        <Input
                                            id="name"
                                            name="name"
                                            placeholder="Ex: Turno A, Matinal 06-14..."
                                            defaultValue={editingShift?.name}
                                            className="h-12 bg-black/40 border-white/5 rounded-2xl glass text-white font-bold placeholder:text-slate-700"
                                            required
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <Label htmlFor="start_time" className="text-[10px] font-black uppercase tracking-widest text-emerald-500 italic ml-1">Check-in Time</Label>
                                            <Input
                                                id="start_time"
                                                name="start_time"
                                                type="time"
                                                defaultValue={editingShift?.start_time?.slice(0, 5)}
                                                className="h-12 bg-black/40 border-white/5 rounded-2xl glass text-white font-bold"
                                                required
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="end_time" className="text-[10px] font-black uppercase tracking-widest text-rose-500 italic ml-1">Check-out Time</Label>
                                            <Input
                                                id="end_time"
                                                name="end_time"
                                                type="time"
                                                defaultValue={editingShift?.end_time?.slice(0, 5)}
                                                className="h-12 bg-black/40 border-white/5 rounded-2xl glass text-white font-bold"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="description" className="text-[10px] font-black uppercase tracking-widest text-slate-500 italic ml-1">Observações Técnicas</Label>
                                        <Textarea
                                            id="description"
                                            name="description"
                                            placeholder="Notas sobre transferência de turno ou responsabilidades..."
                                            defaultValue={editingShift?.description}
                                            className="bg-black/40 border-white/5 rounded-2xl glass text-white font-medium min-h-[100px]"
                                        />
                                    </div>

                                    <div className="flex gap-4 pt-4">
                                        <Button type="button" variant="ghost" onClick={() => setIsDialogOpen(false)} className="flex-1 h-12 rounded-2xl font-black uppercase text-[10px] tracking-widest text-slate-500">Descartar</Button>
                                        <Button type="submit" disabled={formLoading} className="flex-[2] h-12 bg-blue-600 hover:bg-blue-500 rounded-2xl font-black uppercase text-[10px] tracking-widest italic shadow-lg shadow-blue-500/20">
                                            {formLoading ? "Processando..." : (editingShift ? "Atualizar Sistema" : "Registrar Escala")}
                                        </Button>
                                    </div>
                                </form>
                            </div>
                        </DialogContent>
                    </Dialog>
                }
            />

            {/* Metrics Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <KPISparkCard
                    variant="blue"
                    title="Turnos Ativos"
                    value={shifts.length.toString()}
                    subtext="Escopo de Produção 24h"
                    icon={<Clock className="h-4 w-4" />}
                    data={mockData1}
                    dataKey="value"
                />
                <KPISparkCard
                    variant="emerald"
                    title="Disponibilidade"
                    value="100%"
                    subtext="Cobertura Operacional"
                    icon={<ShieldCheck className="h-4 w-4" />}
                    data={mockData3}
                    dataKey="value"
                />
                <KPISparkCard
                    variant="amber"
                    title="Janela Total"
                    value="24h"
                    subtext="Carga Horária Sistema"
                    icon={<Timer className="h-4 w-4" />}
                    data={mockData2}
                    dataKey="value"
                />
            </div>

            {/* Content Section */}
            <div className="space-y-8">
                <div className="flex items-center justify-between px-1">
                    <div className="flex items-center gap-3">
                        <Zap className="h-5 w-5 text-yellow-400" />
                        <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter">Escalas Configuradas</h2>
                    </div>
                </div>

                {loading ? (
                    <div className="flex flex-col items-center justify-center p-32 gap-4">
                        <div className="h-12 w-12 border-4 border-white/5 border-t-blue-500 rounded-full animate-spin" />
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic">Hydrating shift data...</p>
                    </div>
                ) : shifts.length === 0 ? (
                    <div className="rounded-[2.5rem] border-2 border-dashed border-white/5 bg-slate-900/20 p-24 flex flex-col items-center justify-center text-center">
                        <div className="p-6 rounded-3xl bg-slate-500/5 w-24 h-24 flex items-center justify-center mx-auto mb-8 border border-white/5">
                            <Clock className="h-12 w-12 text-slate-700" />
                        </div>
                        <h3 className="text-2xl font-black text-white uppercase tracking-tight italic">Sem Escalas Definidas</h3>
                        <p className="text-slate-500 max-w-sm mt-4 text-sm font-medium">
                            Configure os turnos para habilitar o planejamento e monitoramento de lotes industriais.
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {shifts.map((shift) => (
                            <div key={shift.id} className="group relative p-8 rounded-[2.5rem] border border-white/5 bg-slate-900/40 glass overflow-hidden transition-all duration-500 hover:border-blue-500/30">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 blur-3xl -mr-16 -mt-16 group-hover:bg-blue-500/10 transition-all duration-500" />

                                <div className="relative z-10 space-y-6">
                                    <div className="flex justify-between items-start">
                                        <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20 group-hover:bg-blue-500/20 transition-all">
                                            <Users className="h-6 w-6 text-blue-400" />
                                        </div>
                                        <div className="flex gap-2">
                                            <Button variant="ghost" size="icon" onClick={() => {
                                                setEditingShift(shift);
                                                setIsDialogOpen(true);
                                            }} className="h-10 w-10 text-slate-500 hover:text-white hover:bg-white/5 rounded-xl border border-transparent hover:border-white/10">
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" onClick={() => handleDelete(shift.id)} className="h-10 w-10 text-slate-500 hover:text-rose-400 hover:bg-rose-500/5 rounded-xl border border-transparent hover:border-rose-500/10">
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>

                                    <div>
                                        <h3 className="text-2xl font-black text-white italic uppercase tracking-tight group-hover:text-blue-400 transition-colors">{shift.name}</h3>
                                        <div className="text-[10px] font-black text-slate-600 uppercase tracking-widest mt-1">Shift Identificator</div>
                                    </div>

                                    <div className="flex items-center gap-4 p-4 rounded-2xl bg-black/40 border border-white/5">
                                        <div className="flex flex-col gap-0.5">
                                            <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest italic leading-none">Start</span>
                                            <span className="text-xl font-black text-white font-mono tracking-tighter italic">{shift.start_time.slice(0, 5)}</span>
                                        </div>
                                        <div className="h-8 w-px bg-white/10" />
                                        <div className="flex flex-col gap-0.5">
                                            <span className="text-[9px] font-black text-rose-500 uppercase tracking-widest italic leading-none">End</span>
                                            <span className="text-xl font-black text-white font-mono tracking-tighter italic">{shift.end_time.slice(0, 5)}</span>
                                        </div>
                                    </div>

                                    {shift.description && (
                                        <div className="pt-2 border-t border-white/5">
                                            <p className="text-[11px] text-slate-500 font-medium italic line-clamp-2">
                                                “{shift.description}”
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

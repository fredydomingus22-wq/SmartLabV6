"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Clock, Plus, Edit, Trash2, ArrowLeft,
    Calendar, Timer, Info, MoreHorizontal,
    LayoutGrid, List
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

    return (
        <div className="container py-8 max-w-6xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Premium Header */}
            <div className="glass p-8 rounded-[2rem] border-none shadow-2xl bg-gradient-to-br from-indigo-500/10 via-slate-900/50 to-transparent relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 blur-[100px] -mr-32 -mt-32 rounded-full" />

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
                    <div className="space-y-4">
                        <Link href="/production">
                            <Button variant="ghost" size="sm" className="pl-0 text-slate-400 hover:text-white -ml-2 mb-2 group">
                                <ArrowLeft className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform" />
                                Voltar à Produção
                            </Button>
                        </Link>
                        <div>
                            <h1 className="text-4xl font-black tracking-tight text-white mb-2">Gestão de Turnos</h1>
                            <p className="text-slate-400 font-medium">Configure os períodos de trabalho para o planeamento industrial.</p>
                        </div>
                    </div>

                    <Dialog open={isDialogOpen} onOpenChange={(open) => {
                        setIsDialogOpen(open);
                        if (!open) setEditingShift(null);
                    }}>
                        <DialogTrigger asChild>
                            <Button className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 h-12 rounded-2xl shadow-lg shadow-indigo-500/20 transition-all hover:scale-105 active:scale-95">
                                <Plus className="w-5 h-5 mr-2" />
                                Novo Turno
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="glass border-slate-800 shadow-2xl sm:max-w-[500px]">
                            <DialogHeader>
                                <DialogTitle className="text-2xl font-bold">{editingShift ? "Editar Turno" : "Novo Turno de Produção"}</DialogTitle>
                                <DialogDescription className="text-slate-400">
                                    Defina o horário e nomeação do turno para uso no MES.
                                </DialogDescription>
                            </DialogHeader>
                            <form onSubmit={handleSubmit} className="space-y-6 pt-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name" className="text-xs font-semibold uppercase tracking-wider text-slate-400">Nome do Turno</Label>
                                    <Input
                                        id="name"
                                        name="name"
                                        placeholder="Ex: Manhã, Turno A, 06-14"
                                        defaultValue={editingShift?.name}
                                        className="bg-slate-900/50 border-slate-800 h-12 rounded-xl focus:ring-indigo-500"
                                        required
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="start_time" className="text-xs font-semibold uppercase tracking-wider text-slate-400">Hora de Início</Label>
                                        <Input
                                            id="start_time"
                                            name="start_time"
                                            type="time"
                                            defaultValue={editingShift?.start_time?.slice(0, 5)}
                                            className="bg-slate-900/50 border-slate-800 h-12 rounded-xl"
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="end_time" className="text-xs font-semibold uppercase tracking-wider text-slate-400">Hora de Fim</Label>
                                        <Input
                                            id="end_time"
                                            name="end_time"
                                            type="time"
                                            defaultValue={editingShift?.end_time?.slice(0, 5)}
                                            className="bg-slate-900/50 border-slate-800 h-12 rounded-xl"
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="description" className="text-xs font-semibold uppercase tracking-wider text-slate-400">Descrição (Opcional)</Label>
                                    <Textarea
                                        id="description"
                                        name="description"
                                        placeholder="Notas adicionais sobre o turno..."
                                        defaultValue={editingShift?.description}
                                        className="bg-slate-900/50 border-slate-800 rounded-xl min-h-[100px]"
                                    />
                                </div>
                                <div className="flex justify-end gap-3 pt-4">
                                    <Button type="button" variant="ghost" onClick={() => setIsDialogOpen(false)} className="rounded-xl px-6 h-12">Cancelar</Button>
                                    <Button type="submit" disabled={formLoading} className="bg-indigo-600 hover:bg-indigo-500 rounded-xl px-8 h-12">
                                        {formLoading ? "A processar..." : (editingShift ? "Gravar Alterações" : "Criar Turno")}
                                    </Button>
                                </div>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {/* List Section */}
            <div className="grid gap-6">
                {loading ? (
                    <div className="flex items-center justify-center p-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500" />
                    </div>
                ) : shifts.length === 0 ? (
                    <div className="glass p-20 text-center rounded-[2rem] border-dashed border-2 border-slate-800/50">
                        <Clock className="w-16 h-16 text-slate-700 mx-auto mb-6" />
                        <h3 className="text-xl font-bold text-slate-400 mb-2">Nenhum turno configurado</h3>
                        <p className="text-slate-600 max-w-sm mx-auto">Adicione turnos para permitir o agendamento de lotes de produção.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {shifts.map((shift) => (
                            <Card key={shift.id} className="glass border-none shadow-xl hover:shadow-indigo-500/5 transition-all group overflow-hidden rounded-[2rem]">
                                <CardHeader className="pb-4">
                                    <div className="flex justify-between items-start">
                                        <div className="p-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 group-hover:bg-indigo-500/20 transition-colors">
                                            <Clock className="w-6 h-6 text-indigo-400" />
                                        </div>
                                        <div className="flex gap-1">
                                            <Button variant="ghost" size="icon" onClick={() => {
                                                setEditingShift(shift);
                                                setIsDialogOpen(true);
                                            }} className="h-10 w-10 text-slate-500 hover:text-white hover:bg-indigo-500/20 rounded-xl">
                                                <Edit className="w-4 h-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" onClick={() => handleDelete(shift.id)} className="h-10 w-10 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl">
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>
                                    <CardTitle className="text-xl font-bold text-white mt-4">{shift.name}</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="flex items-center gap-4 py-3 border-y border-slate-800/50">
                                        <div className="flex items-center gap-2">
                                            <Timer className="w-4 h-4 text-emerald-400" />
                                            <span className="text-lg font-mono font-bold text-emerald-400">{shift.start_time.slice(0, 5)}</span>
                                        </div>
                                        <div className="text-slate-700 font-black">→</div>
                                        <div className="flex items-center gap-2">
                                            <Timer className="w-4 h-4 text-rose-400" />
                                            <span className="text-lg font-mono font-bold text-rose-400">{shift.end_time.slice(0, 5)}</span>
                                        </div>
                                    </div>
                                    {shift.description && (
                                        <p className="text-sm text-slate-400 line-clamp-2 italic">“{shift.description}”</p>
                                    )}
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

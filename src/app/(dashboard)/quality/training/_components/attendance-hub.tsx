"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, X, Clock, Users, FileDown, Save, Loader2 } from "lucide-react";
import { bulkLogAttendanceAction } from "@/app/actions/training";
import { generateAttendancePdf } from "@/app/actions/pdf-generator";
import { format } from "date-fns";
import { toast } from "sonner";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

interface AttendanceHubProps {
    employees: any[];
    teams: any[];
    shifts: any[];
}

export function AttendanceHub({ employees, teams, shifts }: AttendanceHubProps) {
    const [selectedTeam, setSelectedTeam] = useState<string>("all");
    const [selectedShift, setSelectedShift] = useState<string>("all");
    const [attendanceData, setAttendanceData] = useState<Record<string, 'present' | 'late' | 'absent'>>({});
    const [loading, setLoading] = useState(false);

    const filteredEmployees = employees.filter(emp => {
        const teamMatch = selectedTeam === "all" || emp.team_id === selectedTeam;
        return teamMatch;
    });

    const handleStatusChange = (empId: string, status: 'present' | 'late' | 'absent') => {
        setAttendanceData(prev => ({ ...prev, [empId]: status }));
    };

    const handleBulkMark = (status: 'present' | 'absent') => {
        const newData = { ...attendanceData };
        filteredEmployees.forEach(emp => {
            newData[emp.id] = status;
        });
        setAttendanceData(newData);
    };

    const handleSave = async () => {
        const entries = Object.entries(attendanceData).map(([employee_id, status]) => ({
            employee_id,
            status
        }));

        if (entries.length === 0) {
            toast.error("Nenhum registo selecionado");
            return;
        }

        setLoading(true);
        const result = await bulkLogAttendanceAction(entries);
        if (result.success) {
            toast.success(result.message);
            setAttendanceData({});
        } else {
            toast.error(result.error);
        }
        setLoading(false);
    };

    const handleExportPdf = async () => {
        if (selectedTeam === "all") {
            toast.error("Selecione uma equipa específica para gerar o relatório.");
            return;
        }

        toast.info("A gerar PDF de assiduidade...");
        const team = teams.find(t => t.id === selectedTeam);
        const shift = shifts.find(s => s.id === selectedShift);

        const result = await generateAttendancePdf({
            date: format(new Date(), "yyyy-MM-dd"),
            teamId: selectedTeam,
            shiftId: selectedShift,
            teamName: team?.name || "Equipa",
            shiftName: shift?.name || "Turno"
        });

        if (result.success && result.pdf) {
            const linkSource = `data:application/pdf;base64,${result.pdf}`;
            const downloadLink = document.createElement("a");
            downloadLink.href = linkSource;
            downloadLink.download = result.filename || "attendance.pdf";
            downloadLink.click();
            toast.success("Relatório gerado com sucesso.");
        } else {
            toast.error(result.message);
        }
    };

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase tracking-widest text-slate-500">Filtrar por Equipa</Label>
                    <Select value={selectedTeam} onValueChange={setSelectedTeam}>
                        <SelectTrigger className="glass border-slate-800">
                            <SelectValue placeholder="Todas as Equipas" />
                        </SelectTrigger>
                        <SelectContent className="glass border-slate-800">
                            <SelectItem value="all">Todas as Equipas</SelectItem>
                            {teams.map(t => (
                                <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase tracking-widest text-slate-500">Filtrar por Turno</Label>
                    <Select value={selectedShift} onValueChange={setSelectedShift}>
                        <SelectTrigger className="glass border-slate-800">
                            <SelectValue placeholder="Todos os Turnos" />
                        </SelectTrigger>
                        <SelectContent className="glass border-slate-800">
                            <SelectItem value="all">Todos os Turnos</SelectItem>
                            {shifts.map(s => (
                                <SelectItem key={s.id} value={s.id}>{s.name} ({s.start_time})</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleBulkMark('present')} className="flex-1 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/10">
                        Marcar Tudo OK
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleBulkMark('absent')} className="flex-1 border-rose-500/20 text-rose-400 hover:bg-rose-500/10">
                        Marcar Tudo Falta
                    </Button>
                </div>
                <Button onClick={handleExportPdf} variant="secondary" className="bg-slate-800 border-none hover:bg-slate-700">
                    <FileDown className="mr-2 h-4 w-4" />
                    PDF de Presença
                </Button>
            </div>

            <Card className="glass border-slate-800 overflow-hidden">
                <CardHeader className="bg-slate-900/40 border-b border-slate-800">
                    <div className="flex justify-between items-center">
                        <div>
                            <CardTitle className="text-lg">Registo Diário de Assiduidade</CardTitle>
                            <CardDescription>Configure a presença dos funcionários para o turno atual.</CardDescription>
                        </div>
                        <Badge variant="outline" className="border-emerald-500/30 text-emerald-400">
                            {filteredEmployees.length} Funcionários
                        </Badge>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="divide-y divide-slate-800/50">
                        {filteredEmployees.map(emp => (
                            <div key={emp.id} className="p-4 flex items-center justify-between hover:bg-slate-800/20 transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-full bg-slate-800">
                                        <Users className="h-4 w-4 text-slate-400" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-slate-100">{emp.full_name}</p>
                                        <p className="text-[10px] text-slate-500 uppercase tracking-tighter">{emp.position} • {emp.team?.name || "Sem Equipa"}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <StatusButton
                                        active={attendanceData[emp.id] === 'present'}
                                        onClick={() => handleStatusChange(emp.id, 'present')}
                                        icon={<Check className="h-4 w-4" />}
                                        label="Presente"
                                        color="emerald"
                                    />
                                    <StatusButton
                                        active={attendanceData[emp.id] === 'late'}
                                        onClick={() => handleStatusChange(emp.id, 'late')}
                                        icon={<Clock className="h-4 w-4" />}
                                        label="Atraso"
                                        color="amber"
                                    />
                                    <StatusButton
                                        active={attendanceData[emp.id] === 'absent'}
                                        onClick={() => handleStatusChange(emp.id, 'absent')}
                                        icon={<X className="h-4 w-4" />}
                                        label="Falta"
                                        color="rose"
                                    />
                                </div>
                            </div>
                        ))}
                        {filteredEmployees.length === 0 && (
                            <div className="p-12 text-center text-slate-500 italic">
                                Nenhum funcionário encontrado com os filtros selecionados.
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            <div className="flex justify-end">
                <Button
                    onClick={handleSave}
                    disabled={loading || Object.keys(attendanceData).length === 0}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white min-w-[200px]"
                >
                    {loading ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                        <Save className="mr-2 h-4 w-4" />
                    )}
                    Guardar Registos
                </Button>
            </div>
        </div>
    );
}

function StatusButton({ active, onClick, icon, label, color }: any) {
    const colors = {
        emerald: active ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/50" : "bg-slate-900/50 border-slate-800 text-slate-500 hover:bg-emerald-500/5 hover:text-emerald-400",
        amber: active ? "bg-amber-500/20 text-amber-400 border-amber-500/50" : "bg-slate-900/50 border-slate-800 text-slate-500 hover:bg-amber-500/5 hover:text-amber-400",
        rose: active ? "bg-rose-500/20 text-rose-400 border-rose-500/50" : "bg-slate-900/50 border-slate-800 text-slate-500 hover:bg-rose-500/5 hover:text-rose-400",
    };

    return (
        <Button
            variant="outline"
            size="sm"
            onClick={onClick}
            className={`h-9 items-center gap-2 border transition-all ${colors[color as keyof typeof colors]}`}
        >
            {icon}
            <span className="hidden sm:inline">{label}</span>
        </Button>
    );
}

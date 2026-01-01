import { createClient } from "@/lib/supabase/server";
import { getSafeUser } from "@/lib/auth.server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Settings2,
    Calendar,
    CheckCircle2,
    AlertTriangle,
    Clock,
    ArrowLeft,
    Plus,
    FileCheck
} from "lucide-react";
import Link from "next/link";
import { format, differenceInDays } from "date-fns";
import { pt } from "date-fns/locale";
import { RegisterCalibrationDialog } from "../../lab/assets/_components/register-calibration-dialog";

export const dynamic = "force-dynamic";

interface Calibration {
    id: string;
    asset_name: string;
    asset_code: string;
    next_calibration_date: string;
    last_calibration_date: string | null;
    status: string;
}

export default async function CalibrationsPage() {
    const supabase = await createClient();
    const user = await getSafeUser();
    const today = new Date();

    // Fetch all lab assets with calibration info
    const { data: assets } = await supabase
        .from("lab_assets")
        .select("id, name, code, next_calibration_date, last_calibration_date, status")
        .eq("organization_id", user.organization_id)
        .not("next_calibration_date", "is", null)
        .order("next_calibration_date");

    const calibrations: Calibration[] = (assets || []).map(a => ({
        id: a.id,
        asset_name: a.name,
        asset_code: a.code,
        next_calibration_date: a.next_calibration_date,
        last_calibration_date: a.last_calibration_date,
        status: a.status,
    }));

    const overdue = calibrations.filter(c => differenceInDays(new Date(c.next_calibration_date), today) < 0);
    const upcoming = calibrations.filter(c => {
        const days = differenceInDays(new Date(c.next_calibration_date), today);
        return days >= 0 && days <= 30;
    });
    const scheduled = calibrations.filter(c => differenceInDays(new Date(c.next_calibration_date), today) > 30);

    return (
        <div className="container py-8 space-y-8 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Link href="/assets">
                        <Button variant="ghost" size="icon" className="text-slate-400 rounded-full hover:bg-slate-900">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                    </Link>
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline" className="text-[10px] uppercase tracking-widest bg-emerald-500/5 text-emerald-400 border-emerald-500/20">
                                ISO 17025
                            </Badge>
                        </div>
                        <h1 className="text-3xl font-black tracking-tight text-white flex items-center gap-3">
                            <Settings2 className="h-8 w-8 text-emerald-500" />
                            Gestão de Calibrações
                        </h1>
                        <p className="text-slate-400 text-sm font-medium">
                            Acompanhamento de calibrações e verificações metrológicas.
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <RegisterCalibrationDialog assets={calibrations.map(c => ({ id: c.id, name: c.asset_name, code: c.asset_code }))}>
                        <Button className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold h-12 px-8 rounded-xl shadow-lg shadow-emerald-500/20 active:scale-95 transition-all">
                            <Plus className="h-4 w-4 mr-2" />
                            Registar Calibração
                        </Button>
                    </RegisterCalibrationDialog>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-6">
                <Card className="bg-rose-900/20 border-rose-800">
                    <CardContent className="p-6 flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-rose-500/20 text-rose-400">
                            <AlertTriangle className="h-6 w-6" />
                        </div>
                        <div>
                            <h3 className="text-2xl font-black text-white">{overdue.length}</h3>
                            <p className="text-[10px] font-bold text-rose-400 uppercase tracking-widest">Vencidas</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-amber-900/20 border-amber-800">
                    <CardContent className="p-6 flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-amber-500/20 text-amber-400">
                            <Clock className="h-6 w-6" />
                        </div>
                        <div>
                            <h3 className="text-2xl font-black text-white">{upcoming.length}</h3>
                            <p className="text-[10px] font-bold text-amber-400 uppercase tracking-widest">Próx. 30 Dias</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-emerald-900/20 border-emerald-800">
                    <CardContent className="p-6 flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-emerald-500/20 text-emerald-400">
                            <CheckCircle2 className="h-6 w-6" />
                        </div>
                        <div>
                            <h3 className="text-2xl font-black text-white">{scheduled.length}</h3>
                            <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">Agendadas</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Calibration List */}
            <Card className="bg-slate-950/40 border-slate-800">
                <CardHeader>
                    <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
                        <FileCheck className="h-5 w-5 text-emerald-400" />
                        Calendário de Calibrações
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-800 bg-slate-900/20">
                                    <th className="p-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Instrumento</th>
                                    <th className="p-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Código</th>
                                    <th className="p-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center">Última Calibração</th>
                                    <th className="p-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center">Próxima Calibração</th>
                                    <th className="p-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center">Estado</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/50">
                                {calibrations.map((cal) => {
                                    const days = differenceInDays(new Date(cal.next_calibration_date), today);
                                    const isOverdue = days < 0;
                                    const isNear = days >= 0 && days <= 30;

                                    return (
                                        <tr key={cal.id} className="hover:bg-slate-900/20">
                                            <td className="p-4">
                                                <Link href={`/assets/instruments/${cal.id}`} className="font-bold text-white hover:text-emerald-400">
                                                    {cal.asset_name}
                                                </Link>
                                            </td>
                                            <td className="p-4">
                                                <span className="font-mono text-xs text-slate-500">{cal.asset_code}</span>
                                            </td>
                                            <td className="p-4 text-center text-xs text-slate-400">
                                                {cal.last_calibration_date ? format(new Date(cal.last_calibration_date), "dd/MM/yyyy") : "N/A"}
                                            </td>
                                            <td className="p-4 text-center">
                                                <span className={`text-xs font-bold ${isOverdue ? 'text-rose-400' : isNear ? 'text-amber-400' : 'text-slate-300'}`}>
                                                    {format(new Date(cal.next_calibration_date), "dd/MM/yyyy")}
                                                </span>
                                            </td>
                                            <td className="p-4 text-center">
                                                <Badge className={`text-[9px] uppercase ${isOverdue ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : isNear ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'}`}>
                                                    {isOverdue ? 'Vencida' : isNear ? `${days}d restantes` : 'Em Dia'}
                                                </Badge>
                                            </td>
                                        </tr>
                                    );
                                })}
                                {calibrations.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="p-12 text-center text-slate-500 italic">
                                            Nenhuma calibração agendada.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

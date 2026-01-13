import { createClient } from "@/lib/supabase/server";
import { getSafeUser } from "@/lib/auth.server";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Settings2,
    Calendar,
    CheckCircle2,
    AlertTriangle,
    Clock,
    Plus,
    FileCheck
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
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
        <div className="space-y-10 pb-20">
            <PageHeader
                variant="emerald"
                icon={<Settings2 className="h-4 w-4" />}
                overline="ISO 17025 • Metrology Control"
                title="Gestão de Calibrações"
                description="Acompanhamento de calibrações e verificações metrológicas para instrumentos de laboratório."
                backHref="/assets"
                actions={
                    <RegisterCalibrationDialog assets={calibrations.map(c => ({ id: c.id, name: c.asset_name, code: c.asset_code }))}>
                        <Button className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold h-9 shadow-lg shadow-emerald-500/20 px-6">
                            <Plus className="h-4 w-4 mr-2" />
                            Registar Calibração
                        </Button>
                    </RegisterCalibrationDialog>
                }
            />

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="bg-card border-slate-800 shadow-xl relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-1 h-full bg-rose-500" />
                    <CardContent className="p-6 flex items-center gap-5">
                        <div className="p-3.5 rounded-2xl bg-rose-500/10 text-rose-400 border border-rose-500/20 group-hover:scale-110 transition-transform">
                            <AlertTriangle className="h-5 w-5" />
                        </div>
                        <div>
                            <h3 className="text-3xl font-black text-white tracking-tighter">{overdue.length}</h3>
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Vencidas</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-card border-slate-800 shadow-xl relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-1 h-full bg-amber-500" />
                    <CardContent className="p-6 flex items-center gap-5">
                        <div className="p-3.5 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20 group-hover:scale-110 transition-transform">
                            <Clock className="h-5 w-5" />
                        </div>
                        <div>
                            <h3 className="text-3xl font-black text-white tracking-tighter">{upcoming.length}</h3>
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Próx. 30 Dias</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-card border-slate-800 shadow-xl relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500" />
                    <CardContent className="p-6 flex items-center gap-5">
                        <div className="p-3.5 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 group-hover:scale-110 transition-transform">
                            <CheckCircle2 className="h-5 w-5" />
                        </div>
                        <div>
                            <h3 className="text-3xl font-black text-white tracking-tighter">{scheduled.length}</h3>
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Agendadas</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Calibration List */}
            <Card className="bg-card border-slate-800 shadow-2xl rounded-2xl overflow-hidden">
                <CardHeader className="border-b border-slate-800 bg-slate-900/20 py-5">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-sm font-black text-white flex items-center gap-3 uppercase tracking-[0.15em]">
                            <FileCheck className="h-5 w-5 text-emerald-500" />
                            Calendário de Calibrações
                        </CardTitle>
                        <Badge variant="outline" className="border-slate-800 text-slate-500 font-mono text-[10px]">
                            {calibrations.length} Instrumentos
                        </Badge>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-800 bg-slate-900/50">
                                    <th className="py-4 px-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] italic">Instrumento</th>
                                    <th className="py-4 px-4 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] italic text-center">Código</th>
                                    <th className="py-4 px-4 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] italic text-center">Última Calibração</th>
                                    <th className="py-4 px-4 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] italic text-center">Próxima Calibração</th>
                                    <th className="py-4 px-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] italic text-right">Estado</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/40">
                                {calibrations.map((cal) => {
                                    const days = differenceInDays(new Date(cal.next_calibration_date), today);
                                    const isOverdue = days < 0;
                                    const isNear = days >= 0 && days <= 30;

                                    return (
                                        <tr key={cal.id} className="group hover:bg-slate-900/40 transition-all border-b border-slate-800/30 last:border-0">
                                            <td className="py-3 px-6">
                                                <Link href={`/assets/instruments/${cal.id}`} className="font-black text-sm text-slate-100 group-hover:text-emerald-400 transition-colors italic tracking-tight">
                                                    {cal.asset_name}
                                                </Link>
                                            </td>
                                            <td className="py-3 px-4 text-center">
                                                <span className="font-mono text-[11px] bg-slate-950/50 text-slate-400 px-2 py-1 rounded border border-slate-800 font-black">
                                                    {cal.asset_code}
                                                </span>
                                            </td>
                                            <td className="py-3 px-4 text-center">
                                                <div className="flex flex-col items-center">
                                                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-tight">
                                                        {cal.last_calibration_date ? format(new Date(cal.last_calibration_date), "dd/MM/yyyy") : "— —"}
                                                    </span>
                                                    {cal.last_calibration_date && (
                                                        <span className="text-[8px] font-black text-slate-700 uppercase tracking-widest mt-0.5">Executada</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="py-3 px-4 text-center">
                                                <div className="flex flex-col items-center">
                                                    <span className={cn(
                                                        "text-[11px] font-black tracking-tight px-2 py-0.5 rounded-md border",
                                                        isOverdue ? "text-rose-400 bg-rose-500/5 border-rose-500/10" :
                                                            isNear ? "text-amber-400 bg-amber-500/5 border-amber-500/10" :
                                                                "text-emerald-400 bg-emerald-500/5 border-emerald-500/10"
                                                    )}>
                                                        {format(new Date(cal.next_calibration_date), "dd/MM/yyyy")}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="py-3 px-6 text-right">
                                                <Badge className={cn(
                                                    "px-3 py-1 rounded-xl font-black uppercase tracking-tighter text-[10px] border shadow-inner",
                                                    isOverdue ? "bg-rose-500/10 text-rose-400 border-rose-500/20" :
                                                        isNear ? "bg-amber-500/10 text-amber-400 border-amber-500/20" :
                                                            "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                                )}>
                                                    {isOverdue ? 'VENCIDA' : isNear ? `${days}d restantes` : 'CONCORDE'}
                                                </Badge>
                                            </td>
                                        </tr>
                                    );
                                })}
                                {calibrations.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="py-20 text-center">
                                            <div className="flex flex-col items-center gap-4">
                                                <div className="h-16 w-16 bg-slate-900/50 rounded-full flex items-center justify-center border border-dashed border-slate-700">
                                                    <Clock className="h-8 w-8 text-slate-700" />
                                                </div>
                                                <p className="text-slate-500 font-black uppercase tracking-[0.2em] text-[11px]">
                                                    Nenhuma calibração indexada no nó atual
                                                </p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    <div className="p-4 bg-slate-950/20 border-t border-slate-800">
                        <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-700 text-center italic">
                            Metrology Asset Control System • ISO 17025 Compliance
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

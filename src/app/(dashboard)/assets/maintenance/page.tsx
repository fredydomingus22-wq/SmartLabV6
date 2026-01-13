import { createClient } from "@/lib/supabase/server";
import { getSafeUser } from "@/lib/auth.server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Wrench,
    Calendar,
    CheckCircle2,
    AlertTriangle,
    Clock,
    Plus
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import Link from "next/link";
import { format, differenceInDays } from "date-fns";
import { pt } from "date-fns/locale";

export const dynamic = "force-dynamic";

interface MaintenanceItem {
    id: string;
    equipment_name: string;
    equipment_code: string;
    next_maintenance_date: string;
    last_maintenance_date: string | null;
    status: string;
}

export default async function MaintenancePage() {
    const supabase = await createClient();
    const user = await getSafeUser();
    const today = new Date();

    // Fetch all process equipment with maintenance info
    const { data: equipment } = await supabase
        .from("process_equipment")
        .select("id, name, code, next_maintenance_date, last_maintenance_date, status")
        .eq("organization_id", user.organization_id)
        .not("next_maintenance_date", "is", null)
        .order("next_maintenance_date");

    const maintenances: MaintenanceItem[] = (equipment || []).map(e => ({
        id: e.id,
        equipment_name: e.name,
        equipment_code: e.code,
        next_maintenance_date: e.next_maintenance_date,
        last_maintenance_date: e.last_maintenance_date,
        status: e.status,
    }));

    const overdue = maintenances.filter(m => differenceInDays(new Date(m.next_maintenance_date), today) < 0);
    const upcoming = maintenances.filter(m => {
        const days = differenceInDays(new Date(m.next_maintenance_date), today);
        return days >= 0 && days <= 30;
    });
    const scheduled = maintenances.filter(m => differenceInDays(new Date(m.next_maintenance_date), today) > 30);

    return (
        <div className="space-y-10 pb-20">
            <PageHeader
                variant="purple"
                icon={<Wrench className="h-4 w-4" />}
                overline="Preventive Maintenance • Site Assets"
                title="Manutenção Preventiva"
                description="Planeamento e histórico de intervenções de manutenção para equipamentos de processo."
                backHref="/assets"
                actions={
                    <Button className="bg-violet-600 hover:bg-violet-500 text-white font-bold h-9">
                        <Plus className="h-4 w-4 mr-2" />
                        Registar Manutenção
                    </Button>
                }
            />

            {/* Stats */}
            <div className="grid grid-cols-3 gap-6">
                <Card className="bg-card border-rose-800 shadow-lg">
                    <CardContent className="p-6 flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
                            <AlertTriangle className="h-5 w-5" />
                        </div>
                        <div>
                            <h3 className="text-2xl font-black text-white">{overdue.length}</h3>
                            <p className="text-[10px] font-bold text-rose-400 uppercase tracking-widest">Atrasadas</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-card border-amber-800 shadow-lg">
                    <CardContent className="p-6 flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                            <Clock className="h-5 w-5" />
                        </div>
                        <div>
                            <h3 className="text-2xl font-black text-white">{upcoming.length}</h3>
                            <p className="text-[10px] font-bold text-amber-400 uppercase tracking-widest">Próx. 30 Dias</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-card border-emerald-800 shadow-lg">
                    <CardContent className="p-6 flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            <CheckCircle2 className="h-5 w-5" />
                        </div>
                        <div>
                            <h3 className="text-2xl font-black text-white">{scheduled.length}</h3>
                            <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">Agendadas</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Maintenance List */}
            <Card className="bg-card border-slate-800 shadow-xl overflow-hidden">
                <CardHeader className="border-b border-slate-800 pb-4">
                    <CardTitle className="text-lg font-bold text-white flex items-center gap-2 uppercase tracking-widest">
                        <Wrench className="h-5 w-5 text-violet-400" />
                        Plano de Manutenção
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-800 bg-slate-900/40">
                                    <th className="p-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Equipamento</th>
                                    <th className="p-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center">Código</th>
                                    <th className="p-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center">Última Manutenção</th>
                                    <th className="p-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center">Próxima Manutenção</th>
                                    <th className="p-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-right px-8">Estado</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/50">
                                {maintenances.map((maint) => {
                                    const days = differenceInDays(new Date(maint.next_maintenance_date), today);
                                    const isOverdue = days < 0;
                                    const isNear = days >= 0 && days <= 30;

                                    return (
                                        <tr key={maint.id} className="hover:bg-slate-900/20">
                                            <td className="p-4">
                                                <Link href={`/assets/process-equipment/${maint.id}`} className="font-bold text-white hover:text-violet-400">
                                                    {maint.equipment_name}
                                                </Link>
                                            </td>
                                            <td className="p-4">
                                                <span className="font-mono text-xs text-slate-500">{maint.equipment_code}</span>
                                            </td>
                                            <td className="p-4 text-center text-xs text-slate-400">
                                                {maint.last_maintenance_date ? format(new Date(maint.last_maintenance_date), "dd/MM/yyyy") : "N/A"}
                                            </td>
                                            <td className="p-4 text-center">
                                                <span className={`text-xs font-bold ${isOverdue ? 'text-rose-400' : isNear ? 'text-amber-400' : 'text-slate-300'}`}>
                                                    {format(new Date(maint.next_maintenance_date), "dd/MM/yyyy")}
                                                </span>
                                            </td>
                                            <td className="p-4 text-right px-8">
                                                <Badge className={`text-[9px] uppercase font-bold ${isOverdue ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : isNear ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'}`}>
                                                    {isOverdue ? 'ATRASADA' : isNear ? `${days}d restantes` : 'EM DIA'}
                                                </Badge>
                                            </td>
                                        </tr>
                                    );
                                })}
                                {maintenances.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="p-12 text-center text-slate-500 italic">
                                            Nenhuma manutenção agendada.
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

import { createClient } from "@/lib/supabase/server";
import { getSafeUser } from "@/lib/auth.server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Wrench,
    FlaskConical,
    Factory,
    Calendar,
    AlertTriangle,
    CheckCircle2,
    Clock,
    ArrowRight,
    Settings2
} from "lucide-react";
import Link from "next/link";
import { differenceInDays, format } from "date-fns";
import { pt } from "date-fns/locale";

export const dynamic = "force-dynamic";

interface AssetStats {
    totalInstruments: number;
    totalProcessEquipment: number;
    calibrationsDue: number;
    maintenanceDue: number;
    outOfService: number;
}

async function getAssetStats(): Promise<AssetStats> {
    const supabase = await createClient();
    const user = await getSafeUser();

    const today = new Date();
    const thirtyDays = new Date();
    thirtyDays.setDate(thirtyDays.getDate() + 30);

    // Lab Instruments
    const { count: instrumentCount } = await supabase
        .from("lab_assets")
        .select("*", { count: "exact", head: true })
        .eq("organization_id", user.organization_id);

    // Process Equipment
    const { count: processCount } = await supabase
        .from("process_equipment")
        .select("*", { count: "exact", head: true })
        .eq("organization_id", user.organization_id);

    // Calibrations due in next 30 days
    const { count: calibrationsDue } = await supabase
        .from("lab_assets")
        .select("*", { count: "exact", head: true })
        .eq("organization_id", user.organization_id)
        .lte("next_calibration_date", thirtyDays.toISOString())
        .in("status", ["active", "in_use"]);

    // Maintenance due in next 30 days
    const { count: maintenanceDue } = await supabase
        .from("process_equipment")
        .select("*", { count: "exact", head: true })
        .eq("organization_id", user.organization_id)
        .lte("next_maintenance_date", thirtyDays.toISOString())
        .in("status", ["active"]);

    // Out of service count
    const { count: outOfServiceLab } = await supabase
        .from("lab_assets")
        .select("*", { count: "exact", head: true })
        .eq("organization_id", user.organization_id)
        .in("status", ["out_of_calibration", "maintenance", "decommissioned"]);

    const { count: outOfServiceProcess } = await supabase
        .from("process_equipment")
        .select("*", { count: "exact", head: true })
        .eq("organization_id", user.organization_id)
        .in("status", ["maintenance", "decommissioned"]);

    return {
        totalInstruments: instrumentCount || 0,
        totalProcessEquipment: processCount || 0,
        calibrationsDue: calibrationsDue || 0,
        maintenanceDue: maintenanceDue || 0,
        outOfService: (outOfServiceLab || 0) + (outOfServiceProcess || 0),
    };
}

export default async function AssetsPage() {
    const stats = await getAssetStats();

    const quickLinks = [
        {
            title: "Instrumentos Lab",
            description: "Balanças, pH-metros, refratómetros e outros instrumentos de medição",
            href: "/assets/instruments",
            icon: FlaskConical,
            count: stats.totalInstruments,
            color: "text-blue-400",
            bg: "bg-blue-500/10",
        },
        {
            title: "Equipamentos Prod.",
            description: "Pasteurizadores, homogeneizadores, linhas de enchimento",
            href: "/assets/process-equipment",
            icon: Factory,
            count: stats.totalProcessEquipment,
            color: "text-amber-400",
            bg: "bg-amber-500/10",
        },
        {
            title: "Calibrações",
            description: "Gestão de calibrações e verificações metrológicas",
            href: "/assets/calibrations",
            icon: Settings2,
            count: stats.calibrationsDue,
            color: "text-emerald-400",
            bg: "bg-emerald-500/10",
            alert: stats.calibrationsDue > 0,
        },
        {
            title: "Manutenção Preventiva",
            description: "Planos de manutenção e histórico de intervenções",
            href: "/assets/maintenance",
            icon: Wrench,
            count: stats.maintenanceDue,
            color: "text-violet-400",
            bg: "bg-violet-500/10",
            alert: stats.maintenanceDue > 0,
        },
    ];

    return (
        <div className="container py-8 space-y-8 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="text-[10px] uppercase tracking-widest bg-violet-500/5 text-violet-400 border-violet-500/20">
                            Asset Control
                        </Badge>
                    </div>
                    <h1 className="text-3xl font-black tracking-tight text-white flex items-center gap-3">
                        <Wrench className="h-8 w-8 text-violet-500" />
                        Gestão de Ativos
                    </h1>
                    <p className="text-slate-400 text-sm font-medium">
                        Monitorização centralizada de instrumentos, equipamentos, calibrações e manutenção.
                    </p>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: "Instrumentos Lab", value: stats.totalInstruments, icon: FlaskConical, color: "text-blue-400", bg: "bg-blue-500/10" },
                    { label: "Equip. Processo", value: stats.totalProcessEquipment, icon: Factory, color: "text-amber-400", bg: "bg-amber-500/10" },
                    { label: "Calibrações Pendentes", value: stats.calibrationsDue, icon: Calendar, color: stats.calibrationsDue > 0 ? "text-rose-400" : "text-emerald-400", bg: stats.calibrationsDue > 0 ? "bg-rose-500/10" : "bg-emerald-500/10" },
                    { label: "Fora de Serviço", value: stats.outOfService, icon: AlertTriangle, color: stats.outOfService > 0 ? "text-amber-400" : "text-slate-400", bg: stats.outOfService > 0 ? "bg-amber-500/10" : "bg-slate-500/10" },
                ].map((stat, i) => (
                    <Card key={i} className="bg-slate-900/40 border-slate-800 shadow-xl">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between mb-2">
                                <div className={`p-2 rounded-xl ${stat.bg} ${stat.color}`}>
                                    <stat.icon className="h-5 w-5" />
                                </div>
                            </div>
                            <h3 className="text-2xl font-black text-white">{stat.value}</h3>
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">{stat.label}</p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Quick Links */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {quickLinks.map((link) => (
                    <Link key={link.href} href={link.href}>
                        <Card className="bg-slate-950/40 border-slate-800 hover:border-slate-700 transition-all group cursor-pointer h-full">
                            <CardContent className="p-6">
                                <div className="flex items-start gap-4">
                                    <div className={`p-3 rounded-2xl ${link.bg} ${link.color} group-hover:scale-110 transition-transform`}>
                                        <link.icon className="h-6 w-6" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-bold text-white group-hover:text-violet-400 transition-colors">{link.title}</h3>
                                            {link.alert && (
                                                <Badge className="bg-rose-500/10 text-rose-400 border-rose-500/20 text-[9px]">
                                                    {link.count} pendente{link.count !== 1 ? "s" : ""}
                                                </Badge>
                                            )}
                                        </div>
                                        <p className="text-sm text-slate-400 mt-1">{link.description}</p>
                                        <div className="flex items-center gap-2 mt-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                            <span>{link.count} registos</span>
                                            <ArrowRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </Link>
                ))}
            </div>

            {/* Status Overview */}
            <Card className="bg-slate-900/40 border-slate-800">
                <CardHeader>
                    <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
                        <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                        Estado do Sistema de Ativos
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="flex items-center gap-3 p-4 rounded-xl bg-slate-950/50 border border-slate-800">
                            <div className={`p-2 rounded-full ${stats.calibrationsDue === 0 ? "bg-emerald-500/20 text-emerald-400" : "bg-amber-500/20 text-amber-400"}`}>
                                {stats.calibrationsDue === 0 ? <CheckCircle2 className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
                            </div>
                            <div>
                                <p className="text-sm font-bold text-white">
                                    {stats.calibrationsDue === 0 ? "Calibrações em Dia" : `${stats.calibrationsDue} Calibraçõe(s) Pendente(s)`}
                                </p>
                                <p className="text-[10px] text-slate-500">Próximos 30 dias</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 p-4 rounded-xl bg-slate-950/50 border border-slate-800">
                            <div className={`p-2 rounded-full ${stats.maintenanceDue === 0 ? "bg-emerald-500/20 text-emerald-400" : "bg-amber-500/20 text-amber-400"}`}>
                                {stats.maintenanceDue === 0 ? <CheckCircle2 className="h-4 w-4" /> : <Wrench className="h-4 w-4" />}
                            </div>
                            <div>
                                <p className="text-sm font-bold text-white">
                                    {stats.maintenanceDue === 0 ? "Manutenções em Dia" : `${stats.maintenanceDue} Manutenção(ões) Pendente(s)`}
                                </p>
                                <p className="text-[10px] text-slate-500">Próximos 30 dias</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 p-4 rounded-xl bg-slate-950/50 border border-slate-800">
                            <div className={`p-2 rounded-full ${stats.outOfService === 0 ? "bg-emerald-500/20 text-emerald-400" : "bg-rose-500/20 text-rose-400"}`}>
                                {stats.outOfService === 0 ? <CheckCircle2 className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
                            </div>
                            <div>
                                <p className="text-sm font-bold text-white">
                                    {stats.outOfService === 0 ? "Todos Operacionais" : `${stats.outOfService} Ativo(s) Fora de Serviço`}
                                </p>
                                <p className="text-[10px] text-slate-500">Requer atenção</p>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

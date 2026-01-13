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
import { PageHeader } from "@/components/layout/page-header";
import { KPISparkCard } from "@/components/ui/kpi-spark-card";

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
            bg: "bg-blue-500/10 border-blue-500/20",
        },
        {
            title: "Equipamentos Prod.",
            description: "Pasteurizadores, homogeneizadores, linhas de enchimento",
            href: "/assets/process-equipment",
            icon: Factory,
            count: stats.totalProcessEquipment,
            color: "text-amber-400",
            bg: "bg-amber-500/10 border-amber-500/20",
        },
        {
            title: "Calibrações",
            description: "Gestão de calibrações e verificações metrológicas",
            href: "/assets/calibrations",
            icon: Settings2,
            count: stats.calibrationsDue,
            color: "text-emerald-400",
            bg: "bg-emerald-500/10 border-emerald-500/20",
            alert: stats.calibrationsDue > 0,
        },
        {
            title: "Manutenção Preventiva",
            description: "Planos de manutenção e histórico de intervenções",
            href: "/assets/maintenance",
            icon: Wrench,
            count: stats.maintenanceDue,
            color: "text-violet-400",
            bg: "bg-violet-500/10 border-violet-500/20",
            alert: stats.maintenanceDue > 0,
        },
    ];

    return (
        <div className="space-y-10 pb-20">
            <PageHeader
                variant="purple"
                icon={<Wrench className="h-4 w-4" />}
                overline="Maintenance Intelligence • Site Assets"
                title="Gestão de Ativos"
                description="Monitorização centralizada de instrumentos, equipamentos, calibrações e manutenção."
            />

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <KPISparkCard
                    variant="blue"
                    title="Instrumentos Lab"
                    value={stats.totalInstruments.toString().padStart(3, '0')}
                    description="Registrados no site"
                    icon={<FlaskConical className="h-4 w-4" />}
                    data={Array.from({ length: 7 }, () => ({ value: Math.floor(Math.random() * 5) + 10 }))}
                />
                <KPISparkCard
                    variant="amber"
                    title="Equip. Processo"
                    value={stats.totalProcessEquipment.toString().padStart(3, '0')}
                    description="Ativos de produção"
                    icon={<Factory className="h-4 w-4" />}
                    data={Array.from({ length: 7 }, () => ({ value: Math.floor(Math.random() * 5) + 5 }))}
                />
                <KPISparkCard
                    variant={stats.calibrationsDue > 0 ? "destructive" : "emerald"}
                    title="Calibrações"
                    value={stats.calibrationsDue.toString().padStart(3, '0')}
                    description="Próximos 30 dias"
                    icon={<Calendar className="h-4 w-4" />}
                    data={Array.from({ length: 7 }, () => ({ value: Math.floor(Math.random() * 10) }))}
                />
                <KPISparkCard
                    variant={stats.outOfService > 0 ? "amber" : "blue"}
                    title="Fora de Serviço"
                    value={stats.outOfService.toString().padStart(3, '0')}
                    description="Requer atenção"
                    icon={<AlertTriangle className="h-4 w-4" />}
                    data={Array.from({ length: 7 }, () => ({ value: Math.floor(Math.random() * 3) }))}
                />
            </div>

            {/* Quick Links */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {quickLinks.map((link) => (
                    <Link key={link.href} href={link.href}>
                        <Card className="bg-card border-slate-800 hover:border-slate-700 transition-all group cursor-pointer h-full">
                            <CardContent className="p-6">
                                <div className="flex items-start gap-4">
                                    <div className={`p-3 rounded-2xl ${link.bg} ${link.color} group-hover:scale-110 transition-transform shadow-inner border`}>
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
            <Card className="bg-card border-slate-800">
                <CardHeader>
                    <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
                        <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                        Estado do Sistema de Ativos
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="flex items-center gap-3 p-4 rounded-xl bg-slate-950/20 border border-slate-800">
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
                        <div className="flex items-center gap-3 p-4 rounded-xl bg-slate-950/20 border border-slate-800">
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
                        <div className="flex items-center gap-3 p-4 rounded-xl bg-slate-950/20 border border-slate-800">
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

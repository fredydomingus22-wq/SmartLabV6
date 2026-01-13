import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    FlaskConical,
    Plus,
    Scale,
    Thermometer,
    AlertTriangle,
    Calendar,
    CheckCircle2,
    Activity,
    BarChart3,
    History,
    Search,
    Filter,
    ArrowUpRight,
    Settings,
    FileCheck
} from "lucide-react";
import Link from "next/link";
import { format, differenceInDays } from "date-fns";
import { pt } from "date-fns/locale";
import { Input } from "@/components/ui/input";
import { AssetDialog } from "./_components/create-asset-dialog";
import { RegisterCalibrationDialog } from "./_components/register-calibration-dialog";
import { PageHeader } from "@/components/layout/page-header";

export const dynamic = "force-dynamic";

interface LabAsset {
    id: string;
    name: string;
    code: string;
    asset_category: string;
    serial_number: string | null;
    manufacturer: string | null;
    model: string | null;
    last_calibration_date: string | null;
    next_calibration_date: string | null;
    criticality: string;
    status: string;
}

const categoryLabels: Record<string, string> = {
    balance: "Balança",
    ph_meter: "pH-Metro",
    refractometer: "Refratómetro",
    thermometer: "Termómetro",
    spectrophotometer: "Espectrofotómetro",
    viscometer: "Viscosímetro",
    general: "Geral",
};

const statusColors: Record<string, string> = {
    active: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    out_of_calibration: "bg-rose-500/10 text-rose-400 border-rose-500/20",
    maintenance: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    decommissioned: "bg-slate-500/10 text-slate-400 border-slate-500/20",
};

const getCategoryIcon = (category: string) => {
    switch (category) {
        case 'balance': return <Scale className="h-5 w-5 text-blue-400" />;
        case 'ph_meter': return <FlaskConical className="h-5 w-5 text-emerald-400" />;
        case 'thermometer': return <Thermometer className="h-5 w-5 text-orange-400" />;
        default: return <Settings className="h-5 w-5 text-slate-400" />;
    }
};

import { getSafeUser } from "@/lib/auth.server";

export default async function LabAssetsPage() {
    const supabase = await createClient();
    const user = await getSafeUser();

    const { data: assets } = await supabase
        .from("lab_assets")
        .select("*")
        .order("code");

    const { data: plantsData } = await supabase
        .from("plants")
        .select("id, name")
        .order("name");

    const plants = plantsData || [];

    const today = new Date();

    return (
        <div className="container py-8 space-y-8 animate-in fade-in duration-700">
            <PageHeader
                variant="emerald"
                icon={<FlaskConical className="h-4 w-4" />}
                overline="Gestão de equipamentos & Conformidade ISO 17025"
                title="Instrumentos de Laboratório"
                description="Monitorize a calibração, manutenção e criticidade dos ativos do laboratório."
                backHref="/lab"
                actions={
                    <div className="flex items-center gap-3">
                        <Link href="/lab/equipment/routine-checks">
                            <Button variant="outline" className="h-9 bg-card border-slate-800 text-slate-300 hover:bg-slate-900 rounded-xl text-[10px] font-black uppercase tracking-widest px-4 transition-all">
                                <CheckCircle2 className="h-4 w-4 mr-2" />
                                Verificações Diárias
                            </Button>
                        </Link>
                        <AssetDialog plants={plants} />
                    </div>
                }
            />

            {/* Stats Dashboard */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[
                    { label: "Total Asset", value: assets?.length || 0, icon: BarChart3, color: "text-blue-400", bg: "bg-blue-400/10" },
                    { label: "Instrumentos Ativos", value: assets?.filter(a => a.status === 'active').length || 0, icon: Activity, color: "text-emerald-400", bg: "bg-emerald-400/10" },
                    {
                        label: "Calibração Próxima", value: assets?.filter(a => {
                            if (!a.next_calibration_date) return false;
                            const days = differenceInDays(new Date(a.next_calibration_date), today);
                            return days <= 30 && days >= 0;
                        }).length || 0, icon: Calendar, color: "text-amber-400", bg: "bg-amber-400/10"
                    },
                    { label: "Fora de Calibração", value: assets?.filter(a => a.status === 'out_of_calibration').length || 0, icon: AlertTriangle, color: "text-rose-400", bg: "bg-rose-400/10" },
                ].map((stat, i) => (
                    <Card key={i} className="bg-card border-slate-800 shadow-lg overflow-hidden group hover:border-slate-700 transition-all duration-300">
                        <CardContent className="p-6 relative">
                            <div className={`absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity`}>
                                <stat.icon className="h-12 w-12" />
                            </div>
                            <div className="space-y-1">
                                <h3 className="text-3xl font-black text-white">{stat.value}</h3>
                                <p className="text-xs font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2">
                                    <span className={`h-1.5 w-1.5 rounded-full ${stat.color} bg-current`} />
                                    {stat.label}
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Filters & Search */}
            <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1 group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 group-focus-within:text-emerald-400 transition-colors" />
                    <Input
                        placeholder="Procurar por nome, código ou fabricante..."
                        className="bg-card border-slate-800 pl-10 h-12 rounded-xl text-white placeholder:text-slate-600 focus:border-blue-500/30 transition-all shadow-lg"
                    />
                </div>
                <Button variant="outline" className="bg-card border-slate-800 text-slate-300 rounded-xl h-12 shadow-lg">
                    <Filter className="h-4 w-4 mr-2" />
                    Filtros Avançados
                </Button>
            </div>

            {/* Assets Grid */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {assets?.map((asset: LabAsset) => {
                    const daysToCalibration = asset.next_calibration_date
                        ? differenceInDays(new Date(asset.next_calibration_date), today)
                        : null;

                    const isOverdue = daysToCalibration !== null && daysToCalibration < 0;
                    const isNearDue = daysToCalibration !== null && daysToCalibration <= 30 && daysToCalibration >= 0;

                    return (
                        <Card key={asset.id} className="bg-card border-slate-800 shadow-xl overflow-hidden hover:border-slate-700 transition-all duration-500 group hover:-translate-y-2">
                            <CardHeader className="pb-4 space-y-4">
                                <div className="flex items-start justify-between">
                                    <div className="p-3 bg-slate-900/50 rounded-xl border border-slate-800 group-hover:bg-slate-900 group-hover:border-slate-700 transition-all shadow-inner">
                                        {getCategoryIcon(asset.asset_category)}
                                    </div>
                                    <Badge className={`${statusColors[asset.status] || statusColors.active} rounded-lg border-none px-3 py-1 font-bold text-[10px] uppercase tracking-tighter`}>
                                        {asset.status === 'active' ? 'Operacional' :
                                            asset.status === 'out_of_calibration' ? 'Vencido' : asset.status}
                                    </Badge>
                                </div>
                                <div className="space-y-1">
                                    <CardTitle className="text-xl font-bold text-white group-hover:text-amber-400 transition-colors flex items-center gap-2">
                                        {asset.name}
                                        <ArrowUpRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </CardTitle>
                                    <div className="flex items-center gap-2">
                                        <span className="font-mono text-[10px] text-slate-500 bg-slate-950 border border-slate-800 px-2 py-0.5 rounded uppercase tracking-widest">
                                            {asset.code}
                                        </span>
                                        <span className="text-[10px] text-slate-500 uppercase tracking-widest">
                                            {categoryLabels[asset.asset_category] || asset.asset_category}
                                        </span>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {/* Calibration Focus Card */}
                                <div className={`relative p-4 rounded-2xl border transition-all duration-300 ${isOverdue
                                    ? 'bg-rose-500/5 border-rose-500/20 group-hover:bg-rose-500/10'
                                    : isNearDue
                                        ? 'bg-amber-500/5 border-amber-500/20 group-hover:bg-amber-500/10'
                                        : 'bg-slate-900/50 border-slate-800 group-hover:bg-slate-900 group-hover:border-slate-700'
                                    }`}>
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Próxima Calibração</span>
                                        {isOverdue && <AlertTriangle className="h-4 w-4 text-rose-500 animate-pulse" />}
                                    </div>

                                    {asset.next_calibration_date ? (
                                        <div className="flex flex-col">
                                            <span className={`text-lg font-black ${isOverdue ? 'text-rose-400' : isNearDue ? 'text-amber-400' : 'text-slate-200'}`}>
                                                {format(new Date(asset.next_calibration_date), "dd MMM yyyy", { locale: pt })}
                                            </span>
                                            <div className="flex items-center gap-2 mt-1">
                                                <div className="flex-1 h-1 bg-slate-800 rounded-full overflow-hidden">
                                                    <div
                                                        className={`h-full ${isOverdue ? 'bg-rose-500' : isNearDue ? 'bg-amber-500' : 'bg-emerald-500'}`}
                                                        style={{ width: isOverdue ? '100%' : `${Math.max(0, Math.min(100, (daysToCalibration || 0) * 3))}%` }}
                                                    />
                                                </div>
                                                <span className="text-[9px] font-mono text-slate-500 uppercase whitespace-nowrap">
                                                    {isOverdue ? 'Vencida' : `${daysToCalibration} dias`}
                                                </span>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="text-xs text-slate-600 italic">Não agendada</div>
                                    )}
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Fabricante</span>
                                        <p className="text-xs text-white truncate font-medium">{asset.manufacturer || "---"}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Criticidade</span>
                                        <div className="flex items-center gap-2">
                                            <div className={`h-1.5 w-1.5 rounded-full ${asset.criticality === 'high' ? 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]' :
                                                asset.criticality === 'medium' ? 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]' :
                                                    'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]'
                                                }`} />
                                            <span className="text-[10px] text-white uppercase font-black">{asset.criticality}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-2">
                                    <Link href={`/lab/assets/${asset.id}`} className="flex-1">
                                        <Button variant="ghost" className="w-full text-[10px] uppercase font-black tracking-widest text-slate-500 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-xl h-10 border border-transparent hover:border-emerald-500/20 transition-all">
                                            <History className="h-3 w-3 mr-2" />
                                            Historial
                                        </Button>
                                    </Link>
                                    <RegisterCalibrationDialog asset={asset}>
                                        <Button variant="ghost" size="icon" className="bg-slate-900/50 border border-slate-800 text-slate-500 hover:text-emerald-400 rounded-xl h-10 w-10 shadow-lg" title="Registar Calibração">
                                            <FileCheck className="h-4 w-4" />
                                        </Button>
                                    </RegisterCalibrationDialog>
                                    <AssetDialog plants={plants} assetToEdit={asset} mode="edit">
                                        <Button variant="ghost" size="icon" className="bg-slate-900/50 border border-slate-800 text-slate-500 hover:text-white rounded-xl h-10 w-10 shadow-lg">
                                            <Settings className="h-4 w-4" />
                                        </Button>
                                    </AssetDialog>
                                </div>
                            </CardContent>
                        </Card>
                    );
                })
                }
            </div >

            {(!assets || assets.length === 0) && (
                <div className="text-center py-32 bg-card rounded-[2.5rem] border border-dashed border-slate-800 animate-in zoom-in duration-500 shadow-2xl">
                    <div className="p-6 bg-slate-900/50 rounded-full inline-block mb-6 shadow-inner border border-slate-800">
                        <FlaskConical className="h-16 w-16 text-slate-700 opacity-20" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-300 mb-2 font-mono">Inventário Vazio</h3>
                    <p className="text-slate-500 text-sm max-w-[300px] mx-auto leading-relaxed">
                        Nenhum instrumento configurado. Adicione o seu primeiro equipamento para começar o rastreio de calibração.
                    </p>
                    <div className="mt-8">
                        <AssetDialog plants={plants} />
                    </div>
                </div>
            )}
        </div >
    );
}

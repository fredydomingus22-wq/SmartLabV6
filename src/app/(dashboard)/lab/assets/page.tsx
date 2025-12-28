import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FlaskConical, Plus, Scale, Thermometer, AlertTriangle, Calendar, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { format, differenceInDays } from "date-fns";
import { pt } from "date-fns/locale";

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

const categoryColors: Record<string, string> = {
    balance: "text-blue-400",
    ph_meter: "text-emerald-400",
    refractometer: "text-purple-400",
    thermometer: "text-orange-400",
    general: "text-slate-400",
};

const statusColors: Record<string, string> = {
    active: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    out_of_calibration: "bg-rose-500/10 text-rose-400 border-rose-500/20",
    maintenance: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    decommissioned: "bg-slate-500/10 text-slate-400 border-slate-500/20",
};

const getCategoryIcon = (category: string) => {
    switch (category) {
        case 'balance': return <Scale className="h-4 w-4 text-blue-400" />;
        case 'ph_meter': return <FlaskConical className="h-4 w-4 text-emerald-400" />;
        case 'thermometer': return <Thermometer className="h-4 w-4 text-orange-400" />;
        default: return <FlaskConical className="h-4 w-4 text-slate-400" />;
    }
};

export default async function LabAssetsPage() {
    const supabase = await createClient();

    const { data: assets } = await supabase
        .from("lab_assets")
        .select("*")
        .order("code");

    const today = new Date();

    return (
        <div className="container py-8 space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-100 flex items-center gap-3">
                        <FlaskConical className="h-8 w-8 text-emerald-400" />
                        Instrumentos de Laboratório
                    </h1>
                    <p className="text-slate-400 mt-1">
                        Gestão de equipamentos de medição e conformidade ISO 17025.
                    </p>
                </div>
                <div className="flex gap-2">
                    <Link href="/lab/equipment/routine-checks">
                        <Button variant="outline" className="glass border-slate-800">
                            <CheckCircle2 className="h-4 w-4 mr-2" />
                            Verificações Diárias
                        </Button>
                    </Link>
                    <Button className="bg-emerald-600 hover:bg-emerald-700">
                        <Plus className="h-4 w-4 mr-2" />
                        Novo Instrumento
                    </Button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="glass border-slate-800">
                    <CardContent className="pt-6">
                        <div className="text-3xl font-bold text-slate-100">{assets?.length || 0}</div>
                        <div className="text-xs text-slate-500 mt-1">Total de Instrumentos</div>
                    </CardContent>
                </Card>
                <Card className="glass border-slate-800">
                    <CardContent className="pt-6">
                        <div className="text-3xl font-bold text-emerald-400">
                            {assets?.filter(a => a.status === 'active').length || 0}
                        </div>
                        <div className="text-xs text-slate-500 mt-1">Ativos</div>
                    </CardContent>
                </Card>
                <Card className="glass border-slate-800">
                    <CardContent className="pt-6">
                        <div className="text-3xl font-bold text-amber-400">
                            {assets?.filter(a => {
                                if (!a.next_calibration_date) return false;
                                const days = differenceInDays(new Date(a.next_calibration_date), today);
                                return days <= 30 && days >= 0;
                            }).length || 0}
                        </div>
                        <div className="text-xs text-slate-500 mt-1">Calibração Próxima (&lt;30d)</div>
                    </CardContent>
                </Card>
                <Card className="glass border-slate-800">
                    <CardContent className="pt-6">
                        <div className="text-3xl font-bold text-rose-400">
                            {assets?.filter(a => a.status === 'out_of_calibration').length || 0}
                        </div>
                        <div className="text-xs text-slate-500 mt-1">Fora de Calibração</div>
                    </CardContent>
                </Card>
            </div>

            {/* Assets Grid */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {assets?.map((asset: LabAsset) => {
                    const daysToCalibration = asset.next_calibration_date
                        ? differenceInDays(new Date(asset.next_calibration_date), today)
                        : null;

                    const isOverdue = daysToCalibration !== null && daysToCalibration < 0;
                    const isNearDue = daysToCalibration !== null && daysToCalibration <= 30 && daysToCalibration >= 0;

                    return (
                        <Card key={asset.id} className="glass overflow-hidden border-slate-800/50 hover:border-emerald-500/30 transition-all group">
                            <CardHeader className="pb-3">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <CardTitle className="text-lg flex items-center gap-2">
                                            {getCategoryIcon(asset.asset_category)}
                                            {asset.name}
                                        </CardTitle>
                                        <CardDescription className="font-mono text-[10px] uppercase tracking-wider mt-1">
                                            {asset.code} • {categoryLabels[asset.asset_category] || asset.asset_category}
                                        </CardDescription>
                                    </div>
                                    <Badge className={statusColors[asset.status] || statusColors.active}>
                                        {asset.status === 'active' ? 'Ativo' :
                                            asset.status === 'out_of_calibration' ? 'Fora Cal.' : asset.status}
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {/* Equipment Info */}
                                {(asset.manufacturer || asset.model) && (
                                    <div className="text-xs text-slate-400">
                                        {asset.manufacturer && <span>{asset.manufacturer}</span>}
                                        {asset.model && <span className="ml-1 font-mono text-slate-500">({asset.model})</span>}
                                    </div>
                                )}

                                {/* Calibration Status */}
                                <div className={`p-3 rounded-lg border ${isOverdue
                                        ? 'bg-rose-500/10 border-rose-500/20'
                                        : isNearDue
                                            ? 'bg-amber-500/10 border-amber-500/20'
                                            : 'bg-slate-800/50 border-slate-700/50'
                                    }`}>
                                    <div className="flex items-center gap-2">
                                        {isOverdue ? (
                                            <AlertTriangle className="h-4 w-4 text-rose-400" />
                                        ) : (
                                            <Calendar className="h-4 w-4 text-slate-500" />
                                        )}
                                        <span className={`text-xs font-medium ${isOverdue ? 'text-rose-400' : isNearDue ? 'text-amber-400' : 'text-slate-400'
                                            }`}>
                                            {isOverdue ? 'CALIBRAÇÃO VENCIDA' : 'Próxima Calibração'}
                                        </span>
                                    </div>
                                    {asset.next_calibration_date ? (
                                        <div className="mt-1 font-bold text-sm text-slate-200">
                                            {format(new Date(asset.next_calibration_date), "dd MMM yyyy", { locale: pt })}
                                            {daysToCalibration !== null && !isOverdue && (
                                                <span className="ml-2 text-xs font-normal text-slate-500">
                                                    ({daysToCalibration} dias)
                                                </span>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="mt-1 text-xs text-slate-500 italic">Não definida</div>
                                    )}
                                </div>

                                {/* Criticality Badge */}
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] text-slate-500 uppercase">Criticidade:</span>
                                    <Badge variant="outline" className={`text-[10px] ${asset.criticality === 'high' ? 'border-rose-500/50 text-rose-400' :
                                            asset.criticality === 'medium' ? 'border-amber-500/50 text-amber-400' :
                                                'border-slate-500/50 text-slate-400'
                                        }`}>
                                        {asset.criticality.toUpperCase()}
                                    </Badge>
                                </div>

                                {/* Actions */}
                                <div className="flex gap-2 pt-2">
                                    <Link href={`/lab/assets/${asset.id}`} className="flex-1">
                                        <Button variant="outline" size="sm" className="w-full glass border-slate-700">
                                            Ver Histórico
                                        </Button>
                                    </Link>
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            {(!assets || assets.length === 0) && (
                <div className="text-center py-20 bg-slate-900/40 rounded-3xl border border-dashed border-slate-800">
                    <FlaskConical className="h-12 w-12 text-slate-700 mx-auto mb-4 opacity-20" />
                    <p className="text-slate-500 italic">Nenhum instrumento configurado.</p>
                </div>
            )}
        </div>
    );
}

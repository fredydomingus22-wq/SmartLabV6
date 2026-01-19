"use client";

import { useState, useMemo } from "react";
import {
    FlaskConical,
    Scale,
    Thermometer,
    Settings,
    Activity,
    BarChart3,
    Calendar,
    AlertTriangle,
    LayoutGrid,
    List,
    History,
    FileCheck,
    Beaker
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { KPISparkCard } from "@/components/ui/kpi-spark-card";
import { IndustrialToolbar } from "@/components/defaults/industrial-toolbar";
import { EntityCard } from "@/components/defaults/entity-card";
import { IndustrialGrid } from "@/components/defaults/industrial-grid";
import { AssetDialog } from "./_components/create-asset-dialog";
import { RegisterCalibrationDialog } from "./_components/register-calibration-dialog";
import { format, differenceInDays } from "date-fns";
import { pt } from "date-fns/locale";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { ColDef, ICellRendererParams } from "ag-grid-community";

interface LabAssetsClientProps {
    assets: any[];
    plants: any[];
}

const categoryLabels: Record<string, string> = {
    balance: "Balança",
    ph_meter: "pH-Metro",
    refractometer: "Refratómetro",
    thermometer: "Termómetro",
    spectrophotometer: "Espectrofotómetro",
    viscometer: "Viscosímetro",
    general: "Instrumento",
};

const getCategoryIcon = (category: string) => {
    switch (category) {
        case 'balance': return Scale;
        case 'ph_meter': return FlaskConical;
        case 'thermometer': return Thermometer;
        default: return Settings;
    }
};

const statusMap: Record<string, { label: string, variant: "approved" | "rejected" | "warning" | "pending" }> = {
    active: { label: "Operacional", variant: "approved" },
    out_of_calibration: { label: "Vencido", variant: "rejected" },
    maintenance: { label: "Manutenção", variant: "warning" },
    decommissioned: { label: "Retirado", variant: "pending" },
};

export function LabAssetsClient({ assets, plants }: LabAssetsClientProps) {
    const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
    const today = new Date();

    const stats = useMemo(() => {
        const total = assets.length;
        const active = assets.filter(a => a.status === 'active').length;
        const nearDue = assets.filter(a => {
            if (!a.next_calibration_date) return false;
            const days = differenceInDays(new Date(a.next_calibration_date), today);
            return days <= 30 && days >= 0;
        }).length;
        const overdue = assets.filter(a => a.status === 'out_of_calibration').length;

        return { total, active, nearDue, overdue };
    }, [assets]);

    const generateSparkline = (base: number) => Array.from({ length: 7 }, (_, i) => ({ value: base + Math.sin(i) * 2 }));

    const columnDefs = useMemo<ColDef[]>(() => [
        {
            headerName: "Instrumento",
            field: "name",
            flex: 2,
            cellRenderer: (params: ICellRendererParams) => {
                const Icon = getCategoryIcon(params.data.asset_category);
                return (
                    <div className="flex items-center gap-3 h-full">
                        <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                            <Icon className="h-4 w-4 text-emerald-400" />
                        </div>
                        <div className="flex flex-col justify-center leading-tight">
                            <span className="text-sm font-bold text-white tracking-tight">{params.data.name}</span>
                            <span className="text-[10px] font-mono font-black uppercase text-slate-500">{params.data.code}</span>
                        </div>
                    </div>
                );
            }
        },
        {
            headerName: "Status",
            field: "status",
            width: 150,
            cellRenderer: (params: ICellRendererParams) => {
                const status = statusMap[params.value] || { label: params.value, variant: "pending" };
                return (
                    <div className="flex items-center h-full">
                        <div className={cn(
                            "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border",
                            status.variant === "approved" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                                status.variant === "warning" ? "bg-amber-500/10 text-amber-400 border-amber-500/20" :
                                    status.variant === "rejected" ? "bg-rose-500/10 text-rose-400 border-rose-500/20" :
                                        "bg-slate-500/10 text-slate-400 border-slate-500/20"
                        )}>
                            {status.label}
                        </div>
                    </div>
                );
            }
        },
        {
            headerName: "Próxima Calibração",
            field: "next_calibration_date",
            flex: 1.5,
            cellRenderer: (params: ICellRendererParams) => {
                if (!params.value) return <span className="text-slate-600 italic">N/A</span>;
                const date = new Date(params.value);
                const days = differenceInDays(date, today);
                const isOverdue = days < 0;
                const isNearDue = days <= 30 && days >= 0;

                return (
                    <div className="flex flex-col justify-center h-full">
                        <div className="flex items-center gap-2">
                            <Calendar className={cn("h-3 w-3", isOverdue ? "text-rose-400" : isNearDue ? "text-amber-400" : "text-emerald-400")} />
                            <span className={cn(
                                "text-sm font-bold",
                                isOverdue ? "text-rose-400" : isNearDue ? "text-amber-400" : "text-slate-200"
                            )}>
                                {format(date, "dd MMM yyyy", { locale: pt })}
                            </span>
                        </div>
                        <span className="text-[10px] text-slate-500 font-medium">
                            {isOverdue ? "Vencido" : isNearDue ? `Em ${days} dias` : `Faltam ${days} dias`}
                        </span>
                    </div>
                );
            }
        },
        {
            headerName: "Ações",
            field: "actions",
            width: 180,
            cellRenderer: (params: ICellRendererParams) => (
                <div className="flex items-center gap-2 h-full">
                    <Button variant="ghost" size="icon" asChild className="h-8 w-8 bg-slate-900/50 border border-white/5 text-slate-400 hover:text-white rounded-lg">
                        <Link href={`/lab/assets/${params.data.id}`}>
                            <History className="h-3.5 w-3.5" />
                        </Link>
                    </Button>
                    <RegisterCalibrationDialog asset={params.data}>
                        <Button variant="ghost" size="icon" className="h-8 w-8 bg-slate-900/50 border border-white/5 text-slate-400 hover:text-emerald-400 rounded-lg">
                            <FileCheck className="h-3.5 w-3.5" />
                        </Button>
                    </RegisterCalibrationDialog>
                    <AssetDialog plants={plants} assetToEdit={params.data} mode="edit">
                        <Button variant="ghost" size="icon" className="h-8 w-8 bg-slate-900/50 border border-white/5 text-slate-400 hover:text-white rounded-lg">
                            <Settings className="h-3.5 w-3.5" />
                        </Button>
                    </AssetDialog>
                </div>
            )
        }
    ], [plants, today]);

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 px-6">
                <KPISparkCard
                    variant="blue"
                    title="Total de Ativos"
                    value={stats.total.toString()}
                    description="Inventário Geral"
                    icon={<BarChart3 className="h-4 w-4" />}
                    data={generateSparkline(stats.total)}
                    dataKey="value"
                />
                <KPISparkCard
                    variant="emerald"
                    title="Operacionais"
                    value={stats.active.toString()}
                    description="Equipamentos Ativos"
                    icon={<Activity className="h-4 w-4" />}
                    data={generateSparkline(stats.active)}
                    dataKey="value"
                />
                <KPISparkCard
                    variant="amber"
                    title="Próximas Calibrações"
                    value={stats.nearDue.toString()}
                    description="Próximos 30 dias"
                    icon={<Calendar className="h-4 w-4" />}
                    data={generateSparkline(stats.nearDue)}
                    dataKey="value"
                />
                <KPISparkCard
                    variant="rose"
                    title="Fora de Validade"
                    value={stats.overdue.toString()}
                    description="Calibração Vencida"
                    icon={<AlertTriangle className="h-4 w-4" />}
                    data={generateSparkline(stats.overdue)}
                    dataKey="value"
                />
            </div>

            <main className="px-6 space-y-6">
                <IndustrialToolbar
                    totalResults={assets.length}
                    viewMode={viewMode}
                    onViewModeChange={(mode) => setViewMode(mode as any)}
                    actions={
                        <div className="flex items-center gap-3">
                            <AssetDialog plants={plants} />
                        </div>
                    }
                />

                {viewMode === "grid" ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {assets.map((asset) => {
                            const daysToCalibration = asset.next_calibration_date
                                ? differenceInDays(new Date(asset.next_calibration_date), today)
                                : null;

                            const isOverdue = daysToCalibration !== null && daysToCalibration < 0;
                            const isNearDue = daysToCalibration !== null && daysToCalibration <= 30 && daysToCalibration >= 0;

                            const status = statusMap[asset.status] || { label: asset.status, variant: "pending" };
                            const Icon = getCategoryIcon(asset.asset_category);

                            return (
                                <EntityCard
                                    key={asset.id}
                                    title={asset.name}
                                    code={asset.code}
                                    category={categoryLabels[asset.asset_category]}
                                    icon={Icon}
                                    status={{
                                        label: status.label,
                                        variant: status.variant
                                    }}
                                    metrics={[
                                        { label: "Fabricante", value: asset.manufacturer || "---", icon: Settings },
                                        { label: "Criticidade", value: asset.criticality.toUpperCase(), icon: Beaker }
                                    ]}
                                    highlight={asset.next_calibration_date ? {
                                        label: "Próxima Calibração",
                                        value: format(new Date(asset.next_calibration_date), "dd MMM yyyy", { locale: pt }),
                                        progress: isOverdue ? 100 : Math.max(0, 100 - (daysToCalibration || 0) * 3),
                                        variant: isOverdue ? "rose" : isNearDue ? "amber" : "emerald"
                                    } : undefined}
                                    actions={
                                        <div className="flex gap-2 w-full">
                                            <Button variant="ghost" asChild className="flex-1 h-9 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-white border border-white/5">
                                                <Link href={`/lab/assets/${asset.id}`} className="flex items-center gap-2">
                                                    <History className="h-3 w-3" />
                                                    Historial
                                                </Link>
                                            </Button>
                                            <RegisterCalibrationDialog asset={asset}>
                                                <Button variant="ghost" size="icon" className="h-9 w-9 bg-slate-950 border border-white/5 text-slate-400 hover:text-emerald-400 rounded-xl" title="Registar Calibração">
                                                    <FileCheck className="h-4 w-4" />
                                                </Button>
                                            </RegisterCalibrationDialog>
                                            <AssetDialog plants={plants} assetToEdit={asset} mode="edit">
                                                <Button variant="ghost" size="icon" className="h-9 w-9 bg-slate-950 border border-white/5 text-slate-400 hover:text-white rounded-xl">
                                                    <Settings className="h-4 w-4" />
                                                </Button>
                                            </AssetDialog>
                                        </div>
                                    }
                                />
                            );
                        })}
                    </div>
                ) : (
                    <div className="h-[600px] w-full rounded-[2.5rem] overflow-hidden border border-white/5 shadow-2xl bg-slate-950/40 p-4">
                        <IndustrialGrid
                            rowData={assets}
                            columnDefs={columnDefs}
                            rowHeight={64}
                        />
                    </div>
                )}

                {assets.length === 0 && (
                    <div className="text-center py-32 bg-slate-950/20 rounded-[3rem] border-2 border-dashed border-white/5">
                        <FlaskConical className="h-16 w-16 mx-auto mb-6 text-slate-800 opacity-30" />
                        <h3 className="text-xl font-bold text-slate-300 mb-2 italic">Inventário Vazio</h3>
                        <p className="text-slate-500 text-sm max-w-[300px] mx-auto font-medium">
                            Nenhum instrumento configurado. Adicione o seu primeiro equipamento para começar o controlo de calibração.
                        </p>
                        <div className="mt-8">
                            <AssetDialog plants={plants} />
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}

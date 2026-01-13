"use client";

import React, { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ShieldCheck, ShieldAlert, Zap, LayoutGrid, FileText, ClipboardCheck, ArrowRight, Loader2, AlertCircle, TrendingUp } from "lucide-react";
import Link from "next/link";
import { KPISparkCard } from "@/components/ui/kpi-spark-card";
import { PremiumListItem } from "@/components/premium";
import { exportDataAction } from "@/app/actions/reports";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface HACCPViewProps {
    stats: any;
    activity: any;
}

export function HACCPView({ stats, activity }: HACCPViewProps) {
    const [exporting, setExporting] = useState(false);

    const handleExport = async () => {
        setExporting(true);
        try {
            const formData = new FormData();
            formData.set("data_type", "pcc_logs");
            const start = new Date();
            start.setDate(start.getDate() - 30);
            formData.set("start_date", start.toISOString());
            formData.set("end_date", new Date().toISOString());

            const result = await exportDataAction(formData);

            if (result.success && result.data) {
                const data = result.data as any[];
                if (data.length === 0) {
                    toast.error("Nenhum dado encontrado");
                    return;
                }
                const headers = Object.keys(data[0]);
                const csvContent = [
                    headers.join(","),
                    ...data.map(row => headers.map(h => {
                        const val = row[h];
                        return (typeof val === "string" && val.includes(",")) ? `"${val}"` : val ?? "";
                    }).join(","))
                ].join("\n");

                const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = result.filename || "haccp_logs.csv";
                a.click();
                URL.revokeObjectURL(url);
                toast.success(`Exportado: ${data.length} registos`);
            }
        } catch (error) { toast.error("Erro ao exportar"); } finally { setExporting(false); }
    };

    const sparklines = stats?.sparklines || {
        deviations: Array(7).fill({ value: 0 }),
        haccp: Array(7).fill({ value: 100 })
    };

    return (
        <div className="space-y-10">
            {/* KPI Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <KPISparkCard
                    variant="rose"
                    title="Desvios CCP (Turno)"
                    value={stats.recentDeviations.toString()}
                    description="Violações de Limites Críticos"
                    icon={<ShieldAlert className="h-3 w-3" />}
                    trend={{ value: Math.abs(stats.trends.deviations), isPositive: stats.trends.deviations < 0 }}
                    data={sparklines.deviations}
                    dataKey="value"
                />

                <KPISparkCard
                    variant="emerald"
                    title="Conformidade APPCC"
                    value={`${stats.haccpCompliance.toFixed(1)}%`}
                    description="Leituras dentro do Target"
                    icon={<ShieldCheck className="h-3 w-3" />}
                    trend={{ value: stats.trends.haccpCompliance, isPositive: stats.trends.haccpCompliance > 0 }}
                    data={sparklines.haccp}
                    dataKey="value"
                />

                <KPISparkCard
                    variant="amber"
                    title="CCP Mais Crítico"
                    value={stats.problematicCCP}
                    description="Frequência de Alertas"
                    icon={<AlertCircle className="h-3 w-3" />}
                    data={sparklines.deviations}
                    dataKey="value"
                />
            </div>

            {/* Main Content */}
            <div className="grid gap-8 lg:grid-cols-3">
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex justify-between items-center px-1">
                        <h2 className="text-xl font-bold flex items-center gap-2 text-white italic uppercase tracking-tighter">
                            <ShieldAlert className="h-5 w-5 text-red-500" />
                            Log de Monitoramento (Recent)
                        </h2>
                        <Button asChild variant="ghost" size="sm" className="text-slate-500 hover:text-white uppercase text-[10px] font-bold tracking-widest">
                            <Link href="/haccp/logs">
                                Histórico Completo <ArrowRight className="h-3 w-3 ml-2" />
                            </Link>
                        </Button>
                    </div>

                    <div className="rounded-[2rem] border border-white/5 bg-slate-900/40 glass overflow-hidden">
                        {stats.recentHaccpLogs?.length > 0 ? (
                            <div className="divide-y divide-white/5">
                                {stats.recentHaccpLogs.map((log: any) => (
                                    <Link key={log.id} href={`/haccp/logs/${log.id}`}>
                                        <PremiumListItem
                                            title={log.hazard?.process_step || "CCP Indefinido"}
                                            subtitle={`${log.equipment?.name || "Geral"} • ${log.is_compliant ? "Conforme" : "DESVIO DETECTADO"}`}
                                            status={log.is_compliant ? "success" : "error"}
                                            icon={log.is_compliant ? <ShieldCheck className="h-6 w-6 text-emerald-500" /> : <ShieldAlert className="h-6 w-6 text-red-500 animate-pulse" />}
                                        />
                                    </Link>
                                ))}
                            </div>
                        ) : (
                            <div className="p-20 text-center space-y-4">
                                <div className="p-5 rounded-3xl bg-emerald-500/10 w-20 h-20 flex items-center justify-center mx-auto mb-4 border border-emerald-500/20 shadow-[0_0_30px_rgba(16,185,129,0.1)]">
                                    <ShieldCheck className="h-10 w-10 text-emerald-500" />
                                </div>
                                <h3 className="text-xl font-black tracking-tighter text-white uppercase italic">Plano Seguro</h3>
                                <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest italic">Nenhuma leitura registada no momento.</p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="space-y-6">
                    <h2 className="text-xl font-bold flex items-center gap-2 px-1 text-white italic uppercase tracking-tighter">
                        <Zap className="h-5 w-5 text-yellow-400" />
                        Status por Linha
                    </h2>

                    <div className="space-y-4">
                        {stats.lines?.map((line: any) => (
                            <div key={line.id} className="p-6 rounded-3xl glass border border-white/5 bg-slate-900/30">
                                <div className="flex justify-between items-center mb-4">
                                    <div className="flex items-center gap-2">
                                        <LayoutGrid className="h-4 w-4 text-blue-500" />
                                        <span className="text-[10px] font-black uppercase tracking-widest text-white">{line.name}</span>
                                    </div>
                                    <Badge className={cn(
                                        "border-none font-black text-[9px] h-5",
                                        line.isProtected ? "bg-emerald-500/10 text-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.2)]" : "bg-red-500/10 text-red-500 animate-pulse"
                                    )}>
                                        {line.isProtected ? "Protegido" : "EM ALERTA"}
                                    </Badge>
                                </div>
                                <div className="flex justify-between items-end">
                                    <div>
                                        <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Última Verificação</p>
                                        <p className="text-xs font-black text-slate-100 italic">
                                            {line.lastCheck ? new Date(line.lastCheck).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "---"}
                                        </p>
                                    </div>
                                    <div className="flex gap-1.5">
                                        {line.lastReadings.slice(0, 4).map((r: any, i: number) => (
                                            <div key={i} className={cn("h-1.5 w-1.5 rounded-full shadow-sm", r === true ? "bg-emerald-500" : r === false ? "bg-red-500" : "bg-white/5")} />
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="group relative p-8 rounded-[2rem] border border-blue-500/20 bg-blue-500/5 glass overflow-hidden transition-all duration-500 hover:bg-blue-500/10">
                        <div className="absolute -top-12 -right-12 h-40 w-40 rounded-full bg-blue-500/10 blur-3xl group-hover:bg-blue-500/20 transition-all duration-500" />
                        <div className="relative z-10 space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 rounded-xl bg-blue-500/20 border border-blue-500/30">
                                    <FileText className="h-5 w-5 text-blue-500" />
                                </div>
                                <span className="text-[10px] font-black text-blue-400 uppercase tracking-[0.2em]">Auditoria</span>
                            </div>
                            <div>
                                <h3 className="text-xl font-black tracking-tighter text-white uppercase italic leading-none">Log APPCC</h3>
                                <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-2">Pronto para GAMP 5</p>
                            </div>
                            <Button
                                onClick={handleExport}
                                disabled={exporting}
                                className="w-full h-11 glass border-white/10 rounded-xl flex items-center justify-center gap-3 text-[10px] font-bold uppercase tracking-widest hover:border-blue-500/50 transition-all active:scale-95"
                            >
                                {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <ClipboardCheck className="h-4 w-4 text-blue-400" />}
                                Exportar Relatório
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

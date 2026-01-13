"use client";

import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Package,
    Truck,
    History,
    ArrowRight,
    Boxes,
    ClipboardCheck,
    AlertCircle,
    CheckCircle2,
    ShieldCheck,
    ShieldAlert,
    Target
} from "lucide-react";
import Link from "next/link";
import { KPISparkCard } from "@/components/ui/kpi-spark-card";
import { PremiumListItem } from "@/components/premium";
import { cn } from "@/lib/utils";

interface RMPMViewProps {
    stats: any;
    activity: any;
}

export function RMPMView({ stats, activity }: RMPMViewProps) {
    const mockData1 = [10, 14, 12, 16, 13, 15, 12].map(v => ({ value: v }));
    const mockData2 = [2, 1.5, 2.5, 1.2, 2.1, 1.8, 1.8].map(v => ({ value: v }));
    const mockData3 = [2, 2, 3, 3, 4, 3, 3].map(v => ({ value: v }));
    const mockData4 = [5, 4.8, 5.2, 4.5, 4.3, 4.2, 4.2].map(v => ({ value: v }));

    return (
        <div className="space-y-10">
            {/* KPI Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <KPISparkCard
                    variant="blue"
                    title="Lotes MP Pendentes"
                    value="12"
                    description="Aguardando Inspeção"
                    icon={<Package className="h-3 w-3" />}
                    data={mockData1}
                    dataKey="value"
                />

                <KPISparkCard
                    variant="emerald"
                    title="Mat. Aprovados"
                    value={stats.expiringSoon.toString()}
                    description="Conformes do Mês"
                    icon={<ShieldCheck className="h-3 w-3" />}
                    data={mockData2}
                    dataKey="value"
                />

                <KPISparkCard
                    variant="rose"
                    title="Materiais NC"
                    value={stats.recentDeviations.toString()}
                    description="Não Conformidades Abertas"
                    icon={<ShieldAlert className="h-3 w-3" />}
                    data={mockData3}
                    dataKey="value"
                />

                <KPISparkCard
                    variant="blue"
                    title="Média Rating Fornecedor"
                    value="4.2"
                    description="Últimos 6 Meses"
                    icon={<Target className="h-3 w-3" />}
                    trend={{ value: 2, isPositive: true }}
                    data={mockData4}
                    dataKey="value"
                />
            </div>

            {/* Main Content */}
            <div className="grid gap-8 lg:grid-cols-3">
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex justify-between items-center px-1">
                        <h2 className="text-xl font-black flex items-center gap-2 text-white italic uppercase tracking-tighter">
                            <Truck className="h-5 w-5 text-blue-400" />
                            Recebimentos em Inspeção
                        </h2>
                        <Button asChild variant="ghost" size="sm" className="text-slate-500 hover:text-white uppercase text-[10px] font-bold tracking-widest">
                            <Link href="/rmpm/inspections">
                                Ver Inventário Global <ArrowRight className="h-3 w-3 ml-2" />
                            </Link>
                        </Button>
                    </div>

                    <div className="rounded-[2rem] border border-white/5 bg-slate-900/40 glass overflow-hidden">
                        <div className="divide-y divide-white/5">
                            {[1, 2, 3].map((i) => (
                                <PremiumListItem
                                    key={i}
                                    title={`MP-2024-0${i}8 - Açúcar Cristal`}
                                    subtitle="Fornecedor: Usina Central • Lote: 88293-A"
                                    status="info"
                                    icon={<Package className="h-6 w-6 text-blue-400" />}
                                />
                            ))}
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    <h2 className="text-xl font-black flex items-center gap-2 px-1 text-white italic uppercase tracking-tighter">
                        <Boxes className="h-5 w-5 text-blue-400" />
                        Qualidade de Embalagens
                    </h2>

                    <div className="p-8 rounded-[2rem] border border-white/5 bg-slate-900/30 glass space-y-6">
                        <div className="space-y-3">
                            {[
                                { name: "Garrafas PET 500ml", status: "Conforme", variant: "success" },
                                { name: "Rótulos Termoencolhíveis", status: "Atenção", variant: "warning" },
                                { name: "Tampas Flip-Top", status: "Conforme", variant: "success" }
                            ].map(item => (
                                <div key={item.name} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">{item.name}</span>
                                    <Badge className={cn(
                                        "border-none text-[8px] font-black uppercase tracking-widest h-5",
                                        item.variant === "success" ? "bg-emerald-500/10 text-emerald-400" : "bg-orange-500/10 text-orange-400"
                                    )}>
                                        {item.status}
                                    </Badge>
                                </div>
                            ))}
                        </div>

                        <div className="pt-6 border-t border-white/5">
                            <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4">SLA por Fornecedor (%)</p>
                            <div className="space-y-4">
                                {[
                                    { name: "Tetra Pak", score: 98 },
                                    { name: "SIG Combibloc", score: 95 },
                                    { name: "Plastipak", score: 82 },
                                ].map(f => (
                                    <div key={f.name} className="space-y-2">
                                        <div className="flex justify-between text-[10px] font-black uppercase text-white">
                                            <span>{f.name}</span>
                                            <span className={f.score > 90 ? "text-emerald-400" : "text-orange-400"}>{f.score}%</span>
                                        </div>
                                        <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
                                            <div
                                                className={cn("h-full transition-all duration-1000", f.score > 90 ? "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]" : "bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.3)]")}
                                                style={{ width: `${f.score}%` }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="group relative p-8 rounded-[2rem] border border-blue-500/20 bg-blue-500/5 glass overflow-hidden transition-all duration-500 hover:bg-blue-500/10">
                        <div className="absolute -top-12 -right-12 h-40 w-40 rounded-full bg-blue-500/10 blur-3xl group-hover:bg-blue-500/20 transition-all duration-500" />
                        <div className="relative z-10 space-y-4 text-center">
                            <History className="h-10 w-10 text-blue-400 mx-auto group-hover:rotate-12 transition-transform duration-500" />
                            <div>
                                <h3 className="text-xl font-black tracking-tighter text-white uppercase italic leading-none">Certificados</h3>
                                <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-2">Conformidade de Entrada</p>
                            </div>
                            <Button className="w-full h-11 glass border-white/10 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] hover:border-blue-500/50 transition-all active:scale-95">
                                Gerar Certificados
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, Clock, Thermometer, FlaskConical, Scale } from "lucide-react";
import { ActionForm } from "@/components/smart/action-form";
import { logLabAssetActivityAction } from "@/app/actions/lab-assets";
import { toast } from "sonner";
import { DailyVerificationDialog } from "@/components/lab/daily-verification-dialog";

interface LabAsset {
    id: string;
    name: string;
    code: string;
    asset_category: string;
    last_verification_at?: string;
    last_verification_result?: string;
    verification_config?: {
        unit: string;
        validity_hours?: number;
        standards: {
            id: string;
            name: string;
            nominal: number;
            tolerance: number;
        }[];
    };
}

const getCategoryIcon = (category: string) => {
    switch (category) {
        case 'balance': return <Scale className="h-4 w-4 text-blue-400" />;
        case 'ph_meter': return <FlaskConical className="h-4 w-4 text-emerald-400" />;
        case 'thermometer': return <Thermometer className="h-4 w-4 text-orange-400" />;
        default: return <FlaskConical className="h-4 w-4 text-slate-400" />;
    }
};

export function RoutineCheckForm({ equipments }: { equipments: LabAsset[] }) {
    const getStatus = (eq: LabAsset) => {
        if (!eq.last_verification_at || !eq.last_verification_result) return "PENDENTE";
        if (eq.last_verification_result === "fail") return "NÃO CONFORME";

        const validityHours = eq.verification_config?.validity_hours || 48;
        const lastVerif = new Date(eq.last_verification_at);
        const now = new Date();
        const diffMs = now.getTime() - lastVerif.getTime();
        const diffHours = diffMs / (1000 * 60 * 60);

        if (diffHours > validityHours) return "EXPIRADO";
        return "CONFORME";
    };

    return (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
            {equipments.map((eq) => {
                const status = getStatus(eq);
                const isConforming = status === "CONFORME";
                const isPending = status === "PENDENTE" || status === "EXPIRADO";
                const isCritical = status === "NÃO CONFORME";

                return (
                    <Card key={eq.id} className={`glass overflow-hidden border-slate-800/50 transition-all hover:border-emerald-500/30 ${isCritical ? 'ring-1 ring-rose-500/30' : ''}`}>
                        <CardHeader className="pb-3 flex flex-row items-start justify-between space-y-0">
                            <div className="space-y-1">
                                <CardTitle className="text-lg flex items-center gap-2">
                                    {getCategoryIcon(eq.asset_category)}
                                    {eq.name}
                                </CardTitle>
                                <CardDescription className="font-mono text-xs uppercase tracking-wider text-slate-500 font-bold">
                                    {eq.code}
                                </CardDescription>
                            </div>
                            {isConforming && <CheckCircle2 className="h-6 w-6 text-emerald-500 animate-in zoom-in duration-300" />}
                            {isCritical && <XCircle className="h-6 w-6 text-rose-500 animate-pulse" />}
                        </CardHeader>

                        <CardContent className="space-y-6">
                            {/* Status Section */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <span className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Status de Verificação</span>
                                    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-md border ${status === "CONFORME"
                                        ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                                        : status === "PENDENTE" || status === "EXPIRADO"
                                            ? "bg-amber-500/10 border-amber-500/20 text-amber-400"
                                            : "bg-rose-500/10 border-rose-500/20 text-rose-400"
                                        }`}>
                                        <div className={`w-2 h-2 rounded-full ${status === "CONFORME" ? "bg-emerald-500" : status === "NÃO CONFORME" ? "bg-rose-500" : "bg-amber-500 animate-pulse"}`} />
                                        <span className="text-xs font-bold">{status}</span>
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <span className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Critério de Aceitação</span>
                                    <div className="text-xs font-mono text-slate-300 py-2">
                                        {eq.verification_config?.standards[0] ? (
                                            `± ${eq.verification_config.standards[0].tolerance} ${eq.verification_config.unit}`
                                        ) : (
                                            eq.asset_category === 'balance' ? '± 0.2 mg' :
                                                eq.asset_category === 'ph_meter' ? '± 0.05 pH' : 'Padrão Definido'
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Calibration Info */}
                            <div className="flex items-center justify-between py-3 border-t border-slate-800/50">
                                <div className="space-y-0.5">
                                    <span className="text-[10px] text-slate-500 uppercase">Última Calibração Formal</span>
                                    <div className="flex items-center gap-1.5 text-xs text-slate-300">
                                        <Clock className="h-3 w-3 text-slate-500" />
                                        12/12/2025
                                    </div>
                                </div>
                                <div className="space-y-0.5 text-right">
                                    <span className="text-[10px] text-slate-500 uppercase">Frequência</span>
                                    <div className="text-xs text-slate-300">
                                        {eq.verification_config?.validity_hours ? `${eq.verification_config.validity_hours}h` : 'Diária'}
                                    </div>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-3">
                                <DailyVerificationDialog
                                    asset={eq as any}
                                    onSuccess={() => {/* Page will revalidate via action */ }}
                                    trigger={
                                        <Button className={`flex-1 transition-all ${isConforming
                                            ? "bg-slate-800/50 hover:bg-emerald-600/20 text-slate-400 hover:text-emerald-400 border-slate-700"
                                            : "bg-emerald-600/20 hover:bg-emerald-600 text-emerald-400 hover:text-white border-emerald-500/30"}`}>
                                            {isConforming ? "Re-verificar" : "Realizar Verificação"}
                                        </Button>
                                    }
                                />
                                <Button
                                    variant="outline"
                                    className="px-3 border-rose-500/20 text-rose-400 hover:bg-rose-500 hover:text-white hover:border-rose-500"
                                    title="Registar Não Conformidade (Bloquear)"
                                >
                                    <XCircle className="h-4 w-4" />
                                </Button>
                            </div>

                            <p className="text-[10px] text-center text-slate-600 italic">
                                Esta verificação não substitui a calibração formal.
                            </p>
                        </CardContent>
                    </Card>
                );
            })}
        </div>
    );
}

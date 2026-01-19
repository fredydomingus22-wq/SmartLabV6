"use client";

import React from "react";
import { EntityCard } from "@/components/defaults/entity-card";
import { Button } from "@/components/ui/button";
import { Beaker, Calendar, MapPin, Database, Clock, CheckCircle2, MoreHorizontal, ArrowRight, Zap, AlertCircle, ShieldCheck, ShieldAlert, Info } from "lucide-react";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import { cn } from "@/lib/utils";

export interface SampleCardProps {
    sample: {
        id: string;
        code: string;
        status: string;
        collected_at: string;
        type: {
            name: string;
            test_category?: string;
        };
        batch?: {
            code: string;
            product?: {
                id: string;
                name: string;
            };
        };
        sampling_point?: {
            name: string;
        };
        ai_risk_status?: 'approved' | 'warning' | 'blocked' | 'info';
        ai_risk_message?: string;
    };
    onEnterResults: (sampleId: string) => void;
}

const statusConfig: Record<string, { label: string; variant: any; icon: any }> = {
    draft: { label: "Rascunho", variant: "pending", icon: MoreHorizontal },
    pending: { label: "Pendente", variant: "warning", icon: Clock },
    collected: { label: "Colhida", variant: "active", icon: Database },
    in_analysis: { label: "Análise", variant: "in_analysis", icon: Beaker },
    under_review: { label: "Revisão", variant: "under_review", icon: ShieldCheck },
    approved: { label: "Aprovada", variant: "approved", icon: CheckCircle2 },
    rejected: { label: "Rejeitada", variant: "rejected", icon: AlertCircle },
    released: { label: "Libertada", variant: "active", icon: ShieldCheck },
};

const riskConfig: Record<string, { label: string; variant: "emerald" | "amber" | "rose" | "blue"; icon: any }> = {
    blocked: { label: "Risco Crítico", variant: "rose", icon: ShieldAlert },
    warning: { label: "Atenção IA", variant: "amber", icon: ShieldAlert },
    approved: { label: "Validado IA", variant: "emerald", icon: ShieldCheck },
    info: { label: "Análise IA", variant: "blue", icon: Info },
};

export function SampleCard({ sample, onEnterResults }: SampleCardProps) {
    const status = statusConfig[sample.status] || { label: sample.status, variant: "outline", icon: MoreHorizontal };
    const date = sample.collected_at ? new Date(sample.collected_at) : new Date();
    const isActionRequired = sample.status === 'collected' || sample.status === 'in_analysis';

    const risk = sample.ai_risk_status ? riskConfig[sample.ai_risk_status] : null;

    return (
        <EntityCard
            title={sample.code}
            code={`LIMS-${sample.code.split('-').pop()}`}
            category={sample.type?.name}
            icon={status.icon}
            status={{
                label: status.label,
                variant: status.variant
            }}
            metrics={[
                {
                    label: "Colheita",
                    value: format(date, "d MMM, HH:mm", { locale: pt }),
                    icon: Calendar
                },
                {
                    label: "Localização",
                    value: sample.sampling_point?.name || "Geral",
                    icon: MapPin
                },
                {
                    label: "Produto",
                    value: sample.batch?.product?.name || "N/D",
                    icon: Database
                },
                {
                    label: "Lote",
                    value: sample.batch?.code || "N/D",
                    icon: Beaker
                }
            ]}
            highlight={risk ? {
                label: "Insights de IA",
                value: risk.label,
                progress: sample.status === 'approved' ? 100 : sample.status === 'in_analysis' ? 65 : 15,
                variant: risk.variant
            } : undefined}
            variant={status.variant === 'approved' ? 'emerald' : status.variant === 'rejected' ? 'rose' : 'default'}
            actions={
                <div className="flex flex-col w-full gap-2">
                    <Button
                        onClick={(e) => {
                            e.stopPropagation();
                            onEnterResults(sample.id);
                        }}
                        disabled={!isActionRequired}
                        className={cn(
                            "w-full h-10 rounded-xl font-bold text-[10px] uppercase tracking-widest transition-all",
                            isActionRequired
                                ? "bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20 active:scale-95 border-none"
                                : "bg-slate-800 text-slate-600 border-none cursor-not-allowed"
                        )}
                    >
                        {isActionRequired && <Zap className="h-3 w-3 mr-2" />}
                        {sample.status === 'collected' ? 'Registar Amostra' : 'Resultados'}
                    </Button>

                    <Button
                        variant="ghost"
                        asChild
                        onClick={(e) => e.stopPropagation()}
                        className="w-full h-9 text-[9px] font-black uppercase tracking-widest text-slate-500 hover:text-white"
                    >
                        <a href={`/lab/samples/${sample.id}`} className="flex items-center justify-center gap-2">
                            Detalhes Analíticos
                            <ArrowRight className="h-3 w-3" />
                        </a>
                    </Button>
                </div>
            }
        />
    );
}



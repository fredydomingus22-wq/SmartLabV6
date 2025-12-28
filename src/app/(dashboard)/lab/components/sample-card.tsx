"use client";

import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Beaker, Calendar, MapPin, Database, Clock, CheckCircle2, MoreHorizontal, ArrowRight, Zap, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { pt } from "date-fns/locale";

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
    };
    onEnterResults: (sampleId: string) => void;
}

const statusConfig: Record<string, { label: string; color: string; bg: string; icon: any }> = {
    pending: { label: "Pendente", color: "text-amber-500", bg: "bg-amber-500/10", icon: Clock },
    collected: { label: "Colhida", color: "text-blue-400", bg: "bg-blue-400/10", icon: Database },
    in_analysis: { label: "Análise", color: "text-purple-400", bg: "bg-purple-400/10", icon: Beaker },
    reviewed: { label: "Revista", color: "text-emerald-400", bg: "bg-emerald-400/10", icon: CheckCircle2 },
    approved: { label: "Aprovada", color: "text-green-500", bg: "bg-green-500/10", icon: CheckCircle2 },
    rejected: { label: "Rejeitada", color: "text-rose-400", bg: "bg-rose-400/10", icon: AlertCircle },
};


export function SampleCard({ sample, onEnterResults }: SampleCardProps) {
    const status = statusConfig[sample.status] || { label: sample.status, color: "text-slate-500", bg: "bg-slate-500/10", icon: MoreHorizontal };
    const date = sample.collected_at ? new Date(sample.collected_at) : new Date();
    const isActionRequired = sample.status === 'collected' || sample.status === 'in_analysis';

    return (
        <motion.div
            whileHover={{ y: -5 }}
            className="group relative flex flex-col h-full glass p-6 rounded-[2rem] border-slate-800/40 hover:border-blue-500/30 transition-all duration-500 overflow-hidden shadow-xl hover:shadow-blue-500/5"
        >
            {/* Glossy Overlay */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 blur-[60px] -mr-16 -mt-16 rounded-full group-hover:bg-blue-500/10 transition-colors" />

            <div className="flex justify-between items-start mb-6 z-10">
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <span className="text-lg font-black tracking-tighter text-slate-100 uppercase group-hover:text-blue-400 transition-colors">
                            {sample.code}
                        </span>
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                        {sample.type?.name}
                    </p>
                </div>
                <div className={cn("p-2 rounded-xl border border-white/5 shadow-inner", status.bg, status.color)}>
                    <status.icon className="h-4 w-4" />
                </div>
            </div>

            <div className="space-y-4 flex-1 z-10">
                <div className="flex items-center gap-3 text-xs font-bold text-slate-400">
                    <Calendar className="h-3.5 w-3.5 opacity-50" />
                    {format(date, "d MMM, HH:mm", { locale: pt })}
                </div>

                <div className="space-y-2">
                    <div className="flex items-center gap-2">
                        <MapPin className="h-3 w-3 text-slate-600" />
                        <span className="text-[11px] font-bold text-slate-300 truncate">
                            {sample.sampling_point?.name || "Localização Geral"}
                        </span>
                    </div>
                    {sample.batch?.product && (
                        <div className="flex items-center gap-2">
                            <Beaker className="h-3 w-3 text-slate-600" />
                            <span className="text-[11px] font-bold text-blue-400/80 truncate">
                                {sample.batch.product.name}
                            </span>
                        </div>
                    )}
                </div>

                {sample.batch?.code && (
                    <div className="inline-flex items-center bg-slate-950/50 px-3 py-1 rounded-lg border border-slate-800 font-mono text-[10px] text-slate-400">
                        Batch: {sample.batch.code}
                    </div>
                )}
            </div>

            <div className="flex flex-col gap-2 pt-6 mt-auto z-10">
                <Button
                    onClick={() => onEnterResults(sample.id)}
                    disabled={!isActionRequired}
                    className={cn(
                        "w-full h-11 rounded-2xl font-bold text-[11px] uppercase tracking-widest transition-all",
                        isActionRequired
                            ? "bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20 active:scale-95"
                            : "bg-slate-800 text-slate-600 opacity-50 cursor-not-allowed"
                    )}
                >
                    {isActionRequired && <Zap className="h-3 w-3 mr-2" />}
                    {sample.status === 'collected' ? 'Registar Amostra' : 'Preencher Resultados'}
                </Button>

                <Button variant="ghost" asChild className="h-10 text-[10px] font-bold uppercase tracking-widest text-slate-500 hover:text-slate-200">
                    <a href={`/lab/samples/${sample.id}`} className="flex items-center justify-center gap-2">
                        Ver Detalhes Analíticos
                        <ArrowRight className="h-3 w-3" />
                    </a>
                </Button>
            </div>
        </motion.div>
    );
}



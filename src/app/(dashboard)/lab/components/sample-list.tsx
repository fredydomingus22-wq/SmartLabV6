"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import { ExternalLink, Database, FlaskConical, Beaker, Clock, CheckCircle2, MoreHorizontal } from "lucide-react";

interface SampleListProps {
    samples: any[];
    onEnterResults: (sampleId: string) => void;
}

const statusConfig: Record<string, { label: string; color: string; icon: any; bg: string }> = {
    pending: { label: "Pendente", color: "text-amber-500", icon: Clock, bg: "bg-amber-500/10" },
    collected: { label: "Colhida", color: "text-blue-400", icon: Database, bg: "bg-blue-400/10" },
    in_analysis: { label: "Análise", color: "text-purple-400", icon: Beaker, bg: "bg-purple-400/10" },
    reviewed: { label: "Concluída", color: "text-emerald-400", icon: CheckCircle2, bg: "bg-emerald-400/10" },
    approved: { label: "Aprovada", color: "text-green-400", icon: CheckCircle2, bg: "bg-green-400/10" },
    rejected: { label: "Rejeitada", color: "text-rose-400", icon: MoreHorizontal, bg: "bg-rose-400/10" },
};

export function SampleList({ samples, onEnterResults }: SampleListProps) {
    return (
        <div className="space-y-3">
            {samples.map((sample, idx) => {
                const status = statusConfig[sample.status] || { label: sample.status, color: "text-slate-500", icon: MoreHorizontal, bg: "bg-slate-500/10" };
                const date = sample.collected_at ? new Date(sample.collected_at) : new Date();
                const isActionRequired = sample.status === 'collected' || sample.status === 'in_analysis';

                return (
                    <motion.div
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        key={sample.id}
                        className="group relative glass p-5 rounded-3xl border-slate-800/40 hover:border-blue-500/20 hover:bg-slate-900/40 transition-all flex flex-col md:flex-row items-center gap-6"
                    >
                        {/* Status Icon */}
                        <div className={cn("p-3 rounded-2xl shrink-0 group-hover:scale-110 transition-transform", status.bg, status.color)}>
                            <status.icon className="h-5 w-5" />
                        </div>

                        {/* ID & Info */}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 mb-1">
                                <span className="text-sm font-black tracking-tight text-slate-100 uppercase">
                                    {sample.code}
                                </span>
                                <div className="h-1 w-1 rounded-full bg-slate-700" />
                                <span className="text-xs font-bold text-slate-400">
                                    {sample.type?.name}
                                </span>
                            </div>
                            <div className="flex items-center gap-4">
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                                    {sample.batch?.product?.name || "Produto N/D"}
                                </span>
                                {sample.batch?.code && (
                                    <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded-md font-mono text-blue-400/70">
                                        {sample.batch.code}
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Metadata */}
                        <div className="flex items-center gap-8 px-8 border-x border-slate-800/50 hidden lg:flex">
                            <div className="flex flex-col">
                                <span className="text-[9px] uppercase font-black tracking-tighter text-slate-600">Localização</span>
                                <span className="text-xs font-bold text-slate-300 truncate max-w-[120px]">
                                    {sample.sampling_point?.name || "Geral"}
                                </span>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[9px] uppercase font-black tracking-tighter text-slate-600">Colheita</span>
                                <span className="text-xs font-bold text-slate-300">
                                    {format(date, "dd MMM, HH:mm", { locale: pt })}
                                </span>
                            </div>
                        </div>

                        {/* Status Badge & Actions */}
                        <div className="flex items-center gap-6 shrink-0 w-full md:w-auto justify-between md:justify-end">
                            <div className={cn("px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border border-white/5", status.bg, status.color)}>
                                {status.label}
                            </div>

                            <div className="flex items-center gap-2">
                                <Button
                                    asChild
                                    variant="ghost"
                                    size="icon"
                                    className="h-10 w-10 rounded-xl bg-slate-950/50 border border-slate-800 hover:border-blue-500/30 group/btn"
                                >
                                    <a href={`/lab/samples/${sample.id}`}>
                                        <ExternalLink className="h-4 w-4 text-slate-500 group-hover/btn:text-blue-400" />
                                    </a>
                                </Button>

                                <Button
                                    onClick={() => onEnterResults(sample.id)}
                                    disabled={!isActionRequired}
                                    className={cn(
                                        "h-10 px-6 rounded-xl font-bold text-[11px] uppercase tracking-widest transition-all",
                                        isActionRequired
                                            ? "bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20"
                                            : "bg-slate-800 text-slate-600 opacity-50 cursor-not-allowed"
                                    )}
                                >
                                    {sample.status === 'collected' ? 'Registar' : 'Resultados'}
                                </Button>
                            </div>
                        </div>
                    </motion.div>
                );
            })}
        </div>
    );
}

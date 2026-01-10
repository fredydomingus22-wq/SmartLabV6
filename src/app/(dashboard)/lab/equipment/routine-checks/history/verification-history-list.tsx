"use client";

import { CheckCircle2, XCircle, Clock, User, ClipboardList } from "lucide-react";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

interface VerificationHistoryListProps {
    logs: any[];
}

export function VerificationHistoryList({ logs }: VerificationHistoryListProps) {
    if (logs.length === 0) {
        return (
            <div className="text-center py-20 bg-slate-900/40 rounded-3xl border border-dashed border-slate-800">
                <Clock className="h-12 w-12 text-slate-700 mx-auto mb-4 opacity-20" />
                <p className="text-slate-500 italic">Nenhum registo de verificação encontrado.</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {logs.map((log) => {
                let details;
                try {
                    details = typeof log.notes === 'string' ? JSON.parse(log.notes) : log.notes;
                } catch (e) {
                    details = null;
                }

                const isPass = log.result === 'pass';

                return (
                    <Card key={log.id} className="bg-slate-900/50 border-slate-800 overflow-hidden group hover:border-slate-700 transition-all duration-300">
                        <CardContent className="p-0">
                            <div className="flex flex-col md:flex-row">
                                {/* Status Indicator */}
                                <div className={`w-2 md:w-3 ${isPass ? 'bg-emerald-500' : 'bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.3)]'}`} />

                                <div className="flex-1 p-5 grid grid-cols-1 md:grid-cols-4 gap-6 content-center">
                                    {/* Asset Info */}
                                    <div className="space-y-1">
                                        <h3 className="text-slate-100 font-bold flex items-center gap-2">
                                            {log.asset?.name || 'Equipamento'}
                                            {!isPass && <Badge variant="destructive" className="animate-pulse">NÃO CONFORME</Badge>}
                                        </h3>
                                        <p className="text-xs text-slate-500 font-mono uppercase tracking-widest">{log.asset?.code || 'S/C'}</p>
                                    </div>

                                    {/* Verification Data (from JSON) */}
                                    {details ? (
                                        <div className="md:col-span-2 grid grid-cols-2 md:grid-cols-4 gap-4 bg-slate-950/40 p-3 rounded-xl border border-slate-800/50">
                                            <div className="space-y-1">
                                                <p className="text-[10px] text-slate-500 uppercase font-semibold tracking-tighter">Padrão</p>
                                                <p className="text-sm text-slate-300 font-medium truncate" title={details.standard}>{details.standard}</p>
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-[10px] text-slate-500 uppercase font-semibold tracking-tighter">Nominal</p>
                                                <p className="text-sm text-slate-400 font-mono">{details.nominal} {details.unit}</p>
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-[10px] text-slate-500 uppercase font-semibold tracking-tighter">Medido</p>
                                                <p className={`text-sm font-mono font-bold ${isPass ? 'text-emerald-400' : 'text-red-400'}`}>
                                                    {details.measured} {details.unit}
                                                </p>
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-[10px] text-slate-500 uppercase font-semibold tracking-tighter">Desvio</p>
                                                <p className={`text-sm font-mono ${isPass ? 'text-emerald-500' : 'text-red-500'}`}>
                                                    {details.deviation}
                                                </p>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="md:col-span-2 flex items-center text-slate-500 italic text-sm">
                                            <ClipboardList className="h-4 w-4 mr-2" />
                                            {log.description}
                                        </div>
                                    )}

                                    {/* Meta Info */}
                                    <div className="flex flex-col justify-center space-y-2 border-l border-slate-800/50 pl-6 md:pl-0 md:border-l-0">
                                        <div className="flex items-center text-xs text-slate-400">
                                            <Clock className="h-3 w-3 mr-2 text-slate-500" />
                                            {format(new Date(log.performed_at), "dd MMM yyyy, HH:mm", { locale: pt })}
                                        </div>
                                        <div className="flex items-center text-xs text-slate-400 font-medium">
                                            <div className="h-5 w-5 rounded-full bg-slate-800 flex items-center justify-center mr-2 ring-1 ring-slate-700">
                                                <User className="h-3 w-3 text-slate-400" />
                                            </div>
                                            {log.performer?.full_name || 'Técnico Lab'}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Observations if Fail */}
                            {!isPass && details?.user_notes && (
                                <div className="bg-red-500/5 border-t border-red-500/10 p-4">
                                    <p className="text-[10px] text-red-400 uppercase font-bold mb-1 tracking-widest flex items-center gap-2">
                                        <ClipboardList className="h-3 w-3" />
                                        Observações / Justificativa
                                    </p>
                                    <p className="text-sm text-slate-400 italic">"{details.user_notes}"</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                );
            })}
        </div>
    );
}

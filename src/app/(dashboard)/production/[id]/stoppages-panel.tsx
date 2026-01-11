"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, AlertTriangle, Settings, RefreshCcw, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { pt } from "date-fns/locale";

interface ProductionEvent {
    id: string;
    event_type: string;
    timestamp: string;
    user_name: string;
    metadata?: {
        reason_code?: string;
        notes?: string;
        [key: string]: any;
    };
}

interface StoppagesPanelProps {
    events: ProductionEvent[];
}

const EVENT_CONFIG: Record<string, { label: string, icon: any, color: string, bg: string }> = {
    start: { label: "Início", icon: Clock, color: "text-emerald-500", bg: "bg-emerald-500/10" },
    stop: { label: "Paragem", icon: Clock, color: "text-amber-500", bg: "bg-amber-500/10" },
    resume: { label: "Retoma", icon: RefreshCcw, color: "text-blue-500", bg: "bg-blue-500/10" },
    breakdown: { label: "Avaria", icon: AlertTriangle, color: "text-red-500", bg: "bg-red-500/10" },
    maintenance: { label: "Manutenção", icon: Settings, color: "text-slate-400", bg: "bg-slate-400/10" },
    shift_change: { label: "Troca Turno", icon: User, color: "text-violet-400", bg: "bg-violet-400/10" },
};

const REASON_LABELS: Record<string, string> = {
    MECHANICAL: "Falha Mecânica",
    ELECTRICAL: "Falha Elétrica",
    MATERIAL: "Falta de Matéria-Prima",
    QUALITY: "Problema de Qualidade",
    CLEANING: "Limpeza Planeada",
    OPERATOR: "Troca de Operador",
    WAITING: "Aguardando Análise",
};

export function StoppagesPanel({ events }: StoppagesPanelProps) {
    const stoppages = events.filter(e => ['stop', 'breakdown', 'maintenance', 'resume', 'start'].includes(e.event_type));

    return (
        <Card className="glass border-none shadow-sm rounded-2xl overflow-hidden">
            <CardHeader className="pb-2 border-b border-white/5 bg-white/5">
                <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                    <Clock className="h-3 w-3" />
                    Registo de Eventos e Paragens
                </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
                <div className="divide-y divide-white/5">
                    {stoppages.length > 0 ? (
                        stoppages.map((event) => {
                            const config = EVENT_CONFIG[event.event_type] || { label: event.event_type, icon: Clock, color: "text-muted-foreground", bg: "bg-muted" };
                            const Icon = config.icon;
                            const reason = event.metadata?.reason_code ? REASON_LABELS[event.metadata.reason_code] || event.metadata.reason_code : null;

                            return (
                                <div key={event.id} className="flex items-center justify-between p-4 group hover:bg-white/[0.02] transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className={cn("p-2 rounded-xl border border-white/5", config.bg)}>
                                            <Icon className={cn("h-4 w-4", config.color)} />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs font-bold tracking-tight">{config.label}</span>
                                                {reason && (
                                                    <Badge variant="outline" className="text-[8px] font-bold uppercase px-1.5 py-0 border-white/10 text-muted-foreground">
                                                        {reason}
                                                    </Badge>
                                                )}
                                            </div>
                                            <p className="text-[10px] text-muted-foreground flex items-center gap-2 mt-0.5">
                                                <User className="h-2 w-2" /> {event.user_name}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-[10px] font-bold tabular-nums">
                                            {format(new Date(event.timestamp), "HH:mm:ss", { locale: pt })}
                                        </div>
                                        <div className="text-[8px] text-muted-foreground uppercase font-medium">
                                            {format(new Date(event.timestamp), "dd MMM yyyy", { locale: pt })}
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <div className="py-12 text-center opacity-30">
                            <Clock className="h-8 w-8 mx-auto mb-2" />
                            <p className="text-[10px] font-bold uppercase tracking-widest">Sem eventos registados</p>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}

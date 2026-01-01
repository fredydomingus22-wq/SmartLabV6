"use client";

import { useState } from "react";
import {
    GlassTable,
    GlassTableHeader,
    GlassTableRow,
    GlassTableHead,
    GlassTableCell
} from "@/components/ui/glass-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import {
    Search,
    Filter,
    Calendar,
    Eye,
    User as UserIcon,
    ArrowRight,
    Activity,
    CheckCircle2,
    XCircle,
    MoreHorizontal,
    ArrowUpDown,
    BrainCircuit,
    AlertTriangle,
    ShieldAlert,
    AlertCircle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface AuditClientViewProps {
    initialEvents: any[];
    total: number;
}

export function AuditClientView({ initialEvents, total }: AuditClientViewProps) {
    const [events, setEvents] = useState(initialEvents);
    const [searchTerm, setSearchTerm] = useState("");

    const getEventColor = (type: string) => {
        if (type.includes('CREATED') || type.includes('REGISTERED')) return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
        if (type.includes('APPROVED') || type.includes('PUBLISHED')) return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20';
        if (type.includes('REJECTED')) return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
        if (type.includes('UPDATE') || type.includes('PROGRESSED')) return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
        return 'bg-slate-500/10 text-slate-400 border-white/5';
    };

    return (
        <div className="space-y-4">
            {/* Filters Bar */}
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between pb-2">
                <div className="flex items-center gap-3 w-full md:w-auto">
                    <div className="relative w-full md:w-80 group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
                        <Input
                            placeholder="Procurar por Entidade ou User..."
                            className="pl-10 h-11 bg-black/40 border-white/5 focus:border-indigo-500/50 rounded-xl transition-all"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <Button variant="outline" className="h-11 border-white/5 bg-white/5 gap-2 px-4 rounded-xl text-slate-400 hover:text-white">
                        <Filter className="h-4 w-4" />
                        <span>Filtros</span>
                    </Button>
                </div>

                <div className="flex items-center gap-2">
                    <Button variant="ghost" className="text-xs font-bold uppercase tracking-widest text-slate-500 hover:text-white">
                        Últimos 7 Dias
                    </Button>
                    <div className="h-4 w-px bg-white/5" />
                    <Button variant="ghost" className="text-xs font-bold uppercase tracking-widest text-slate-500 hover:text-white">
                        Este Mês
                    </Button>
                </div>
            </div>

            {/* Audit Table */}
            <div className="glass overflow-hidden rounded-3xl border-none shadow-2xl">
                <GlassTable>
                    <GlassTableHeader>
                        <GlassTableRow className="bg-white/[0.02]">
                            <GlassTableHead className="w-[180px]">Timestamp</GlassTableHead>
                            <GlassTableHead>Utilizador</GlassTableHead>
                            <GlassTableHead>AI Risk</GlassTableHead>
                            <GlassTableHead>Evento</GlassTableHead>
                            <GlassTableHead>Entidade</GlassTableHead>
                            <GlassTableHead className="text-right">Ações</GlassTableHead>
                        </GlassTableRow>
                    </GlassTableHeader>
                    <tbody>
                        {events.length > 0 ? (
                            events.map((event) => (
                                <GlassTableRow key={event.id} className="hover:bg-white/[0.03] transition-colors group">
                                    <GlassTableCell className="font-mono text-[11px] text-slate-400 tracking-tight">
                                        <div className="flex items-center gap-2">
                                            <Calendar className="h-3 w-3 text-indigo-500/50" />
                                            {format(new Date(event.created_at), "dd/MM/yyyy HH:mm:ss")}
                                        </div>
                                    </GlassTableCell>
                                    <GlassTableCell>
                                        <div className="flex items-center gap-3">
                                            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center border border-white/5">
                                                <UserIcon className="h-4 w-4 text-indigo-400" />
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-sm font-medium text-slate-200">
                                                    {event.user?.full_name || 'System / Batch'}
                                                </span>
                                                <span className="text-[10px] text-slate-500 font-mono">
                                                    {event.user?.email || 'automated@system'}
                                                </span>
                                            </div>
                                        </div>
                                    </GlassTableCell>
                                    <GlassTableCell>
                                        <div className="flex items-center gap-4">
                                            {/* AI Insight Badge */}
                                            {event.ai_insight && (
                                                <TooltipProvider>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <div className={cn(
                                                                "flex items-center justify-center h-8 w-8 rounded-lg animate-pulse shadow-lg transition-transform hover:scale-110",
                                                                event.ai_insight.status === 'blocked' ? "bg-red-500/20 text-red-400 border border-red-500/40" :
                                                                    event.ai_insight.status === 'warning' ? "bg-amber-500/20 text-amber-400 border border-amber-500/40" :
                                                                        "bg-blue-500/20 text-blue-400 border border-blue-500/40"
                                                            )}>
                                                                {event.ai_insight.status === 'blocked' ? <ShieldAlert className="h-4 w-4" /> :
                                                                    event.ai_insight.status === 'warning' ? <AlertTriangle className="h-4 w-4" /> :
                                                                        <BrainCircuit className="h-4 w-4" />}
                                                            </div>
                                                        </TooltipTrigger>
                                                        <TooltipContent side="right" className="glass border-white/5 p-3 max-w-xs">
                                                            <div className="space-y-1">
                                                                <p className="text-xs font-bold text-slate-100 uppercase tracking-wider flex items-center gap-2">
                                                                    <BrainCircuit className="h-3 w-3 text-indigo-400" />
                                                                    AI Analyst Insight
                                                                </p>
                                                                <p className="text-sm text-slate-300 leading-relaxed">
                                                                    {event.ai_insight.message}
                                                                </p>
                                                                <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/5">
                                                                    <span className="text-[10px] text-slate-500">Confidence: {(event.ai_insight.confidence * 100).toFixed(0)}%</span>
                                                                    <span className={cn(
                                                                        "text-[10px] font-bold px-1.5 rounded uppercase",
                                                                        event.ai_insight.status === 'blocked' ? "text-red-400 bg-red-400/10" :
                                                                            event.ai_insight.status === 'warning' ? "text-amber-400 bg-amber-400/10" :
                                                                                "text-blue-400 bg-blue-400/10"
                                                                    )}>
                                                                        {event.ai_insight.status}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                </TooltipProvider>
                                            )}
                                        </div>
                                    </GlassTableCell>
                                    <GlassTableCell>
                                        <Badge className={cn("px-2.5 py-1 text-[9px] font-black uppercase tracking-widest border", getEventColor(event.event_type))}>
                                            {event.event_type.replace(/_/g, ' ')}
                                        </Badge>
                                    </GlassTableCell>
                                    <GlassTableCell>
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest bg-white/5 px-1.5 py-0.5 rounded">
                                                {event.entity_type}
                                            </span>
                                            <ArrowRight className="h-3 w-3 text-slate-700" />
                                            <span className="text-xs font-mono text-indigo-300">
                                                {event.entity_id.substring(0, 8)}...
                                            </span>
                                        </div>
                                    </GlassTableCell>
                                    <GlassTableCell className="text-right">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 rounded-lg hover:bg-white/5 text-slate-500 hover:text-indigo-400 opacity-0 group-hover:opacity-100 transition-all"
                                        >
                                            <Eye className="h-4 w-4" />
                                        </Button>
                                    </GlassTableCell>
                                </GlassTableRow>
                            ))
                        ) : (
                            <GlassTableRow>
                                <GlassTableCell colSpan={5} className="py-20">
                                    <div className="flex flex-col items-center justify-center text-slate-500 gap-4">
                                        <Activity className="h-10 w-10 text-slate-800" />
                                        <p className="text-sm font-bold uppercase tracking-[0.2em]">Nenhum evento registado</p>
                                    </div>
                                </GlassTableCell>
                            </GlassTableRow>
                        )}
                    </tbody>
                </GlassTable>
            </div>

            <div className="flex justify-between items-center px-4 py-2">
                <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">
                    Página 1 de {Math.ceil(total / 50)} • Mostrando {events.length} registos
                </span>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" disabled className="h-8 border-white/5 bg-black/20 text-slate-600 px-4 rounded-lg">Anterior</Button>
                    <Button variant="outline" size="sm" className="h-8 border-white/5 bg-white/5 text-slate-400 hover:text-white px-4 rounded-lg">Próximo</Button>
                </div>
            </div>
        </div>
    );
}

"use client";

import React from "react";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, ShieldAlert, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

interface Props {
    lastCipDate?: string | null;
    isValid: boolean;
    className?: string;
}

export function HygieneGateBadge({ lastCipDate, isValid, className }: Props) {
    const getTimeSinceCip = () => {
        if (!lastCipDate) return null;
        const cipTime = new Date(lastCipDate).getTime();
        const now = Date.now();
        const hoursSince = Math.round((now - cipTime) / (1000 * 60 * 60));

        if (hoursSince < 24) return `${hoursSince}h`;
        return `${Math.round(hoursSince / 24)}d`;
    };

    const timeSince = getTimeSinceCip();

    if (isValid) {
        return (
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Badge
                            className={cn(
                                "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 font-bold text-[10px] uppercase tracking-widest gap-1.5 px-3 py-1.5 cursor-help",
                                className
                            )}
                        >
                            <ShieldCheck className="h-3.5 w-3.5" />
                            Higiene OK
                            {timeSince && (
                                <span className="text-emerald-500/70 ml-1">({timeSince})</span>
                            )}
                        </Badge>
                    </TooltipTrigger>
                    <TooltipContent className="bg-slate-950 border-slate-800">
                        <p className="text-xs">
                            Última limpeza CIP: {lastCipDate ? new Date(lastCipDate).toLocaleString('pt-PT') : 'N/A'}
                        </p>
                        <p className="text-xs text-emerald-400 mt-1">Equipamento libertado para produção</p>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
        );
    }

    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Badge
                        variant="destructive"
                        className={cn(
                            "bg-red-500/10 text-red-400 border-red-500/20 font-bold text-[10px] uppercase tracking-widest gap-1.5 px-3 py-1.5 cursor-help animate-pulse",
                            className
                        )}
                    >
                        <ShieldAlert className="h-3.5 w-3.5" />
                        CIP Necessário
                    </Badge>
                </TooltipTrigger>
                <TooltipContent className="bg-slate-950 border-slate-800">
                    <p className="text-xs text-red-400 font-medium">
                        Equipamento não libertado para produção
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                        {lastCipDate
                            ? `Última limpeza: ${new Date(lastCipDate).toLocaleString('pt-PT')} (expirado)`
                            : 'Nenhum registo CIP encontrado'}
                    </p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}

"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { AlertTriangle } from "lucide-react";

/**
 * ContextRow: Standard row for displaying metadata (Sample, Product, Batch)
 * with support for status indicators (e.g., calibration status).
 */
export function IndustrialContextRow({ label, value, icon, highlight, status }: {
    label: string,
    value: React.ReactNode,
    icon?: React.ReactNode,
    highlight?: boolean,
    status?: "calibrated" | "expired"
}) {
    return (
        <div className="flex items-center justify-between p-3 px-4 hover:bg-slate-800/30 transition-colors">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                {icon} {label}
            </span>
            <span className={cn(
                "text-xs font-semibold truncate max-w-[150px]",
                highlight ? "text-blue-400 uppercase font-black" : "text-slate-300",
                status === "expired" && "text-rose-400 font-black flex items-center gap-1 animate-pulse"
            )}>
                {value}
                {status === "expired" && <AlertTriangle className="h-3 w-3" />}
            </span>
        </div>
    );
}

/**
 * SpecBox: Compact display for specification limits (Min, Target, Max).
 */
export function IndustrialSpecBox({ label, value, color = "text-slate-400" }: {
    label: string,
    value: any,
    color?: string
}) {
    return (
        <div className="p-2 rounded-lg bg-slate-900 border border-slate-800/50 text-center">
            <div className="text-[8px] font-bold text-slate-500 uppercase">{label}</div>
            <div className={cn("text-xs font-black font-mono", color)}>
                {value !== null && value !== undefined ? value : "-"}
            </div>
        </div>
    );
}

/**
 * IndustrialBadge: Status badge with high contrast for industrial contexts.
 */
export function IndustrialStatusBadge({ status, className }: {
    status: "conforming" | "non_conforming" | "unknown",
    className?: string
}) {
    const config = {
        conforming: {
            label: "CONFORME",
            styles: "border-emerald-500/50 text-emerald-400 bg-emerald-500/5 shadow-[0_0_10px_rgba(16,185,129,0.2)]"
        },
        non_conforming: {
            label: "FORA DE ESPECIFICAÇÃO (OOS)",
            styles: "border-rose-500/50 text-rose-400 bg-rose-500/5 shadow-[0_0_10px_rgba(244,63,94,0.2)]"
        },
        unknown: {
            label: "PENDENTE",
            styles: "border-slate-500/50 text-slate-400 bg-slate-500/5"
        }
    };

    const { label, styles } = config[status];

    return (
        <div className={cn(
            "px-2 py-0.5 rounded-full border text-[9px] font-black uppercase tracking-tighter transition-all",
            styles,
            className
        )}>
            {label}
        </div>
    );
}

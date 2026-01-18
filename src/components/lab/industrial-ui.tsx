"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { AlertTriangle } from "lucide-react";

import { Badge } from "@/components/ui/badge";

/**
 * ContextRow: Standard row for displaying metadata (Sample, Product, Batch)
 */
export function IndustrialContextRow({ label, value, icon, highlight, status }: {
    label: string,
    value: React.ReactNode,
    icon?: React.ReactNode,
    highlight?: boolean,
    status?: "calibrated" | "expired"
}) {
    return (
        <div className="flex items-center justify-between py-1.5 px-4 hover:bg-accent/40 transition-colors border-b last:border-b-0">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-tighter flex items-center gap-1.5 opacity-80">
                {icon} {label}
            </span>
            <span className={cn(
                "text-[12px] font-semibold truncate max-w-[140px] tracking-tight",
                highlight ? "text-primary uppercase font-black" : "text-foreground",
                status === "expired" && "text-destructive font-black flex items-center gap-1"
            )}>
                {value}
                {status === "expired" && <AlertTriangle className="h-2.5 w-2.5" />}
            </span>
        </div>
    );
}

/**
 * SpecBox: Compact display for specification limits (Min, Target, Max).
 */
export function IndustrialSpecBox({ label, value, color = "text-muted-foreground" }: {
    label: string,
    value: any,
    color?: string
}) {
    return (
        <div className="p-1 px-2 rounded bg-muted/30 border text-center min-w-[50px]">
            <div className="text-[8px] font-black text-muted-foreground uppercase leading-none mb-0.5">{label}</div>
            <div className={cn("text-[11px] font-bold font-mono leading-none tracking-tighter", color)}>
                {value !== null && value !== undefined ? value : "—"}
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
            variant: "outline" as const,
            styles: "border-emerald-500/50 text-emerald-500 bg-emerald-500/5"
        },
        non_conforming: {
            label: "FORA DE ESPECIFICAÇÃO (OOS)",
            variant: "destructive" as const,
            styles: "bg-destructive/10 text-destructive border-destructive/20"
        },
        unknown: {
            label: "PENDENTE",
            variant: "outline" as const,
            styles: "text-muted-foreground"
        }
    };

    const { label, variant, styles } = config[status];

    return (
        <Badge variant={variant} className={cn(
            "rounded-full text-[9px] font-black uppercase tracking-tighter transition-all",
            styles,
            className
        )}>
            {label}
        </Badge>
    );
}

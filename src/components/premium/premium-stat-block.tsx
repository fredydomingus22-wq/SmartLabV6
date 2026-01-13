"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { LucideIcon } from "lucide-react";

/**
 * 📈 PremiumStatBlock
 * Single stat display for use within larger containers (not a card).
 */

interface PremiumStatBlockProps {
    title: string;
    value: string | number;
    subtitle?: string;
    icon?: React.ReactNode;
    badge?: string;
    badgeVariant?: "default" | "success" | "warning" | "error";
    variant?: "default" | "highlight";
    className?: string;
}

const badgeStyles = {
    default: "bg-slate-500/10 text-slate-400 border-none",
    success: "bg-emerald-500/10 text-emerald-400 border-none",
    warning: "bg-amber-500/10 text-amber-400 border-none",
    error: "bg-rose-500/10 text-rose-400 border-none"
};

export function PremiumStatBlock({
    title,
    value,
    subtitle,
    icon,
    badge,
    badgeVariant = "default",
    variant = "default",
    className
}: PremiumStatBlockProps) {
    return (
        <div className={cn(
            "p-8 rounded-3xl border border-white/5 bg-slate-950/40 glass group hover:bg-slate-900/50 transition-all duration-500",
            variant === "highlight" && "bg-gradient-to-br from-cyan-500/[0.03] to-transparent",
            className
        )}>
            <div className="flex items-center gap-4 mb-6">
                {icon && (
                    <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/5 group-hover:scale-110 transition-transform">
                        {icon}
                    </div>
                )}
                <div>
                    <h3 className="text-sm font-black text-white uppercase tracking-widest italic leading-none">{title}</h3>
                    {subtitle && (
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1 opacity-60">{subtitle}</p>
                    )}
                </div>
            </div>

            <div className="flex items-baseline gap-3">
                <span className="text-4xl font-black text-white italic tracking-tighter">{value}</span>
                {badge && (
                    <Badge className={cn("text-[10px] font-black italic", badgeStyles[badgeVariant])}>
                        {badge}
                    </Badge>
                )}
            </div>
        </div>
    );
}

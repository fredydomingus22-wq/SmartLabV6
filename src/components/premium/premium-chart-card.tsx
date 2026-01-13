"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { GlassCard } from "@/components/ui/glass-card";
import { LucideIcon } from "lucide-react";

/**
 * 📊 PremiumChartCard
 * Extended container for complex visualizations with integrated header and glass styling.
 */

interface PremiumChartCardProps {
    title: string;
    subtitle?: string;
    icon?: React.ReactNode;
    badge?: string;
    children: React.ReactNode;
    actions?: React.ReactNode;
    className?: string;
    contentClassName?: string;
}

export function PremiumChartCard({
    title,
    subtitle,
    icon,
    badge,
    children,
    actions,
    className,
    contentClassName
}: PremiumChartCardProps) {
    return (
        <GlassCard className={cn(
            "p-8 rounded-3xl border border-white/5 bg-slate-950/40 glass min-h-[400px] flex flex-col group transition-all duration-500 hover:bg-slate-900/40 hover:border-white/10",
            className
        )}>
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
                <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                        {badge && (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[8px] font-black uppercase tracking-widest border border-emerald-500/10">
                                {badge}
                            </span>
                        )}
                        {icon}
                    </div>
                    <h3 className="text-xl font-black text-white italic tracking-tighter uppercase leading-none">
                        {title}
                    </h3>
                    {subtitle && (
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic opacity-60">
                            {subtitle}
                        </p>
                    )}
                </div>
                {actions && (
                    <div className="flex items-center gap-2">
                        {actions}
                    </div>
                )}
            </div>

            {/* Content */}
            <div className={cn("flex-1 w-full", contentClassName)}>
                {children}
            </div>
        </GlassCard>
    );
}

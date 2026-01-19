"use client";

import React from "react";
import { GlassCard } from "./glass-card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { ArrowUpRight, LucideIcon } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface EntityCardMetric {
    label: string;
    value: string | number;
    icon?: LucideIcon;
}

interface EntityCardProps {
    title: string;
    code: string;
    category?: string;
    icon?: LucideIcon;
    status: {
        label: string;
        variant: "default" | "secondary" | "destructive" | "outline" | "warning" | "pending" | "active" | "approved" | "rejected" | "blocked" | "under_review" | "in_analysis";
    };
    metrics?: EntityCardMetric[];
    highlight?: {
        label: string;
        value: string;
        progress?: number;
        variant?: "emerald" | "amber" | "rose" | "blue" | "default";
    };
    onClick?: () => void;
    actions?: React.ReactNode;
    variant?: "default" | "blue" | "emerald" | "amber" | "rose" | "indigo" | "purple";
    className?: string;
}

export function EntityCard({
    title,
    code,
    category,
    icon: Icon,
    status,
    metrics,
    highlight,
    onClick,
    actions,
    variant = "default",
    className
}: EntityCardProps) {
    return (
        <GlassCard
            variant={variant}
            onClick={onClick}
            className={cn(
                "flex flex-col h-full group p-5 border-white/5",
                onClick && "cursor-pointer",
                className
            )}
        >
            {/* Header */}
            <div className="flex items-start justify-between mb-5">
                <div className="flex items-center gap-3">
                    {Icon && (
                        <div className="p-2.5 rounded-xl bg-slate-950/50 border border-white/5 shadow-inner group-hover:border-white/10 transition-colors">
                            <Icon className="h-4 w-4 text-slate-400 group-hover:text-blue-400 transition-colors" />
                        </div>
                    )}
                    <div className="space-y-0.5">
                        <h3 className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors flex items-center gap-1.5 leading-tight">
                            {title}
                            <ArrowUpRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </h3>
                        <div className="flex items-center gap-2">
                            <span className="font-mono text-[9px] text-slate-500 bg-slate-950 px-1.5 py-0.5 rounded border border-white/5 uppercase tracking-wider">
                                {code}
                            </span>
                            {category && (
                                <span className="text-[9px] text-slate-500 uppercase font-black tracking-widest leading-none">
                                    {category}
                                </span>
                            )}
                        </div>
                    </div>
                </div>
                <Badge variant={status.variant} className="rounded-lg border-none px-2 py-0.5 font-bold text-[9px] uppercase tracking-tight">
                    {status.label}
                </Badge>
            </div>

            {/* Metrics Grid */}
            {metrics && metrics.length > 0 && (
                <div className="grid grid-cols-2 gap-x-4 gap-y-3 mb-5">
                    {metrics.map((m, i) => (
                        <div key={i} className="space-y-1">
                            <p className="text-[9px] uppercase font-black text-slate-500 tracking-widest leading-none">{m.label}</p>
                            <div className="flex items-center gap-1.5">
                                {m.icon && <m.icon className="h-3 w-3 text-slate-600" />}
                                <p className="text-xs text-slate-200 font-medium truncate">{m.value}</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Highlight Section (e.g. Calibration/IA Risk) */}
            {highlight && (
                <div className={cn(
                    "mt-auto p-4 rounded-2xl border bg-slate-950/30 transition-all duration-300",
                    highlight.variant === 'rose' ? 'border-rose-500/20 group-hover:bg-rose-500/10' :
                        highlight.variant === 'amber' ? 'border-amber-500/20 group-hover:bg-amber-500/10' :
                            highlight.variant === 'emerald' ? 'border-emerald-500/20 group-hover:bg-emerald-500/10' :
                                highlight.variant === 'blue' ? 'border-blue-500/20 group-hover:bg-blue-500/10' :
                                    'border-white/5 group-hover:bg-white/5'
                )}>
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">{highlight.label}</span>
                    </div>
                    <div className="flex flex-col gap-2">
                        <span className={cn(
                            "text-base font-black tracking-tight",
                            highlight.variant === 'rose' ? 'text-rose-400' :
                                highlight.variant === 'amber' ? 'text-amber-400' :
                                    highlight.variant === 'emerald' ? 'text-emerald-400' :
                                        highlight.variant === 'blue' ? 'text-blue-400' :
                                            'text-slate-200'
                        )}>
                            {highlight.value}
                        </span>
                        {highlight.progress !== undefined && (
                            <div className="flex items-center gap-2">
                                <Progress
                                    value={highlight.progress}
                                    className="h-1 bg-slate-900 border-none rounded-full overflow-hidden"
                                    indicatorClassName={cn(
                                        highlight.variant === 'rose' ? 'bg-rose-500' :
                                            highlight.variant === 'amber' ? 'bg-amber-500' :
                                                highlight.variant === 'emerald' ? 'bg-emerald-500' :
                                                    highlight.variant === 'blue' ? 'bg-blue-500' :
                                                        'bg-slate-500'
                                    )}
                                />
                                <span className="text-[9px] font-mono text-slate-500 font-bold">{highlight.progress}%</span>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Actions */}
            {actions && (
                <div className="flex gap-2 mt-5 pt-4 border-t border-white/5">
                    {actions}
                </div>
            )}
        </GlassCard>
    );
}

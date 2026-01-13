"use client";

import React from "react";
import { Area, AreaChart, ResponsiveContainer, Tooltip } from "recharts";
import { motion } from "framer-motion";
import { ArrowUpRight, ArrowDownRight, LucideIcon, Activity } from "lucide-react";
import { cn } from "@/lib/utils";
import { GlassCard } from "@/components/ui/glass-card";

/**
 * 💎 PremiumMetricCard
 * Standardized industrial card with glassmorphism and real-time sparkline visualization.
 */

interface PremiumMetricCardProps {
    title: string;
    value: string | number;
    description?: string;
    subtext?: string; // Legacy support
    trend?: {
        value: number | string;
        isPositive: boolean;
    };
    trendValue?: number | string; // Legacy support
    trendType?: "up" | "down" | "neutral"; // Legacy support
    data?: any[];
    dataKey?: string;
    color?: string;
    variant?: "blue" | "emerald" | "amber" | "purple" | "rose" | "indigo" | "cyan";
    className?: string;
    icon?: React.ReactNode;
    loading?: boolean;
}

const variantStyles = {
    blue: { chart: "#3b82f6", glow: "bg-blue-500" },
    emerald: { chart: "#10b981", glow: "bg-emerald-500" },
    amber: { chart: "#f59e0b", glow: "bg-amber-500" },
    purple: { chart: "#8b5cf6", glow: "bg-purple-500" },
    rose: { chart: "#f43f5e", glow: "bg-rose-500" },
    indigo: { chart: "#6366f1", glow: "bg-indigo-500" },
    cyan: { chart: "#06b6d4", glow: "bg-cyan-500" }
};

export function PremiumMetricCard({
    title,
    value,
    description,
    subtext,
    trend,
    trendValue,
    trendType,
    data = [],
    dataKey = "value",
    color,
    variant = "blue",
    className,
    icon,
    loading = false
}: PremiumMetricCardProps) {
    const chartId = React.useId().replace(/[:.]/g, "");
    const style = variantStyles[variant];
    const finalColor = color || style.chart;

    // Normalization
    const finalDescription = description || subtext;
    const isTrendUp = trend ? trend.isPositive : trendType === "up";
    const finalTrendValue = trend ? trend.value : trendValue;

    return (
        <GlassCard className={cn(
            "p-0 overflow-hidden group h-[185px] flex flex-col justify-between relative border-white/[0.05] bg-slate-950/40 backdrop-blur-2xl rounded-3xl",
            className
        )}>
            {/* Background Glow */}
            <div className={cn(
                "absolute -right-8 -top-8 h-24 w-24 rounded-full blur-[50px] opacity-10 pointer-events-none group-hover:opacity-20 transition-opacity duration-700",
                style.glow
            )} />

            <div className="p-5 flex justify-between items-start z-10">
                <div className="space-y-1.5">
                    <div className="flex items-center gap-1.5">
                        {icon}
                        <p className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-500 italic opacity-80 group-hover:opacity-100 transition-opacity">
                            {title}
                        </p>
                    </div>

                    <div className="flex items-baseline gap-2">
                        <h3 className="text-3xl font-black tracking-tighter text-white uppercase italic leading-none">
                            {loading ? "---" : value}
                        </h3>
                    </div>

                    {finalDescription && (
                        <p className="text-[11px] font-medium text-slate-500/80 tracking-tight leading-relaxed line-clamp-1">
                            {finalDescription}
                        </p>
                    )}
                </div>

                {finalTrendValue !== undefined && (
                    <div className={cn(
                        "flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black italic tracking-tight border border-white/[0.05]",
                        isTrendUp ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/10" :
                            "bg-rose-500/10 text-rose-400 border-rose-500/10"
                    )}>
                        {isTrendUp ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                        {finalTrendValue}%
                    </div>
                )}
            </div>

            {/* Sparkline */}
            <div className="h-[75px] w-full relative mt-auto -mb-[2px] -mx-[4px]">
                {data.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={data} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                            <defs>
                                <linearGradient id={`gradient-${chartId}`} x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor={finalColor} stopOpacity={0.3} />
                                    <stop offset="95%" stopColor={finalColor} stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <Tooltip
                                content={({ active, payload }) => {
                                    if (active && payload && payload.length) {
                                        return (
                                            <div className="bg-slate-900/90 backdrop-blur-md border border-white/10 p-2 rounded-xl shadow-2xl">
                                                <p className="text-[10px] font-black text-white italic">{payload[0].value}</p>
                                            </div>
                                        );
                                    }
                                    return null;
                                }}
                            />
                            <Area
                                type="monotone"
                                dataKey={dataKey}
                                stroke={finalColor}
                                strokeWidth={2.5}
                                fillOpacity={1}
                                fill={`url(#gradient-${chartId})`}
                                animationDuration={2000}
                                isAnimationActive={true}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="h-full flex items-end px-5 pb-5 opacity-10">
                        <div className="w-full h-[1px] bg-slate-500" />
                    </div>
                )}
            </div>
        </GlassCard>
    );
}

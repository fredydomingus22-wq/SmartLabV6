"use client";

import React from "react";
import {
    Area,
    AreaChart,
    ResponsiveContainer,
} from "recharts";
import { motion } from "framer-motion";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";

/**
 * 📊 KPISparkCard - Shadcn Edition
 * 
 * Standardized to use Shadcn UI components while maintaining 
 * the premium analytical visualizations.
 */

interface KPISparkCardProps {
    title: string;
    value: string | number;
    description?: string;
    subtext?: string;
    trend?: number | { value: number | string; isPositive: boolean };
    trendValue?: number | string;
    trendType?: "up" | "down" | "neutral";
    data?: any[];
    sparklineData?: any[]; // Modern alternative
    dataKey?: string;
    variant?: "blue" | "emerald" | "amber" | "purple" | "rose" | "indigo" | "cyan" | "slate";
    color?: string; // Hex or CSS color
    className?: string;
    icon?: React.ReactNode;
}

const variantColors = {
    blue: "#3b82f6",
    emerald: "#10b981",
    amber: "#f59e0b",
    purple: "#8b5cf6",
    rose: "#f43f5e",
    indigo: "#6366f1",
    cyan: "#06b6d4",
    slate: "#94a3b8"
};

export function KPISparkCard({
    title,
    value,
    description,
    subtext,
    trend,
    trendValue,
    trendType,
    data,
    sparklineData,
    dataKey = "value",
    variant = "blue",
    color,
    className,
    icon,
}: KPISparkCardProps) {
    const finalColor = color || variantColors[variant] || variantColors.blue;
    const chartId = React.useId().replace(/[:.]/g, "");

    // Normalize Data
    const finalData = sparklineData || data || [];
    const finalDescription = description || subtext;

    // Normalize Trend logic
    let isTrendUp = true;
    let displayTrendValue: string | number | undefined = undefined;

    if (typeof trend === "number") {
        isTrendUp = trend >= 0;
        displayTrendValue = Math.abs(trend);
    } else if (trend && typeof trend === "object") {
        isTrendUp = trend.isPositive;
        displayTrendValue = trend.value;
    } else if (trendValue !== undefined) {
        isTrendUp = trendType === "up" || trendType === "neutral";
        displayTrendValue = trendValue;
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="h-full"
        >
            <Card className={cn(
                "group relative overflow-hidden transition-all duration-300 hover:shadow-xl h-[180px] flex flex-col justify-between border-slate-800 bg-card",
                className
            )}>
                {/* Visual Accent */}
                <div 
                    className="absolute top-0 left-0 w-1 h-full opacity-40 transition-opacity group-hover:opacity-100" 
                    style={{ backgroundColor: finalColor }}
                />

                {/* Header Section */}
                <div className="p-5 pb-0 z-10 flex justify-between items-start">
                    <div className="space-y-1">
                        <div className="flex items-center gap-1.5">
                            {icon && <span className="opacity-50">{icon}</span>}
                            <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500 italic">
                                {title}
                            </h3>
                        </div>
                        <div className="text-3xl font-black italic tracking-tighter text-white">
                            {value}
                        </div>
                        {finalDescription && (
                            <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest line-clamp-1">
                                {finalDescription}
                            </p>
                        )}
                    </div>

                    {displayTrendValue !== undefined && (
                        <div className={cn(
                            "flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-black uppercase border",
                            isTrendUp ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" :
                                "bg-rose-500/10 text-rose-500 border-rose-500/20"
                        )}>
                            {isTrendUp ? <ArrowUpRight className="h-2.5 w-2.5" /> : <ArrowDownRight className="h-2.5 w-2.5" />}
                            {displayTrendValue}%
                        </div>
                    )}
                </div>

                {/* Chart Section */}
                <div className="h-[70px] w-full relative -mb-1">
                    {finalData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={finalData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id={`gradient-${chartId}`} x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor={finalColor} stopOpacity={0.4} />
                                        <stop offset="95%" stopColor={finalColor} stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <Area
                                    type="monotone"
                                    dataKey={dataKey}
                                    stroke={finalColor}
                                    strokeWidth={2}
                                    fill={`url(#gradient-${chartId})`}
                                    fillOpacity={1}
                                    isAnimationActive={true}
                                    animationDuration={1500}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-full flex items-end px-5 pb-4 opacity-5">
                            <div className="w-full h-[1px] bg-slate-500 border-dashed border-t" />
                        </div>
                    )}
                </div>
            </Card>
        </motion.div>
    );
}

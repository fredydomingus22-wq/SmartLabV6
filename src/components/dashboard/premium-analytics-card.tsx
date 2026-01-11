"use client";

import React from "react";
import {
    Area,
    AreaChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
    CartesianGrid,
} from "recharts";
import { GlassCard } from "@/components/ui/glass-card";
import { motion } from "framer-motion";
import { TrendingUp, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface PremiumAnalyticsCardProps {
    title: string;
    value: string | number;
    description: string;
    trend?: {
        value: number;
        isPositive: boolean;
    };
    data: any[];
    dataKey: string;
    color?: string;
}

export function PremiumAnalyticsCard({
    title,
    value,
    description,
    trend,
    data,
    dataKey,
    color = "#3b82f6", // Default blue-500
    className
}: PremiumAnalyticsCardProps & { className?: string }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
        >
            <GlassCard className={cn("p-5 overflow-hidden group h-[180px] flex flex-col justify-between relative", className)}>
                <div className="flex justify-between items-start mb-2 relative z-10">
                    <div>
                        <p className="text-xs font-medium text-muted-foreground mb-1 uppercase tracking-wider">{title}</p>
                        <h3 className="text-2xl font-bold tracking-tight">{value}</h3>
                        <p className="text-[11px] text-muted-foreground mt-0.5">{description}</p>
                    </div>
                    {trend && (
                        <div
                            className={cn(
                                "flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold",
                                trend.isPositive
                                    ? "bg-green-500/10 text-green-500"
                                    : "bg-red-500/10 text-red-500"
                            )}
                        >
                            {trend.isPositive ? (
                                <ArrowUpRight className="h-3 w-3" />
                            ) : (
                                <ArrowDownRight className="h-3 w-3" />
                            )}
                            {trend.value}%
                        </div>
                    )}
                </div>

                <div className="h-[90px] min-h-[90px] w-full mt-2 -mx-2 relative">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={data}>
                            <defs>
                                <linearGradient id={`gradient-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                                    <stop offset="95%" stopColor={color} stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <Tooltip
                                content={({ active, payload }) => {
                                    if (active && payload && payload.length) {
                                        return (
                                            <div className="glass p-2 border border-white/10 rounded-lg text-xs shadow-2xl">
                                                <p className="font-bold">{payload[0].value}</p>
                                            </div>
                                        );
                                    }
                                    return null;
                                }}
                            />
                            <Area
                                type="monotone"
                                dataKey={dataKey}
                                stroke={color}
                                strokeWidth={2}
                                fillOpacity={1}
                                fill={`url(#gradient-${dataKey})`}
                                animationDuration={1500}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </GlassCard>
        </motion.div>
    );
}

"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { LucideIcon, ArrowUpRight, ArrowDownRight, Info } from "lucide-react";
import { Box, Typography, Skeleton, Tooltip, IconButton } from "@mui/material";
import { motion } from "framer-motion";

interface IndustrialCardProps {
    children?: React.ReactNode;
    title?: string;
    subtitle?: string;
    icon?: LucideIcon;
    status?: "active" | "warning" | "error" | "success" | "neutral";
    value?: string | number;
    description?: string;
    tooltip?: string;
    trend?: {
        value: number;
        isPositive: boolean;
    };
    actions?: React.ReactNode;
    footer?: React.ReactNode;
    variant?: "default" | "analytics" | "compact";
    className?: string;
    loading?: boolean;
    animate?: boolean;
    bodyClassName?: string;
}

/**
 * IndustrialCard: The Master Component for SmartLab Enterprise.
 * Refined for 100% visual parity with the provided reference image.
 */
export function IndustrialCard({
    children,
    title,
    subtitle,
    icon: Icon,
    status = "neutral",
    value,
    description,
    tooltip,
    trend,
    actions,
    footer,
    variant = "default",
    className,
    loading = false,
    animate = true,
    bodyClassName,
}: IndustrialCardProps) {

    // Status mapping for the subtle industrial accent (top line)
    const accentColors = {
        active: "bg-blue-600 shadow-[0_0_15px_rgba(37,99,235,0.4)]",
        warning: "bg-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.4)]",
        error: "bg-rose-600 shadow-[0_0_15px_rgba(225,29,72,0.4)]",
        success: "bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.4)]",
        neutral: "bg-slate-700 shadow-none",
    };

    const cardContent = (
        <div
            className={cn(
                "relative flex flex-col h-full rounded-[24px] overflow-hidden transition-all duration-500 group",
                // DEEPER PREMIUM GLASS (Refined based on reference image)
                "bg-slate-900/60 backdrop-blur-3xl border border-white/5 shadow-2xl",
                "hover:bg-slate-900/80 hover:border-white/15 transition-all duration-300",
                variant === "analytics" && "min-h-[200px]",
                className
            )}
        >
            {/* Subtle Top Industrial Accent */}
            <div className={cn("h-1 w-full absolute top-0 left-0 z-20 transition-all duration-500", accentColors[status])} />

            {/* Premium Analytics Variant (EXACT match to Reference) */}
            {variant === "analytics" && (
                <div className="p-6 flex flex-col h-full group">
                    {/* Header Row: Title + Trend (As seen in image) */}
                    <div className="flex justify-between items-center mb-6 relative z-10 w-full">
                        <div className="flex items-center gap-2">
                            <Typography className="text-sm font-semibold text-slate-300/80 group-hover:text-white transition-colors">
                                {title}
                            </Typography>
                            {tooltip && (
                                <Tooltip title={tooltip} arrow placement="top">
                                    <IconButton size="small" className="p-0 text-slate-600 hover:text-slate-400 transition-colors">
                                        <Info className="h-3.5 w-3.5" />
                                    </IconButton>
                                </Tooltip>
                            )}
                        </div>

                        {trend && (
                            <div className={cn(
                                "flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border border-white/5",
                                trend.isPositive ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400"
                            )}>
                                {trend.isPositive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                                {trend.value}%
                            </div>
                        )}
                    </div>

                    {/* Value Area (Increased prominence as seen in image) */}
                    <div className="mb-1">
                        {loading ? (
                            <Skeleton variant="text" width={100} height={48} className="bg-white/5" />
                        ) : (
                            <Typography className="text-4xl font-black tracking-tight text-white group-hover:text-blue-50 transition-colors">
                                {value}
                            </Typography>
                        )}
                    </div>

                    {/* Description */}
                    <Typography className="text-[11px] leading-relaxed text-slate-500 font-medium group-hover:text-slate-400 transition-colors">
                        {description}
                    </Typography>

                    {/* Grounded Sparkline Container (flush with bottom) */}
                    <div className="h-[80px] min-h-[80px] w-full mt-auto -mx-2 mb-[-12px] relative overflow-visible flex items-end">
                        <div className="w-full h-full opacity-60 group-hover:opacity-100 transition-opacity duration-500">
                            {children}
                        </div>
                    </div>
                </div>
            )}

            {/* Standard/Default/Compact Variants */}
            {variant !== "analytics" && (
                <>
                    {(title || Icon || actions) && (
                        <div className="flex justify-between items-start p-6 pb-2">
                            <div className="flex gap-4">
                                {Icon && (
                                    <div className="p-2.5 rounded-2xl bg-white/5 border border-white/5 text-blue-400 group-hover:scale-110 transition-transform duration-500">
                                        <Icon className="h-5 w-5" />
                                    </div>
                                )}
                                <div>
                                    {title && (
                                        <div className="flex items-center gap-2">
                                            <Typography className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500 group-hover:text-slate-400 transition-colors">
                                                {title}
                                            </Typography>
                                            {tooltip && (
                                                <Tooltip title={tooltip} arrow placement="top">
                                                    <IconButton size="small" className="p-0 text-slate-600 hover:text-slate-400 transition-colors">
                                                        <Info className="h-3 w-3" />
                                                    </IconButton>
                                                </Tooltip>
                                            )}
                                        </div>
                                    )}
                                    {subtitle && (
                                        <Typography className="text-sm font-bold text-slate-200 mt-1">
                                            {subtitle}
                                        </Typography>
                                    )}
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                {actions}
                            </div>
                        </div>
                    )}

                    <div className={cn("flex-grow p-6 pt-2", bodyClassName)}>
                        {loading ? (
                            <div className="space-y-3">
                                <Skeleton variant="rectangular" height={120} className="rounded-2xl bg-white/5" />
                            </div>
                        ) : (
                            children
                        )}
                    </div>

                    {footer && (
                        <div className="p-4 bg-black/30 border-t border-white/5 backdrop-blur-md">
                            {footer}
                        </div>
                    )}
                </>
            )}
        </div>
    );

    if (animate) {
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.98, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="h-full"
            >
                {cardContent}
            </motion.div>
        );
    }

    return cardContent;
}

export function IndustrialGrid({
    children,
    cols = 3,
    className,
}: {
    children: React.ReactNode;
    cols?: 1 | 2 | 3 | 4;
    className?: string;
}) {
    const colStyles = {
        1: "grid-cols-1",
        2: "grid-cols-1 md:grid-cols-2",
        3: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
        4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
    };

    return (
        <div className={cn("grid gap-8", colStyles[cols], className)}>
            {children}
        </div>
    );
}

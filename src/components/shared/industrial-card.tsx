"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface IndustrialCardProps {
    children: React.ReactNode;
    title?: string;
    subtitle?: string;
    icon?: LucideIcon;
    status?: "active" | "warning" | "error" | "success" | "neutral";
    className?: string;
    headerClassName?: string;
    bodyClassName?: string;
}

/**
 * IndustrialCard: Base glassmorphism container with status indicators.
 * Provides a consistent "Industrial Design" aesthetic across all modules.
 */
export function IndustrialCard({
    children,
    title,
    subtitle,
    icon: Icon,
    status = "neutral",
    className,
    headerClassName,
    bodyClassName,
}: IndustrialCardProps) {
    const statusStyles = {
        active: "border-blue-500/30 shadow-blue-500/10",
        warning: "border-amber-500/30 shadow-amber-500/10",
        error: "border-rose-500/30 shadow-rose-500/10",
        success: "border-emerald-500/30 shadow-emerald-500/10",
        neutral: "border-slate-800/50",
    };

    const iconBgStyles = {
        active: "bg-blue-500/10 text-blue-400",
        warning: "bg-amber-500/10 text-amber-400",
        error: "bg-rose-500/10 text-rose-400",
        success: "bg-emerald-500/10 text-emerald-400",
        neutral: "bg-slate-800 text-slate-400",
    };

    const accentBarStyles = {
        active: "bg-blue-500",
        warning: "bg-amber-500",
        error: "bg-rose-500",
        success: "bg-emerald-500",
        neutral: "bg-slate-700",
    };

    return (
        <div
            className={cn(
                "rounded-2xl border bg-slate-900/50 backdrop-blur-xl shadow-2xl overflow-hidden",
                statusStyles[status],
                className
            )}
        >
            {/* Status Accent Bar */}
            <div className={cn("h-1 w-full", accentBarStyles[status])} />

            {/* Header */}
            {(title || Icon) && (
                <div
                    className={cn(
                        "flex items-center gap-3 p-4 border-b border-slate-800/50 bg-slate-900/80",
                        headerClassName
                    )}
                >
                    {Icon && (
                        <div className={cn("p-2 rounded-xl", iconBgStyles[status])}>
                            <Icon className="h-5 w-5" />
                        </div>
                    )}
                    <div>
                        {title && (
                            <h3 className="text-sm font-black uppercase tracking-tighter text-slate-200">
                                {title}
                            </h3>
                        )}
                        {subtitle && (
                            <p className="text-[10px] text-slate-500 font-mono">
                                {subtitle}
                            </p>
                        )}
                    </div>
                </div>
            )}

            {/* Body */}
            <div className={cn("p-4", bodyClassName)}>{children}</div>
        </div>
    );
}

/**
 * IndustrialGrid: Responsive grid container for industrial layouts.
 */
export function IndustrialGrid({
    children,
    cols = 2,
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
        4: "grid-cols-1 md:grid-cols-2 lg:grid-cols-4",
    };

    return (
        <div className={cn("grid gap-4", colStyles[cols], className)}>
            {children}
        </div>
    );
}

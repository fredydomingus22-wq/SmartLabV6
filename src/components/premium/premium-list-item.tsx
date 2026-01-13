"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

/**
 * 🔗 PremiumListItem
 * Individual item component designed to live inside PremiumListCard or PremiumSection.
 */

interface PremiumListItemProps {
    title: string;
    subtext?: string;
    subtitle?: string; // Legacy support
    value?: string | number;
    icon?: React.ReactNode;
    status?: "default" | "success" | "warning" | "error" | "info";
    className?: string;
}

const statusStyles = {
    default: "bg-white/[0.03] border-white/5 text-white/70",
    success: "bg-emerald-500/10 border-emerald-500/10 text-emerald-400",
    warning: "bg-amber-500/10 border-amber-500/10 text-amber-400",
    error: "bg-rose-500/10 border-rose-500/10 text-rose-400",
    info: "bg-cyan-500/10 border-cyan-500/10 text-cyan-400"
};

export function PremiumListItem({
    title,
    subtext,
    subtitle,
    value,
    icon,
    status = "default",
    className
}: PremiumListItemProps) {
    const displayText = subtext || subtitle;
    return (
        <div className={cn(
            "flex items-center justify-between p-4 rounded-2xl transition-all duration-300 group border border-transparent hover:bg-white/[0.05] hover:border-white/5",
            className
        )}>
            <div className="flex items-center gap-4">
                {icon && (
                    <div className={cn(
                        "h-10 w-10 rounded-xl flex items-center justify-center border transition-transform duration-500 group-hover:scale-110",
                        statusStyles[status]
                    )}>
                        {icon}
                    </div>
                )}
                <div className="space-y-0.5">
                    <p className="text-[11px] font-black text-white uppercase italic tracking-tight group-hover:text-cyan-400 transition-colors">
                        {title}
                    </p>
                    {displayText && (
                        <p className="text-[10px] font-medium text-slate-500 uppercase tracking-widest opacity-60">
                            {displayText}
                        </p>
                    )}
                </div>
            </div>
            {value !== undefined && (
                <span className="text-sm font-black text-white italic tracking-tighter group-hover:scale-110 transition-transform">
                    {value}
                </span>
            )}
        </div>
    );
}

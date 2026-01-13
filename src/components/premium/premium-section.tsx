"use client";

import React from "react";
import { Sparkles, LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface PremiumSectionProps {
    title: string;
    subtitle?: string;
    icon?: LucideIcon;
    badge?: string;
    children: React.ReactNode;
    className?: string;
    titleClassName?: string;
}

export function PremiumSection({
    title,
    subtitle,
    icon: Icon,
    badge,
    children,
    className,
    titleClassName
}: PremiumSectionProps) {
    return (
        <section className={cn("space-y-6", className)}>
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 px-1">
                <div className="space-y-1.5">
                    <div className="flex items-center gap-2 text-cyan-400">
                        {Icon ? <Icon className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] italic opacity-80">
                            {badge || "Process Intelligence"}
                        </span>
                    </div>
                    <h2 className={cn(
                        "text-2xl font-black tracking-tighter text-white uppercase italic leading-none",
                        titleClassName
                    )}>
                        {title}
                    </h2>
                    {subtitle && (
                        <p className="text-slate-500 text-sm font-medium tracking-tight">
                            {subtitle}
                        </p>
                    )}
                </div>
            </div>
            <div className="w-full">
                {children}
            </div>
        </section>
    );
}

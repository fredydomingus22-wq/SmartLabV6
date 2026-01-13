"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { LucideIcon, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * 📋 PremiumListCard
 * Optimized for displaying recent activities, logs, or quick entity previews.
 */

interface PremiumListCardProps {
    title: string;
    icon?: React.ReactNode;
    children: React.ReactNode;
    footerHref?: string;
    footerLabel?: string;
    className?: string;
}

export function PremiumListCard({
    title,
    icon,
    children,
    footerHref,
    footerLabel = "Ver Todos",
    className
}: PremiumListCardProps) {
    return (
        <div className={cn(
            "p-10 rounded-3xl border border-white/5 bg-slate-950/40 glass flex flex-col h-full transition-all duration-500 hover:bg-slate-900/40",
            className
        )}>
            <div className="flex items-center gap-3 mb-8">
                {icon}
                <h3 className="text-sm font-black text-white italic uppercase tracking-widest leading-none">
                    {title}
                </h3>
            </div>

            <div className="flex-1 space-y-4">
                {children}
            </div>

            {footerHref && (
                <div className="mt-8 pt-6 border-t border-white/5">
                    <Button
                        variant="ghost"
                        className="w-full justify-between text-slate-400 hover:text-white group p-0 h-auto font-black uppercase text-[10px] tracking-widest italic"
                    >
                        <span>{footerLabel}</span>
                        <ArrowRight className="h-4 w-4 transform group-hover:translate-x-1 transition-transform" />
                    </Button>
                </div>
            )}
        </div>
    );
}

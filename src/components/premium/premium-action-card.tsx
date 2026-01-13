"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { LucideIcon, ArrowRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

/**
 * ⚡ PremiumActionCard
 * Industrial-grade action card for quick navigation and feature highlights.
 */

interface PremiumActionCardProps {
    title: string;
    description: string;
    icon: React.ReactNode;
    href: string;
    stats?: { label: string; value: string | number }[];
    color?: "cyan" | "emerald" | "amber" | "purple" | "rose" | "indigo" | "blue";
    className?: string;
}

const colorStyles = {
    cyan: {
        icon: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
        hover: "group-hover:border-cyan-500/30"
    },
    emerald: {
        icon: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
        hover: "group-hover:border-emerald-500/30"
    },
    amber: {
        icon: "bg-amber-500/10 text-amber-400 border-amber-500/20",
        hover: "group-hover:border-amber-500/30"
    },
    purple: {
        icon: "bg-purple-500/10 text-purple-400 border-purple-500/20",
        hover: "group-hover:border-purple-500/30"
    },
    rose: {
        icon: "bg-rose-500/10 text-rose-400 border-rose-500/20",
        hover: "group-hover:border-rose-500/30"
    },
    indigo: {
        icon: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
        hover: "group-hover:border-indigo-500/30"
    },
    blue: {
        icon: "bg-blue-500/10 text-blue-400 border-blue-500/20",
        hover: "group-hover:border-blue-500/30"
    }
};

export function PremiumActionCard({
    title,
    description,
    icon,
    href,
    stats,
    color = "cyan",
    className
}: PremiumActionCardProps) {
    const style = colorStyles[color];

    return (
        <Link href={href} className="block">
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className={cn(
                    "group p-8 rounded-3xl border border-white/5 bg-slate-950/40 glass transition-all duration-500 hover:bg-slate-900/50",
                    style.hover,
                    className
                )}
            >
                <div className="flex items-start justify-between mb-6">
                    <div className={cn(
                        "p-4 rounded-2xl border transition-transform duration-500 group-hover:scale-110",
                        style.icon
                    )}>
                        {icon}
                    </div>
                    <ArrowRight className="h-5 w-5 text-slate-600 group-hover:text-white group-hover:translate-x-1 transition-all duration-300" />
                </div>

                <h3 className="text-lg font-black text-white italic uppercase tracking-tight leading-tight mb-2 group-hover:text-cyan-400 transition-colors">
                    {title}
                </h3>
                <p className="text-[11px] font-medium text-slate-500 tracking-tight leading-relaxed mb-6">
                    {description}
                </p>

                {stats && stats.length > 0 && (
                    <div className="flex items-center gap-6 pt-6 border-t border-white/5">
                        {stats.map((stat, i) => (
                            <div key={i} className="space-y-1">
                                <p className="text-xl font-black text-white italic tracking-tighter">{stat.value}</p>
                                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest italic">{stat.label}</p>
                            </div>
                        ))}
                    </div>
                )}
            </motion.div>
        </Link>
    );
}

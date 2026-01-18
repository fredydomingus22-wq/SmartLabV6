"use client";

import React from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { motion } from "framer-motion";
import { LucideIcon, ArrowRight } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface PremiumActionCardProps {
    title: string;
    description: string;
    href: string;
    icon: React.ReactNode;
    color: string;
    stats?: string | number;
    statsLabel?: string;
}

export function PremiumActionCard({
    title,
    description,
    href,
    icon,
    color,
    stats,
    statsLabel
}: PremiumActionCardProps) {
    return (
        <Link href={href} className="block group h-full">
            <motion.div
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                className="h-full"
            >
                <div className="h-full relative overflow-hidden rounded-lg border border-white/5 bg-slate-950/40 backdrop-blur-xl p-6 transition-all duration-500 hover:border-white/10 group-hover:shadow-2xl group-hover:shadow-black/40 flex flex-col">
                    {/* Background Glow */}
                    <div
                        className="absolute -right-8 -top-8 w-32 h-32 blur-[60px] opacity-10 transition-opacity duration-500 group-hover:opacity-20 pointer-events-none"
                        style={{ backgroundColor: color }}
                    />

                    <div className="flex items-center gap-6 mb-6">
                        <div
                            className="p-4 rounded-lg bg-white/[0.03] border border-white/5 flex items-center justify-center transition-all duration-500 group-hover:rotate-[10deg] group-hover:scale-110 shadow-inner"
                            style={{ color }}
                        >
                            {icon}
                        </div>
                        <div className="space-y-1">
                            <h3 className="font-black text-lg text-white italic uppercase tracking-tighter leading-none">{title}</h3>
                            <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest italic opacity-60 line-clamp-1">{description}</p>
                        </div>
                    </div>

                    <div className="mt-auto flex items-end justify-between">
                        {stats !== undefined && (
                            <div className="space-y-1">
                                <p className="text-2xl font-black text-white italic leading-none tracking-tighter">{stats}</p>
                                <p className="text-[9px] uppercase tracking-[0.2em] text-slate-500 font-black italic">
                                    {statsLabel}
                                </p>
                            </div>
                        )}
                        <div className="flex items-center gap-2 text-[10px] font-black text-blue-400 uppercase tracking-widest italic opacity-0 group-hover:opacity-100 transition-all duration-500 translate-x-4 group-hover:translate-x-0">
                            Acessar
                            <ArrowRight className="h-3 w-3" />
                        </div>
                    </div>
                </div>
            </motion.div>
        </Link>
    );
}

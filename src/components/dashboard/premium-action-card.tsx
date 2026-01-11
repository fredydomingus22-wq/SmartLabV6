"use client";

import React from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";
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
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="h-full"
            >
                <GlassCard className="p-5 h-full flex flex-col relative overflow-hidden transition-all duration-300 group-hover:border-primary/50 group-hover:shadow-xl">
                    {/* Background Glow */}
                    <div
                        className="absolute -right-4 -top-4 w-24 h-24 blur-3xl opacity-10 group-hover:opacity-20 transition-opacity"
                        style={{ backgroundColor: color }}
                    />

                    <div className="flex items-center gap-4 mb-4">
                        <div
                            className="p-3 rounded-xl glass flex items-center justify-center transition-transform duration-500 group-hover:rotate-12"
                            style={{ color }}
                        >
                            {icon}
                        </div>
                        <div>
                            <h3 className="font-semibold text-base tracking-tight">{title}</h3>
                            <p className="text-[11px] text-muted-foreground line-clamp-1">{description}</p>
                        </div>
                    </div>

                    <div className="mt-auto flex items-end justify-between">
                        {stats !== undefined && (
                            <div>
                                <p className="text-xl font-bold tracking-tighter">{stats}</p>
                                <p className="text-[9px] uppercase tracking-widest text-muted-foreground font-semibold">
                                    {statsLabel}
                                </p>
                            </div>
                        )}
                        <div className="flex items-center text-xs font-semibold text-primary opacity-0 group-hover:opacity-100 transition-opacity translate-x-4 group-hover:translate-x-0 duration-300">
                            Acessar →
                        </div>
                    </div>
                </GlassCard>
            </motion.div>
        </Link>
    );
}

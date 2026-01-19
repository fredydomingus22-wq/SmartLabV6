"use client";

import { cn } from "@/lib/utils";
import React from "react";
import { motion, HTMLMotionProps } from "framer-motion";

interface GlassCardProps extends HTMLMotionProps<"div"> {
    children: React.ReactNode;
    variant?: "default" | "blue" | "emerald" | "amber" | "rose" | "indigo" | "purple";
    hoverEffect?: boolean;
}

const variantStyles = {
    default: "border-slate-800/50 bg-slate-900/40 hover:border-slate-700/50",
    blue: "border-blue-500/10 bg-blue-500/5 hover:border-blue-500/30 shadow-blue-500/5",
    emerald: "border-emerald-500/10 bg-emerald-500/5 hover:border-emerald-500/30 shadow-emerald-500/5",
    amber: "border-amber-500/10 bg-amber-500/5 hover:border-amber-500/30 shadow-amber-500/5",
    rose: "border-rose-500/10 bg-rose-500/5 hover:border-rose-500/30 shadow-rose-500/5",
    indigo: "border-indigo-500/10 bg-indigo-500/5 hover:border-indigo-500/30 shadow-indigo-500/5",
    purple: "border-purple-500/10 bg-purple-500/5 hover:border-purple-500/30 shadow-purple-500/5",
};

export function GlassCard({
    children,
    className,
    variant = "default",
    hoverEffect = true,
    ...props
}: GlassCardProps) {
    return (
        <motion.div
            whileHover={hoverEffect ? { y: -4, transition: { duration: 0.3 } } : undefined}
            className={cn(
                "relative overflow-hidden backdrop-blur-md border rounded-3xl transition-all duration-500",
                variantStyles[variant],
                className
            )}
            {...props}
        >
            {/* Glossy Overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/[0.03] to-transparent pointer-events-none" />

            <div className="relative z-10 h-full">
                {children}
            </div>
        </motion.div>
    );
}

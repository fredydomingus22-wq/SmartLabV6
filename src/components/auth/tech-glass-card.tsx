"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface TechGlassCardProps {
    children: React.ReactNode;
    className?: string;
}

/**
 * TechGlassCard - Futuristic Glassmorphism Card
 * Features:
 * - Deep obsidian glass effect
 * - Cyber corner brackets
 * - Subtle scanline overlay
 * - Neon border glow on hover
 */
export function TechGlassCard({ children, className }: TechGlassCardProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className={cn(
                "relative group",
                className
            )}
        >
            {/* Main Glass Container */}
            <div className="relative bg-slate-950/80 backdrop-blur-2xl border border-slate-700/50 rounded-xl overflow-hidden shadow-2xl shadow-cyan-500/5">
                {/* Corner Brackets */}
                <div className="absolute top-0 left-0 w-6 h-6 border-l-2 border-t-2 border-cyan-400/60 rounded-tl-lg" />
                <div className="absolute top-0 right-0 w-6 h-6 border-r-2 border-t-2 border-cyan-400/60 rounded-tr-lg" />
                <div className="absolute bottom-0 left-0 w-6 h-6 border-l-2 border-b-2 border-cyan-400/60 rounded-bl-lg" />
                <div className="absolute bottom-0 right-0 w-6 h-6 border-r-2 border-b-2 border-cyan-400/60 rounded-br-lg" />

                {/* Scanline Overlay */}
                <div className="absolute inset-0 pointer-events-none opacity-[0.02] bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,rgba(6,182,212,0.03)_2px,rgba(6,182,212,0.03)_4px)]" />

                {/* Hover Glow Effect */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-b from-cyan-500/5 via-transparent to-emerald-500/5 pointer-events-none" />

                {/* Content */}
                <div className="relative z-10 p-6 sm:p-8">
                    {children}
                </div>
            </div>

            {/* Outer Glow Ring */}
            <div className="absolute -inset-px rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-r from-cyan-500/20 via-transparent to-emerald-500/20 -z-10 blur-sm" />
        </motion.div>
    );
}

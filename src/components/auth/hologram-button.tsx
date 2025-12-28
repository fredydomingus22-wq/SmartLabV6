"use client";

import { forwardRef } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

interface HologramButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    loading?: boolean;
    variant?: "primary" | "secondary" | "ghost";
    children: React.ReactNode;
}

/**
 * HologramButton - Futuristic Action Button
 * Features:
 * - Hex-pattern texture
 * - Magnetic hover effect
 * - Loading state with spinner
 * - Glow pulse animation
 */
export const HologramButton = forwardRef<HTMLButtonElement, HologramButtonProps>(
    ({ className, children, loading, disabled, variant = "primary", ...props }, ref) => {
        const isDisabled = loading || disabled;

        return (
            <motion.button
                ref={ref}
                whileHover={!isDisabled ? { scale: 1.02 } : undefined}
                whileTap={!isDisabled ? { scale: 0.98 } : undefined}
                className={cn(
                    "relative w-full py-3 px-6 rounded-lg font-semibold text-sm sm:text-base",
                    "transition-all duration-300 overflow-hidden group",
                    "disabled:opacity-50 disabled:cursor-not-allowed",
                    variant === "primary" && [
                        "bg-gradient-to-r from-cyan-600 via-cyan-500 to-emerald-500",
                        "text-white shadow-lg shadow-cyan-500/25",
                        "hover:shadow-xl hover:shadow-cyan-500/30",
                    ],
                    variant === "secondary" && [
                        "bg-slate-800/50 border border-slate-700/50",
                        "text-slate-200 hover:bg-slate-700/50",
                    ],
                    variant === "ghost" && [
                        "bg-transparent text-cyan-400 hover:bg-cyan-500/10",
                    ],
                    className
                )}
                disabled={isDisabled}
                {...props}
            >
                {/* Hex Pattern Overlay */}
                <div className="absolute inset-0 opacity-10 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyOCIgaGVpZ2h0PSI0OSI+PHBhdGggZD0iTTEzLjk5IDkuMjVsMTMgNy41djE1bC0xMyA3LjVsLTEzLTcuNXYtMTVsMTMtNy41eiIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMSkiIHN0cm9rZS13aWR0aD0iMC41Ii8+PC9zdmc+')]" />

                {/* Shine Effect */}
                <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"
                />

                {/* Content */}
                <span className="relative z-10 flex items-center justify-center gap-2">
                    {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                    {children}
                </span>

                {/* Pulse Ring */}
                {variant === "primary" && !isDisabled && (
                    <motion.div
                        className="absolute inset-0 rounded-lg border-2 border-cyan-400/50"
                        initial={{ scale: 1, opacity: 0 }}
                        animate={{ scale: 1.1, opacity: [0, 0.5, 0] }}
                        transition={{ duration: 2, repeat: Infinity }}
                    />
                )}
            </motion.button>
        );
    }
);

HologramButton.displayName = "HologramButton";

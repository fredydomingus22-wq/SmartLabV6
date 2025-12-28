"use client";

import { forwardRef, useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Eye, EyeOff } from "lucide-react";

interface GlowInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    icon?: React.ReactNode;
}

/**
 * GlowInput - Neon-Reactive Input Field
 * Features:
 * - Glowing border on focus
 * - Floating label animation
 * - Password toggle for password fields
 * - Subtle hover effects
 */
export const GlowInput = forwardRef<HTMLInputElement, GlowInputProps>(
    ({ className, type, label, icon, ...props }, ref) => {
        const [isFocused, setIsFocused] = useState(false);
        const [showPassword, setShowPassword] = useState(false);
        const isPassword = type === "password";

        return (
            <div className="relative group">
                {/* Label */}
                {label && (
                    <motion.label
                        className={cn(
                            "absolute left-3 text-sm font-medium transition-all duration-200 pointer-events-none z-10",
                            isFocused || props.value
                                ? "top-1 text-[10px] text-cyan-400"
                                : "top-3.5 text-slate-400"
                        )}
                    >
                        {label}
                    </motion.label>
                )}

                {/* Input Container */}
                <div className="relative">
                    {/* Icon */}
                    {icon && (
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-cyan-400 transition-colors">
                            {icon}
                        </div>
                    )}

                    {/* Input Field */}
                    <input
                        type={isPassword && showPassword ? "text" : type}
                        className={cn(
                            "w-full bg-slate-900/50 border border-slate-700/50 rounded-lg text-white placeholder:text-slate-500",
                            "focus:outline-none focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20",
                            "hover:border-slate-600/50 transition-all duration-200",
                            "text-sm sm:text-base",
                            label ? "pt-5 pb-2 px-3" : "py-3 px-3",
                            icon && "pl-10",
                            isPassword && "pr-10",
                            className
                        )}
                        ref={ref}
                        onFocus={() => setIsFocused(true)}
                        onBlur={() => setIsFocused(false)}
                        {...props}
                    />

                    {/* Password Toggle */}
                    {isPassword && (
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-cyan-400 transition-colors"
                        >
                            {showPassword ? (
                                <EyeOff className="h-4 w-4" />
                            ) : (
                                <Eye className="h-4 w-4" />
                            )}
                        </button>
                    )}

                    {/* Focus Glow Line */}
                    <motion.div
                        className="absolute bottom-0 left-1/2 h-0.5 bg-gradient-to-r from-cyan-500 via-emerald-400 to-cyan-500"
                        initial={{ width: 0, x: "-50%" }}
                        animate={{
                            width: isFocused ? "100%" : 0,
                            x: "-50%"
                        }}
                        transition={{ duration: 0.3 }}
                    />
                </div>
            </div>
        );
    }
);

GlowInput.displayName = "GlowInput";

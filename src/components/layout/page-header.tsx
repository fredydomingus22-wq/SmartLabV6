import React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ChevronRight } from "lucide-react";
import Link from "next/link";

interface PageHeaderProps {
    overline?: string;
    title: string;
    description?: string;
    icon?: React.ReactNode;
    backHref?: string;
    backLabel?: string;
    actions?: React.ReactNode;
    children?: React.ReactNode;
    variant?: "blue" | "emerald" | "amber" | "purple" | "rose" | "indigo" | "slate";
    sticky?: boolean;
}

const variantColors = {
    blue: "bg-blue-500",
    emerald: "bg-emerald-500",
    amber: "bg-amber-500",
    purple: "bg-purple-500",
    rose: "bg-rose-500",
    indigo: "bg-indigo-500",
    slate: "bg-slate-500",
};

const glowColors = {
    blue: "from-blue-500/5 to-transparent",
    emerald: "from-emerald-500/5 to-transparent",
    amber: "from-amber-500/5 to-transparent",
    purple: "from-purple-500/5 to-transparent",
    rose: "from-rose-500/5 to-transparent",
    indigo: "from-indigo-500/5 to-transparent",
    slate: "from-slate-500/5 to-transparent",
};

/**
 * Redesigned PageHeader: Ultra-Compact, Minimalist, Figma-Level Aesthetic.
 */
export function PageHeader({
    overline,
    title,
    description,
    icon,
    backHref,
    backLabel = "Voltar",
    actions,
    children,
    variant = "blue",
    sticky = true,
}: PageHeaderProps) {
    return (
        <div className={cn(
            "w-full flex flex-col transition-all duration-300 animate-in fade-in slide-in-from-top-1",
            sticky && "sticky top-0 z-50"
        )}>
            {/* 🏗️ ULTRA-THIN TOP ACCENT */}
            <div className={cn("h-[1px] w-full opacity-60", variantColors[variant])} />

            <header className="relative w-full border-b border-white/5 bg-slate-950/80 backdrop-blur-3xl px-6 py-2.5 flex flex-col gap-2 overflow-hidden">
                {/* Minimal Subtle Glow */}
                <div className={cn(
                    "absolute -top-16 -right-16 h-48 w-48 rounded-full bg-gradient-to-br blur-[60px] pointer-events-none opacity-20",
                    glowColors[variant]
                )} />

                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    {/* 🧭 NAVIGATION & BREADCRUMB AREA */}
                    <div className="flex flex-col gap-0.5">
                        <div className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-[0.2em] text-slate-500/80">
                            {backHref && (
                                <>
                                    <Link href={backHref} className="hover:text-white transition-colors flex items-center">
                                        {backLabel}
                                    </Link>
                                    <ChevronRight className="h-2 w-2 opacity-20" />
                                </>
                            )}
                            {overline && (
                                <span className={cn("font-black tracking-[0.3em]", `text-${variant}-500/60`)}>
                                    {overline}
                                </span>
                            )}
                        </div>

                        <div className="flex items-center gap-2.5">
                            {icon}
                            <div>
                                <h1 className="text-xl font-black tracking-tight text-white/90 flex items-center gap-1.5">
                                    {title}
                                    {variant !== 'slate' && (
                                        <div className={cn("h-1 w-1 rounded-full opacity-40", variantColors[variant])} />
                                    )}
                                </h1>
                                {description && (
                                    <p className="text-[10px] font-medium text-slate-500 mt-0.5">
                                        {description}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* 🚀 ACTION AREA */}
                    <div className="flex items-center gap-2 md:ml-auto">
                        {actions}
                    </div>
                </div>

                {/* 🔍 OPTIONAL FILTER/SEARCH AREA */}
                {children && (
                    <div className="relative z-10 flex flex-wrap items-center gap-2 pt-1.5 border-t border-white/5 mt-0.5">
                        {children}
                    </div>
                )}
            </header>
        </div>
    );
}

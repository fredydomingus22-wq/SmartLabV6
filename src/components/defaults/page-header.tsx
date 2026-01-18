
import React from "react";
import { cn } from "@/lib/utils";
import { ChevronRight } from "lucide-react";
import Link from "next/link";

interface PageHeaderProps {
    title: string;
    description?: React.ReactNode;
    actions?: React.ReactNode;
    className?: string;
    // Rich features
    overline?: string;
    icon?: React.ReactNode;
    backHref?: string;
    backLabel?: string;
    children?: React.ReactNode;
    variant?: "blue" | "emerald" | "amber" | "purple" | "rose" | "indigo" | "slate" | "cyan" | "destructive";
    sticky?: boolean;
    size?: "default" | "compact";
    childrenPosition?: "bottom" | "inline";
}

const variantColors = {
    blue: "bg-blue-500",
    emerald: "bg-emerald-500",
    amber: "bg-amber-500",
    purple: "bg-purple-500",
    rose: "bg-rose-500",
    indigo: "bg-indigo-500",
    slate: "bg-slate-500",
    cyan: "bg-cyan-500",
    destructive: "bg-red-500",
};

const glowColors = {
    blue: "from-blue-500/5 to-transparent",
    emerald: "from-emerald-500/5 to-transparent",
    amber: "from-amber-500/5 to-transparent",
    purple: "from-purple-500/5 to-transparent",
    rose: "from-rose-500/5 to-transparent",
    indigo: "from-indigo-500/5 to-transparent",
    slate: "from-slate-500/5 to-transparent",
    cyan: "from-cyan-500/5 to-transparent",
    destructive: "from-red-500/5 to-transparent",
};

/**
 * Standard Page Header – Global SmartLab Enterprise Standard.
 * Now formatted with Rich Features + Backward Compatibility.
 */
export function PageHeader({
    title,
    description,
    actions,
    className,
    overline,
    icon,
    backHref,
    backLabel = "Voltar",
    children,
    variant = "blue",
    sticky = true,
    size = "default",
    childrenPosition = "bottom",
}: PageHeaderProps) {
    const isCompact = size === "compact";
    const isInline = childrenPosition === "inline";

    return (
        <div className={cn(
            "w-full flex flex-col transition-all duration-300 animate-in fade-in slide-in-from-top-1",
            sticky && "sticky top-0 z-50",
            className
        )}>
            {/* 🏗️ ULTRA-THIN TOP ACCENT */}
            <div className={cn("h-[1px] w-full opacity-60", variantColors[variant])} />

            <header className={cn(
                "relative w-full border-b border-white/5 bg-slate-950/80 backdrop-blur-3xl flex flex-col overflow-hidden px-4 md:px-6",
                isCompact ? "py-2 min-h-[48px] gap-1" : "py-4 min-h-[64px] gap-2"
            )}>
                {/* Minimal Subtle Glow */}
                <div className={cn(
                    "absolute -top-16 -right-16 h-48 w-48 rounded-full bg-gradient-to-br blur-[60px] pointer-events-none opacity-20",
                    glowColors[variant]
                )} />

                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    {/* 🧭 NAVIGATION & BREADCRUMB AREA */}
                    <div className="flex flex-col gap-0.5 max-w-[60%]">
                        {(backHref || overline) && !isInline && (
                            <div className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-[0.2em] text-slate-500/80 mb-1">
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
                        )}

                        <div className="flex items-center gap-2.5">
                            {backHref && isInline && (
                                <Link
                                    href={backHref}
                                    className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition-colors mr-1"
                                    title={backLabel}
                                >
                                    <ChevronRight className="h-4 w-4 rotate-180" />
                                </Link>
                            )}
                            {icon}
                            <div className="flex flex-col">
                                <h1 className={cn(
                                    "font-semibold tracking-tight text-white/90 flex items-center gap-1.5 whitespace-nowrap",
                                    isCompact ? "text-lg" : "text-2xl"
                                )}>
                                    {title}
                                    {variant !== 'slate' && (
                                        <div className={cn("h-1 w-1 rounded-full opacity-40", variantColors[variant])} />
                                    )}
                                </h1>
                                {description && !isInline && (
                                    <div className="text-sm font-medium text-muted-foreground mt-0.5">
                                        {description}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* 🚀 ACTION & INLINE CHILDREN AREA */}
                    <div className="flex items-center gap-4 md:ml-auto">
                        {isInline && children && (
                            <div className="flex items-center pr-4 border-r border-white/5 mr-2">
                                {children}
                            </div>
                        )}
                        <div className="flex items-center gap-2">
                            {actions}
                        </div>
                    </div>
                </div>

                {/* 🔍 OPTIONAL FILTER/SEARCH AREA */}
                {children && !isInline && (
                    <div className="relative z-10 flex flex-wrap items-center gap-2 pt-1.5 border-t border-white/5 mt-0.5">
                        {children}
                    </div>
                )}
            </header>
        </div>
    );
}

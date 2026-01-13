"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { LucideIcon, ArrowRight } from "lucide-react";
import Link from "next/link";

interface ActionItem {
    title: string;
    description: string;
    icon: LucideIcon;
    href?: string;
    onClick?: () => void;
    variant?: "blue" | "emerald" | "amber" | "purple" | "rose" | "indigo";
}

interface ActionGridProps {
    actions: ActionItem[];
    className?: string;
}

const variantStyles = {
    blue: "text-blue-400 bg-blue-500/10 group-hover:bg-blue-500/20",
    emerald: "text-emerald-400 bg-emerald-500/10 group-hover:bg-emerald-500/20",
    amber: "text-amber-400 bg-amber-400/10 group-hover:bg-amber-400/20",
    purple: "text-purple-400 bg-purple-500/10 group-hover:bg-purple-500/20",
    rose: "text-rose-400 bg-rose-500/10 group-hover:bg-rose-500/20",
    indigo: "text-indigo-400 bg-indigo-500/10 group-hover:bg-indigo-500/20",
};

export function ActionGrid({ actions, className }: ActionGridProps) {
    return (
        <div className={cn("grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4", className)}>
            {actions.map((action, index) => {
                const Content = (
                    <div className="group relative flex items-start gap-4 p-5 rounded-[1.5rem] border border-white/5 bg-slate-900/40 glass hover:bg-slate-900/60 hover:border-white/10 transition-all duration-300">
                        <div className={cn(
                            "p-3 rounded-xl transition-all duration-300",
                            variantStyles[action.variant || "blue"]
                        )}>
                            <action.icon className="h-5 w-5" />
                        </div>
                        <div className="flex-1 space-y-1">
                            <h3 className="text-sm font-bold text-white uppercase tracking-tight">
                                {action.title}
                            </h3>
                            <p className="text-[11px] text-slate-500 leading-tight">
                                {action.description}
                            </p>
                        </div>
                        <div className="self-center p-2 rounded-full bg-white/5 opacity-0 group-hover:opacity-100 transition-all group-hover:translate-x-1">
                            <ArrowRight className="h-3 w-3 text-white" />
                        </div>
                    </div>
                );

                if (action.href) {
                    return (
                        <Link key={index} href={action.href} className="outline-none focus:ring-2 focus:ring-white/10 rounded-[1.5rem]">
                            {Content}
                        </Link>
                    );
                }

                return (
                    <button key={index} onClick={action.onClick} className="text-left outline-none focus:ring-2 focus:ring-white/10 rounded-[1.5rem]">
                        {Content}
                    </button>
                );
            })}
        </div>
    );
}
